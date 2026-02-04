import { initCetusSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { getFullnodeUrl } from '@mysten/sui/client';

async function main() {
    console.log("🌊 Connecting to Cetus Testnet (Broad Search)...");

    const sdk = initCetusSDK({ network: 'testnet' });
    sdk.senderAddress = '0x1234567890123456789012345678901234567890123456789012345678901234';

    try {
        console.log("🔍 Fetching ALL available pools via Cetus SDK...");

        // Fetch first page of pools (no filter)
        const result = await sdk.Pool.getPoolsWithPage([]);

        if (result.length === 0) {
            console.log("⚠️ SDK returned 0 pools. The Indexer might be syncing or Empty.");
        } else {
            console.log(`✅ Found ${result.length} active pools!`);
            console.log("---------------------------------------------------");

            // Sort by liquidity string length (rough proxy for magnitude) or just take first few
            const topPools = result.slice(0, 10);

            topPools.forEach((pool, i) => {
                const coinA = pool.coinTypeA.split('::').pop(); // Short name
                const coinB = pool.coinTypeB.split('::').pop(); // Short name
                console.log(`🏊 Pool #${i + 1}: ${coinA} / ${coinB}`);
                console.log(`   ID: ${pool.poolAddress}`);
                console.log(`   Liquidity: ${pool.liquidity}`);
                console.log(`   Fee: ${pool.fee_rate * 100}%`);
                console.log("---------------------------------------------------");
            });
        }

    } catch (e: any) {
        console.error("❌ Error fetching pools:", e.message || e);
        if (e.message?.includes("events")) {
            console.log("\n💡 TIP: 'Transaction events' error usually means the RPC node is lagging behind the Indexer.");
        }
    }
}

main();
