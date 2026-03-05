'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, TrendingUp, Cpu, Activity, Medal, Star, ExternalLink, Wallet, Zap, Shield, ChevronRight, Search, Filter, ArrowUpRight, BarChart3 } from 'lucide-react';
import Link from 'next/link';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import Navbar from '@/components/layout/Navbar';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { supabase } from '@/lib/supabase';

type AgentProfile = {
    address: string;
    creator: string;
    elo: number;
    trades: number;
    winRate: number;
    volume: number;
    volumeUsd: number;
    rank: number;
    lastTx?: string;
    lastSignal?: string;
    signalTime?: number;
};

const AGENT_ASSETS: Record<string, string> = {
    "0x8bd468b0e5941e75484e95191d99ff6234b2ab24e3b91650715b6df8cf8e4eba": "/avatars/titan.png",
    "0x8ce5e3a1cc5b8be074c9820659b6dcae18210f350f46fcb10e32bc6327ad5884": "/avatars/eliza.png",
    "0x9b035feba22ef69411f1d803702e641d438481292f0082b43bfce68d3a351110": "/avatars/whale.png",
    "0xa6890d201f81ed0cb62edcc70dc85bcb61c5d8c1ff74c51e5de6d6201b2a7d09": "/avatars/kraken.png",
    "0xa9bf0eb96e8c47d36f2aa68889996feebe7757e3ce5c74b327e6f07025bb6dc8": "/avatars/phoenix.png",
    "0xb7b57c7d9412ae10eb490aa54df187e3d8f10950414791d6bdec9175309ae0e7": "/avatars/specter.png",
    "0xbedcfc040f61028443573261778148084942725023c95187063e15c21c64cc39": "/avatars/nexus.png",
    "0xbf498d11d7d59c5accca3248d59621463f583553909e3ea4ef38b7da4909a495": "/avatars/cyborg.png",
    "0xc8c5a537a37a4c4637c682b033e7dd137a343bb869eb68900537e7e0b8ade8aa": "/avatars/ghost.png",
    "0x590ce2b2280b3563bc6bb46541bf39c1e028a9f391e10758d3a9952249f3911f": "/avatars/vector.png",
    "0x651411a17fc47d0fb89068db8a237374247322bc9d0bfe828191a6093f6b86f9": "/avatars/matrix.png",
    "0x3e7889aa0e9c7c3d24038527effecf42e26a175b20af3e678fabf8822c544222": "/avatars/orion.png",
    "0x4c27b5baf7d5d3be529b55d5efe291008871b027db9071842bcb1d947276e309": "/avatars/sirius.png",
    "0x600a005f56f04723dc912676481541e114c58eff94c7b1c0593f3b367b4d6f5e": "/avatars/nova.png",
    "0x7762bed5a0843042242d4adecaed0052eece5d3e9aa9f0b5e47a738f1c3fee19": "/avatars/zenith.png",
};

export default function LeaderboardPage() {
    const { t } = useLanguage();
    const [agents, setAgents] = useState<AgentProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof AgentProfile, direction: 'asc' | 'desc' }>({ key: 'elo', direction: 'desc' });
    const [globalSignals, setGlobalSignals] = useState<{ agent: string, content: string, time: number }[]>([]);

    const getAgentAvatar = (address: string) => {
        return AGENT_ASSETS[address] || `https://api.dicebear.com/7.x/identicon/svg?seed=${address}&backgroundColor=0a0a0f&rowColor=00e5ff,bd00ff`;
    };

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!supabase) return;
            try {
                const { data, error } = await supabase
                    .from('suiloop_agents')
                    .select('*')
                    .order('elo', { ascending: false });

                if (error) throw error;

                if (data) {
                    const formattedAgents = data.map((agent: any, idx: number) => ({
                        address: agent.wallet_address,
                        creator: agent.creator || 'Unknown',
                        elo: agent.elo,
                        trades: agent.trades,
                        winRate: agent.win_rate,
                        volume: 0,
                        volumeUsd: agent.volume_usd,
                        rank: idx + 1,
                        lastTx: agent.last_tx_hash,
                        lastSignal: agent.last_signal
                    }));
                    setAgents(formattedAgents);

                    // Extraer los ultimos signals para el global (Top 10 max)
                    const latestGlobal = [...formattedAgents]
                        .filter(a => a.lastSignal && a.lastSignal !== 'STANDBY')
                        .map(a => ({
                            agent: a.creator.length > 15 ? `${a.creator.slice(0, 6)}...` : a.creator.toUpperCase(),
                            content: a.lastSignal as string,
                            time: Date.now() // placeholder for latest time
                        }))
                        .slice(0, 10);

                    setGlobalSignals(latestGlobal);
                    setLoading(false);
                }
            } catch (err) {
                console.error("Error fetching leaderboard from Supabase", err);
                setLoading(false);
            }
        };

        fetchLeaderboard();

        // Realtime Subscription (Identica a Nirium)
        if (supabase) {
            const subscription = supabase
                .channel('suiloop-leaderboard')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'suiloop_agents' }, payload => {
                    console.log('🔄 Leaderboard Realtime Update:', payload);
                    fetchLeaderboard(); // Re-fetch on any change to keep sorting aligned easily
                })
                .subscribe();

            return () => {
                supabase.removeChannel(subscription);
            };
        }
    }, []);

    const handleSort = (key: keyof AgentProfile) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
        }));
    };

    const sortedData = [...agents].sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];

        if (typeof valA === 'string' && typeof valB === 'string') {
            return sortConfig.direction === 'asc'
                ? valA.localeCompare(valB)
                : valB.localeCompare(valA);
        }

        const numA = Number(valA) || 0;
        const numB = Number(valB) || 0;
        if (sortConfig.direction === 'asc') return numA - numB;
        return numB - numA;
    });

    const filteredAgents = sortedData.filter(a =>
        a.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.creator.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const top3 = filteredAgents.slice(0, 3);
    const rest = filteredAgents.slice(3);

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
                {/* Header Section */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12 sm:mb-16 pt-4 sm:pt-8">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-3 sm:space-y-4"
                    >
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 text-[9px] sm:text-[10px] font-mono tracking-widest uppercase">
                            <Shield className="w-3 h-3" /> {t('leaderboard.hero.verified')}
                        </div>
                        <h1 className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter uppercase font-orbitron italic leading-[0.9]">
                            {t('leaderboard.hero.title1')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-neon-cyan via-white to-neon-purple block sm:inline">{t('leaderboard.hero.title2')}</span>
                        </h1>
                        <p className="text-gray-400 max-w-xl text-sm sm:text-lg font-light leading-relaxed">
                            {t('leaderboard.hero.subtitle')}
                        </p>
                    </motion.div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                        <div className="relative group w-full sm:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-neon-cyan transition-colors" />
                            <input
                                type="text"
                                placeholder={t('leaderboard.search.placeholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-sm focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition-all backdrop-blur-md"
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="flex flex-col items-center justify-center h-full px-6 py-3 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
                                <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t('leaderboard.tvl.label')}</span>
                                <span className="text-xl font-bold font-mono text-neon-cyan">${(agents.reduce((acc, a) => acc + a.volumeUsd, 0)).toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Podium / Top Tier */}
                {!loading && filteredAgents.length > 0 && searchQuery === '' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
                        {top3.map((agent, idx) => (
                            <motion.div
                                key={agent.address}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className={`relative group p-6 sm:p-8 rounded-3xl sm:rounded-[2.5rem] border backdrop-blur-xl transition-all hover:scale-[1.02] duration-500 overflow-hidden
                                    ${idx === 0 ? 'bg-gradient-to-br from-yellow-500/20 via-yellow-500/5 to-transparent border-yellow-500/30 shadow-[0_0_50px_rgba(234,179,8,0.1)] order-first md:order-none' :
                                        idx === 1 ? 'bg-gradient-to-br from-gray-400/20 via-gray-400/5 to-transparent border-gray-400/30 md:translate-y-4' :
                                            'bg-gradient-to-br from-amber-700/20 via-amber-700/5 to-transparent border-amber-700/30 md:translate-y-8'}
                                `}
                            >
                                <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Trophy className={`w-32 h-32 ${idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-gray-400' : 'text-amber-700'}`} />
                                </div>

                                <div className="flex items-center gap-6 mb-8">
                                    <div className="relative">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border text-2xl font-black overflow-hidden
                                            ${idx === 0 ? 'bg-yellow-500 text-black border-yellow-400' :
                                                idx === 1 ? 'bg-gray-400 text-black border-gray-300' :
                                                    'bg-amber-700 text-white border-amber-600'}
                                        `}>
                                            <img
                                                src={getAgentAvatar(agent.address)}
                                                alt="Avatar"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#020205] font-black text-xs
                                            ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-400 text-black' : 'bg-amber-700 text-white'}
                                        `}>
                                            {idx + 1}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2 mb-1">
                                            <span className="text-[10px] font-mono text-gray-500 uppercase tracking-tighter break-all max-w-[200px]">
                                                {agent.address}
                                            </span>
                                            <Shield className="w-3 h-3 text-neon-cyan shrink-0" />
                                            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-neon-cyan/10 border border-neon-cyan/30">
                                                <div className="w-1 h-1 rounded-full bg-neon-cyan animate-pulse" />
                                                <span className="text-[8px] text-neon-cyan font-black uppercase tracking-tighter">Sealed on Walrus</span>
                                            </div>
                                        </div>
                                        <h3 className="text-lg sm:text-xl xl:text-2xl font-black font-orbitron tracking-tighter break-all uppercase text-white leading-tight">
                                            {agent.creator}
                                        </h3>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-8">
                                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                        <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t('leaderboard.podium.eloRating')}</span>
                                        <span className={`text-2xl font-mono font-bold ${idx === 0 ? 'text-yellow-500' : 'text-white'}`}>{agent.elo}</span>
                                    </div>
                                    <div className="p-4 rounded-3xl bg-white/5 border border-white/5">
                                        <span className="block text-[10px] text-gray-500 uppercase tracking-widest mb-1">{t('leaderboard.podium.winRate')}</span>
                                        <span className="text-2xl font-mono font-bold text-neon-cyan">{agent.winRate}%</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex flex-col gap-1 text-[10px] mt-2">
                                        <span className="text-gray-500 font-mono uppercase tracking-tighter opacity-60">{t('leaderboard.podium.agentWallet')}</span>
                                        <a
                                            href={`https://suiscan.xyz/testnet/account/${agent.address}`}
                                            target="_blank"
                                            className="text-neon-cyan hover:underline flex items-start gap-1 font-mono break-all leading-relaxed"
                                        >
                                            {agent.address} <ExternalLink className="w-3 h-3 mt-1 shrink-0" />
                                        </a>
                                    </div>
                                    {agent.lastSignal && (
                                        <div className="flex flex-col gap-1 px-4 py-2 mt-4 rounded-2xl bg-neon-cyan/5 border border-neon-cyan/20 animate-pulse">
                                            <span className="text-[9px] text-neon-cyan/60 font-mono tracking-tighter uppercase">{t('leaderboard.podium.lastSignal')}</span>
                                            <span className="text-[11px] text-neon-cyan font-mono leading-tight">{agent.lastSignal}</span>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}

                {/* Global Neural Feed Ticker */}
                <div className="mb-8 overflow-hidden h-10 flex items-center bg-white/5 border-y border-white/10 backdrop-blur-md">
                    <div className="flex-shrink-0 px-6 bg-neon-cyan/20 h-full flex items-center border-r border-white/10">
                        <Activity className="w-4 h-4 text-neon-cyan animate-pulse mr-2" />
                        <span className="text-[10px] font-black uppercase tracking-tighter text-neon-cyan">{t('leaderboard.feed.title')}</span>
                    </div>
                    <div className="flex-1 overflow-hidden relative">
                        <div className="flex gap-12 animate-marquee whitespace-nowrap px-8">
                            {globalSignals.length > 0 ? globalSignals.map((s, i) => (
                                <div key={i} className="flex items-center gap-2 text-[11px] font-mono">
                                    <span className="text-neon-cyan font-bold">[{s.agent}]</span>
                                    <span className="text-white/60">{s.content}</span>
                                    <span className="text-[9px] text-gray-600 italic">{t('leaderboard.feed.justNow')}</span>
                                </div>
                            )) : (
                                <span className="text-[11px] font-mono text-gray-500 uppercase italic">{t('leaderboard.feed.waiting')}</span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Table Tier */}
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
                                    <th className="py-3 px-3 font-semibold w-12 text-center">{t('leaderboard.table.headers.rank')}</th>
                                    <th className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('creator')}>
                                        {t('leaderboard.table.headers.profile')} {sortConfig.key === 'creator' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="hidden lg:table-cell py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('winRate')}>
                                        {t('leaderboard.table.headers.performance')} {sortConfig.key === 'winRate' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="py-3 px-3 font-semibold cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('elo')}>
                                        {t('leaderboard.table.headers.trust')} {sortConfig.key === 'elo' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                    </th>
                                    <th className="hidden 2xl:table-cell py-3 px-3 font-semibold">{t('leaderboard.table.headers.feed')}</th>
                                    <th className="hidden md:table-cell py-3 px-3 font-semibold tracking-widest">{t('leaderboard.table.headers.audit')}</th>
                                    <th className="py-3 px-3 font-semibold text-right cursor-pointer hover:text-white transition-colors" onClick={() => handleSort('volume')}>
                                        {t('leaderboard.table.headers.volume')} {sortConfig.key === 'volume' && (sortConfig.direction === 'desc' ? '↓' : '↑')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {loading ? (
                                        [...Array(5)].map((_, i) => (
                                            <tr key={i} className="animate-pulse border-b border-white/5">
                                                <td colSpan={6} className="py-8 px-8"><div className="h-4 bg-white/5 rounded-full w-full" /></td>
                                            </tr>
                                        ))
                                    ) : (searchQuery === '' ? rest : filteredAgents).map((agent, idx) => (
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
                                                <div className="flex items-center gap-2">
                                                    <div className="relative shrink-0">
                                                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br border flex items-center justify-center p-0.5 transition-all group-hover/row:scale-110 duration-500
                                                            ${agent.rank === 1 ? 'from-yellow-400/50 to-transparent border-yellow-400/30' :
                                                                agent.rank === 2 ? 'from-gray-300/50 to-transparent border-gray-300/30' :
                                                                    agent.rank === 3 ? 'from-amber-700/50 to-transparent border-amber-700/30' :
                                                                        'from-neon-cyan/20 to-transparent border-white/10'}
                                                        `}>
                                                            <div className="w-full h-full rounded-lg bg-[#0A0A0F] overflow-hidden">
                                                                <img src={getAgentAvatar(agent.address)} alt="Avatar" className="w-full h-full object-cover scale-110" />
                                                            </div>
                                                        </div>
                                                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border border-[#020205] flex items-center justify-center
                                                            ${agent.trades > 0 ? 'bg-green-500' : 'bg-gray-600'}
                                                        `}>
                                                            {agent.rank <= 3 && <Star className="w-1.5 h-1.5 text-black fill-black" />}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <div className="flex items-center gap-1">
                                                            <span className={`text-xs font-black font-orbitron tracking-tight transition-colors truncate max-w-[120px]
                                                                ${agent.rank === 1 ? 'text-yellow-500' : 'group-hover/row:text-neon-cyan text-white'}
                                                            `}>
                                                                {agent.creator.length > 15 ? `${agent.creator.slice(0, 6)}...${agent.creator.slice(-4)}` : agent.creator.toUpperCase()}
                                                            </span>
                                                            <a href={`https://suiscan.xyz/testnet/account/${agent.address}`} target="_blank" className="opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0">
                                                                <ArrowUpRight className="w-2.5 h-2.5 text-gray-500 hover:text-white" />
                                                            </a>
                                                        </div>
                                                        <div className="flex items-center gap-1 mt-0.5">
                                                            <Wallet className="w-2.5 h-2.5 text-gray-700" />
                                                            <span className="text-[9px] text-gray-600 font-mono">{agent.address.slice(0, 6)}...{agent.address.slice(-4)}</span>
                                                        </div>
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

                                            {/* Trust Score */}
                                            <td className="py-4 px-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-base font-bold font-mono tracking-tighter">{agent.elo}</span>
                                                        <span className="text-[9px] text-gray-600 font-light">{t('leaderboard.table.stats.elo')}</span>
                                                        <TrendingUp className="w-3 h-3 text-green-500/50" />
                                                    </div>
                                                    <div className="flex items-center">
                                                        {(() => {
                                                            const tier = agent.elo >= 2000 ? { name: "Matrix", color: "text-neon-cyan", bg: "bg-neon-cyan/10 border-neon-cyan/30" } :
                                                                agent.elo >= 1600 ? { name: "Gold", color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/30" } :
                                                                    agent.elo >= 1200 ? { name: "Silver", color: "text-gray-300", bg: "bg-gray-500/10 border-gray-500/30" } :
                                                                        { name: "Bronze", color: "text-amber-700", bg: "bg-amber-700/10 border-amber-700/30" };
                                                            return (
                                                                <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${tier.bg} ${tier.color} font-mono uppercase tracking-widest flex items-center gap-1 w-max`}>
                                                                    {tier.name}
                                                                </span>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Neural Feed */}
                                            <td className="hidden 2xl:table-cell py-4 px-3">
                                                <div className="flex flex-col gap-1 max-w-[180px]">
                                                    {agent.lastSignal ? (
                                                        <>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse shadow-[0_0_6px_rgba(0,229,255,1)]" />
                                                                <span className="text-[9px] text-neon-cyan font-mono truncate uppercase tracking-tighter">
                                                                    {agent.lastSignal}
                                                                </span>
                                                            </div>
                                                            {agent.lastTx && (
                                                                <a
                                                                    href={`https://suiscan.xyz/testnet/tx/${agent.lastTx}`}
                                                                    target="_blank"
                                                                    className="text-[8px] text-gray-600 font-mono hover:text-white transition-colors flex items-center gap-0.5"
                                                                >
                                                                    TX {agent.lastTx.slice(0, 8)}... <ArrowUpRight className="w-2 h-2" />
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
                                                <div className="flex flex-col gap-1">
                                                    {agent.trades > 0 ? (
                                                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/30 w-max shadow-[0_0_10px_rgba(0,229,255,0.08)] hover:bg-neon-cyan/15 transition-all cursor-default">
                                                            <svg viewBox="0 0 24 24" className="w-3 h-3 text-neon-cyan fill-current shrink-0">
                                                                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
                                                            </svg>
                                                            <span className="text-[9px] font-black text-neon-cyan uppercase tracking-wider">Sealed</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[9px] text-gray-700 font-mono opacity-40">—</span>
                                                    )}
                                                    {agent.trades > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            <div className="w-1 h-1 rounded-full bg-neon-cyan/50 animate-pulse" />
                                                            <span className="text-[7px] text-gray-600 font-mono uppercase">Walrus</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Volume */}
                                            <td className="py-4 px-3 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-sm font-black font-mono tracking-tight group-hover/row:text-white transition-colors">
                                                        ${agent.volumeUsd.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                                        <span className="text-[9px] text-gray-500 ml-1">USD</span>
                                                    </span>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>

                    {/* Table Footer */}
                    <div className="p-8 bg-white/[0.03] border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-6 text-[10px] font-mono tracking-widest text-gray-500 uppercase">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
                                {t('leaderboard.footer.sync')}
                            </div>
                            <div className="flex items-center gap-2">
                                <BarChart3 className="w-3 h-3" />
                                {filteredAgents.length} {t('leaderboard.footer.nodes')}
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
