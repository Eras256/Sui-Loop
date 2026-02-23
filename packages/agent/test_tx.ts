import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Transaction } from '@mysten/sui/transactions';

async function main() {
  const client = new SuiClient({ url: getFullnodeUrl('testnet') });
  const tx = new Transaction();
  const txBlock = await tx.build({ client });
  console.log('Test Transaction Built');
}
main().catch(console.error);
