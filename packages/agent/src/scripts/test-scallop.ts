import { Scallop } from '@scallop-io/sui-scallop-sdk';

async function main() {
    console.log("🐚 Connecting to Scallop Testnet...");

    try {
        const scallop = new Scallop({
            networkType: 'testnet',
        });

        const query = await scallop.createScallopQuery();
        console.log("🔍 Fetching Scallop Market Data...");

        const marketData = await query.getMarketPools();

        // The structure seems to be { pools: [...], ... } or { pools: { 'sui': ... } }
        // Let's inspect 'pools' directly
        // @ts-ignore
        const pools = marketData?.pools;

        if (!pools || Object.keys(pools).length === 0) {
            console.log("⚠️ No active Scallop pools found.");
        } else {
            console.log(`✅ Found Scallop Liquidity!`);

            // Iterate over the coins in 'pools'
            for (const [coinName, poolData] of Object.entries(pools)) {
                // @ts-ignore
                const supplyApy = poolData.supplyApy;
                // @ts-ignore
                const borrowApy = poolData.borrowApy;
                // @ts-ignore
                const supplyBalance = poolData.supplyBalance;

                console.log(`\n💎 Block Asset: ${coinName.toUpperCase()}`);
                console.log(`   Supply APY: ${(supplyApy * 100).toFixed(2)}%`);
                console.log(`   Borrow APY: ${(borrowApy * 100).toFixed(2)}%`);
                console.log(`   Total Supply: ${supplyBalance}`);
            }
        }

    } catch (e: any) {
        console.error("❌ Error exploring Scallop:", e.message || e);
    }
}

main();
