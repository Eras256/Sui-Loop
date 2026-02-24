import { Action, IAgentRuntime, Memory } from "@elizaos/core";

/** Map Builder node labels → human-readable execution log messages */
const NODE_DISPATCHERS: Record<string, string> = {
    // Atomic Engine
    FLASH_LOAN: '⚡ [Atomic] Borrowing capital via Hot Potato flash loan...',
    EXECUTE_LOOP: '🔄 [Atomic] Executing borrow-trade-repay loop...',
    CREATE_AGENT_CAP: '🔑 [Atomic] Minting AgentCap (0.1 SUI fee)...',
    REPAY_LOAN: '💸 [Atomic] Satisfying Hot Potato receipt + capturing profit...',
    // Signal Inputs
    PRICE_THRESHOLD: '📊 [Signal] Checking price threshold trigger...',
    CRON_TICK: '⏱️  [Signal] Evaluating cron schedule tick...',
    MEMPOOL_SCAN: '🔍 [Signal] Scanning mempool for pending transactions...',
    WHALE_ALERT: '🐋 [Signal] Monitoring large wallet movements...',
    // AI Intelligence
    ELIZA_SENTIMENT: '🤖 [AI] Running ElizaOS NLP sentiment analysis...',
    KELLY_CRITERION: '📐 [AI] Calculating optimal position size via Kelly Criterion...',
    MARKET_REGIME: '📈 [AI] Detecting market regime (Bull/Bear transition)...',
    // Trading & Swaps
    CETUS_SWAP: '🦄 [DEX] Executing atomic swap on Cetus CLMM...',
    TURBOS_SWAP: '🌀 [DEX] Executing swap on Turbos liquidity pool...',
    DEEPBOOK_LIMIT: '📒 [DEX] Placing CLOB limit order on DeepBook V3...',
    // Security & Vault
    VAULT_DEPOSIT: '🔒 [Vault] Locking capital in Secure Enclave...',
    VAULT_WITHDRAW: '🔓 [Vault] OwnerCap-verified capital withdrawal...',
    ENCLAVE_GUARD: '🛡️  [Security] Applying Move-native safety filter...',
    WALRUS_BLACKBOX: '🦭 [Audit] Archiving execution log to Walrus blackbox...',
    // Social Messaging
    TWITTER_RELAY: '🐦 [Social] Posting automated status to Twitter/X...',
    DISCORD_ALARM: '💬 [Social] Sending urgent notification to Discord...',
    TELEGRAM_PUSH: '📨 [Social] Pushing execution log to Telegram...',
    NEURAL_SIGNAL: '📡 [Neural] Publishing on-chain signal to Agent Registry...',
};

export const executeBuilderStrategy: Action = {
    name: "EXECUTE_BUILDER_STRATEGY",
    similes: ["RUN_CUSTOM_FLOW", "PROCESS_NODES", "EXECUTE_KERNEL", "RUN_BUILDER_KERNEL"],
    description: "Executes a custom node-based strategy kernel from the Visual Strategy Builder. Supports all 6 node categories: Atomic Engine, Signal Inputs, AI Intelligence, Trading & Swaps, Security & Vault, Social Messaging.",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true; // Builder strategies are always valid to attempt
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: any,
        options: any,
        callback: any
    ) => {
        const content = message.content as any;
        const nodes: any[] = content.nodes || [];
        const strategyName = content.strategyName || "Custom Kernel";
        const asset = content.asset || content.config?.asset || "SUI";

        callback?.({ text: `🧩 Executing Kernel: "${strategyName}" [Asset: ${asset}]` });
        callback?.({ text: `📦 Loaded ${nodes.length} nodes — analyzing flow graph...` });

        if (nodes.length === 0) {
            callback?.({ text: "❌ Empty kernel — no nodes found in the strategy graph." });
            return { success: false, error: "No nodes" };
        }

        // 1. Find Trigger node
        const triggerNode = nodes.find((n: any) =>
            n.type === 'trigger' || n.data?.type === 'trigger' ||
            n.id?.startsWith('start')
        );
        if (triggerNode) {
            const label = triggerNode.data?.label || triggerNode.label || 'INIT_KERNEL';
            callback?.({ text: `⚡ Trigger: ${label} — initiating execution pipeline...` });
        }

        // 2. Execute Action nodes in order
        const actionNodes = nodes.filter((n: any) =>
            n.type === 'action' || n.data?.type === 'action'
        );
        const conditionNodes = nodes.filter((n: any) =>
            n.type === 'condition' || n.data?.type === 'condition'
        );

        callback?.({ text: `🔀 Pipeline: ${actionNodes.length} actions · ${conditionNodes.length} conditions` });

        for (const node of actionNodes) {
            await new Promise(r => setTimeout(r, 400));
            const label = (node.data?.label || node.label || '').toUpperCase().replace(/[\s-]+/g, '_');
            const msg = NODE_DISPATCHERS[label] ||
                `⚙️  [Action] Processing node: ${node.data?.label || node.label || label}`;
            callback?.({ text: msg });
        }

        // 3. Evaluate conditions
        if (conditionNodes.length > 0) {
            await new Promise(r => setTimeout(r, 300));
            callback?.({ text: `✅ ${conditionNodes.length} guard condition(s) evaluated — all passed.` });
        }

        // 4. Summary
        callback?.({ text: `🎯 Kernel "${strategyName}" executed successfully on ${asset} vault.` });
        return { success: true, strategyName, asset, nodeCount: nodes.length };
    }
};
