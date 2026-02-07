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
    config?: any;
}

export const StrategyService = {
    // Fetch all active strategies for a wallet
    async getStrategies(walletAddress: string): Promise<ActiveStrategy[]> {
        if (!supabase) return [];

        console.log('[StrategyService] Fetching kernels for:', walletAddress);

        const { data, error } = await supabase
            .from('strategies')
            .select('*')
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
            created_at: row.created_at,
            config: row.config // Return full config
        }));
    },

    // Save a new deployed strategy (or update existing with same name)
    async deployStrategy(walletAddress: string, strategy: ActiveStrategy) {
        if (!supabase) {
            console.error('Supabase client not initialized. Check your environment variables.');
            throw new Error('Persistence Layer Offline');
        }

        // First check if strategy with same name exists for this user
        const { data: existing } = await supabase
            .from('strategies')
            .select('id')
            .eq('user_id', walletAddress)
            .eq('name', strategy.strategy_id)
            .single();

        if (existing) {
            // Update existing
            const { data, error } = await (supabase
                .from('strategies') as any)
                .update({
                    status: strategy.status || 'RUNNING',
                    config: {
                        displayName: strategy.name,
                        emoji: strategy.emoji,
                        yield: strategy.yield,
                        txDigest: strategy.tx_digest,
                        ...strategy.config
                    }
                } as any)
                .eq('id', (existing as any).id)
                .select()
                .single();

            if (error) {
                console.error('Supabase update failed:', error.message, error.details, error.hint);
                throw new Error(error.message || 'Supabase Update Error');
            }
            return data;
        }

        // Insert new
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
                    txDigest: strategy.tx_digest,
                    ...strategy.config
                }
            } as any)
            .select()
            .single();

        if (error) {
            console.error('Supabase deploy failed:', error.message, error.details, error.hint, error);
            throw new Error(error.message || 'Supabase Deployment Error');
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
