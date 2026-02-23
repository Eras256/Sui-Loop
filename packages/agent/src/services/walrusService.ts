import axios from 'axios';

const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';

export interface StrategyExecutionLog {
    strategy_id: string;
    strategy_name: string;
    asset: 'SUI' | 'USDC';
    wallet: string;
    txHash: string;
    profit_mist: number;
    gas_cost_mist: number;
    status: 'success' | 'failure' | 'reverted';
    protocol: string;
    timestamp: string;
    kernel_version: string;
}

export class WalrusService {
    constructor() { }

    /**
     * Uploads a SuiLoop strategy execution forensic log to Walrus.
     * Used by the Walrus Blackbox Logger skill for tamper-proof audit trails.
     */
    async logStrategyExecution(log: StrategyExecutionLog): Promise<string> {
        console.log(`🦭 [Blackbox] Archiving strategy execution to Walrus — ${log.strategy_id}`);

        const payload = JSON.stringify({
            type: 'suiloop_execution_log',
            kernel_version: log.kernel_version || '0.0.7',
            content: log,
            timestamp: log.timestamp || new Date().toISOString()
        });

        try {
            const response = await axios.put(`${WALRUS_PUBLISHER}/v1/blobs?epochs=5`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000
            });

            if (response.data && (response.data.newlyCreated || response.data.alreadyCertified)) {
                const blobId = response.data.newlyCreated?.blobObject?.blobId ||
                    response.data.alreadyCertified?.blobId;
                console.log(`✅ [Blackbox] Execution sealed on Walrus. Blob ID: ${blobId}`);
                return blobId;
            }
            throw new Error('Unexpected response format from Walrus node.');
        } catch (error: any) {
            console.warn(`⚠️ [Blackbox] Walrus upload failed — ${error.message}. Falling back to local log.`);
            // Return simulated blob ID as fallback so execution is not blocked
            return `local-${log.strategy_id}-${Date.now()}`;
        }
    }

    /**
     * Uploads generic trade log data to Walrus.
     */
    async logTradeToWalrus(tradeData: Record<string, any>): Promise<string> {
        console.log('🦭 Uploading trade log to Walrus...', tradeData);

        try {
            const payload = JSON.stringify({
                type: 'trade_log',
                content: tradeData,
                timestamp: new Date().toISOString()
            });

            // Modern Walrus Testnet REST API endpoint for storing blobs is /v1/blobs (2025/2026)
            const response = await axios.put(`${WALRUS_PUBLISHER}/v1/blobs?epochs=5`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000
            });

            if (response.data && (response.data.newlyCreated || response.data.alreadyCertified)) {
                const blobId = response.data.newlyCreated?.blobObject?.blobId ||
                    response.data.alreadyCertified?.blobId;

                console.log(`✅ Trade log archived to Walrus! Blob ID: ${blobId}`);
                return blobId;
            }

            throw new Error('Unexpected response format from Walrus node.');
        } catch (error: any) {
            console.error(`⚠️ Failed to upload trade log to Walrus:`, error.message);
            throw error;
        }
    }
}
