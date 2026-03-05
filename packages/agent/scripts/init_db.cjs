const { Client } = require('pg');

async function initDB() {
    const client = new Client({
        connectionString: 'postgresql://postgres:[Ether44.22.]@db.qzocuuldfqklicaakdhj.supabase.co:5432/postgres'
    });

    try {
        await client.connect();
        console.log("Conectado a Supabase PostgreSQL");

        await client.query(`
            CREATE TABLE IF NOT EXISTS public.suiloop_agents (
                id TEXT PRIMARY KEY,
                wallet_address TEXT NOT NULL,
                creator TEXT,
                elo INTEGER DEFAULT 1000,
                trades INTEGER DEFAULT 0,
                win_rate NUMERIC(5,2) DEFAULT 0,
                volume_usd NUMERIC(20,7) DEFAULT 0,
                last_tx_hash TEXT,
                last_signal TEXT,
                last_activity TIMESTAMPTZ DEFAULT NOW(),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("Tabla suiloop_agents verificada/creada.");

        await client.query(`
            -- Habilitar Realtime para la tabla
            ALTER PUBLICATION supabase_realtime ADD TABLE public.suiloop_agents;
        `).catch(e => console.log("Realtime pub warning (ya puede estar activa):", e.message));

        console.log("Setup de Base de Datos finalizado.");
    } catch (err) {
        console.error("Error BD:", err);
    } finally {
        await client.end();
    }
}

initDB();
