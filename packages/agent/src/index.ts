import { Plugin } from "@elizaos/core";
import { executeAtomicLeverage } from "./actions/executeAtomicLeverage.js";
import { executeBuilderStrategy } from "./actions/executeBuilderStrategy.js";
import { executeMainnetStrategy } from "./actions/executeMainnetStrategy.js";
import { deepBookProvider } from "./providers/deepBookProvider.js";

export const suiLoopPlugin: Plugin = {
    name: "@suiloop/plugin-agent",
    description: "SuiLoop Agent — Atomic Flash Loans · SUI/USDC Multi-Asset Vaults · DeepBook V3 · Walrus Blackbox Logging · ElizaOS AI Layer",
    actions: [executeAtomicLeverage, executeBuilderStrategy, executeMainnetStrategy],
    providers: [deepBookProvider],
    evaluators: [] // Add evaluators here
};
