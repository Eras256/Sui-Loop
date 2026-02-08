/**
 * SuiLoop Agent Runner
 * 
 * This script initializes and runs the SuiLoop agent to execute atomic flash loans.
 * 
 * Usage: pnpm dev (or npm run dev)
 */

import * as dotenv from "dotenv";
import { executeAtomicLeverage } from "./actions/executeAtomicLeverage.js";

// Load environment variables from .env file
dotenv.config();

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
        text: process.argv[2] || "Loop 0.1 SUI please"
    },
    userId: "test-user",
    agentId: "suiloop-agent",
    roomId: "test-room",
};

// Callback to display results
const displayCallback = async (response: { text: string; content?: unknown }) => {
    console.log("\n" + "=".repeat(60));
    console.log("🤖 AGENT RESPONSE:");
    console.log("=".repeat(60));
    console.log(response.text);
    if (response.content) {
        console.log("\n📊 Data:", JSON.stringify(response.content, null, 2));
    }
    console.log("=".repeat(60) + "\n");
    return [];
};

async function main() {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                  🚀 SUILOOP AGENT v0.0.7                  ║
║              Atomic Flash Loans on Sui Testnet            ║
╚═══════════════════════════════════════════════════════════╝
    `);

    // Check configuration
    const privateKey = process.env.SUI_PRIVATE_KEY;
    const packageId = process.env.SUI_PACKAGE_ID;
    const poolId = process.env.SUI_POOL_ID;

    console.log("📋 Configuration Check:");
    console.log(`   • Private Key: ${privateKey ? "✅ Configured" : "❌ Missing"}`);
    console.log(`   • Package ID: ${packageId?.slice(0, 20) || "Using default"}...`);
    console.log(`   • Pool ID: ${poolId?.slice(0, 20) || "Using default"}...`);
    console.log(`   • Command: "${mockMessage.content.text}"`);
    console.log("");

    if (!privateKey) {
        console.error("❌ SUI_PRIVATE_KEY not found in .env file!");
        console.error("   Please add your private key to packages/agent/.env");
        process.exit(1);
    }

    // Validate the action
    console.log("🔍 Validating action...");
    const isValid = await executeAtomicLeverage.validate(
        mockRuntime as any,
        mockMessage as any
    );

    if (!isValid) {
        console.error("❌ Action validation failed!");
        process.exit(1);
    }
    console.log("✅ Action validated successfully\n");

    // Execute the action
    console.log("🚀 Executing Atomic Flash Loan...\n");

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
                console.log("\n🎉 SUCCESS! Flash loan executed on-chain.");
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
