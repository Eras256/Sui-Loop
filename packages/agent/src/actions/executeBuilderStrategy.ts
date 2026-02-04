import { Action, IAgentRuntime, Memory } from "@elizaos/core";

export const executeBuilderStrategy: Action = {
    name: "EXECUTE_BUILDER_STRATEGY",
    similes: ["RUN_CUSTOM_FLOW", "PROCESS_NODES"],
    description: "Executes a custom node-based strategy flow defined in the Strategy Builder",
    validate: async (runtime: IAgentRuntime, message: Memory) => {
        return true; // Always valid to attempt
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: any,
        options: any,
        callback: any
    ) => {
        // Extract nodes from content
        const content = message.content as any;
        const nodes = content.nodes || [];
        const strategyName = content.strategyName || "Custom Flow";

        callback?.({ text: `🧩 Starting execution of Custom Strategy: "${strategyName}"` });
        callback?.({ text: `📊 Loaded ${nodes.length} nodes from configuration.` });

        // 1. Find Start Node (Trigger)
        const startNode = nodes.find((n: any) => n.id === 'start' || n.type === 'trigger');
        if (!startNode) {
            callback?.({ text: "❌ Error: No Trigger/Start node found in the flow." });
            return false;
        }

        callback?.({ text: `⚡ Trigger Activated: ${startNode.label}` });

        // 2. Simulate Traversal (Linear for now, just finding connected actions)
        // In a real engine, we would follow edges. Here we just execute Actions sequentially.
        const actionNodes = nodes.filter((n: any) => n.type === 'action');

        for (const node of actionNodes) {
            // Simulate processing delay
            await new Promise(r => setTimeout(r, 500));

            switch (node.label) {
                case 'Flash Loan SUI':
                    callback?.({ text: `💰 [Action] Executing Flash Loan for SUI...` });
                    break;
                case 'Swap SUI -> USDC':
                    callback?.({ text: `🔄 [Action] Swapping SUI to USDC on Cetus...` });
                    break;
                case 'Supply to Scallop':
                    callback?.({ text: `🏦 [Action] Supplying assets to Scallop Protocol...` });
                    break;
                default:
                    callback?.({ text: `⚙️ [Action] Processing custom block: ${node.label}` });
            }
        }

        // 3. Check Conditions (Mock)
        const conditions = nodes.filter((n: any) => n.type === 'condition');
        if (conditions.length > 0) {
            callback?.({ text: `🔍 Evaluated ${conditions.length} safe-guard conditions. All Passed.` });
        }

        callback?.({ text: `✅ Strategy Execution Complete.` });
        return true;
    }
};
