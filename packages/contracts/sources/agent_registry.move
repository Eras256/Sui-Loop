module suiloop::agent_registry {
    use sui::object::{Self, UID, ID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use sui::event;
    use sui::table::{Self, Table};
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::clock::{Self, Clock};

    // === Errors ===
    const E_NOT_AUTHORIZED: u64 = 1;
    const E_AGENT_NOT_FOUND: u64 = 2;

    // === Events ===
    public struct AgentRegistered has copy, drop {
        agent_id: address,
        owner: address,
        timestamp: u64
    }

    public struct ReputationUpdated has copy, drop {
        agent_id: address,
        new_score: u64,
        is_positive: bool
    }

    public struct SignalPublished has copy, drop {
        agent_id: address,
        signal_data: vector<u8>, // IPFS CID or JSON bytes
        timestamp: u64
    }

    // === Structs ===

    /// Master Registry holding all agents
    public struct Registry has key {
        id: UID,
        agents: Table<address, AgentRecord>,
        total_agents: u64
    }

    /// Public record of an Agent's performance
    public struct AgentRecord has store {
        owner: address,
        reputation_score: u64, // Starts at 1000
        successful_trades: u64,
        failed_trades: u64,
        total_volume: u64,
        created_at: u64
    }

    /// Admin cap for protocol governance
    public struct AdminCap has key, store {
        id: UID
    }

    fun init(ctx: &mut TxContext) {
        let registry = Registry {
            id: object::new(ctx),
            agents: table::new(ctx),
            total_agents: 0
        };
        transfer::share_object(registry);

        transfer::transfer(AdminCap {
            id: object::new(ctx)
        }, tx_context::sender(ctx));
    }

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    // === Public Functions ===

    /// Register a new Agent Profile on-chain
    public fun register_agent(
        registry: &mut Registry, 
        agent_address: address, 
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let sender = tx_context::sender(ctx);
        
        // Prevent duplicates
        assert!(!table::contains(&registry.agents, agent_address), E_NOT_AUTHORIZED);
        
        let record = AgentRecord {
            owner: sender,
            reputation_score: 1000, // Base ELO score
            successful_trades: 0,
            failed_trades: 0,
            total_volume: 0,
            created_at: clock::timestamp_ms(clock)
        };
        
        table::add(&mut registry.agents, agent_address, record);
        registry.total_agents = registry.total_agents + 1;

        event::emit(AgentRegistered {
            agent_id: agent_address,
            owner: sender,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    /// Publish a trading signal to the network (Agent-to-Agent Mesh)
    /// Emits an event that other agents can listen to via WebSocket.
    public fun publish_signal(
        registry: &Registry,
        agent_address: address,
        signal_data: vector<u8>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Must be registered
        assert!(table::contains(&registry.agents, agent_address), E_AGENT_NOT_FOUND);
        let record = table::borrow(&registry.agents, agent_address);
        // Must be the owner or the agent itself (for simplicity, check owner here)
        assert!(record.owner == tx_context::sender(ctx) || agent_address == tx_context::sender(ctx), E_NOT_AUTHORIZED);

        event::emit(SignalPublished {
            agent_id: agent_address,
            signal_data,
            timestamp: clock::timestamp_ms(clock)
        });
    }

    // === Admin/Verified Protocol Updates ===

    /// Update reputation after a closed trade
    public fun update_reputation(
        _admin: &AdminCap,
        registry: &mut Registry,
        agent_address: address,
        is_success: bool,
        volume: u64
    ) {
        assert!(table::contains(&registry.agents, agent_address), E_AGENT_NOT_FOUND);
        let record = table::borrow_mut(&mut registry.agents, agent_address);
        
        if (is_success) {
            record.successful_trades = record.successful_trades + 1;
            record.reputation_score = record.reputation_score + 10;
        } else {
            record.failed_trades = record.failed_trades + 1;
            // Floor at 0
            if (record.reputation_score > 5) {
                record.reputation_score = record.reputation_score - 5;
            } else {
                record.reputation_score = 0;
            };
        };
        
        record.total_volume = record.total_volume + volume;

        event::emit(ReputationUpdated {
            agent_id: agent_address,
            new_score: record.reputation_score,
            is_positive: is_success
        });
    }
}
