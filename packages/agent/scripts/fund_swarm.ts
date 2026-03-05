/**
 * fund_swarm.ts — Distribuye SUI desde el wallet principal a los 20 agentes del swarm
 * Uso: npx tsx scripts/fund_swarm.ts
 *
 * Envía 0.08 SUI a cada agente en una sola PTB (splitCoins + transferObjects)
 * para que tengan gas para ejecutar señales y flash loans.
 */

import 'dotenv/config';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { decodeSuiPrivateKey } from '@mysten/sui/cryptography';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

// Main (funded) wallet — suiprivkey from balance_all.ts
const MAIN_PRIVKEY = process.env.SUI_PRIVATE_KEY ||
    'suiprivkey1qz84s4m4s0kvgd9e6wafg0tjt6jk5mf0uyyuqvfgr56qxhx4p5upz884pdj';

// Amount per agent: 0.05 SUI = 50_000_000 MIST
// 20 agents × 0.05 = 1.0 SUI total
const AMOUNT_PER_AGENT = 50_000_000n; // MIST

async function main() {
    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    // Load main keypair
    let mainKp: Ed25519Keypair;
    try {
        if (MAIN_PRIVKEY.startsWith('suiprivkey')) {
            const decoded = decodeSuiPrivateKey(MAIN_PRIVKEY);
            mainKp = Ed25519Keypair.fromSecretKey(decoded.secretKey);
        } else {
            mainKp = Ed25519Keypair.fromSecretKey(MAIN_PRIVKEY);
        }
    } catch (e: any) {
        console.error('❌ Could not load main keypair:', e.message);
        process.exit(1);
    }

    const mainAddr = mainKp.getPublicKey().toSuiAddress();
    const mainBal = await client.getBalance({ owner: mainAddr });
    const mainSui = Number(mainBal.totalBalance) / 1e9;

    console.log(`\n💰 Main wallet: ${mainAddr}`);
    console.log(`   Balance: ${mainSui.toFixed(4)} SUI\n`);

    if (mainSui < 1.0) {
        console.error('❌ Not enough SUI. Need at least 1 SUI.');
        process.exit(1);
    }

    // Get swarm agent addresses (first 20 .key files)
    const keyFiles = fs.readdirSync(PROJECT_ROOT)
        .filter(f => f.endsWith('.key') && f.startsWith('0x'))
        .sort()
        .slice(0, 20);

    const agentAddresses = keyFiles.map(f => f.replace('.key', ''));

    // Check existing balances
    console.log('📊 Checking existing balances...');
    const needsFunding: string[] = [];
    for (const addr of agentAddresses) {
        const bal = await client.getBalance({ owner: addr });
        const sui = Number(bal.totalBalance) / 1e9;
        if (sui < 0.004) {
            needsFunding.push(addr);
        } else {
            console.log(`  ✅ ${addr.slice(0, 10)}... already has ${sui.toFixed(4)} SUI — skipping`);
        }
    }

    if (needsFunding.length === 0) {
        console.log('\n✅ All agents already funded!');
        return;
    }

    console.log(`\n⚡ Funding ${needsFunding.length} agents with ${Number(AMOUNT_PER_AGENT) / 1e9} SUI each...`);
    console.log(`   Total to distribute: ${(Number(AMOUNT_PER_AGENT) * needsFunding.length / 1e9).toFixed(4)} SUI\n`);

    // Build a single PTB: splitCoins + multiple transferObjects
    const tx = new Transaction();

    // Split N coins from gas
    const amounts = needsFunding.map(() => tx.pure.u64(AMOUNT_PER_AGENT));
    const coins = tx.splitCoins(tx.gas, amounts);

    // Transfer each coin to the corresponding agent
    for (let i = 0; i < needsFunding.length; i++) {
        tx.transferObjects([coins[i]], tx.pure.address(needsFunding[i]));
    }

    tx.setGasBudget(50_000_000); // 0.05 SUI for gas of this tx

    try {
        const result = await client.signAndExecuteTransaction({
            signer: mainKp,
            transaction: tx,
            options: { showEffects: true }
        });

        if (result.effects?.status?.status === 'success') {
            console.log(`✅ Distribution successful!`);
            console.log(`   TX: ${result.digest}`);
            console.log(`   https://suiscan.xyz/testnet/tx/${result.digest}\n`);

            // Show new balances
            console.log('💰 New balances:');
            for (const addr of needsFunding) {
                const bal = await client.getBalance({ owner: addr });
                console.log(`   ${addr.slice(0, 14)}... → ${(Number(bal.totalBalance) / 1e9).toFixed(4)} SUI`);
            }

            const finalBal = await client.getBalance({ owner: mainAddr });
            console.log(`\n   Main wallet remaining: ${(Number(finalBal.totalBalance) / 1e9).toFixed(4)} SUI`);
        } else {
            console.error('❌ TX failed:', JSON.stringify(result.effects?.status));
        }
    } catch (e: any) {
        console.error('❌ Error:', e.message);
    }
}

main();
