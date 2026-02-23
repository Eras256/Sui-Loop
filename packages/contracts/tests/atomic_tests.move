#[test_only]
module suiloop::atomic_tests {
    use sui::test_scenario;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use suiloop::atomic_engine::{Self, MockPool};

    // Test coin types
    public struct USDC has drop {}

    /// Test 1: Create a pool successfully
    #[test]
    fun test_create_pool() {
        let admin = @0xAD;
        
        let mut scenario = test_scenario::begin(admin);
        {
            // Create pool
            atomic_engine::create_pool<SUI, USDC>(test_scenario::ctx(&mut scenario));
        };

        test_scenario::next_tx(&mut scenario, admin);
        {
            // Verify pool exists
            let pool = test_scenario::take_shared<MockPool<SUI, USDC>>(&scenario);
            assert!(atomic_engine::pool_liquidity(&pool) == 0, 0);
            assert!(atomic_engine::flash_loan_fee(&pool) == 30, 1); // 0.3%
            test_scenario::return_shared(pool);
        };

        test_scenario::end(scenario);
    }

    /// Test 2: Add liquidity to pool
    #[test]
    fun test_add_liquidity() {
        let admin = @0xAD;
        
        let mut scenario = test_scenario::begin(admin);
        
        // Create pool
        test_scenario::next_tx(&mut scenario, admin);
        {
            atomic_engine::create_pool<SUI, USDC>(test_scenario::ctx(&mut scenario));
        };

        // Add liquidity
        test_scenario::next_tx(&mut scenario, admin);
        {
            let mut pool = test_scenario::take_shared<MockPool<SUI, USDC>>(&scenario);
            
            // Create test coins (1000 SUI)
            let liquidity = coin::mint_for_testing<SUI>(1000_000_000_000, test_scenario::ctx(&mut scenario));
            
            atomic_engine::add_liquidity(&mut pool, liquidity, test_scenario::ctx(&mut scenario));
            
            assert!(atomic_engine::pool_liquidity(&pool) == 1000_000_000_000, 0);
            
            test_scenario::return_shared(pool);
        };

        test_scenario::end(scenario);
    }

    /// Test 3: Execute a successful flash loan cycle
    #[test]
    fun test_flash_loan_cycle() {
        let admin = @0xAD;
        let user = @0xB0B;
        
        let mut scenario = test_scenario::begin(admin);
        
        // Create and fund pool
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

        // User executes loop
        test_scenario::next_tx(&mut scenario, user);
        {
            let mut pool = test_scenario::take_shared<MockPool<SUI, USDC>>(&scenario);
            
            // User provides some funds to cover fees (simulating profit from strategy)
            // Borrow 100 SUI, need 0.3% fee = 0.3 SUI
            let user_funds = coin::mint_for_testing<SUI>(1_000_000_000, test_scenario::ctx(&mut scenario)); // 1 SUI
            
            atomic_engine::execute_loop(
                &mut pool,
                user_funds,
                100_000_000_000, // Borrow 100 SUI
                0,               // Min profit 0 (we're just testing the cycle)
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(pool);
        };

        // Verify user received profit
        test_scenario::next_tx(&mut scenario, user);
        {
            // User should have received remaining funds after repayment
            let profit = test_scenario::take_from_sender<Coin<SUI>>(&scenario);
            // 1 SUI - 0.3 SUI fee = 0.7 SUI profit (approximately)
            assert!(coin::value(&profit) > 0, 0);
            test_scenario::return_to_sender(&scenario, profit);
        };

        test_scenario::end(scenario);
    }

    /// Test 4: Flash loan fails with insufficient profit
    #[test]
    #[expected_failure(abort_code = atomic_engine::E_INSUFFICIENT_PROFIT)]
    fun test_flash_loan_insufficient_profit() {
        let admin = @0xAD;
        let user = @0xB0B;
        
        let mut scenario = test_scenario::begin(admin);
        
        // Create and fund pool
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

        // User tries to execute loop but doesn't have enough funds for required profit
        test_scenario::next_tx(&mut scenario, user);
        {
            let mut pool = test_scenario::take_shared<MockPool<SUI, USDC>>(&scenario);
            
            // User provides minimal funds but requires high profit
            let user_funds = coin::mint_for_testing<SUI>(500_000_000, test_scenario::ctx(&mut scenario)); // 0.5 SUI
            
            // This should fail: borrow 100 SUI, need 0.3 SUI fee, but require 1 SUI profit
            // Total needed: 100 + 0.3 + 1 = 101.3 SUI
            // User only has 0.5 SUI + 100 borrowed = 100.5 SUI
            atomic_engine::execute_loop(
                &mut pool,
                user_funds,
                100_000_000_000, // Borrow 100 SUI
                1_000_000_000,   // Require 1 SUI profit (impossible with these funds)
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(pool);
        };

        test_scenario::end(scenario);
    }

    /// Test 5: Flash loan fails with insufficient pool liquidity
    #[test]
    #[expected_failure(abort_code = atomic_engine::E_POOL_INSUFFICIENT_LIQUIDITY)]
    fun test_flash_loan_no_liquidity() {
        let admin = @0xAD;
        let user = @0xB0B;
        
        let mut scenario = test_scenario::begin(admin);
        
        // Create pool WITHOUT adding liquidity
        test_scenario::next_tx(&mut scenario, admin);
        {
            atomic_engine::create_pool<SUI, USDC>(test_scenario::ctx(&mut scenario));
        };

        // User tries to borrow from empty pool
        test_scenario::next_tx(&mut scenario, user);
        {
            let mut pool = test_scenario::take_shared<MockPool<SUI, USDC>>(&scenario);
            
            let user_funds = coin::mint_for_testing<SUI>(1_000_000_000, test_scenario::ctx(&mut scenario));
            
            // This should fail: pool has no liquidity
            atomic_engine::execute_loop(
                &mut pool,
                user_funds,
                100_000_000_000, // Try to borrow 100 SUI from empty pool
                0,
                test_scenario::ctx(&mut scenario)
            );
            
            test_scenario::return_shared(pool);
        };

        test_scenario::end(scenario);
    }
}
