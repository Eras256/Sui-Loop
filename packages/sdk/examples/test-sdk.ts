import { Agent } from '../src/index';

async function main() {
    console.log('🧪 Testing SuiLoop TypeScript SDK...');

    const client = new Agent({
        apiKey: 'sk_live_your_api_key_here',
        baseUrl: 'http://localhost:3001'
    });

    try {
        console.log('1. Checking Agent Health...');
        const health = await client.health();
        console.log('✅ Agent Health Status:', health.status);

        console.log('\n2. Executing Flash Loan Strategy...');
        const result = await client.execute('flash-loan-executor', 'SUI');

        if (result.success) {
            console.log('✅ Strategy Executed Successfully!');
            console.log('🔗 Hash:', result.txHash);
        } else {
            console.error('❌ Strategy Execution Failed:', result.error);
        }

    } catch (error) {
        console.error('💥 SDK Test Error:', error);
    }
}

main();
