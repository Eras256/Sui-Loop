
import * as dotenv from 'dotenv';
import { executeMainnetStrategy } from './src/actions/executeMainnetStrategy.js';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromBase64 } from '@mysten/sui/utils';

dotenv.config({ path: 'packages/agent/.env' });
console.log("Loading .env from packages/agent/.env");

async function runTest() {
    console.log("🧪 Starting Test: executeMainnetStrategy");

    if (!process.env.SUI_PRIVATE_KEY) {
        console.error("❌ SUI_PRIVATE_KEY not found in .env");
        process.exit(1);
    }

    // Mock Runtime
    const mockRuntime = {
        getSetting: (key: string) => process.env[key],
        composeState: async () => ({}),
        sui: {
            // Mocking internal runtime helpers if any, but the action uses imports directly mostly
        }
    };

    // Mock Message
    const mockMessage = {
        content: {
            text: "Execute Flash Loan Strategy",
            strategy: "flash-loan-executor"
        },
        userId: "test-user-01",
        roomId: "test-room"
    };

    // Mock Callback
    const callback = async (response: any) => {
        console.log(`[🤖 Agent]: ${response.text}`);
    };

    try {
        console.log("▶️ Triggering Action Handler...");
        const result = await executeMainnetStrategy.handler(
            mockRuntime as any,
            mockMessage as any,
            {} as any,
            {},
            callback
        );

        console.log("✅ Execution Result:", result);
    } catch (error) {
        console.error("❌ Test Failed:", error);
    }
}

runTest();
