import { Plugin } from "@elizaos/core";
import { executeAtomicLeverage } from "./actions/executeAtomicLeverage.js";
import { deepBookProvider } from "./providers/deepBookProvider.js";

export const suiLoopPlugin: Plugin = {
    name: "@elizaos/plugin-sui",
    description: "SuiLoop Plugin for Atomic Leverage and DeepBook Interaction",
    actions: [executeAtomicLeverage],
    providers: [deepBookProvider],
    evaluators: [] // Add evaluators here
};
