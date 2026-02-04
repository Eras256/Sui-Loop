import { initCetusSDK, CetusClmmSDK } from '@cetusprotocol/cetus-sui-clmm-sdk';
import { getFullnodeUrl } from '@mysten/sui/client';

export class CetusService {
    private sdk: CetusClmmSDK;
    private isConnected: boolean = false;

    constructor() {
        this.sdk = initCetusSDK({ network: 'testnet' });
        this.sdk.senderAddress = '0x0000000000000000000000000000000000000000000000000000000000000000'; // Read-only
    }

    async checkHealth(): Promise<boolean> {
        try {
            // Simple lightweight call to check if SDK can talk to RPC
            await this.sdk.Pool.getPoolsWithPage([]);
            this.isConnected = true;
            return true;
        } catch (error) {
            console.warn('⚠️ Cetus Service Unreachable (RPC or Indexer issue):', error);
            this.isConnected = false;
            return false;
        }
    }

    async getPool(coinA: string, coinB: string): Promise<string | null> {
        if (!this.isConnected) {
            // Try to reconnect once
            const alive = await this.checkHealth();
            if (!alive) return null;
        }

        try {
            console.log(`🔍 Searching Cetus Pools for ${coinA} / ${coinB}...`);
            const pools = await this.sdk.Pool.getPoolsWithPage([]);

            // Naive filter for now as API might not support filtering by coin type in getPoolsWithPage args directly 
            // without complex config
            const match = pools.find(p =>
                (p.coinTypeA === coinA && p.coinTypeB === coinB) ||
                (p.coinTypeA === coinB && p.coinTypeB === coinA)
            );

            if (match) {
                console.log(`✅ Found Cetus Pool: ${match.poolAddress}`);
                return match.poolAddress;
            }
        } catch (e) {
            console.error("❌ Failed to fetch Cetus pools:", e);
        }
        return null;
    }
}
