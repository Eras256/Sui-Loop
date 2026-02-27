import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const pk = "suiprivkey1qz84s4m4s0kvgd9e6wafg0tjt6jk5mf0uyyuqvfgr56qxhx4p5upz884pdj";
    const { decodeSuiPrivateKey } = await import('@mysten/sui/cryptography');
    const keypair = Ed25519Keypair.fromSecretKey(decodeSuiPrivateKey(pk).secretKey);
    const address = keypair.toSuiAddress();
    
    console.log("Address:", address);
    
    const balances = await client.getAllBalances({ owner: address });
    console.log("Balances:", JSON.stringify(balances, null, 2));
}
main();
