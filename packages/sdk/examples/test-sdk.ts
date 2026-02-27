import { Agent } from '../src/index';

async function main() {
    console.log('🧪 Testing SuiLoop TypeScript SDK v0.0.8...');

    const client = new Agent({
        apiKey: process.env.SUILOOP_API_KEY || 'sk_live_your_key_here',
        baseUrl: process.env.AGENT_URL || 'http://localhost:3001'
    });

    try {
        // 1. Health check
        console.log('1. Checking Agent Health...');
        const health = await client.health();
        console.log('✅ Agent Health Status:', health.status);

        // 2. Live market data (Pyth oracle + Scallop APY)
        console.log('\n2. Fetching Live Market Data (Pyth + Scallop)...');
        const market = await client.getMarket();
        console.log(`   SUI Price:       $${market.suiPrice}`);
        console.log(`   Scallop SUI APY: ${market.scallopApy?.supply}%`);
        console.log(`   Navi USDC APY:   ${market.naviUsdcApy?.supply}%`);
        console.log(`   LLM Enabled:     ${market.llmEnabled}`);

        // 3. Execute a SUI flash loan strategy
        console.log('\n3. Executing SUI Flash Loan Strategy...');
        const result = await client.execute('flash-loan-executor', 'SUI');

        if (result.success) {
            console.log('✅ Strategy Executed Successfully!');
            if (result.txHash) console.log(`   TX Hash: ${result.txHash}`);
            if (result.txHash) console.log(`   SuiScan: https://suiscan.xyz/testnet/tx/${result.txHash}`);
            if (result.profit) console.log(`   Yield:   ${result.profit}`);
        } else {
            console.error('❌ Strategy Execution Failed:', result.error);
        }

    } catch (error) {
        console.error('💥 SDK Test Error:', error);
    }
}

main();
