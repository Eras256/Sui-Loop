import { Plugin } from "@elizaos/core";
import { executeAtomicLeverage } from "./actions/executeAtomicLeverage.js";
import { executeBuilderStrategy } from "./actions/executeBuilderStrategy.js";
import { executeMainnetStrategy } from "./actions/executeMainnetStrategy.js";
import { deepBookProvider } from "./providers/deepBookProvider.js";

export const suiLoopPlugin: Plugin = {
    name: "@elizaos/plugin-sui",
    description: "SuiLoop Plugin for Atomic Leverage and Scallop/Cetus Interaction",
    actions: [executeAtomicLeverage, executeBuilderStrategy, executeMainnetStrategy],
    providers: [deepBookProvider],
    evaluators: [] // Add evaluators here
};
