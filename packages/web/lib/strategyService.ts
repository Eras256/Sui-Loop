import { supabase } from './supabase';

export interface ActiveStrategy {
    id?: string;
    strategy_id: string; // The type (e.g., 'sui-usdc-loop')
    name: string;
    emoji: string;
    status: string;
    yield: string;
    asset?: 'SUI' | 'USDC';  // vault asset type
    tx_digest?: string;
    created_at?: string;
    config?: any;
}

// ─── localStorage helpers (offline fallback) ────────────────────────────────

const LS_KEY = (wallet: string) => `sui_loop_strategies_${wallet}`;

function lsGet(wallet: string): ActiveStrategy[] {
    try {
        return JSON.parse(localStorage.getItem(LS_KEY(wallet)) || '[]');
    } catch {
        return [];
    }
}

function lsSet(wallet: string, strategies: ActiveStrategy[]): void {
    try {
        localStorage.setItem(LS_KEY(wallet), JSON.stringify(strategies));
    } catch { /* quota exceeded – silently ignore */ }
}

// ─── Helper: check if Supabase is reachable ──────────────────────────────────

let _supabaseReachable: boolean | null = null; // cached per session

async function isSupabaseReachable(): Promise<boolean> {
    if (_supabaseReachable !== null) return _supabaseReachable;
    if (!supabase) { _supabaseReachable = false; return false; }
    try {
        // Lightweight probe – just a HEAD request to the REST endpoint
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://qzocuuldfqklicaakdhj.supabase.co";
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res = await fetch(`${url}/rest/v1/`, { method: 'HEAD', signal: ctrl.signal });
        clearTimeout(timer);
        _supabaseReachable = res.ok || res.status < 500;
    } catch {
        _supabaseReachable = false;
    }
    return _supabaseReachable;
}

// ─── Service ─────────────────────────────────────────────────────────────────

// --- Helper: ensure profile exists for this wallet ---
async function getOrCreateProfile(wallet: string): Promise<string | null> {
    if (!supabase) return null;
    try {
        // 1. Try to find existing profile
        const { data: profile, error } = await (supabase
            .from('profiles') as any)
            .select('id')
            .eq('wallet_address', wallet)
            .maybeSingle();

        if (profile) return (profile as any).id;

        // 2. Not found, create it
        const { data: newProfile, error: insertError } = await (supabase
            .from('profiles') as any)
            .insert({
                wallet_address: wallet,
                username: `User_${wallet.slice(0, 6)}`
            })
            .select('id')
            .single();

        if (insertError) {
            console.error('[StrategyService] Error creating profile:', insertError.message);
            return null;
        }
        return (newProfile as any)?.id || null;
    } catch (err) {
        console.error('[StrategyService] Profile sync error:', err);
        return null;
    }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export const StrategyService = {
    // Fetch all active strategies for a wallet
    async getStrategies(walletAddress: string): Promise<ActiveStrategy[]> {
        const reachable = await isSupabaseReachable();

        if (reachable && supabase) {
            try {
                console.log('[StrategyService] Fetching kernels for:', walletAddress);
                const { data, error } = await (supabase
                    .from('strategies') as any)
                    .select('*')
                    .eq('wallet_owner', walletAddress)
                    .order('created_at', { ascending: false });

                if (error) {
                    // Fallback to older column name if wallet_owner doesn't exist yet
                    if (error.message.includes('column "wallet_owner" does not exist')) {
                        const { data: oldData, error: oldError } = await (supabase
                            .from('strategies') as any)
                            .select('*')
                            .eq('user_id', walletAddress)
                            .order('created_at', { ascending: false });

                        if (!oldError) {
                            const mapped = oldData.map((row: any) => ({
                                id: row.id,
                                strategy_id: row.name,
                                name: row.config?.displayName || row.name,
                                emoji: row.config?.emoji || '🤖',
                                status: row.status,
                                yield: row.config?.yield || '0%',
                                asset: (row.config?.asset as 'SUI' | 'USDC') || 'SUI',
                                tx_digest: row.config?.txDigest,
                                created_at: row.created_at,
                                config: row.config
                            }));
                            lsSet(walletAddress, mapped);
                            return mapped;
                        }
                    }
                    console.warn('[StrategyService] Supabase fetch error, falling back to localStorage:', error.message);
                } else {
                    const remote = data.map((row: any) => ({
                        id: row.id,
                        strategy_id: row.name,
                        name: row.config?.displayName || row.name,
                        emoji: row.config?.emoji || '🤖',
                        status: row.status,
                        yield: row.config?.yield || '0%',
                        asset: (row.config?.asset as 'SUI' | 'USDC') || 'SUI',
                        tx_digest: row.config?.txDigest,
                        created_at: row.created_at,
                        config: row.config
                    }));
                    // Sync remote data back to localStorage as backup
                    lsSet(walletAddress, remote);
                    return remote;
                }
            } catch (err) {
                console.warn('[StrategyService] Network error during getStrategies, using localStorage:', err);
            }
        }

        // Fallback: localStorage
        return lsGet(walletAddress);
    },

    // Save a new deployed strategy
    async deployStrategy(walletAddress: string, strategy: ActiveStrategy) {
        // Always persist to localStorage first
        const local = lsGet(walletAddress);
        const existingIdx = local.findIndex(s => s.strategy_id === strategy.strategy_id);
        const entry: ActiveStrategy = {
            ...strategy,
            id: existingIdx >= 0 ? local[existingIdx].id : `local_${Date.now()}`,
            created_at: strategy.created_at || new Date().toISOString(),
        };

        if (existingIdx >= 0) {
            local[existingIdx] = entry;
        } else {
            local.unshift(entry);
        }
        lsSet(walletAddress, local);

        const reachable = await isSupabaseReachable();
        if (!reachable || !supabase) return entry;

        try {
            // 1. Sync Profile (ensure user existence in profiles table)
            const profileId = await getOrCreateProfile(walletAddress);

            // 2. Check if a record with the same name already exists
            const { data: existing } = await (supabase
                .from('strategies') as any)
                .select('id')
                .eq('wallet_owner', walletAddress)
                .eq('name', strategy.strategy_id)
                .single();

            const strategyPayload = {
                wallet_owner: walletAddress,
                user_id: profileId, // This will be the UUID if profile exists
                name: strategy.strategy_id,
                status: strategy.status || 'RUNNING',
                config: {
                    displayName: strategy.name,
                    emoji: strategy.emoji,
                    yield: strategy.yield,
                    asset: strategy.asset || 'SUI',
                    txDigest: strategy.tx_digest,
                    ...strategy.config
                }
            };

            if (existing) {
                const { data, error } = await (supabase
                    .from('strategies') as any)
                    .update(strategyPayload as any)
                    .eq('id', (existing as any).id)
                    .select()
                    .single();

                if (!error) return data;
            } else {
                const { data, error } = await (supabase
                    .from('strategies') as any)
                    .insert(strategyPayload as any)
                    .select()
                    .single();

                if (!error) return data;

                // Fallback attempt if UUID column is missing (old schema)
                if (error.message.includes('column "wallet_owner" does not exist')) {
                    await (supabase.from('strategies') as any).insert({
                        user_id: walletAddress,
                        name: strategy.strategy_id,
                        status: strategy.status || 'RUNNING',
                        config: strategyPayload.config
                    } as any);
                }
            }
            return entry;
        } catch (err) {
            console.error('[StrategyService] Deploy error:', err);
            return entry;
        }
    },

    // Stop (Delete/Update) a strategy
    async stopStrategy(dbId: string, walletAddress?: string) {
        // Remove from localStorage
        if (walletAddress) {
            const local = lsGet(walletAddress);
            lsSet(walletAddress, local.filter(s => s.id !== dbId));
        }

        const reachable = await isSupabaseReachable();
        if (!reachable || !supabase) {
            console.warn('[StrategyService] Supabase offline – strategy removed from localStorage only.');
            return;
        }

        try {
            const { error } = await (supabase
                .from('strategies') as any)
                .delete()
                .eq('id', dbId);

            if (error) {
                console.warn('[StrategyService] Error stopping strategy in Supabase:', error);
            }
        } catch (err) {
            console.warn('[StrategyService] Network error during stopStrategy:', err);
        }
    }
};
