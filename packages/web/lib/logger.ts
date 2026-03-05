/**
 * Write a log entry to the Supabase `logs` table.
 * Used by Dashboard (strategy events), Marketplace, and Plugins (install events).
 *
 * Uses raw fetch to avoid Supabase TS generic issues with dynamically-added tables.
 */
export async function writeLog(
    message: string,
    level: 'info' | 'warn' | 'error' | 'success' | 'system' = 'info',
    agentId?: string
) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qzocuuldfqklicaakdhj.supabase.co";
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF6b2N1dWxkZnFrbGljYWFrZGhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNDc5ODgsImV4cCI6MjA4NTcyMzk4OH0.X_WzBp8-QLi6Ozwy6SoYY894D4Wf14mx0JiErAgNIB4";

    try {
        await fetch(`${url}/rest/v1/agent_logs`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': key,
                'Authorization': `Bearer ${key}`,
                'Prefer': 'return=minimal',
            },
            body: JSON.stringify({
                message,
                level,
                strategy_id: agentId ?? null,
                details: { source: 'frontend_logger' }
            }),
        });
    } catch (e) {
        // Silently fail — logs are non-critical
        console.warn('[writeLog] Failed:', e);
    }
}
