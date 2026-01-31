/// SuiLoop Atomic Engine v0.0.4
/// 
/// This module demonstrates the "Hot Potato" pattern for secure flash loans on Sui.
/// The LoopReceipt struct MUST be consumed by calling repay_loan() or the transaction aborts.
/// This is enforced by Move's linear type system - no 'drop' ability means no way to discard.
///
/// For the Hackathon Demo:
/// - Uses a MockPool to simulate DeepBook V3 liquidity (V3 testnet package is unstable)
/// - The security guarantees are IDENTICAL to production flash loans
/// - Events are emitted for frontend tracking
module suiloop::atomic_engine {
    use sui::coin::{Self, Coin};
    use sui::balance::{Self, Balance};
    use sui::event;
    use sui::sui::SUI;

    // === Error Codes ===
    const E_INSUFFICIENT_PROFIT: u64 = 1;
    const E_INVALID_REPAYMENT: u64 = 2;
    const E_POOL_INSUFFICIENT_LIQUIDITY: u64 = 3;
    const E_WRONG_RECEIPT: u64 = 4;

    // === Events ===
    
    /// Emitted when an atomic loop is successfully executed
    public struct LoopExecuted has copy, drop {
        borrowed_amount: u64,
        repaid_amount: u64,
        profit: u64,
        user: address,
        pool_id: address
    }

    /// Emitted when a flash loan is initiated
    public struct FlashLoanInitiated has copy, drop {
        amount: u64,
        borrower: address
    }

    /// Emitted when a flash loan is repaid
    public struct FlashLoanRepaid has copy, drop {
        amount: u64,
        fee: u64
    }

    // === Core Structs ===

    /// The "Hot Potato" receipt - This struct has NO 'drop' ability!
    /// Move's type system GUARANTEES this must be consumed by repay_loan().
    /// If you try to ignore it, the compiler/runtime will reject the transaction.
    /// This provides the same security as DeepBook V3 flash loans.
    public struct LoopReceipt {
        pool_id: address,
        borrowed_amount: u64,
        min_repay_amount: u64,
        borrower: address
    }

    /// Mock Pool to simulate DeepBook V3 liquidity
    /// In production, this would be replaced with actual DeepBook V3 Pool interaction
    public struct MockPool<phantom Base, phantom Quote> has key, store {
        id: UID,
        base_balance: Balance<Base>,
        quote_balance: Balance<Quote>,
        flash_loan_fee_bps: u64 // Fee in basis points (100 = 1%)
    }

    // === Pool Management ===

    /// Create and share a new MockPool
    /// This simulates the liquidity pool that would exist in DeepBook V3
    public entry fun create_pool<Base, Quote>(ctx: &mut TxContext) {
        let pool = MockPool<Base, Quote> {
            id: object::new(ctx),
            base_balance: balance::zero(),
            quote_balance: balance::zero(),
            flash_loan_fee_bps: 30 // 0.3% fee like DeepBook
        };
        transfer::public_share_object(pool);
    }

    /// Add liquidity to the pool (for testing flash loans)
    public entry fun add_liquidity<Base, Quote>(
        pool: &mut MockPool<Base, Quote>,
        base_coin: Coin<Base>,
        _ctx: &mut TxContext
    ) {
        let base_balance = coin::into_balance(base_coin);
        balance::join(&mut pool.base_balance, base_balance);
    }

    // === Flash Loan Functions ===

    /// Borrow assets from the pool - Returns the "Hot Potato" receipt
    /// The caller MUST call repay_loan() with this receipt or transaction fails
    public fun borrow_flash_loan<Base, Quote>(
        pool: &mut MockPool<Base, Quote>,
        borrow_amount: u64,
        ctx: &mut TxContext
    ): (Coin<Base>, LoopReceipt) {
        let pool_liquidity = balance::value(&pool.base_balance);
        assert!(pool_liquidity >= borrow_amount, E_POOL_INSUFFICIENT_LIQUIDITY);

        let sender = ctx.sender();
        let pool_address = object::uid_to_address(&pool.id);

        // Calculate fee (0.3%)
        let fee = (borrow_amount * pool.flash_loan_fee_bps) / 10000;
        let min_repay = borrow_amount + fee;

        // Extract the loan from pool
        let loan_balance = balance::split(&mut pool.base_balance, borrow_amount);
        let loan_coin = coin::from_balance(loan_balance, ctx);

        // Create the Hot Potato receipt - MUST be consumed!
        let receipt = LoopReceipt {
            pool_id: pool_address,
            borrowed_amount: borrow_amount,
            min_repay_amount: min_repay,
            borrower: sender
        };

        event::emit(FlashLoanInitiated {
            amount: borrow_amount,
            borrower: sender
        });

        (loan_coin, receipt)
    }

    /// Repay the flash loan - Consumes the "Hot Potato" receipt
    /// This is the ONLY way to destroy the receipt, ensuring repayment
    public fun repay_flash_loan<Base, Quote>(
        pool: &mut MockPool<Base, Quote>,
        payment: Coin<Base>,
        receipt: LoopReceipt,
        _ctx: &mut TxContext
    ) {
        let LoopReceipt { 
            pool_id, 
            borrowed_amount, 
            min_repay_amount, 
            borrower: _ 
        } = receipt;

        // Verify this receipt belongs to this pool
        assert!(pool_id == object::uid_to_address(&pool.id), E_WRONG_RECEIPT);

        // Verify sufficient repayment
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= min_repay_amount, E_INVALID_REPAYMENT);

        // Calculate actual fee paid
        let fee_paid = payment_amount - borrowed_amount;

        // Return funds to pool
        let payment_balance = coin::into_balance(payment);
        balance::join(&mut pool.base_balance, payment_balance);

        event::emit(FlashLoanRepaid {
            amount: payment_amount,
            fee: fee_paid
        });
    }

    // === Main Entry Point ===

    /// Execute an atomic leverage loop
    /// This demonstrates the complete flash loan cycle:
    /// 1. Borrow from pool (get Hot Potato)
    /// 2. Execute strategy (simulated)
    /// 3. Repay loan (destroy Hot Potato)
    /// 4. Keep profit
    ///
    /// If ANY step fails, the ENTIRE transaction reverts (atomicity guarantee)
    public entry fun execute_loop<Base, Quote>(
        pool: &mut MockPool<Base, Quote>,
        user_funds: Coin<Base>, // User provides funds to cover fees + simulate strategy
        borrow_amount: u64,
        min_profit: u64,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        let pool_address = object::uid_to_address(&pool.id);

        // 1. FLASH LOAN - Borrow from pool
        let (mut loan_coin, receipt) = borrow_flash_loan(pool, borrow_amount, ctx);

        // 2. STRATEGY EXECUTION (Simulated)
        // In production, this would call: Cetus Swap -> Suilend Deposit -> etc.
        // For demo, we merge user's funds to simulate "profit from strategy"
        coin::join(&mut loan_coin, user_funds);

        // 3. CALCULATE REPAYMENT
        let total_funds = coin::value(&loan_coin);
        let fee = (borrow_amount * 30) / 10000; // 0.3%
        let repay_amount = borrow_amount + fee;

        // 4. SOLVENCY CHECK - Abort if not profitable
        assert!(total_funds >= repay_amount + min_profit, E_INSUFFICIENT_PROFIT);

        // 5. REPAYMENT - Split exact amount and repay (destroys Hot Potato)
        let payment = coin::split(&mut loan_coin, repay_amount, ctx);
        repay_flash_loan(pool, payment, receipt, ctx);

        // 6. PROFIT CAPTURE
        let profit = coin::value(&loan_coin);

        event::emit(LoopExecuted {
            borrowed_amount: borrow_amount,
            repaid_amount: repay_amount,
            profit,
            user: sender,
            pool_id: pool_address
        });

        // Send remaining profit to user
        if (profit > 0) {
            transfer::public_transfer(loan_coin, sender);
        } else {
            // Destroy empty coin
            coin::destroy_zero(loan_coin);
        }
    }

    // === View Functions ===

    /// Get pool liquidity
    public fun pool_liquidity<Base, Quote>(pool: &MockPool<Base, Quote>): u64 {
        balance::value(&pool.base_balance)
    }

    /// Get flash loan fee in basis points
    public fun flash_loan_fee<Base, Quote>(pool: &MockPool<Base, Quote>): u64 {
        pool.flash_loan_fee_bps
    }
}
