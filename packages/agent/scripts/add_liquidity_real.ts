import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    
    // User provided pk with funds
    const pk = "suiprivkey1qz84s4m4s0kvgd9e6wafg0tjt6jk5mf0uyyuqvfgr56qxhx4p5upz884pdj";
    const { decodeSuiPrivateKey } = await import('@mysten/sui/cryptography');
    const keypair = Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(pk).secretKey);
    const address = keypair.toSuiAddress();
    
    // The previously created pool that acts as our dummy USDC pool
    const poolId = "0xd4dd4eeabf29e2286f151a907ef12e267cbb5ef1f98cac9f7ad2e57f6512d61e";
    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID || process.env.SUI_PACKAGE_ID;
    
    if (!packageId) throw new Error("Missing package ID");

    // Fetch user balances
    const balances = await client.getAllBalances({ owner: address });
    const usdcType = "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC";
    const usdcBalance = balances.find(b => b.coinType === usdcType);
    
    if (!usdcBalance || BigInt(usdcBalance.totalBalance) === 0n) {
        console.error("No USDC found in wallet");
        return;
    }
    
    console.log("Will inject", Number(usdcBalance.totalBalance) / 1e6, "USDC");

    // Get USDC coins
    const coinsInfo = await client.getCoins({ owner: address, coinType: usdcType });
    const coinsIds = coinsInfo.data.map(c => c.coinObjectId);
    console.log("Found USDC Coins:", coinsIds);

    const tx = new Transaction();
    
    // If multiple coins, we might need to merge them first, or just take the first one
    // Assuming just 1 coin or using the first one for simplicity, split all except 0?
    // Actually if we want to inject ALL of it, just merge all and pass the total.
    
    // We just pass the entire coin object if it's 1.
    let targetCoin;
    if (coinsIds.length > 1) {
        tx.mergeCoins(tx.object(coinsIds[0]), coinsIds.slice(1).map(id => tx.object(id)));
        targetCoin = tx.object(coinsIds[0]);
    } else {
        targetCoin = tx.object(coinsIds[0]);
    }
    
    tx.moveCall({
        target: `${packageId}::atomic_engine::add_liquidity`,
        typeArguments: [usdcType, '0x2::sui::SUI'],
        arguments: [
            tx.object(poolId),
            targetCoin
        ]
    });
    
    const res = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true, showBalanceChanges: true }
    });
    
    console.log("Tx:", res.digest);
    if (res.effects?.status.status === 'success') {
        console.log(`✅ Successfully injected 20 USDC into the MockPool!`);
    } else {
        console.error("❌ Failed:", res.effects?.status.error);
    }
}
main().catch(console.error);
