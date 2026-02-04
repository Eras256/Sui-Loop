import { supabase } from './supabase';

export interface ActiveStrategy {
    id?: string;
    strategy_id: string; // The type (e.g., 'sui-usdc-loop')
    name: string;
    emoji: string;
    status: string;
    yield: string;
    tx_digest?: string;
    created_at?: string;
}

export const StrategyService = {
    // Fetch all active strategies for a wallet
    async getStrategies(walletAddress: string): Promise<ActiveStrategy[]> {
        if (!supabase) return [];

        // We assume 'strategies' table stores config JSON which contains our frontend metadata
        // Or we map the raw DB rows to our frontend shape
        const { data, error } = await supabase
            .from('strategies')
            .select('*')
            // Temporarily filtering by config check or if you have a wallet_column
            // Since schema has user_id, we try to match that, or assume RLS handles it
            .eq('user_id', walletAddress)
            .order('created_at', { ascending: false });

        if (error) {
            console.warn('Supabase fetch skipped (using local fallback caused by):', error.message || error);
            return []; // Return empty to trigger localStorage fallback
        }

        return data.map((row: any) => ({
            id: row.id,
            strategy_id: row.name, // Mapping DB 'name' to our ID
            name: row.config?.displayName || row.name,
            emoji: row.config?.emoji || '🤖',
            status: row.status,
            yield: row.config?.yield || '0%',
            tx_digest: row.config?.txDigest,
            created_at: row.created_at
        }));
    },

    // Save a new deployed strategy
    async deployStrategy(walletAddress: string, strategy: ActiveStrategy) {
        if (!supabase) return null;

        const { data, error } = await supabase
            .from('strategies')
            .insert({
                user_id: walletAddress,
                name: strategy.strategy_id,
                status: strategy.status || 'RUNNING',
                config: {
                    displayName: strategy.name,
                    emoji: strategy.emoji,
                    yield: strategy.yield,
                    txDigest: strategy.tx_digest
                }
            } as any)
            .select()
            .single();

        if (error) {
            console.warn('Supabase deploy skipped (using local fallback caused by):', error.message || error);
            // Don't throw, return null so frontend adds it to local state anyway
            return null;
        }

        return data;
    },

    // Stop (Delete/Update) a strategy
    async stopStrategy(dbId: string) {
        if (!supabase) return;

        const { error } = await supabase
            .from('strategies')
            .delete()
            .eq('id', dbId);

        if (error) {
            console.error('Error stopping strategy:', error);
            throw error;
        }
    }
};
