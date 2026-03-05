import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qzocuuldfqklicaakdhj.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE0Nzk4OCwiZXhwIjoyMDg1NzIzOTg4fQ.d1mfIye20GN3T9YLwa0bcZR4lA3dH0j_6bgc9357k14';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false }
});

const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || process.env.SUI_PACKAGE_ID || "0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0";

async function runIndexer() {
    console.log("🚀 Iniciando SuiLoop Agent Indexer...");
    console.log(`Conectando a Sui Testnet (Package: ${PACKAGE_ID})`);

    const client = new SuiClient({ url: getFullnodeUrl('testnet') });

    // Carga inicial del registro
    let agentState: Record<string, any> = {};

    async function syncState() {
        try {
            // 1. Fetch Registered Agents
            const regEvents = await client.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::agent_registry::AgentRegistered` },
                limit: 100
            });

            // 2. Fetch Reputation Updates
            const upEvents = await client.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::agent_registry::ReputationUpdated` },
                limit: 1000,
                order: 'descending'
            });

            // 3. Fetch Signals
            const signalEvents = await client.queryEvents({
                query: { MoveEventType: `${PACKAGE_ID}::agent_registry::SignalPublished` },
                limit: 200,
                order: 'descending'
            });

            // 4. Procesar el estado exacto
            regEvents.data.forEach(ev => {
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
            });

            // Procesar Señales
            signalEvents.data.forEach(ev => {
                const parsed = ev.parsedJson as any;
                if (agentState[parsed.agent_id] && agentState[parsed.agent_id].last_signal === 'STANDBY') {
                    agentState[parsed.agent_id].last_signal = parsed.content;
                    agentState[parsed.agent_id].last_tx_hash = ev.id.txDigest;
                }
            });

            // Procesar Reputation
            upEvents.data.forEach(ev => {
                const parsed = ev.parsedJson as any;
                if (agentState[parsed.agent_id]) {
                    const agent = agentState[parsed.agent_id];
                    agent.trades += 1;
                    if (parsed.is_positive) agent.wins += 1;

                    // Solo toma el primer score por ser descending
                    if (agent.trades === 1) {
                        agent.elo = Number(parsed.new_score);
                    }
                    agent.win_rate = Number(((agent.wins / agent.trades) * 100).toFixed(1));
                    agent.last_activity = new Date().toISOString();
                }
            });

            // Upsert a Supabase Database
            const agentsArray = Object.values(agentState).map((a: any) => {
                const { wins, ...dbReady } = a;
                return dbReady;
            });

            if (agentsArray.length > 0) {
                const { error, count } = await supabase
                    .from('suiloop_agents')
                    .upsert(agentsArray, { onConflict: 'id' });

                if (error) {
                    console.error("⚠️ Error escribiendo en Supabase:", error.message);
                } else {
                    console.log(`✅ [${new Date().toISOString()}] Sincronizados ${agentsArray.length} agentes hacia Supabase Realtime`);
                }
            }
        } catch (error: any) {
            console.error("⚠️ Error en ciclo de sincronizacion:", error.message);
        }
    }

    // Correr de inmediato, y luego cada 5 segundos
    await syncState();
    setInterval(syncState, 5000);
}

runIndexer();
