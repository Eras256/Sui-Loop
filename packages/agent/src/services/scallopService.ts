import { Scallop } from '@scallop-io/sui-scallop-sdk';

export class ScallopService {
    private scallop: Scallop;
    private isConnected: boolean = false;

    constructor() {
        this.scallop = new Scallop({
            networkType: 'testnet',
        });
    }

    async getMarketData(coin: string = 'sui') {
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
                    active: true
                };
            }
            return null;
        } catch (error) {
            console.warn('⚠️ Scallop Service Warning:', error);
            return null;
        }
    }
}
