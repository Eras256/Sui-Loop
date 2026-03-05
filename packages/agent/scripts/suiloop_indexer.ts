import 'dotenv/config';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qzocuuldfqklicaakdhj.supabase.co';
const SUPABASE_KEY = (process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6b2N1dWxkZnFrbGljYWFrZGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDc5ODgsImV4cCI6MjA4NTcyMzk4OH0.X_WzBp8-QLi6Ozwy6SoYY894D4Wf14mx0JiErAgNIB4').replace(/"/g, '');

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || process.env.SUI_PACKAGE_ID || "0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0";

// SUI price estimate in USD for testnet display
const SUI_PRICE_USD = 3.5;

async function runIndexer() {
    console.log("🚀 SuiLoop Agent Indexer v3 — Real Volume Tracking");
    console.log(`Package: ${PACKAGE_ID}`);

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    // Full agent state map
    let agentState: Record<string, any> = {};

    async function syncState() {
        try {
            // 1. Fetch Registered Agents
            const regEvents = await client.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::agent_registry::AgentRegistered` },
                limit: 100
            });

            // 2. Fetch all Reputation Updates (descending = newest first)
            const upEvents = await client.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::agent_registry::ReputationUpdated` },
                limit: 1000,
                order: 'descending'
            });

            // 3. Fetch Signals (latest per agent)
            const signalEvents = await client.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::agent_registry::SignalPublished` },
                limit: 500,
                order: 'descending'
            });

            // ---- Build agent base records from registration events ----
            for (const ev of regEvents.data) {
                const parsed = ev.parsedJson as any;
                if (!agentState[parsed.agent_id]) {
                    agentState[parsed.agent_id] = {
                        id: parsed.agent_id,
                        wallet_address: parsed.agent_id,
                        creator: parsed.owner,
                        elo: 1000,
                        trades: 0,
                        win_rate: 0,
                        volume_usd: 0,
                        last_tx_hash: ev.id.txDigest,
                        last_signal: 'STANDBY',
                        wins: 0
                    };
                }
            }

            // ---- Track latest signal per agent ----
            // signalEvents is descending, so first occurrence per agent = latest
            const seenSignals = new Set<string>();
            for (const ev of signalEvents.data) {
                const parsed = ev.parsedJson as any;
                const agentId = parsed.agent_id;
                if (!seenSignals.has(agentId) && agentState[agentId]) {
                    seenSignals.add(agentId);
                    try {
                        agentState[agentId].last_signal = Buffer.from(parsed.signal_data).toString('utf8');
                    } catch {
                        agentState[agentId].last_signal = "Signal Active";
                    }
                    agentState[agentId].last_tx_hash = ev.id.txDigest;
                }
            }

            // ---- Aggregate reputation + volume from tx inputs ----
            // Reset counters on each sync to recompute from chain
            for (const id in agentState) {
                agentState[id].trades = 0;
                agentState[id].wins = 0;
                agentState[id].volume_usd = 0;
            }

            // Fetch tx details for volume extraction in parallel (batched)
            const txDigests = [...new Set(upEvents.data.map(ev => ev.id.txDigest))];
            const txVolumeMap: Record<string, number> = {};

            // Batch fetch txs (up to 50 at once to avoid RPC limits)
            const batchSize = 50;
            for (let i = 0; i < txDigests.length; i += batchSize) {
                const batch = txDigests.slice(i, i + batchSize);
                try {
                    const txs = await client.multiGetTransactionBlocks({
                        digests: batch,
                        options: { showInput: true }
                    });
                    for (const tx of txs) {
                        if (!tx?.transaction?.data?.transaction) continue;
                        const txData = tx.transaction.data.transaction as any;
                        // Handle programmable tx: look for update_reputation call inputs
                        if (txData.kind === 'ProgrammableTransaction') {
                            const inputs = txData.inputs || [];
                            // The volume arg is the last Pure u64 input in update_reputation
                            // Inputs are: AdminCap(Obj), RegistryId(Obj), agent_address(Pure), is_success(Pure), volume(Pure)
                            // Find pure u64 values after the object refs
                            const pureInputs = inputs.filter((inp: any) => inp.type === 'pure');
                            if (pureInputs.length >= 2) {
                                // Last pure input is the volume in MIST
                                const lastPure = pureInputs[pureInputs.length - 1];
                                const volumeMist = Number(lastPure.value || 0);
                                txVolumeMap[tx.digest] = volumeMist;
                            }
                        }
                    }
                } catch {
                    // silently continue if batch fails
                }
            }

            // Process reputation events with volume from tx
            for (const ev of upEvents.data) {
                const parsed = ev.parsedJson as any;
                const agentId = parsed.agent_id;
                if (agentState[agentId]) {
                    const agent = agentState[agentId];
                    agent.trades += 1;
                    if (parsed.is_positive) agent.wins += 1;

                    // Take the latest score as ELO (events are descending, so use only when trades===1 = latest)
                    if (agent.trades === 1) {
                        agent.elo = Number(parsed.new_score);
                    }

                    // Add volume from tx input
                    const volumeMist = txVolumeMap[ev.id.txDigest] || 0;
                    agent.volume_usd += (volumeMist / 1_000_000_000) * SUI_PRICE_USD;
                }
            }

            // Compute win rates
            for (const id in agentState) {
                const a = agentState[id];
                if (a.trades > 0) {
                    a.win_rate = Number(((a.wins / a.trades) * 100).toFixed(1));
                }
                a.volume_usd = Number(a.volume_usd.toFixed(2));
                a.last_activity = new Date().toISOString();
            }

            // Upsert all agents to Supabase
            const agentsArray = Object.values(agentState).map((a: any) => {
                const { wins, ...dbReady } = a;
                return dbReady;
            });

            if (agentsArray.length > 0) {
                const { error } = await supabase
                    .from('suiloop_agents')
                    .upsert(agentsArray, { onConflict: 'id' });

                if (error) {
                    console.error("⚠️ Supabase error:", error.message);
                } else {
                    const totalVol = agentsArray.reduce((s: number, a: any) => s + (a.volume_usd || 0), 0);
                    console.log(`✅ [${new Date().toISOString()}] Synced ${agentsArray.length} agents | Total Volume: $${totalVol.toFixed(2)}`);
                }
            }
        } catch (error: any) {
            console.error("⚠️ Sync error:", error.message);
        }
    }

    // Run immediately, then every 8 seconds
    await syncState();
    setInterval(syncState, 8000);
}

runIndexer();
