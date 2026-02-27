import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env.local' });

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    let keypair;
    const pk = process.env.SUI_PRIVATE_KEY || '';
    if (pk.startsWith('suiprivkey')) {
        const { decodeSuiPrivateKey } = await import('@mysten/sui/cryptography');
        keypair = Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(pk).secretKey);
    } else {
        keypair = Ed25519Keypair.fromSecretKey(fromBase64(pk));
    }
    
    // Testnet USDC coin type we will use (a generic mock from SuiTestnet) or we just use 0x2::sui::SUI, 0x2::sui::SUI again? 
    const usdcType = "0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC";
    const packageId = process.env.NEXT_PUBLIC_PACKAGE_ID || process.env.SUI_PACKAGE_ID;

    if (!packageId) throw new Error("Missing package ID");

    const tx = new Transaction();
    tx.moveCall({
        target: `${packageId}::atomic_engine::create_pool`,
        typeArguments: [usdcType, '0x2::sui::SUI']
    });
    
    const res = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true }
    });
    
    console.log("Tx:", res.digest);
    const pool = res.objectChanges.find((o: any) => o.type === 'created' && o.objectType.includes('MockPool'));
    if (pool) {
        console.log("USDC MockPool ID:", (pool as any).objectId);
        console.log("SUCCESS. Save this ID.");
    } else {
        console.log("Created objects:", res.objectChanges);
    }
}
main().catch(console.error);
