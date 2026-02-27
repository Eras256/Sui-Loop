import { Scallop } from '@scallop-io/sui-scallop-sdk';
async function run() {
    try {
        const scallop = new Scallop({ networkType: 'testnet' });
        const query = await scallop.createScallopQuery();
        const market = await query.queryMarket();
        const sui = market.pools['sui'];
        const usdc = market.pools['usdc'];
        console.log("SUI APY:", sui?.supplyApr, sui?.borrowApr);
        console.log("USDC APY:", usdc?.supplyApr, usdc?.borrowApr);
    } catch (e) {
        console.error(e);
    }
}
run();
