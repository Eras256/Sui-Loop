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
    const poolId = "0xfc45942dce550fe733e6bb2a6c635dc85d1acbf1acb1b581f3354412d1ae9398";
    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID || process.env.SUI_PACKAGE_ID;
    
    // Attempt to inject whatever is available
    const balance = await client.getBalance({ owner: address });
    const totalSui = BigInt(balance.totalBalance);
    
    const injectionAmount = totalSui - 50_000_000n; // leave tiny amount for gas
    if (injectionAmount < 100_000_000n) {
        console.error("Too little funds to inject");
        return;
    }

    const tx = new Transaction();
    
    const [coin] = tx.splitCoins(tx.gas, [Number(injectionAmount)]); 
    
    tx.moveCall({
        target: `${packageId}::atomic_engine::add_liquidity`,
        typeArguments: ['0x2::sui::SUI', '0x2::sui::SUI'],
        arguments: [
            tx.object(poolId),
            coin
        ]
    });
    
    const res = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true, showBalanceChanges: true }
    });
    
    console.log("Tx:", res.digest);
    if (res.effects?.status.status === 'success') {
        console.log(`✅ Successfully injected ${Number(injectionAmount)/1e9} USDC (Sui mock token) into the MockPool!`);
    } else {
        console.error("❌ Failed:", res.effects?.status.error);
    }
}
main().catch(console.error);
