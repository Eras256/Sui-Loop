module suiloop::strategy_marketplace {
    use sui::object;
    use sui::tx_context;
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use std::string::String;

    // === Errors ===
    const E_NOT_OWNER: u64 = 1;
    const E_INSUFFICIENT_FUNDS: u64 = 2;

    // === Events ===
    public struct StrategyListed has copy, drop {
        id: ID,
        creator: address,
        name: String,
        price: u64,
        cid: String // IPFS/Walrus reference to the logic
    }

    public struct StrategyBought has copy, drop {
        id: ID,
        buyer: address,
        price: u64
    }

    // === Structs ===

    /// NFT representing ownership of a strategy algorithm/ruleset
    public struct StrategyTemplate has key, store {
        id: UID,
        creator: address,
        name: String,
        cid: String,   // CID of the JSON config on decentralized storage
        price: u64,    // One-time fee to copy this strategy
        total_copies: u64
    }

    /// Global Marketplace Hub
    public struct Marketplace has key {
        id: UID,
        treasury: address,
        strategies: Table<ID, StrategyRecord>
    }

    public struct StrategyRecord has store {
        creator: address,
        price: u64,
        total_sales: u64,
        is_active: bool
    }

    fun init(ctx: &mut TxContext) {
        let sender = tx_context::sender(ctx);
        transfer::share_object(Marketplace {
            id: object::new(ctx),
            treasury: sender,
            strategies: table::new(ctx)
        });
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    // === Public Functions ===

    /// Creator lists a new strategy
    public fun list_strategy(
        market: &mut Marketplace,
        name: String,
        cid: String,
        price: u64,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);

        let template = StrategyTemplate {
            id: object::new(ctx),
            creator: sender,
            name,
            cid,
            price,
            total_copies: 0
        };

        let strategy_id = object::id(&template);

        table::add(&mut market.strategies, strategy_id, StrategyRecord {
            creator: sender,
            price,
            total_sales: 0,
            is_active: true
        });

        event::emit(StrategyListed {
            id: strategy_id,
            creator: sender,
            name,
            price,
            cid
        });

        // The creator keeps the "Master Template"
        transfer::transfer(template, sender);
    }

    /// User buys a copy of the strategy
    public fun buy_copy(
        market: &mut Marketplace,
        template_id: ID,
        mut payment: Coin<SUI>,
        ctx: &mut TxContext
    ) {
        assert!(table::contains(&market.strategies, template_id), E_NOT_OWNER);
        let record = table::borrow_mut(&mut market.strategies, template_id);
        assert!(record.is_active, E_NOT_OWNER);
        assert!(coin::value(&payment) >= record.price, E_INSUFFICIENT_FUNDS);

        let sender = tx_context::sender(ctx);

        // 1% Platform Fee (Software License)
        let fee_amount = record.price / 100;
        let royalty_amount = record.price - fee_amount;

        let fee = coin::split(&mut payment, fee_amount, ctx);
        let royalty = coin::split(&mut payment, royalty_amount, ctx);
        
        transfer::public_transfer(fee, market.treasury);
        transfer::public_transfer(royalty, record.creator);

        // Send back any remainder to the buyer
        transfer::public_transfer(payment, sender);

        record.total_sales = record.total_sales + 1;

        event::emit(StrategyBought {
            id: template_id,
            buyer: sender,
            price: record.price
        });
    }

}
