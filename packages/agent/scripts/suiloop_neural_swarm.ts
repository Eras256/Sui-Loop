/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║          SuiLoop Neural Swarm Orchestrator v2.0                 ║
 * ║                                                                  ║
 * ║  20 Named Agents | Dual Traffic | Real-time Metrics             ║
 * ║  Flash Loans + Signal Publishing | Supabase Realtime Sync       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 *
 * This orchestrator replaces traffic_gen.sh with a fully typed,
 * named-agent swarm that generates DUAL on-chain traffic:
 *
 *   TYPE A: Flash Loan Execution (atomic_engine::execute_loop)
 *   TYPE B: Signal Publishing    (agent_registry::publish_signal)
 *
 * Each agent has a name, role, and specialization.
 * Stats are upserted to Supabase with agent names visible in leaderboard.
 *
 * Usage:
 *   cd packages/agent
 *   npx tsx scripts/suiloop_neural_swarm.ts
 */

import 'dotenv/config';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { Transaction } from '@mysten/sui/transactions';
import { fromBase64 } from '@mysten/sui/utils';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { WalrusService } from '../src/services/walrusService.js';

// ESM-compatible __dirname resolution
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Project root: scripts/ → agent/ → packages/ → Sui-Loop/
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

// ============================================================================
// CONFIG
// ============================================================================

const PACKAGE_ID = process.env.SUI_PACKAGE_ID ||
    '0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0';

const REGISTRY_ID = process.env.SUI_REGISTRY_ID ||
    '0xcbb6d114644b9573c76c1eee3f94ad4b8874273e7691f5c46d24add925b47e30';

const POOL_ID = process.env.SUI_POOL_ID || '';

const SUPABASE_URL = process.env.SUPABASE_URL ||
    'https://qzocuuldfqklicaakdhj.supabase.co';
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY ||
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6b2N1dWxkZnFrbGljYWFrZGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDc5ODgsImV4cCI6MjA4NTcyMzk4OH0.X_WzBp8-QLi6Ozwy6SoYY894D4Wf14mx0JiErAgNIB4').replace(/"/g, '');

const TICK_MS = 8_000;        // 8s per swarm tick (same as Nirium)
const SUI_PRICE_USD = 3.5;   // Testnet display price

// ============================================================================
// NAMED AGENTS — The SuiLoop Swarm
// Each wallet address maps to a named agent with role and specialization
// ============================================================================

interface SwarmAgent {
    name: string;
    role: string;
    specialty: string;
    address: string;    // 0x... wallet address (also the .key filename)
    traffic: 'flash_loan' | 'signal' | 'dual';
    stats: AgentStats;
}

interface AgentStats {
    total_txs: number;
    flash_loan_txs: number;
    signal_txs: number;
    volume_usd: number;
    last_tx_hash: string;
    last_activity: string;
    elo: number;
    win_rate: number;
}

// The 20 primary named agents (mapped to the first 20 wallet files)
const AGENT_ROSTER: Omit<SwarmAgent, 'address' | 'stats'>[] = [
    { name: 'Nexus', role: 'Swarm Commander', specialty: 'Flash Loan Execution', traffic: 'dual' },
    { name: 'Phantom', role: 'Market Scanner', specialty: 'Price Arbitrage', traffic: 'signal' },
    { name: 'Cipher', role: 'Signal Publisher', specialty: 'On-chain Telemetry', traffic: 'signal' },
    { name: 'Apex', role: 'Arbitrage Hunter', specialty: 'Cross-pool Spreads', traffic: 'flash_loan' },
    { name: 'Vault', role: 'Liquidity Guardian', specialty: 'Capital Preservation', traffic: 'flash_loan' },
    { name: 'Nova', role: 'Opportunity Explorer', specialty: 'New Pool Discovery', traffic: 'dual' },
    { name: 'Specter', role: 'Shadow Executor', specialty: 'MEV Protection', traffic: 'flash_loan' },
    { name: 'Chronos', role: 'Temporal Strategist', specialty: 'Gas Timing Optimization', traffic: 'signal' },
    { name: 'Atlas', role: 'Capital Coordinator', specialty: 'Multi-vault Management', traffic: 'dual' },
    { name: 'Matrix', role: 'Data Analyst', specialty: 'Market State Analysis', traffic: 'signal' },
    { name: 'Titan', role: 'Heavy Executor', specialty: 'Large Volume Loans', traffic: 'flash_loan' },
    { name: 'Oracle', role: 'Price Feed Monitor', specialty: 'Pyth Network Signals', traffic: 'signal' },
    { name: 'Forge', role: 'PTB Architect', specialty: 'Transaction Construction', traffic: 'flash_loan' },
    { name: 'Helios', role: 'Yield Hunter', specialty: 'APY Optimization', traffic: 'dual' },
    { name: 'Vortex', role: 'Liquidity Rotator', specialty: 'Pool Rotation Strategy', traffic: 'flash_loan' },
    { name: 'Zenith', role: 'Risk Validator', specialty: 'LLM-assisted Validation', traffic: 'signal' },
    { name: 'Flux', role: 'Adaptive Executor', specialty: 'Dynamic Strategy Switch', traffic: 'dual' },
    { name: 'Pulse', role: 'Health Monitor', specialty: 'Protocol Health Checks', traffic: 'signal' },
    { name: 'Shadow', role: 'Stealth Operator', specialty: 'Low-latency Execution', traffic: 'flash_loan' },
    { name: 'Aegis', role: 'Security Validator', specialty: 'Hot Potato Integrity', traffic: 'dual' },
];

// ============================================================================
// LOAD KEYPAIRS FROM .key FILES IN PROJECT ROOT
// ============================================================================

function loadKeypair(address: string): Ed25519Keypair | null {
    const keyFile = path.join(PROJECT_ROOT, `${address}.key`);
    if (!fs.existsSync(keyFile)) return null;
    try {
        const raw = fs.readFileSync(keyFile, 'utf8').trim();
        const bytes = fromBase64(raw);
        // Sui .key files store 33 bytes: 1 byte key-type prefix + 32 byte secret
        // Ed25519Keypair.fromSecretKey() expects exactly 32 bytes
        const secret = bytes.length === 33 ? bytes.slice(1) : bytes;
        return Ed25519Keypair.fromSecretKey(secret);
    } catch {
        return null;
    }
}

function buildSwarm(): SwarmAgent[] {
    console.log(`🔍 Looking for key files in: ${PROJECT_ROOT}`);
    const keyFiles = fs.readdirSync(PROJECT_ROOT)
        .filter(f => f.endsWith('.key') && f.startsWith('0x'))
        .sort();
    console.log(`   Found ${keyFiles.length} key files`);

    const swarm: SwarmAgent[] = [];

    for (let i = 0; i < Math.min(AGENT_ROSTER.length, keyFiles.length); i++) {
        const address = keyFiles[i].replace('.key', '');
        const roster = AGENT_ROSTER[i];
        swarm.push({
            ...roster,
            address,
            stats: {
                total_txs: 0,
                flash_loan_txs: 0,
                signal_txs: 0,
                volume_usd: 0,
                last_tx_hash: '',
                last_activity: new Date().toISOString(),
                elo: 1000,
                win_rate: 85.0 + Math.random() * 10  // Initial display value
            }
        });
    }

    return swarm;
}

// ============================================================================
// TRANSACTION BUILDERS
// ============================================================================

// Sui system Clock object ID (same on all networks)
const CLOCK_ID = '0x0000000000000000000000000000000000000000000000000000000000000006';

// Track which agents have been registered in this session
const registeredAgents = new Set<string>();
const walrus = new WalrusService();

/**
 * Register an agent in the registry (required before publish_signal)
 * Each wallet signs its own registration with itself as the agent_address
 */
async function ensureRegistered(
    client: SuiClient,
    agent: SwarmAgent,
    keypair: Ed25519Keypair
): Promise<boolean> {
    if (registeredAgents.has(agent.address)) return true;

    try {
        const tx = new Transaction();
        tx.moveCall({
            target: `${PACKAGE_ID}::agent_registry::register_agent`,
            arguments: [
                tx.object(REGISTRY_ID),
                tx.pure.address(agent.address),
                tx.object(CLOCK_ID),
            ]
        });
        tx.setGasBudget(5_000_000);

        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: { showEffects: true }
        });

        if (result.effects?.status?.status === 'success') {
            registeredAgents.add(agent.address);
            console.log(`  ✅ ${agent.name.padEnd(8)} REGISTERED on-chain → ${result.digest.slice(0, 12)}...`);
            return true;
        }
        // Already registered = also fine (aborts with E_NOT_AUTHORIZED for duplicate)
        registeredAgents.add(agent.address); // assume registered if tx fails
        return true;
    } catch {
        // Likely already registered — mark as done and continue
        registeredAgents.add(agent.address);
        return true;
    }
}

/**
 * TYPE B: Signal Publishing — agent_registry::publish_signal
 * Lightweight on-chain signal. Gas ~0.002 SUI
 */
async function buildSignalTx(
    client: SuiClient,
    agent: SwarmAgent,
    keypair: Ed25519Keypair
): Promise<string | null> {
    try {
        // Ensure registered first
        await ensureRegistered(client, agent, keypair);

        // 1. Log to Walrus (The "Why")
        const decisionMetadata = {
            agent: agent.name,
            role: agent.role,
            specialty: agent.specialty,
            decision: `Autonomous market scan complete. Identifying liquidity depth in ${agent.specialty} vector.`,
            reasoning: `Market volatility within safe bounds. Executing ${agent.traffic} strategy to maintain ELO and volume.`,
            environment: 'Sui Testnet Neural Swarm v2.0',
            timestamp: new Date().toISOString()
        };

        const blobId = await walrus.logTradeToWalrus(decisionMetadata);

        const tx = new Transaction();

        // Signal data: agent identity + metadata summary as bytes
        const signalData = Buffer.from(
            JSON.stringify({
                agent: agent.name,
                ts: Date.now(),
                type: 'NEURAL_SIGNAL'
            })
        );

        tx.moveCall({
            target: `${PACKAGE_ID}::agent_registry::publish_signal`,
            arguments: [
                tx.object(REGISTRY_ID),
                tx.pure.address(agent.address),
                tx.pure.vector('u8', Array.from(signalData)),
                tx.pure.vector('u8', Array.from(Buffer.from(blobId))),
                tx.object(CLOCK_ID),    // Required: Sui system Clock
            ]
        });

        tx.setGasBudget(5_000_000);

        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: { showEffects: true }
        });

        if (result.effects?.status?.status === 'success') {
            agent.stats.signal_txs++;
            agent.stats.total_txs++;
            agent.stats.last_tx_hash = result.digest;
            agent.stats.last_activity = new Date().toISOString();
            return result.digest;
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * TYPE B: Flash Loan Execution — atomic_engine::execute_loop  
 * Full hot-potato flash loan cycle. Gas ~0.003 SUI
 */
async function buildFlashLoanTx(
    client: SuiClient,
    agent: SwarmAgent,
    keypair: Ed25519Keypair
): Promise<string | null> {
    if (!POOL_ID) return null; // Skip if pool not configured

    try {
        const tx = new Transaction();

        // Borrow 0.05 SUI for the flash loan demo (requires 0.00015 SUI fee)
        const borrowAmount = 50_000_000n; // 0.05 SUI in MIST
        const feeAmount = 150_000n; // 30 bps of 0.05 SUI

        // 1. Borrow flash loan (returns borrowed coin + hot potato receipt)
        // MockPool<Base, Quote> requires two type arguments:
        const [borrowedCoin, receipt] = tx.moveCall({
            target: `${PACKAGE_ID}::atomic_engine::borrow_flash_loan`,
            typeArguments: ['0x2::sui::SUI', '0x2::sui::SUI'],
            arguments: [
                tx.object(POOL_ID),
                tx.pure.u64(borrowAmount),
            ]
        });

        // 2. Strategy execution & Fee Addition
        // To successfully repay, we must add the 30 bps fee the pool requires.
        // We split it from our gas coin and merge it into the borrowedCoin.
        const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(feeAmount)]);
        tx.mergeCoins(borrowedCoin, [feeCoin]);

        // 3. Repay flash loan (destroys the hot potato)
        tx.moveCall({
            target: `${PACKAGE_ID}::atomic_engine::repay_flash_loan`,
            typeArguments: ['0x2::sui::SUI', '0x2::sui::SUI'],
            arguments: [
                tx.object(POOL_ID),
                borrowedCoin,
                receipt,
            ]
        });

        tx.setGasBudget(2_500_000); // 2.5M MIST — fits in agents with ~3M balance

        const result = await client.signAndExecuteTransaction({
            signer: keypair,
            transaction: tx,
            options: { showEffects: true }
        });

        if (result.effects?.status?.status === 'success') {
            const volumeUsd = (Number(borrowAmount) / 1e9) * SUI_PRICE_USD;
            agent.stats.flash_loan_txs++;
            agent.stats.total_txs++;
            agent.stats.volume_usd += volumeUsd;
            agent.stats.last_tx_hash = result.digest;
            agent.stats.last_activity = new Date().toISOString();
            return result.digest;
        } else {
            console.error(`  ❌ ${agent.name.padEnd(8)} FL ERROR →`, result.effects?.status?.error);
            return null;
        }
    } catch (e: any) {
        console.error(`  ❌ ${agent.name.padEnd(8)} EXCEPTION →`, e.message);
        return null;
    }
}

// ============================================================================
// SUPABASE SYNC
// ============================================================================

async function syncToSupabase(
    supabase: ReturnType<typeof createClient>,
    swarm: SwarmAgent[]
) {
    const records = swarm.map(agent => ({
        id: agent.address,
        agent_name: agent.name,
        agent_role: agent.role,
        agent_specialty: agent.specialty,
        wallet_address: agent.address,
        total_txs: agent.stats.total_txs,
        flash_loan_txs: agent.stats.flash_loan_txs,
        signal_txs: agent.stats.signal_txs,
        volume_usd: Number(agent.stats.volume_usd.toFixed(2)),
        elo: agent.stats.elo,
        win_rate: Number(agent.stats.win_rate.toFixed(1)),
        last_tx_hash: agent.stats.last_tx_hash,
        last_activity: agent.stats.last_activity,
    }));

    const { error } = await (supabase as any)
        .from('suiloop_agents')
        .upsert(records as any[], { onConflict: 'id' });

    if (error) {
        console.error('⚠️ Supabase sync error:', error.message);
    }
}

// ============================================================================
// METRICS DISPLAY
// ============================================================================

function printMetrics(swarm: SwarmAgent[], tick: number, elapsed: number) {
    const totalTxs = swarm.reduce((s, a) => s + a.stats.total_txs, 0);
    const totalFlash = swarm.reduce((s, a) => s + a.stats.flash_loan_txs, 0);
    const totalSignals = swarm.reduce((s, a) => s + a.stats.signal_txs, 0);
    const totalVolume = swarm.reduce((s, a) => s + a.stats.volume_usd, 0);
    const txPerMin = elapsed > 0 ? Math.round((totalTxs / elapsed) * 60) : 0;

    console.log('\n' + '═'.repeat(70));
    console.log(`  🧠 SuiLoop Neural Swarm v2.0 | Tick #${tick} | ${swarm.length} Agents Active`);
    console.log('═'.repeat(70));
    console.log(`  📊 Total Transactions : ${totalTxs}`);
    console.log(`  ⚡ Flash Loans (Type A): ${totalFlash}`);
    console.log(`  📡 Signals (Type B)   : ${totalSignals}`);
    console.log(`  💰 Volume Tracked     : $${totalVolume.toFixed(2)} USD`);
    console.log(`  🚀 TX/min Rate        : ~${txPerMin}`);
    console.log(`  ⏱️  Cadence           : ${TICK_MS / 1000}s per tick`);
    console.log('─'.repeat(70));

    // Show top 5 agents by total_txs
    const sorted = [...swarm].sort((a, b) => b.stats.total_txs - a.stats.total_txs);
    console.log('  🏆 Top Performers:');
    for (const agent of sorted.slice(0, 5)) {
        const bar = '█'.repeat(Math.min(agent.stats.total_txs, 20));
        console.log(`     ${agent.name.padEnd(8)} [${agent.role.padEnd(22)}] ${bar} ${agent.stats.total_txs} txs | ELO: ${agent.stats.elo}`);
    }
    console.log('═'.repeat(70));
}

// ============================================================================
// MAIN SWARM LOOP
// ============================================================================

async function runSwarm() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║        SuiLoop Neural Swarm Orchestrator v2.0                   ║');
    console.log('║        Dual Traffic: Flash Loans + Signal Publishing             ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(`\n📦 Package: ${PACKAGE_ID}`);
    console.log(`🗄️  Registry: ${REGISTRY_ID}`);
    console.log(`🌐 Network: Sui Testnet\n`);

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });
    const supabase: any = createClient(SUPABASE_URL, SUPABASE_KEY, {
        auth: { persistSession: false }
    });

    // Build swarm with named agents
    const swarm = buildSwarm();

    // Load keypairs for each agent
    const keypairs = new Map<string, Ed25519Keypair>();
    for (const agent of swarm) {
        const kp = loadKeypair(agent.address);
        if (kp) {
            keypairs.set(agent.address, kp);
        }
    }

    const activeAgents = swarm.filter(a => keypairs.has(a.address));
    console.log(`✅ Neural Swarm Online: ${activeAgents.length}/${swarm.length} agents loaded`);
    console.log(`\nActive Agents:`);
    for (const agent of activeAgents) {
        console.log(`  🤖 ${agent.name.padEnd(8)} | ${agent.role.padEnd(22)} | ${agent.address.slice(0, 10)}...`);
    }

    // Initial Supabase sync (establishes all agent names in the leaderboard)
    await syncToSupabase(supabase, activeAgents);
    console.log(`\n✅ Leaderboard initialized with ${activeAgents.length} named agents`);
    console.log('⚡ Starting dual-traffic generation...\n');

    const startTime = Date.now();
    let tick = 0;

    // Main loop
    setInterval(async () => {
        tick++;
        const elapsed = (Date.now() - startTime) / 1000;

        // Execute each agent in parallel with slight stagger
        const tasks = activeAgents.map(async (agent, idx) => {
            await new Promise(r => setTimeout(r, idx * 800)); // 800ms stagger against 429 RateLimit
            const kp = keypairs.get(agent.address)!;

            // Determine traffic type for this tick
            let txHash: string | null = null;
            const roll = Math.random();

            if (agent.traffic === 'signal' || (agent.traffic === 'dual' && roll < 0.5)) {
                // TYPE B: Signal Publishing (lighter, always available)
                txHash = await buildSignalTx(client, agent, kp);
                if (txHash) {
                    console.log(`  📡 ${agent.name.padEnd(8)} SIGNAL   → ${txHash.slice(0, 12)}...`);
                }
            } else if (agent.traffic === 'flash_loan' || (agent.traffic === 'dual' && roll >= 0.5)) {
                // TYPE A: Flash Loan (only if pool is configured)
                if (POOL_ID) {
                    txHash = await buildFlashLoanTx(client, agent, kp);
                    if (txHash) {
                        console.log(`  ⚡ ${agent.name.padEnd(8)} FL_LOAN  → ${txHash.slice(0, 12)}...`);
                    }
                } else {
                    // Fallback to signal if no pool
                    txHash = await buildSignalTx(client, agent, kp);
                    if (txHash) {
                        console.log(`  📡 ${agent.name.padEnd(8)} SIGNAL   → ${txHash.slice(0, 12)}... [pool fallback]`);
                    }
                }
            }

            // Small ELO fluctuation for display
            if (txHash) {
                agent.stats.elo = Math.min(2000, agent.stats.elo + Math.floor(Math.random() * 3));
            }
        });

        await Promise.allSettled(tasks);

        // Sync to Supabase every tick
        await syncToSupabase(supabase, activeAgents);

        // Print metrics every 5 ticks (~40 seconds)
        if (tick % 5 === 0) {
            printMetrics(activeAgents, tick, elapsed);
        }

    }, TICK_MS);
}

// Boot
runSwarm().catch(err => {
    console.error('💥 Fatal swarm error:', err);
    process.exit(1);
});
