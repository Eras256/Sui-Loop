import { initCetusSDK, CetusClmmSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';

const SUI_TESTNET_CONFIG = {
    fullRpcUrl: getFullnodeUrl('testnet'),
    simulationAccount: '',
};

async function main() {
    console.log("🌊 Connecting to Cetus Testnet...");

    const sdk = initCetusSDK({ network: 'testnet' });
    sdk.senderAddress = '0x123...'; // Dummy address for read-only

    console.log("🔍 Fetching Pools (SUI/USDC equivalents)...");

    // SUI Coin Type (Testnet)
    const SUI_COIN = "0x2::sui::SUI";
    // USDC Coin Type (Testnet - standard mock often used)
    // We will search for pools containing SUI and see what's paired

    try {
        // Fetch explicit pools usually requires knowing addresses or fetching a list.
        // Cetus SDK usually has a config with defaults, let's inspect what it loaded.
        const poolList = await sdk.Pool.getPoolsWithPage([]);

        console.log(`✅ Found ${poolList.length} pools on Cetus Testnet.`);

        // Filter for SUI pools
        const suiPools = poolList.filter(p => p.coinTypeA === SUI_COIN || p.coinTypeB === SUI_COIN);

        console.log(`🔹 Found ${suiPools.length} SUI-paired pools.`);

        // Sort by liquidity (rough approximation)
        suiPools.sort((a, b) => Number(b.liquidity) - Number(a.liquidity));

        // Show top 3
        suiPools.slice(0, 3).forEach((pool, index) => {
            console.log(`\n🏆 Pool #${index + 1}:`);
            console.log(`   Address: ${pool.poolAddress}`);
            console.log(`   Pair: ${pool.coinTypeA.split('::').pop()} / ${pool.coinTypeB.split('::').pop()}`);
            console.log(`   Liquidity: ${pool.liquidity}`);
            console.log(`   Fee Rate: ${pool.feeRate}`);
        });

    } catch (e) {
        console.error("❌ Error exploring Cetus:", e);
    }
}

main().catch(console.error);
