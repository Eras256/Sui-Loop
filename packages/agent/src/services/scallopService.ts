import { Scallop } from '@scallop-io/sui-scallop-sdk';

export class ScallopService {
    private scallop: Scallop;
    private isConnected: boolean = false;

    constructor() {
        const network = (process.env.SUI_NETWORK as 'testnet' | 'mainnet') || 'testnet';
        this.scallop = new Scallop({
            networkType: network,
        });
    }

    /** Fetch SUI or USDC market data from Scallop */
    async getMarketData(coin: string = 'sui') {
        // For USDC, fall back to Navi Protocol which has better USDC pool data on testnet
        if (coin === 'usdc') {
            return this.getNaviUsdcData();
        }

        try {
            const query = await this.scallop.createScallopQuery();
            const marketPools = await query.getMarketPools();

            // @ts-ignore
            const pools = marketPools?.pools;

            if (pools && pools[coin]) {
                const data = pools[coin];
                return {
                    coin: coin.toUpperCase(),
                    // @ts-ignore
                    supplyApy: (data.supplyApy * 100).toFixed(2),
                    // @ts-ignore
                    borrowApy: (data.borrowApy * 100).toFixed(2),
                    active: true,
                    source: 'Scallop'
                };
            }
            return null;
        } catch (error) {
            console.warn('⚠️ Scallop Service Warning:', error);
            return null;
        }
    }

    /** Fetch USDC lending rates from Navi Protocol REST API */
    async getNaviUsdcData() {
        try {
            const res = await fetch('https://open-api.naviprotocol.io/api/pools', {
                signal: AbortSignal.timeout(5000)
            });
            if (!res.ok) throw new Error(`Navi API error: ${res.status}`);
            const json = await res.json() as any[];
            const usdcPool = json.find((p: any) =>
                p.symbol?.toUpperCase() === 'USDC' ||
                p.tokenSymbol?.toUpperCase() === 'USDC'
            );
            if (usdcPool) {
                const supplyApy = parseFloat(usdcPool.supplyApy ?? usdcPool.supply_apy ?? usdcPool.depositApy ?? '0');
                const borrowApy = parseFloat(usdcPool.borrowApy ?? usdcPool.borrow_apy ?? '0');
                return {
                    coin: 'USDC',
                    supplyApy: supplyApy.toFixed(2),
                    borrowApy: borrowApy.toFixed(2),
                    active: true,
                    source: 'Navi'
                };
            }
            return null;
        } catch (error) {
            console.warn('⚠️ Navi USDC Service Warning:', error);
            return null;
        }
    }
}

