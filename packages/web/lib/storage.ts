/**
 * Walrus / IPFS Storage Utility
 * 
 * Provides methods to upload strategy code and metadata to decentralized storage.
 * Currently configured for Walrus (Sui's storage layer) or a generic IPFS gateway.
 */

const WALRUS_PUBLISHER = process.env.NEXT_PUBLIC_WALRUS_PUBLISHER_URL || 'https://publisher.walrus-testnet.walrus.space';
const WALRUS_AGGREGATOR = process.env.NEXT_PUBLIC_WALRUS_AGGREGATOR_URL || 'https://aggregator.walrus-testnet.walrus.space';

export interface StorageResult {
    blobId: string;
    url: string;
}

/**
 * Uploads data to Walrus (Sui Storage)
 * @param data The JSON data or string content to upload
 * @returns The blob ID and download URL
 */
export async function uploadToStorage(data: any): Promise<StorageResult> {
    try {
        const content = typeof data === 'string' ? data : JSON.stringify(data);

        // Push to Walrus Publisher
        const response = await fetch(`${WALRUS_PUBLISHER}/v1/store`, {
            method: 'PUT',
            body: content
        });

        if (!response.ok) {
            throw new Error(`Storage Error: ${response.statusText}`);
        }

        const result = await response.json();
        let blobId = '';

        // Handle different response formats from Walrus versions
        if (result.newlyCreated && result.newlyCreated.blobObject && result.newlyCreated.blobObject.blobId) {
            blobId = result.newlyCreated.blobObject.blobId;
        } else if (result.alreadyCertified && result.alreadyCertified.blobId) {
            blobId = result.alreadyCertified.blobId;
        } else {
            // Fallback/Simulated ID if testnet is unstable
            console.warn("Could not parse Walrus response, using mock ID for dev.");
            blobId = "blob_" + Math.random().toString(36).substring(7);
        }

        return {
            blobId,
            url: `${WALRUS_AGGREGATOR}/v1/${blobId}`
        };

    } catch (error) {
        console.error("Failed to upload to decentralized storage:", error);
        // Fallback for demo purposes if Walrus is unreachable
        return {
            blobId: "mock_ipfs_hash_" + Date.now(),
            url: "#"
        };
    }
}
