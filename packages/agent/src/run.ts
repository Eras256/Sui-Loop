/**
 * SuiLoop Agent Runner
 *
 * Initializes and runs the SuiLoop agent to execute atomic flash loans.
 *
 * Usage:
 *   pnpm dev                          → Loop 0.1 SUI (default)
 *   pnpm dev "Loop 1 SUI please"      → Custom amount/asset from text
 *   pnpm dev "Loop 0.5 USDC"          → USDC flash loan
 */

import * as dotenv from "dotenv";
import { executeAtomicLeverage } from "./actions/executeAtomicLeverage.js";

// Load environment variables from .env file
dotenv.config();

// Parse command from argv — default to SUI loop
const command = process.argv[2] || "Loop 0.1 SUI please";
const isUSDC = command.toLowerCase().includes('usdc');
const assetLabel = isUSDC ? 'USDC' : 'SUI';

// Mock runtime that reads from environment variables
const mockRuntime = {
    getSetting: (key: string): string | undefined => {
        return process.env[key];
    },
    composeState: async () => ({}),
};

// Mock message with user request
const mockMessage = {
    content: {
        text: command
    },
    userId: "cli-runner",
    agentId: "suiloop-agent",
    roomId: "cli-room",
};

// Callback to display results
const displayCallback = async (response: { text: string; content?: unknown }) => {
    console.log("\n" + "═".repeat(60));
    console.log("🤖 AGENT OUTPUT:");
    console.log("═".repeat(60));
    console.log(response.text);
    if (response.content) {
        console.log("\n📊 Data:", JSON.stringify(response.content, null, 2));
    }
    console.log("═".repeat(60) + "\n");
    return [];
};

async function main() {
    const privateKey = process.env.SUI_PRIVATE_KEY;
    const packageId = process.env.SUI_PACKAGE_ID;
    const poolId = process.env.SUI_POOL_ID;
    const network = process.env.SUI_NETWORK || 'testnet';

    console.log(`
╔══════════════════════════════════════════════════════════════╗
║           🚀 SUILOOP AGENT RUNNER v0.0.7                    ║
║     Atomic Flash Loans · SUI/USDC · Sui Testnet             ║
╚══════════════════════════════════════════════════════════════╝
    `);

    console.log("📋 Configuration Check:");
    console.log(`   • Private Key:  ${privateKey ? "✅ Configured" : "❌ MISSING — set SUI_PRIVATE_KEY in .env"}`);
    console.log(`   • Package ID:   ${packageId ? `✅ ${packageId.slice(0, 20)}...` : "⚙️  Using default (v0.0.7)"}`);
    console.log(`   • Pool ID:      ${poolId ? `✅ ${poolId.slice(0, 20)}...` : "⚙️  Using default (MockPool)"}`);
    console.log(`   • Network:      ${network === 'testnet' ? '🟡' : '🔴'} ${network.toUpperCase()}`);
    console.log(`   • Asset:        ${assetLabel}`);
    console.log(`   • Command:      "${command}"`);
    console.log("");

    if (!privateKey) {
        console.error("❌ SUI_PRIVATE_KEY not found in .env file!");
        console.error("   Add your private key to packages/agent/.env:");
        console.error("   SUI_PRIVATE_KEY=suiprivkey1...");
        process.exit(1);
    }

    // Validate the action
    console.log("🔍 Validating action...");
    const isValid = await executeAtomicLeverage.validate(
        mockRuntime as any,
        mockMessage as any
    );

    if (!isValid) {
        console.error("❌ Action validation failed! Check SUI_PRIVATE_KEY format.");
        process.exit(1);
    }
    console.log(`✅ Action validated — executing ${assetLabel} flash loan...\n`);

    try {
        const result = await executeAtomicLeverage.handler(
            mockRuntime as any,
            mockMessage as any,
            undefined,
            {},
            displayCallback as any
        );

        if (result && typeof result === 'object' && 'success' in result) {
            if (result.success) {
                console.log(`\n🎉 SUCCESS! ${assetLabel} flash loan executed on-chain.`);
                if ('url' in result) {
                    console.log(`   View on Suiscan: ${result.url}`);
                }
                process.exit(0);
            } else {
                console.log("\n⚠️ Transaction did not complete successfully.");
                if ('error' in result) {
                    console.log(`   Error: ${result.error}`);
                }
                process.exit(1);
            }
        }
    } catch (error) {
        console.error("\n❌ Error executing action:", error);
        process.exit(1);
    }
}

main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
