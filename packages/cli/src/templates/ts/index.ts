import { Agent } from '@suiloop/sdk';
// @ts-ignore - Dependency installed in user project
import { NAVISDKClient } from 'navi-sdk'; // Institutional DeFi Integration
import 'dotenv/config';

const agent = new Agent({
    apiKey: process.env.SUILOOP_API_KEY || '',
    baseUrl: 'http://localhost:3001'
});

async function main() {
    console.log('🤖 Starting SuiLoop Agent...');
    console.log('🏦 Initializing Navi Protocol Module...');

    const status = await agent.ping();
    if (!status) {
        console.error('❌ Could not connect to Agent Network');
        process.exit(1);
    }
    console.log('✅ Connected to Neural Matrix');

    agent.subscribe(async (signal: any) => {
        console.log('⚡ Signal Received:', signal);

        // --- NAVI PROTOCOL EXECUTION ---
        if (signal.type === 'NAVI_SUPPLY') {
            console.log(`🏦 [NAVI] Supplying ${signal.asset} to Liquidity Pool...`);
            // const navi = new NAVISDKClient({ mnemonic: process.env.MNEMONIC });
            // await navi.supply(signal.asset, signal.amount);
        }

        // --- DEEPBOOK EXECUTION ---
        if (signal.type === 'DEEPBOOK_LIMIT') {
            console.log(`📘 [DEEPBOOK] Placing Limit Order: ${signal.pair}`);
        }
    });

    console.log('🛰️ Waiting for orbital signals...');
}

main().catch(console.error);
