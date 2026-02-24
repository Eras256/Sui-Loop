
import { requestSuiFromFaucetV1, getFaucetHost } from '@mysten/sui/faucet';

const recipient = '0x3375661d59379545d2e412a56890483d4d22c7027d91df6571c012276e175d29';

async function main() {
    console.log('Requesting SUI from faucet for:', recipient);
    try {
        const result = await requestSuiFromFaucetV1({
            host: getFaucetHost('testnet'),
            recipient: recipient,
        });
        console.log('Success:', JSON.stringify(result));
    } catch (e) {
        console.error('Error requesting faucet:', e);
    }
}

main();
