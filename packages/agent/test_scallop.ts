import { Scallop } from '@scallop-io/sui-scallop-sdk';
async function run() {
    const scallop = new Scallop({ networkType: 'testnet' });
    const market = await scallop.queryMarket();
    // find sui and usdc APY
    const sui = market.pools['sui'];
    const usdc = market.pools['usdc'];
    console.log(sui?.supplyCoinApy, sui?.borrowCoinApy);
    console.log(usdc?.supplyCoinApy, usdc?.borrowCoinApy);
}
run();
