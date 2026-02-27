import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    let keypair;
    if (process.env.SUI_PRIVATE_KEY.startsWith('suiprivkey')) {
        const { decodeSuiPrivateKey } = await import('@mysten/sui/cryptography');
        keypair = Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(process.env.SUI_PRIVATE_KEY).secretKey);
    } else {
        keypair = Ed25519Keypair.fromSecretKey(fromBase64(process.env.SUI_PRIVATE_KEY));
    }
    
    // Testnet USDC coin type we will use (a generic mock from SuiTestnet) or we just use 0x2::sui::SUI, 0x2::sui::SUI again? 
    // We want a MockPool<USDC, SUI>. The user asked for "un segundo mockpool en cadena para usdc".
    // 0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN is Scallop's testnet USDC. Let's try it.
    const usdcType = "0x5d4b302506645c37ff133b98c4b50a5ae14841659738d6d733d59d0d217a93bf::coin::COIN";
    
    const tx = new Transaction();
    tx.moveCall({
        target: `${process.env.NEXT_PUBLIC_PACKAGE_ID}::atomic_engine::create_pool`,
        typeArguments: [usdcType, '0x2::sui::SUI']
    });
    
    const res = await client.signAndExecuteTransaction({
        signer: keypair,
        transaction: tx,
        options: { showEffects: true, showObjectChanges: true }
    });
    
    console.log("Tx:", res.digest);
    const pool = res.objectChanges.find(o => o.type === 'created' && o.objectType.includes('MockPool'));
    if (pool) {
        console.log("USDC MockPool ID:", pool.objectId);
        console.log("SUCCESS. Save this ID.");
    } else {
        console.log("Created objects:", res.objectChanges);
    }
}
main().catch(console.error);
