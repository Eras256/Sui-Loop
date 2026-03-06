'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Cpu, Activity, Medal, Star, ExternalLink, Wallet, Zap, Shield, ChevronRight, Search, Filter, ArrowUpRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import Navbar from '@/components/layout/Navbar';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';

// ──────────────────────────────────────────────────────────────────────────────
// FUENTE DE VERDAD: Wallets reales del Swarm v2.0
// Keys normalizadas a lowercase sin padding.
// ──────────────────────────────────────────────────────────────────────────────

const AGENT_ROSTER_MANIFEST: Record<string, { name: string; role: string; specialty: string; avatar: string }> = {
    "0x01fd306d35ad4ae1b8ae2c0019af3e5fd3b458618de64ffaa6ad9dbbaa4974e9": { name: "Nexus", role: "Swarm Commander", specialty: "Flash Loan Execution", avatar: "/avatars/nexus.png" },
    "0x055ead3142c5f1da6c912f9eb4276625f5b0aba75dc9aceb1ba3b41c091436ff": { name: "Phantom", role: "Market Scanner", specialty: "Price Arbitrage", avatar: "/avatars/vector.png" },
    "0x07d43ece931a943dbc8b21a7df65e7e10f792a2f7b235d020f9d36a08c8f3cbd": { name: "Cipher", role: "Signal Publisher", specialty: "On-chain Telemetry", avatar: "/avatars/vector.png" },
    "0x1e350af2c07c6394266dbe5d6024e816400c379e2a0ab9df0d331f43492d83d2": { name: "Apex", role: "Arbitrage Hunter", specialty: "Cross-pool Spreads", avatar: "/avatars/vector.png" },
    "0x3dca88b3d70616c0f8a0cbfcee1ce79e43f32d4a89bdecaff6452e9200a2e64c": { name: "Vault", role: "Liquidity Guardian", specialty: "Capital Preservation", avatar: "/avatars/vector.png" },
    "0x43a69f111deb5c6edc7d8abfd7b424a2b1ca7cf2e9ec68304372553ceb40e444": { name: "Nova", role: "Opportunity Explorer", specialty: "New Pool Discovery", avatar: "/avatars/nova.png" },
    "0x598411217828219f6fdf53c7776263be4414f2db38978847ce369bed0a46ff17": { name: "Specter", role: "Shadow Executor", specialty: "MEV Protection", avatar: "/avatars/specter.png" },
    "0x5c0314c7bf067d9e614cc45e3b254d5b4afd88ad627e422a47050bd628596b57": { name: "Chronos", role: "Temporal Strategist", specialty: "Gas Timing Optimization", avatar: "/avatars/vector.png" },
    "0x667bab377fc5916509bfaf787ce40d662bd0e9fc28a843354c84da02b1f564be": { name: "Atlas", role: "Capital Coordinator", specialty: "Multi-vault Management", avatar: "/avatars/vector.png" },
    "0x69cfe18995932c96132fe40ce2eb873defda4adbdba9ea3012b455ccf906b1d3": { name: "Matrix", role: "Data Analyst", specialty: "Market State Analysis", avatar: "/avatars/matrix.png" },
    "0x6e29974a442bf1f7dcab9a0c4176478be327782ea2875d6ac0045fb27d6d0201": { name: "Titan", role: "Heavy Executor", specialty: "Large Volume Loans", avatar: "/avatars/titan.png" },
    "0x6e69998549852fce594fb3186731a636f801ba5d604f7d045107444abe9e2905": { name: "Oracle", role: "Price Feed Monitor", specialty: "Pyth Network Signals", avatar: "/avatars/vector.png" },
    "0x6e94d3e8e595f51b67df62a0d2a284093706d33c2170af7442f19440d23fb733": { name: "Forge", role: "PTB Architect", specialty: "Transaction Construction", avatar: "/avatars/vector.png" },
    "0x775e59d3883620e439707e544918fed2d5ae02b830591c4c446ed2ec216c8848": { name: "Helios", role: "Yield Hunter", specialty: "APY Optimization", avatar: "/avatars/vector.png" },
    "0x79c84b3aeb6996ba1fd6a8b830782da159b6adbae5f82764d64b2c25a6b4d564": { name: "Vortex", role: "Liquidity Rotator", specialty: "Pool Rotation Strategy", avatar: "/avatars/vector.png" },
    "0x7b228358a9a6f8c900d33a2a4ac67b9384d518892c408156a596fa5124c06d8a": { name: "Zenith", role: "Risk Validator", specialty: "LLM-assisted Validation", avatar: "/avatars/zenith.png" },
    "0x7ebd76a950aef3b5b71202fd014813932ab01d69981bf7cbb40cc293c1b72551": { name: "Flux", role: "Adaptive Executor", specialty: "Dynamic Strategy Switch", avatar: "/avatars/vector.png" },
    "0x7f3d91ea3f707bbacb012f2686d0bf05bc2dd5d877ae4f5337c9991fc5699b57": { name: "Pulse", role: "Health Monitor", specialty: "Protocol Health Checks", avatar: "/avatars/vector.png" },
    "0x8178f43fcb59592019693e9951a760cafb968ed211166b0cfa46b7d3794baa83": { name: "Shadow", role: "Stealth Operator", specialty: "Low-latency Execution", avatar: "/avatars/vector.png" },
    "0x84b0fcb1b1b967f8bed7c15e8527680772eb7f70ffd1bcb72151e16d67502a56": { name: "Aegis", role: "Security Validator", specialty: "Hot Potato Integrity", avatar: "/avatars/vector.png" },
};

// Normaliza cualquier address a lowercase completo para lookup seguro
function normalizeAddress(addr: string): string {
    if (!addr) return '';
    return addr.trim().toLowerCase();
}

// Devuelve metadata del manifest o fallback digno
function resolveAgent(walletAddress: string) {
    const key = normalizeAddress(walletAddress);
    return AGENT_ROSTER_MANIFEST[key] ?? null;
}

// Avatar: manifest → dicebear identicon (nunca roto)
function getAvatar(walletAddress: string): string {
    const meta = resolveAgent(walletAddress);
    if (meta?.avatar) return meta.avatar;
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${walletAddress}&backgroundColor=0a0a0f&rowColor=00e5ff,bd00ff`;
}

// Nombre corto para la wallet (6 + … + 4)
function shortAddr(addr: string): string {
    if (!addr || addr.length < 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

type AgentProfile = {
    address: string;
    name: string;
    role: string;
    specialty: string;
    avatar: string;
    elo: number;
    trades: number;
    winRate: number;
    volumeUsd: number;
    rank: number;
    lastTx?: string;
    lastSignal?: string;
    isHuman: boolean;
};

export default function LeaderboardPage() {
    const { t } = useLanguage();
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof AgentProfile; direction: 'asc' | 'desc' }>({ key: 'elo', direction: 'desc' });
    const [globalSignals, setGlobalSignals] = useState<{ agent: string; content: string }[]>([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!supabase) return;
            try {
                const { data, error } = await supabase
                    .from('suiloop_agents')
                    .select('*')
                    .order('elo', { ascending: false });

                if (error) throw error;

                if (data && data.length > 0) {
                    const formatted: AgentProfile[] = data.map((row: any, idx: number) => {
                        const wallet = row.wallet_address ?? '';
                        const meta = resolveAgent(wallet);

                        // Nombre: manifest → campo en DB → shortAddr (nunca "Unknown" ni hex crudo)
                        const name = meta?.name
                            ?? (row.agent_name && row.agent_name !== 'Unknown' ? row.agent_name : null)
                            ?? shortAddr(wallet);

                        return {
                            address: wallet,
                            name,
                            role: meta?.role ?? row.agent_role ?? 'Agent',
                            specialty: meta?.specialty ?? row.agent_specialty ?? 'General',
                            avatar: getAvatar(wallet),
                            elo: Number(row.elo) || 1000,
                            trades: Number(row.total_txs) || Number(row.trades) || 0,
                            winRate: Number(row.win_rate) || 0,
                            volumeUsd: Number(row.volume_usd) || 0,
                            rank: idx + 1,
                            lastTx: row.last_tx_hash ?? undefined,
                            lastSignal: row.last_signal ?? undefined,
                            isHuman: !meta,
                        };
                    });

                    setAgents(formatted);

                    // Feed neuronal: agentes con señal real
                    const feed = formatted
                        .filter(a => a.lastSignal && a.lastSignal !== 'STANDBY')
                        .map(a => ({ agent: a.name.toUpperCase(), content: a.lastSignal! }))
                        .slice(0, 12);
                    setGlobalSignals(feed);
                }
            } catch (err) {
                console.error('Leaderboard fetch error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();

        if (supabase) {
            const sub = supabase
                .channel('suiloop-leaderboard-v2')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'suiloop_agents' }, () => {
                    fetchLeaderboard();
                })
                .subscribe();
            return () => { supabase?.removeChannel(sub); };
        }
    }, []);

    const handleSort = (key: keyof AgentProfile) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const sortedData = [...agents].sort((a, b) => {
        const vA = a[sortConfig.key] as any;
        const vB = b[sortConfig.key] as any;
        if (typeof vA === 'string') {
            return sortConfig.direction === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
        }
        return sortConfig.direction === 'asc' ? Number(vA) - Number(vB) : Number(vB) - Number(vA);
    });

    const filtered = sortedData.filter(a =>
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const top3 = filtered.slice(0, 3);
    const rest = filtered.slice(3);

    const totalVolume = agents.reduce((s, a) => s + a.volumeUsd, 0);

    const tierLabel = (elo: number) => {
        if (elo >= 2000) return { name: 'Matrix', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10 border-neon-cyan/30' };
        if (elo >= 1600) return { name: 'Gold', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' };
        if (elo >= 1200) return { name: 'Silver', color: 'text-gray-300', bg: 'bg-gray-500/10 border-gray-500/30' };
        return { name: 'Bronze', color: 'text-amber-700', bg: 'bg-amber-700/10 border-amber-700/30' };
    };

    return (
        <main className="min-h-screen bg-[#020205] text-white pt-24 pb-20 relative overflow-hidden">
            <Navbar />

            {/* Ambient Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/4 w-[1000px] h-[600px] bg-neon-cyan/5 rounded-full blur-[160px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[800px] h-[500px] bg-neon-purple/5 rounded-full blur-[140px] animate-pulse" style={{ animationDelay: '2s' }} />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_20%,transparent_100%)] opacity-30" />
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">

                {/* ── Header ── */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 pt-4 sm:pt-8">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] font-mono tracking-widest uppercase">
                            <Shield className="w-3 h-3" /> {t('leaderboard.hero.verified')}
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase font-orbitron italic leading-[0.9]">
                            {t('leaderboard.hero.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-purple block sm:inline">{t('leaderboard.hero.title2')}</span>
                        </h1>
                        <p className="text-gray-400 max-w-xl text-sm sm:text-lg font-light leading-relaxed">{t('leaderboard.hero.subtitle')}</p>
                    </motion.div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="text"
                                placeholder={t('leaderboard.search.placeholder')}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all backdrop-blur-md"
                            />
                        </div>
                        <div className="flex flex-col items-center justify-center px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t('leaderboard.tvl.label')}</span>
                            <span className="text-xl font-bold font-mono text-neon-cyan">${totalVolume.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                        </div>
                    </div>
                </div>

                {/* ── Podium Top 3 ── */}
                {!loading && top3.length > 0 && searchQuery === '' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {top3.map((agent, idx) => (
                            <motion.div
                                key={agent.address}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative group p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border backdrop-blur-xl transition-all hover:scale-[1.02] duration-500 overflow-hidden
                                    ${idx === 0 ? 'bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-transparent border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.1)]' :
                                        idx === 1 ? 'bg-gradient-to-br from-gray-400/20 via-gray-400/5 to-transparent border-gray-400/30 md:translate-y-4' :
                                            'bg-gradient-to-br from-amber-700/20 via-amber-700/5 to-transparent border-amber-700/30 md:translate-y-8'}
                                `}
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy className={`w-32 h-32 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`} />
                                </div>

                                <div className="flex items-center gap-5 mb-6">
                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`w-16 h-16 rounded-2xl border overflow-hidden
                                            ${idx === 0 ? 'border-yellow-400/50' : idx === 1 ? 'border-gray-300/40' : 'border-amber-600/40'}`}>
                                            <img src={agent.avatar} alt={agent.name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${agent.address}`; }} />
                                        </div>
                                        <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#020205] font-black text-xs
                                            ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : 'bg-amber-700 text-white'}`}>
                                            {idx + 1}
                                        </div>
                                    </div>

                                    {/* Name + wallet */}
                                    <div className="min-w-0">
                                        {/* Nombre institucional — grande y claro */}
                                        <h3 className={`text-2xl sm:text-3xl font-black font-orbitron tracking-tighter uppercase leading-none mb-1
                                            ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>
                                            {agent.name}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[10px] text-gray-500 font-mono">{agent.role}</p>
                                            {agent.isHuman && (
                                                <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-neon-purple/30 border border-neon-purple/50 text-neon-purple font-black uppercase tracking-tighter shadow-[0_0_10px_rgba(189,0,255,0.2)]">Human</span>
                                            )}
                                        </div>
                                        {/* Wallet en formato corto + link */}
                                        <a
                                            href={`https://suiscan.xyz/testnet/account/${agent.address}`}
                                            target="_blank"
                                            className="flex items-center gap-1 mt-1 text-[10px] text-gray-600 font-mono hover:text-neon-cyan transition-colors"
                                        >
                                            <Wallet className="w-2.5 h-2.5" />
                                            {shortAddr(agent.address)}
                                            <ExternalLink className="w-2.5 h-2.5" />
                                        </a>
                                    </div>
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">{t('leaderboard.podium.eloRating')}</span>
                                        <span className={`text-2xl font-mono font-bold ${idx === 0 ? 'text-yellow-400' : 'text-white'}`}>{agent.elo}</span>
                                    </div>
                                    <div className="p-3 rounded-2xl bg-white/5 border border-white/5">
                                        <span className="block text-[9px] text-gray-500 uppercase tracking-widest mb-1">{t('leaderboard.podium.winRate')}</span>
                                        <span className="text-2xl font-mono font-bold text-neon-cyan">{agent.winRate}%</span>
                                    </div>
                                </div>

                                {/* Specialty badge + Walrus seal */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <span className="text-[9px] px-2 py-1 rounded-full bg-neon-purple/10 border border-neon-purple/20 text-neon-purple font-mono uppercase tracking-wider">
                                        {agent.specialty}
                                    </span>
                                    <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                                        <span className="text-[9px] text-neon-cyan font-black uppercase tracking-tighter">Walrus Sealed</span>
                                    </div>
                                </div>

                                {/* Last Signal */}
                                {agent.lastSignal && (
                                    <div className="px-4 py-2 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20">
                                        <span className="block text-[8px] text-neon-cyan/60 font-mono tracking-tighter uppercase mb-0.5">{t('leaderboard.podium.lastSignal')}</span>
                                        <span className="text-[10px] text-neon-cyan font-mono leading-tight line-clamp-2">{agent.lastSignal}</span>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* ── Neural Feed Ticker ── */}
                <div className="mb-8 overflow-hidden h-10 flex items-center bg-white/5 border-y border-white/10 backdrop-blur-md">
                    <div className="flex-shrink-0 px-6 bg-neon-cyan/20 h-full flex items-center border-r border-white/10">
                        <Activity className="w-4 h-4 text-neon-cyan animate-pulse mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-neon-cyan">{t('leaderboard.feed.title')}</span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <div className="flex gap-12 animate-marquee whitespace-nowrap px-8">
                            {globalSignals.length > 0 ? globalSignals.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                                    <span className="text-neon-cyan font-bold">[{s.agent}]</span>
                                    <span className="text-white/60">{s.content}</span>
                                </div>
                            )) : (
                                <span className="text-[11px] font-mono text-gray-500 uppercase italic">{t('leaderboard.feed.waiting')}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Main Table ── */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="relative group lg:rounded-[3rem] border border-white/10 bg-white/[0.02] backdrop-blur-3xl"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-white/[0.03] to-transparent pointer-events-none rounded-[inherit]" />

                    <div className="overflow-x-auto custom-scrollbar -mx-4 sm:mx-0">
                        <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full">
                            <thead>
                                <tr className="border-b border-white/5 text-[9px] text-gray-500 tracking-[0.15em] uppercase font-mono whitespace-nowrap">
                                    <th className="py-3 px-3 w-12 text-center">{t('leaderboard.table.headers.rank')}</th>
                                    <th className="py-3 px-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('name')}>
                                        {t('leaderboard.table.headers.profile')} {sortConfig.key === 'name' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="hidden lg:table-cell py-3 px-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('winRate')}>
                                        {t('leaderboard.table.headers.performance')} {sortConfig.key === 'winRate' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="py-3 px-3 cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('elo')}>
                                        {t('leaderboard.table.headers.trust')} {sortConfig.key === 'elo' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="hidden 2xl:table-cell py-3 px-3">{t('leaderboard.table.headers.feed')}</th>
                                    <th className="hidden md:table-cell py-3 px-3 tracking-widest">{t('leaderboard.table.headers.audit')}</th>
                                    <th className="py-3 px-3 text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('volumeUsd')}>
                                        {t('leaderboard.table.headers.volume')} {sortConfig.key === 'volumeUsd' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        [...Array(8)].map((_, i) => (
                                            <tr key={i} className="animate-pulse border-b border-white/5">
                                                <td colSpan={7} className="py-8 px-8"><div className="h-4 bg-white/5 rounded-full w-full" /></td>
                                            </tr>
                                        ))
                                    ) : (searchQuery === '' ? rest : filtered).map((agent, idx) => {
                                        const tier = tierLabel(agent.elo);
                                        return (
                                            <motion.tr
                                                key={agent.address}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="group/row border-b border-white/5 hover:bg-white/[0.04] transition-all duration-300"
                                            >
                                                {/* Rank */}
                                                <td className="py-4 px-3">
                                                    <div className="flex flex-col items-center">
                                                        <span className={`text-sm font-black font-orbitron ${agent.rank <= 3 ? 'text-neon-cyan' : 'text-gray-600'}`}>
                                                            #{agent.rank.toString().padStart(2, '0')}
                                                        </span>
                                                        {agent.trades > 50 && <Zap className="w-2.5 h-2.5 text-yellow-500 mt-0.5" />}
                                                    </div>
                                                </td>

                                                {/* Profile */}
                                                <td className="py-4 px-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="relative shrink-0">
                                                            <div className={`w-10 h-10 rounded-xl border overflow-hidden transition-all group-hover/row:scale-110 duration-500
                                                                ${agent.rank === 1 ? 'border-yellow-400/30' : agent.rank === 2 ? 'border-gray-300/30' : agent.rank === 3 ? 'border-amber-700/30' : 'border-white/10'}`}>
                                                                <img
                                                                    src={agent.avatar}
                                                                    alt={agent.name}
                                                                    className="w-full h-full object-cover"
                                                                    onError={e => { (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/identicon/svg?seed=${agent.address}`; }}
                                                                />
                                                            </div>
                                                            <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border border-[#020205]
                                                                ${agent.trades > 0 ? 'bg-green-500' : 'bg-gray-600'}`} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            {/* Nombre institucional */}
                                                            <div className="flex items-center gap-1">
                                                                <span className={`text-xs font-black font-orbitron tracking-tight uppercase truncate max-w-[110px]
                                                                    ${agent.rank === 1 ? 'text-yellow-400' : 'group-hover/row:text-neon-cyan text-white'}`}>
                                                                    {agent.name}
                                                                </span>
                                                                <a href={`https://suiscan.xyz/testnet/account/${agent.address}`} target="_blank" className="opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                                                                    <ArrowUpRight className="w-2.5 h-2.5 text-gray-500 hover:text-white" />
                                                                </a>
                                                            </div>
                                                            {/* Wallet corta + rol */}
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <Wallet className="w-2.5 h-2.5 text-gray-700" />
                                                                <span className="text-[9px] text-gray-600 font-mono">{shortAddr(agent.address)}</span>
                                                                {agent.isHuman && (
                                                                    <span className="text-[8px] px-1.5 rounded-full bg-neon-purple/30 border border-neon-purple/50 text-neon-purple font-black uppercase tracking-tighter">Human</span>
                                                                )}
                                                            </div>
                                                            <span className="text-[8px] text-gray-700 font-mono">{agent.role}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Performance */}
                                                <td className="hidden lg:table-cell py-4 px-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold font-mono text-neon-cyan">{agent.winRate}%</span>
                                                            <span className="text-[8px] text-gray-600 uppercase font-mono">{t('leaderboard.table.stats.winRate')}</span>
                                                        </div>
                                                        <div className="h-6 w-px bg-white/5" />
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold font-mono">{agent.trades}</span>
                                                            <span className="text-[8px] text-gray-600 uppercase font-mono">{t('leaderboard.table.stats.trades')}</span>
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Trust / ELO */}
                                                <td className="py-4 px-3">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-base font-bold font-mono tracking-tighter">{agent.elo}</span>
                                                            <TrendingUp className="w-3 h-3 text-green-500/50" />
                                                        </div>
                                                        <span className={`text-[8px] px-1.5 py-0.5 rounded-full border w-max font-mono uppercase tracking-widest ${tier.bg} ${tier.color}`}>
                                                            {tier.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Neural Feed */}
                                                <td className="hidden 2xl:table-cell py-4 px-3">
                                                    <div className="flex flex-col gap-1 max-w-[180px]">
                                                        {agent.lastSignal ? (
                                                            <>
                                                                <div className="flex items-center gap-1.5">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_6px_rgba(0,229,255,1)]" />
                                                                    <span className="text-[9px] text-neon-cyan font-mono truncate uppercase tracking-tighter">{agent.lastSignal}</span>
                                                                </div>
                                                                {agent.lastTx && (
                                                                    <a href={`https://suiscan.xyz/testnet/tx/${agent.lastTx}`} target="_blank"
                                                                        className="text-[8px] text-gray-600 font-mono hover:text-white transition-colors flex items-center gap-0.5">
                                                                        TX {agent.lastTx.slice(0, 8)}… <ArrowUpRight className="w-2 h-2" />
                                                                    </a>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-[9px] font-mono text-gray-700">{t('leaderboard.table.stats.standby')}</span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Walrus Audit */}
                                                <td className="hidden md:table-cell py-4 px-3">
                                                    {agent.trades > 0 ? (
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 w-max shadow-[0_0_10px_rgba(0,229,255,0.08)]">
                                                                <svg viewBox="0 0 24 24" className="w-3 h-3 text-neon-cyan fill-current shrink-0">
                                                                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                                                                </svg>
                                                                <span className="text-[9px] font-black text-neon-cyan uppercase tracking-wider">Sealed</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <div className="w-1 h-1 rounded-full bg-neon-cyan/50 animate-pulse" />
                                                                <span className="text-[7px] text-gray-600 font-mono uppercase">Walrus</span>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] text-gray-700 font-mono opacity-40">—</span>
                                                    )}
                                                </td>

                                                {/* Volume */}
                                                <td className="py-4 px-3 text-right">
                                                    <span className="text-sm font-black font-mono tracking-tight group-hover/row:text-white transition-colors">
                                                        ${agent.volumeUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        <span className="text-[9px] text-gray-500 ml-1">USD</span>
                                                    </span>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Footer */}
                    <div className="p-8 bg-white/[0.03] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                                {t('leaderboard.footer.sync')}
                            </div>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-3 h-3" />
                                {filtered.length} {t('leaderboard.footer.nodes')}
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <Link href="/agents">
                                <button className="px-6 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-mono uppercase tracking-widest hover:bg-white/10 transition-all">
                                    {t('leaderboard.footer.monitor')}
                                </button>
                            </Link>
                            <Link href="/strategies/builder">
                                <button className="px-8 py-2 rounded-xl bg-neon-cyan text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(0,229,255,0.3)]">
                                    {t('leaderboard.footer.deploy')}
                                </button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
