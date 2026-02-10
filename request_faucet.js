
import { requestSuiFromFaucetV1, getFaucetHost } from '@mysten/sui/faucet';

const recipient = '0x8bd468b0e5941e75484e95191d99ff6234b2ab24e3b91650715b6df8cf8e4eba';

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
