
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

const privateKey = 'suiprivkey1qpzug3y5453l94pjw2s8as9ctt63ye90p7803gxf568pyepv0art5zxzg6d';
try {
    const keypair = Ed25519Keypair.fromSecretKey(privateKey);
    console.log(keypair.getPublicKey().toSuiAddress());
} catch (e) {
    // Try other method
    try {
        const { decodeSuiPrivateKey } = await import('@mysten/sui/utils');
        const { secretKey } = decodeSuiPrivateKey(privateKey);
        const keypair = Ed25519Keypair.fromSecretKey(secretKey);
        console.log(keypair.getPublicKey().toSuiAddress());
    } catch (e2) {
        console.error("Failed to decode key", e2);
    }
}
