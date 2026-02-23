// @ts-ignore - Dependency installed in generated user project
import WebSocket from 'ws';
// @ts-ignore - Dependency installed in generated user project
import fetch from 'node-fetch';
import 'dotenv/config';

const AGENT_URL = 'http://localhost:3001';
const API_KEY = process.env.SUILOOP_API_KEY || '';

async function ping(): Promise<boolean> {
    try {
        const res = await fetch(`${AGENT_URL}/health`);
        return res.ok;
    } catch {
        return false;
    }
}

async function execute(strategy: string, asset: "SUI" | "USDC", amount: number) {
    try {
        const res = await fetch(`${AGENT_URL}/api/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': API_KEY
            },
            body: JSON.stringify({ strategy, asset, params: { amount } })
        });
        return await res.json();
    } catch (e) {
        console.error('Execution Failed', e);
    }
}

async function main() {
    console.log('🤖 Starting SuiLoop Agent (TypeScript)...');

    const status = await ping();
    if (!status) {
        console.error('❌ Could not connect to Agent Network at', AGENT_URL);
        process.exit(1);
    }
    console.log('✅ Connected to Neural Matrix');

    // --- WEBSOCKET STREAM ---
    const wsUrl = AGENT_URL.replace('http', 'ws') + '/ws/signals';
    const ws = new WebSocket(wsUrl, { headers: { 'x-api-key': API_KEY } });

    ws.on('open', () => {
        console.log('🔌 Listening for market signals...');
        ws.send(JSON.stringify({ type: 'auth', apiKey: API_KEY }));
    });

    ws.on('message', async (data: Buffer) => {
        const signal = JSON.parse(data.toString());
        console.log('⚡ Signal Received:', signal);

        // --- AUTOMATED EXECUTION EXAMPLE ---
        if (signal.type === 'signal' && signal.payload?.confidence > 80) {
            const asset = signal.payload.pair?.includes('USDC') ? 'USDC' : 'SUI';
            console.log(`🚀 High confidence! Executing flash loan on ${asset}...`);
            const result = await execute('atomic-flash-loan', asset, 1.0);
            console.log('💰 Result:', result);
        }
    });

    ws.on('close', () => console.log('⚠️ Stream closed'));
    ws.on('error', (err: any) => console.error('WS Error:', err));
}

main().catch(console.error);
