import axios from 'axios';

const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

export class WalrusService {
    constructor() { }

    /**
     * Uploads trade log data to the Walrus decentralized storage network.
     */
    async logTradeToWalrus(tradeData: Record<string, any>): Promise<string> {
        console.log("🦭 Uploading trade log to Walrus...", tradeData);

        try {
            const payload = JSON.stringify({
                type: 'trade_log',
                content: tradeData,
                timestamp: new Date().toISOString()
            });

            // Modern Walrus Testnet REST API endpoint for storing blobs is /v1/blobs (2025/2026)
            const response = await axios.put(`${WALRUS_PUBLISHER}/v1/blobs?epochs=5`, payload, {
                headers: { 'Content-Type': 'application/json' }
            });

            if (response.data && (response.data.newlyCreated || response.data.alreadyCertified)) {
                const blobId = response.data.newlyCreated?.blobObject?.blobId ||
                    response.data.alreadyCertified?.blobId;

                console.log(`✅ Trade log successfully archived to Walrus! Blob ID: ${blobId}`);
                return blobId;
            }

            throw new Error('Unexpected response format from Walrus node.');
        } catch (error: any) {
            console.error(`⚠️ Failed to upload trade log to Walrus:`, error.message);
            throw error;
        }
    }
}
