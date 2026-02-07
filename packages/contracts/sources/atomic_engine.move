module suiloop::atomic_engine {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::sui::SUI;
    use sui::event;

    // === Errors ===
    const E_REPAY_AMOUNT_INVALID: u64 = 0;
    const E_INSUFFICIENT_PROFIT: u64 = 1;
    const E_INSUFFICIENT_FEE: u64 = 2;
    const E_POOL_INSUFFICIENT_LIQUIDITY: u64 = 3;
    const E_WRONG_RECEIPT: u64 = 4;
    const E_INVALID_REPAYMENT: u64 = 5;
    const E_UNAUTHORIZED: u64 = 6;

    // === Constants ===
    /// Fee for deploying an Agent (License). 
    /// Target: ~$4.50 USD. Assuming 1 SUI ~ $0.90 USD => ~5 SUI.
    /// Rounding to 5 SUI for protocol revenue.
    const DEPLOYMENT_FEE: u64 = 5_000_000_000; // 5 SUI
    
    /// Protocol Treasury Address (Placeholder)
    const TREASURY: address = @0x7b8f95e347b4899d453046777777777777777777777777777777777777777777;

    // === Events ===

    public struct LoopExecuted has copy, drop {
        borrowed_amount: u64,
        repaid_amount: u64,
        profit: u64,
        user: address,
        pool_id: address
    }

    public struct FlashLoanInitiated has copy, drop {
        amount: u64,
        borrower: address
    }

    public struct FlashLoanRepaid has copy, drop {
        amount: u64,
        fee: u64
    }

    // === Structs ===

    /// The Safe/Vault that holds user capital.
    /// The Agent CANNOT withdraw from here, only trade via whitelisted functions.
    public struct Vault<phantom Asset> has key {
        id: UID,
        balance: Balance<Asset>,
        owner: address
    }

    /// Capability delegating permission to EXECUTE strategies, but NOT withdraw.
    /// Held by the hot wallet / agent.
    public struct AgentCap has key, store {
        id: UID,
        vault_id: ID
    }

    /// Capability allowing full control (Withdrawals).
    /// Kept by the user's cold wallet.
    public struct OwnerCap has key, store {
        id: UID,
        vault_id: ID
    }

    /// The "Hot Potato" receipt - GUARANTEES repayment.
    public struct LoopReceipt {
        pool_id: address,
        borrowed_amount: u64,
        min_repay_amount: u64,
        borrower: address
    }

    /// Mock Pool to simulate DeepBook V3 liquidity
    public struct MockPool<phantom Base, phantom Quote> has key, store {
        id: UID,
        base_balance: Balance<Base>,
        quote_balance: Balance<Quote>,
        flash_loan_fee_bps: u64
    }

    // === Vault Management ===

    /// Creates a new Vault and transfers ownership to the caller.
    /// The Vault is shared (accessible by ID), and the OwnerCap is sent to the user.
    public entry fun create_vault<Asset>(ctx: &mut TxContext) {
        let vault_uid = object::new(ctx);
        let vault_id = object::uid_to_inner(&vault_uid);
        let sender = ctx.sender();
        
        let vault: Vault<Asset> = Vault {
            id: vault_uid,
            balance: balance::zero<Asset>(),
            owner: sender
        };

        let owner_cap = OwnerCap {
            id: object::new(ctx),
            vault_id
        };

        // Share the Vault so it can be accessed by its ID
        transfer::share_object(vault);
        // Transfer the OwnerCap to the user (only they can withdraw)
        transfer::public_transfer(owner_cap, sender);
    }

    public fun deposit<Asset>(vault: &mut Vault<Asset>, payment: Coin<Asset>) {
        coin::put(&mut vault.balance, payment);
    }

    public fun withdraw<Asset>(
        vault: &mut Vault<Asset>, 
        cap: &OwnerCap, 
        amount: u64, 
        ctx: &mut TxContext
    ): Coin<Asset> {
        assert!(object::id(vault) == cap.vault_id, E_UNAUTHORIZED);
        coin::take(&mut vault.balance, amount, ctx)
    }

    /// Mint an AgentCap to delegate execution rights.
    /// REQUIRING PAYMENT (~89 MXN in SUI).
    public fun create_agent_cap<Asset>(
        vault: &Vault<Asset>,
        owner_cap: &OwnerCap, 
        payment: Coin<SUI>, // Fee payment
        ctx: &mut TxContext
    ): AgentCap {
        assert!(object::id(vault) == owner_cap.vault_id, E_UNAUTHORIZED);
        
        // 1. Check Fee
        assert!(coin::value(&payment) >= DEPLOYMENT_FEE, E_INSUFFICIENT_FEE);
        
        // 2. Pay Treasury
        transfer::public_transfer(payment, TREASURY);

        // 3. Mint Cap
        AgentCap {
            id: object::new(ctx),
            vault_id: object::id(vault)
        }
    }

    /// Safely destroy the Vault and return remaining funds to the owner.
    /// Requires the OwnerCap to prove ownership.
    public fun destroy_vault<Asset>(
        vault: Vault<Asset>, 
        cap: OwnerCap, 
        ctx: &mut TxContext
    ): Coin<Asset> {
        let Vault { id, balance, owner: _ } = vault;
        let OwnerCap { id: cap_id, vault_id } = cap;

        assert!(object::uid_to_inner(&id) == vault_id, E_UNAUTHORIZED);

        object::delete(id);
        object::delete(cap_id);


        coin::from_balance(balance, ctx)
    }

    /// Revoke Agent Permission (Burn AgentCap).
    /// Can be called by the Owner to stop specific agents.
    public entry fun destroy_agent_cap(
        cap: AgentCap
    ) {
        let AgentCap { id, vault_id: _ } = cap;
        object::delete(id);
    }

    // === Execution Logic ===

    /// V2: Zero Risk Execution (Vault + Hot Potato)
    public entry fun execute_strategy_secure<Base, Quote>(
        vault: &mut Vault<Base>,
        agent_cap: &AgentCap,
        pool: &mut MockPool<Base, Quote>,
        borrow_amount: u64,
        min_profit: u64,
        ctx: &mut TxContext
    ) {
        // 1. Verify Agent Permission
        assert!(object::id(vault) == agent_cap.vault_id, E_UNAUTHORIZED);

        // 2. Borrow Flash Loan
        let (mut loan_coin, receipt) = borrow_flash_loan(pool, borrow_amount, ctx);

        // --- STRATEGY EXECUTION (Simulated) ---
        // In this demo, we just hold the loan. 
        // Real world: Swap(Loan) -> Arbitrage -> Profit.
        
        // 3. Calculate Repayment
        let fee = (borrow_amount * 30) / 10000; 
        let repay_amount = borrow_amount + fee;

        // 4. Repay Logic
        // We take the repayment amount from the LOAN itself (classic arb)
        // If loan isn't enough (unprofitable), this crashes (Hot Potato safety).
        // Note: Real strat would use vault funds if needed, but here we enforce profit.
        
        let payment = coin::split(&mut loan_coin, repay_amount, ctx);
        repay_flash_loan(pool, payment, receipt, ctx);

        // 5. Deposit Profit to User Vault (Non-Custodial)
        deposit(vault, loan_coin);
    }

    /// V1: Classic Wallet Execution (Legacy)
    public entry fun execute_loop<Base, Quote>(
        pool: &mut MockPool<Base, Quote>,
        user_funds: Coin<Base>, 
        borrow_amount: u64,
        min_profit: u64,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let (mut loan_coin, receipt) = borrow_flash_loan(pool, borrow_amount, ctx);

        coin::join(&mut loan_coin, user_funds);

        let total_funds = coin::value(&loan_coin);
        let fee = (borrow_amount * 30) / 10000;
        let repay_amount = borrow_amount + fee;

        assert!(total_funds >= repay_amount + min_profit, E_INSUFFICIENT_PROFIT);

        let payment = coin::split(&mut loan_coin, repay_amount, ctx);
        repay_flash_loan(pool, payment, receipt, ctx);

        let profit = coin::value(&loan_coin);
        event::emit(LoopExecuted {
            borrowed_amount: borrow_amount,
            repaid_amount: repay_amount,
            profit,
            user: sender,
            pool_id: object::uid_to_address(&pool.id)
        });

        if (profit > 0) {
            transfer::public_transfer(loan_coin, sender);
        } else {
            coin::destroy_zero(loan_coin);
        }
    }

    // === Flash Loan Core ===

    public fun borrow_flash_loan<Base, Quote>(
        pool: &mut MockPool<Base, Quote>,
        borrow_amount: u64,
        ctx: &mut TxContext
    ): (Coin<Base>, LoopReceipt) {
        assert!(balance::value(&pool.base_balance) >= borrow_amount, E_POOL_INSUFFICIENT_LIQUIDITY);

        let sender = ctx.sender();
        let pool_address = object::uid_to_address(&pool.id);

        let fee = (borrow_amount * pool.flash_loan_fee_bps) / 10000;
        let min_repay = borrow_amount + fee;

        let loan_balance = balance::split(&mut pool.base_balance, borrow_amount);
        let loan_coin = coin::from_balance(loan_balance, ctx);

        let receipt = LoopReceipt {
            pool_id: pool_address,
            borrowed_amount: borrow_amount,
            min_repay_amount: min_repay,
            borrower: sender
        };

        event::emit(FlashLoanInitiated { amount: borrow_amount, borrower: sender });

        (loan_coin, receipt)
    }

    public fun repay_flash_loan<Base, Quote>(
        pool: &mut MockPool<Base, Quote>,
        payment: Coin<Base>,
        receipt: LoopReceipt,
        _ctx: &mut TxContext
    ) {
        let LoopReceipt { pool_id, borrowed_amount: _, min_repay_amount, borrower: _ } = receipt;

        assert!(pool_id == object::uid_to_address(&pool.id), E_WRONG_RECEIPT);
        assert!(coin::value(&payment) >= min_repay_amount, E_INVALID_REPAYMENT);

        let payment_val = coin::value(&payment);
        
        balance::join(&mut pool.base_balance, coin::into_balance(payment));

        event::emit(FlashLoanRepaid { amount: payment_val, fee: 0 }); // Fee calculation simplified for event
    }

    // === Pool Setup ===

    public entry fun create_pool<Base, Quote>(ctx: &mut TxContext) {
        let pool = MockPool<Base, Quote> {
            id: object::new(ctx),
            base_balance: balance::zero(),
            quote_balance: balance::zero(),
            flash_loan_fee_bps: 30
        };
        transfer::public_share_object(pool);
    }

    public entry fun add_liquidity<Base, Quote>(
        pool: &mut MockPool<Base, Quote>,
        base_coin: Coin<Base>,
        _ctx: &mut TxContext
    ) {
        balance::join(&mut pool.base_balance, coin::into_balance(base_coin));
    }
}
