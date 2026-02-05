import { Agent } from '@suiloop/sdk';
import 'dotenv/config';

const agent = new Agent({
    apiKey: process.env.SUILOOP_API_KEY || '',
    baseUrl: 'http://localhost:3001'
});

async function main() {
    console.log('🤖 Starting SuiLoop Agent...');

    const status = await agent.ping();
    if (!status) {
        console.error('❌ Could not connect to Agent Network');
        process.exit(1);
    }
    console.log('✅ Connected to Neural Matrix');

    agent.subscribe((signal: any) => {
        console.log('⚡ Signal Received:', signal);
        // Add your logic here
    });
}

main();
