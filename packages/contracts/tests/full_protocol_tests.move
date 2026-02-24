#[test_only]
module suiloop::full_protocol_tests {
    use sui::test_scenario;
    use sui::coin::{Self};
    use sui::sui::SUI;
    use sui::clock;
    use std::string;
    use suiloop::atomic_engine::{Self, Vault, OwnerCap, AgentCap, MockPool};
    use suiloop::agent_registry::{Self, Registry, AdminCap};
    use suiloop::strategy_marketplace::{Self, Marketplace, StrategyTemplate};

    public struct USDC has drop {}

    #[test]
    fun test_full_protocol_flow() {
        let admin = @0xAD;
        let user = @0xB0B;
        let agent_wallet = @0xACE;

        let mut scenario = test_scenario::begin(admin);
        
        // 1. Setup Registry and Marketplace
        test_scenario::next_tx(&mut scenario, admin);
        {
            agent_registry::init_for_testing(test_scenario::ctx(&mut scenario));
            strategy_marketplace::init_for_testing(test_scenario::ctx(&mut scenario));
        };
        
        // 2. Setup Atomic Engine Pool
        test_scenario::next_tx(&mut scenario, admin);
        {
            atomic_engine::create_pool<SUI, USDC>(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, admin);
        {
            let mut pool = test_scenario::take_shared<MockPool<SUI, USDC>>(&scenario);
            let liquidity = coin::mint_for_testing<SUI>(1000_000_000_000, test_scenario::ctx(&mut scenario));
            atomic_engine::add_liquidity(&mut pool, liquidity, test_scenario::ctx(&mut scenario));
            test_scenario::return_shared(pool);
        };

        // 3. User creates a Vault
        test_scenario::next_tx(&mut scenario, user);
        {
            atomic_engine::create_vault<SUI>(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, user);
        {
            let mut vault = test_scenario::take_shared<Vault<SUI>>(&scenario);
            let deposit_amt = coin::mint_for_testing<SUI>(10_000_000_000, test_scenario::ctx(&mut scenario)); // 10 SUI
            atomic_engine::deposit(&mut vault, deposit_amt);
            test_scenario::return_shared(vault);
        };

        // 4. User Creates Agent License (AgentCap)
        test_scenario::next_tx(&mut scenario, user);
        {
            let vault = test_scenario::take_shared<Vault<SUI>>(&scenario);
            let owner_cap = test_scenario::take_from_sender<OwnerCap>(&scenario);
            let fee = coin::mint_for_testing<SUI>(100_000_000, test_scenario::ctx(&mut scenario)); // 0.1 SUI fee
            
            let agent_cap = atomic_engine::create_agent_cap(&vault, &owner_cap, fee, test_scenario::ctx(&mut scenario));
            
            // Send Cap to the agent wallet
            transfer::public_transfer(agent_cap, agent_wallet);
            
            test_scenario::return_shared(vault);
            test_scenario::return_to_sender(&scenario, owner_cap);
        };

        // 5. Agent Executes Strategy using Vault (Secure Execution)
        test_scenario::next_tx(&mut scenario, agent_wallet);
        {
            let mut vault = test_scenario::take_shared<Vault<SUI>>(&scenario);
            let agent_cap = test_scenario::take_from_sender<AgentCap>(&scenario);
            let mut pool = test_scenario::take_shared<MockPool<SUI, USDC>>(&scenario);

            // Borrow 50 SUI
            atomic_engine::execute_strategy_secure(
                &mut vault,
                &agent_cap,
                &mut pool,
                50_000_000_000,
                0,
                test_scenario::ctx(&mut scenario)
            );

            test_scenario::return_shared(vault);
            test_scenario::return_shared(pool);
            test_scenario::return_to_sender(&scenario, agent_cap);
        };

        // 6. Register Agent in Registry for reputation
        test_scenario::next_tx(&mut scenario, user);
        {
            let mut registry = test_scenario::take_shared<Registry>(&scenario);
            let clock = clock::create_for_testing(test_scenario::ctx(&mut scenario));
            
            agent_registry::register_agent(&mut registry, agent_wallet, &clock, test_scenario::ctx(&mut scenario));
            
            clock::share_for_testing(clock);
            test_scenario::return_shared(registry);
        };

        // 7. Marketplace: List and Buy Strategy
        test_scenario::next_tx(&mut scenario, user);
        {
            let mut market = test_scenario::take_shared<Marketplace>(&scenario);
            strategy_marketplace::list_strategy(
                &mut market,
                string::utf8(b"Turbo Alpha"),
                string::utf8(b"ipfs://hash"),
                500_000_000, // 0.5 SUI
                test_scenario::ctx(&mut scenario)
            );
            test_scenario::return_shared(market);
        };

        let buyer = @0xDEB;
        test_scenario::next_tx(&mut scenario, buyer);
        {
            let mut market = test_scenario::take_shared<Marketplace>(&scenario);
            let template = test_scenario::take_from_address<StrategyTemplate>(&scenario, user);
            let template_id = object::id(&template);
            
            let payment = coin::mint_for_testing<SUI>(500_000_000, test_scenario::ctx(&mut scenario));
            
            strategy_marketplace::buy_copy(&mut market, template_id, payment, test_scenario::ctx(&mut scenario));
            
            test_scenario::return_shared(market);
            test_scenario::return_to_address(user, template);
        };

        test_scenario::end(scenario);
    }
}
