import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const AUDIT_FILE = path.join(process.cwd(), 'audit_book.log');

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
    constructor() {
        // Initialize audit file with a header if it doesn't exist
        if (!fs.existsSync(AUDIT_FILE)) {
            fs.writeFileSync(AUDIT_FILE, `--- SUILOOP WALRUS AUDIT TRAIL ---\nGenerated: ${new Date().toISOString()}\n\n`);
        }
    }

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

        let blobId = `local-${log.strategy_id}-${Date.now()}`;
        try {
            const response = await axios.put(`${WALRUS_PUBLISHER}/v1/blobs?epochs=5`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000
            });

            if (response.data && (response.data.newlyCreated || response.data.alreadyCertified)) {
                blobId = response.data.newlyCreated?.blobObject?.blobId ||
                    response.data.alreadyCertified?.blobId;
                console.log(`✅ [Blackbox] Execution sealed on Walrus. Blob ID: ${blobId}`);
            } else {
                console.warn('⚠️ [Blackbox] Unexpected Walrus response. Using local ID fallback.');
            }
        } catch (error: any) {
            console.warn(`⚠️ [Blackbox] Walrus upload failed — ${error.message}. Falling back to local log.`);
        }

        // --- REAL AUDIT TRAIL: SAVE TO LOCAL FILE ---
        const auditEntry = `[${new Date().toISOString()}] STRATEGY_EXECUTION: ${log.strategy_name} (${log.strategy_id})\n` +
            `  - Wallet: ${log.wallet}\n` +
            `  - TxHash: ${log.txHash}\n` +
            `  - Result: ${log.status} (Profit: ${log.profit_mist} MIST)\n` +
            `  - Walrus Seal: https://walruscan.com/testnet/blob/${blobId}\n` +
            `  - Blob ID: ${blobId}\n\n`;

        fs.appendFileSync(AUDIT_FILE, auditEntry);

        return blobId;
    }

    /**
     * Uploads generic trade log data to Walrus.
     */
    async logTradeToWalrus(tradeData: Record<string, any>): Promise<string> {
        console.log('🦭 Uploading trade log to Walrus...', tradeData);

        const payload = JSON.stringify({
            type: 'trade_log',
            content: tradeData,
            timestamp: new Date().toISOString()
        });

        let blobId = `local-trade-${Date.now()}`;
        try {
            const response = await axios.put(`${WALRUS_PUBLISHER}/v1/blobs?epochs=5`, payload, {
                headers: { 'Content-Type': 'application/json' },
                timeout: 8000
            });

            if (response.data && (response.data.newlyCreated || response.data.alreadyCertified)) {
                blobId = response.data.newlyCreated?.blobObject?.blobId ||
                    response.data.alreadyCertified?.blobId;
                console.log(`✅ Trade log archived to Walrus! Blob ID: ${blobId}`);
            }
        } catch (error: any) {
            console.error(`⚠️ Failed to upload trade log to Walrus:`, error.message);
        }

        // Save to local audit book
        const auditEntry = `[${new Date().toISOString()}] TRADE_LOG: ${tradeData.action || 'Trade'}\n` +
            `  - Walrus Seal: https://walruscan.com/testnet/blob/${blobId}\n` +
            `  - Data: ${JSON.stringify(tradeData)}\n\n`;

        fs.appendFileSync(AUDIT_FILE, auditEntry);

        return blobId;
    }
}
