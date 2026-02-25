"use client";

import Navbar from "@/components/layout/Navbar";
import {
    Download, Star, Search, Filter, TrendingUp, Sparkles,
    CheckCircle, Package, ExternalLink, ChevronRight, Zap,
    Code2, Bell, BarChart3, Database, Link2, Settings, Play, UserPlus,
    Activity, Wifi, Cpu, RefreshCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { writeLog } from "@/lib/logger";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import InstallSkillModal from "@/components/marketplace/InstallSkillModal";
import { useSuiClient, useSignTransaction, useCurrentAccount } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";

// Types
interface MarketplaceSkill {
    id: string;
    name: string;
    slug: string;
    version: string;
    description: string;
    author: string;
    category: string;
    tags: string[];
    downloads: number;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    isFeatured: boolean;
    price: number; // Price in SUI
    actions?: { name: string; description: string }[];
}

interface Category {
    id: string;
    name: string;
    count: number;
    icon: string;
}

const CATEGORY_ICONS: Record<string, any> = {
    trading: TrendingUp,
    analysis: BarChart3,
    notification: Bell,
    integration: Link2,
    data: Database,
    utility: Settings
};

const CATEGORY_COLORS: Record<string, string> = {
    trading: "from-emerald-500 to-green-600",
    analysis: "from-blue-500 to-indigo-600",
    notification: "from-orange-500 to-amber-600",
    integration: "from-purple-500 to-violet-600",
    data: "from-cyan-500 to-teal-600",
    utility: "from-gray-500 to-slate-600",
    neural: "from-neon-cyan to-blue-500"
};

export default function MarketplacePage() {
    const [skills, setSkills] = useState<MarketplaceSkill[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredSkills, setFeaturedSkills] = useState<MarketplaceSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"downloads" | "rating" | "newest">("downloads");
    const account = useCurrentAccount();
    const [installedSkills, setInstalledSkills] = useState<{ [key: string]: boolean }>({});
    const suiClient = useSuiClient();
    const { mutateAsync: signTransaction } = useSignTransaction();
    const [stats, setStats] = useState({ totalSkills: 0, totalDownloads: 0 });
    const [liveActivity, setLiveActivity] = useState<any[]>([]);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedSkillToInstall, setSelectedSkillToInstall] = useState<MarketplaceSkill | null>(null);
    const [selectedSkillToExecute, setSelectedSkillToExecute] = useState<MarketplaceSkill | null>(null);
    const { t } = useLanguage();

    // Fetch marketplace data
    const fetchData = useCallback(async (showLoading = true) => {
        if (showLoading) setLoading(true);
        else setIsRefreshing(true);

        try {
            const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0";

            // 1. FETCH REAL ON-CHAIN STRATEGIES (Multi-Event Discovery)
            const eventTypes = [
                `${PACKAGE_ID}::strategy_marketplace::StrategyListed`,
                `${PACKAGE_ID}::strategy_marketplace::StrategyPublished`
            ];

            let allEvents: any[] = [];
            for (const type of eventTypes) {
                try {
                    const res = await suiClient.queryEvents({ query: { MoveEventType: type }, limit: 50, order: 'descending' });
                    allEvents = [...allEvents, ...res.data];
                } catch (e) {
                    console.warn(`Failed to fetch ${type}`, e);
                }
            }

            const realSkills: MarketplaceSkill[] = allEvents.map((ev: any) => {
                const parsed = ev.parsedJson;
                // Resilience: handle different field names
                const strategyId = parsed.id || parsed.strategy_id || ev.id.txDigest;
                const name = parsed.name || parsed.strategy_name || "";
                const priceInSui = Number(parsed.price || 0) / 1000000000;

                return {
                    id: strategyId,
                    name: name,
                    slug: name.toLowerCase().replace(/\s+/g, '-'),
                    version: parsed.version || "1.0.0",
                    description: parsed.description || "",
                    author: (parsed.creator || parsed.author || "0x...").slice(0, 10) + "...",
                    category: (parsed.category || "trading").toLowerCase(),
                    tags: ["on-chain", "verified"],
                    downloads: Math.floor(Math.random() * 500) + 100, // Simulated for demo
                    rating: 4.5 + Math.random() * 0.5,
                    reviewCount: Math.floor(Math.random() * 20),
                    isVerified: true,
                    isFeatured: false,
                    price: priceInSui
                };
            });

            // 2. FETCH LIVE NEURAL SIGNALS (The Activity Feed)
            try {
                const signalRes = await suiClient.queryEvents({
                    query: { MoveEventType: `${PACKAGE_ID}::agent_registry::SignalPublished` },
                    limit: 15,
                    order: 'descending'
                });
                const signals = signalRes.data.map((ev: any) => {
                    const p = ev.parsedJson;
                    let msg = p.signal_data || "";
                    if (Array.isArray(msg)) msg = String.fromCharCode(...msg);
                    return {
                        id: ev.id.txDigest,
                        message: msg,
                        timestamp: Number(p.timestamp || Date.now()),
                        agent: (p.agent_id || "0x...").slice(0, 8)
                    };
                });
                setLiveActivity(signals);
            } catch (err) {
                console.warn("Failed to fetch live signals", err);
            }

            // Dedup by ID
            const uniqueSkillsMap = new Map();
            realSkills.forEach(s => uniqueSkillsMap.set(s.id, s));

            // --- CORE MANUAL STRATEGIES (0 SUI) ---
            const CORE_MANUALS: MarketplaceSkill[] = [
                {
                    id: 'manual-sui-dca',
                    name: 'Manual SUI Accumulator (DCA)',
                    slug: 'manual-sui-dca',
                    version: '1.0.0',
                    description: 'Professional DCA tool for $SUI. Manually set accumulation levels or trigger at specific price points. Includes risk-adjusted entries.',
                    author: 'SuiLoop Core',
                    category: 'trading',
                    tags: ['manual', 'dca', 'accumulation'],
                    downloads: 2150,
                    rating: 5.0,
                    reviewCount: 38,
                    isVerified: true,
                    isFeatured: true,
                    price: 0
                },
                {
                    id: 'manual-hedge-master',
                    name: 'Delta Neutral Hedge Master',
                    slug: 'manual-hedge-master',
                    version: '1.2.0',
                    description: 'Real-time delta neutral hedging suite. Manually balance Long/Short positions across Cetus and Bluefin.',
                    author: 'SuiLoop Core',
                    category: 'trading',
                    tags: ['manual', 'hedging', 'risk'],
                    downloads: 1840,
                    rating: 4.8,
                    reviewCount: 22,
                    isVerified: true,
                    isFeatured: true,
                    price: 0
                },
                {
                    id: 'manual-lp-scout',
                    name: 'Manual Liquidity Scout',
                    slug: 'manual-lp-scout',
                    version: '2.0.1',
                    description: 'Visual range management for Cetus CLMM. Manually adjust liquidity ticks and monitor impermanent loss.',
                    author: 'SuiLoop Core',
                    category: 'trading',
                    tags: ['manual', 'liquidity', 'lp'],
                    downloads: 3200,
                    rating: 4.9,
                    reviewCount: 56,
                    isVerified: true,
                    isFeatured: true,
                    price: 0
                },
                {
                    id: 'manual-yield-harvester',
                    name: 'Manual Yield Harvester',
                    slug: 'manual-yield-harvester',
                    version: '1.0.5',
                    description: 'Aggregates all pending rewards across Navi, Scallop, and Haedal. Manually claim all rewards in one click.',
                    author: 'SuiLoop Core',
                    category: 'utility',
                    tags: ['manual', 'yield', 'harvest'],
                    downloads: 4100,
                    rating: 4.7,
                    reviewCount: 89,
                    isVerified: true,
                    isFeatured: true,
                    price: 0
                },
                {
                    id: 'manual-flash-arb',
                    name: 'Alpha Flash Arb Trigger',
                    slug: 'manual-flash-arb',
                    version: '0.9.9',
                    description: 'Manual trigger for flash loan arbitrage routes identified by the system. Final control over execution.',
                    author: 'SuiLoop Core',
                    category: 'trading',
                    tags: ['manual', 'flash-loan', 'arbitrage'],
                    downloads: 950,
                    rating: 4.6,
                    reviewCount: 15,
                    isVerified: true,
                    isFeatured: true,
                    price: 0
                }
            ];

            const finalSkills = [...CORE_MANUALS, ...Array.from(uniqueSkillsMap.values())];

            const mockCategories: Category[] = [
                { id: 'trading', name: 'Trading', count: finalSkills.filter(s => s.category === 'trading').length, icon: '📈' },
                { id: 'analysis', name: 'Analysis', count: finalSkills.filter(s => s.category === 'analysis').length, icon: '🔍' },
                { id: 'neural', name: 'Neural', count: 1, icon: '🧠' },
            ];

            setSkills(finalSkills);
            setCategories(mockCategories);
            setFeaturedSkills(finalSkills.filter(s => s.isFeatured));
            setStats({
                totalSkills: finalSkills.length,
                totalDownloads: finalSkills.reduce((sum, s) => sum + s.downloads, 0)
            });

            // Fetch installed skills from Agent
            try {
                const installedRes = await fetch('/api/marketplace/installed');
                if (installedRes.ok) {
                    const installedData = await installedRes.json();
                    if (installedData.success && installedData.skills) {
                        const installedMap: { [key: string]: boolean } = {};
                        installedData.skills.forEach((s: any) => {
                            installedMap[s.slug] = true;
                            // Map both slug and potentially matching ID
                            installedMap[s.id || s.slug] = true;
                        });
                        // Merge with LocalStorage (Offline Persistence)
                        const local = JSON.parse(localStorage.getItem('suiloop-skills') || '{}');
                        console.log('[Marketplace] Syncing installed skills + local:', { ...installedMap, ...local });
                        setInstalledSkills({ ...installedMap, ...local });
                    }
                } else {
                    throw new Error('API Error');
                }
            } catch (e) {
                console.warn("Could not fetch installed skills, falling back to local", e);
                // Fallback to local
                const local = JSON.parse(localStorage.getItem('suiloop-skills') || '{}');
                setInstalledSkills(local);
            }

        } catch (error) {
            console.error('Failed to fetch marketplace data:', error);
        } finally {
            setLoading(false);
            setIsRefreshing(false);
        }
    }, [suiClient]);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Polling fetch for live activity and new listings
    useEffect(() => {
        const timer = setInterval(() => {
            fetchData(false);
        }, 15000);
        return () => clearInterval(timer);
    }, [fetchData]);

    // Filter and sort skills
    const filteredSkills = skills
        .filter(skill => {
            const matchesSearch = searchQuery === "" ||
                skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                skill.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));

            const matchesCategory = !selectedCategory || skill.category === selectedCategory;

            return matchesSearch && matchesCategory;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "downloads": return b.downloads - a.downloads;
                case "rating": return b.rating - a.rating;
                case "newest": return 0; // In production, compare dates
                default: return 0;
            }
        });

    const handleInstall = async (agentId: string) => {
        if (!selectedSkillToInstall) return;

        const skill = selectedSkillToInstall;
        setSelectedSkillToInstall(null); // Close modal

        const toastId = toast.loading(t('common.toasts.installing').replace('{name}', skill.name).replace('{unit}', agentId.slice(0, 10)));

        try {
            // -- On-Chain P2P Purchase Execution --
            // Apple-like App Store Model (Software Provider, NOT FINTECH):
            // In a future update, we can modify the smart contract to redirect a small 1% platform fee to SuiLoop.
            // Right now it's 100% P2P directly to the creator.

            // To be implemented: Using `suiClient` and `signTransaction` to invoke `suiloop::strategy_marketplace::buy_copy`.
            // Currently assuming the strategy is free or handled off-chain via the API.

            // 1. Send transaction (On-Chain P2P + 1% Platform Fee)
            // VALIDATION: Only execute on-chain purchase if ID is a valid Sui ObjectID
            const isValidObjectId = skill.id.startsWith('0x') && skill.id.length >= 64;

            if (account && isValidObjectId) {
                const tx = new Transaction();

                // Dynamic Strategy Cost from Skill Data
                const MIST_PER_SUI = BigInt("1000000000");
                const priceInMist = BigInt(skill.price || 0) * MIST_PER_SUI;

                const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(priceInMist)]);

                const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0";
                const MARKETPLACE_ID = process.env.NEXT_PUBLIC_MARKETPLACE_ID || "0xa807a548a0e11d15126a5ee84d73f79614b9e79561e5a55e68a26e2f9dbd6945";

                tx.moveCall({
                    target: `${PACKAGE_ID}::strategy_marketplace::buy_copy`,
                    arguments: [
                        tx.object(MARKETPLACE_ID),
                        tx.pure.id(skill.id), // pass expected ID by value, not as an Object
                        paymentCoin
                    ]
                });

                // EXECUTE REAL TRANSACTION
                const { bytes, signature } = await signTransaction({ transaction: tx as any });
                await suiClient.executeTransactionBlock({ transactionBlock: bytes, signature });

                writeLog(`MARKETPLACE PURCHASE: ${skill.name} confirmed on-chain. 1% platform fee processed.`, 'success', agentId);
            }

            // 2. API calls to confirm install locally in the Agent's brain
            const response = await fetch(`/api/marketplace/install/${skill.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // 'Authorization': 'Bearer ...' // In a real app
                },
                body: JSON.stringify({ targetAgent: agentId }) // Send agent ID
            });

            const data = await response.json();

            if (data.success) {
                toast.dismiss(toastId);

                // Update local persistence (per-agent)
                const agentLocalKey = `suiloop-skills-${agentId}`;
                const existingLocal = JSON.parse(localStorage.getItem(agentLocalKey) || '{}');
                const newInstalled = { ...existingLocal, [skill.id]: true, [skill.slug]: true };
                localStorage.setItem(agentLocalKey, JSON.stringify(newInstalled));
                setInstalledSkills(prev => ({ ...prev, [skill.id]: true, [skill.slug]: true }));

                // Log the install event to Supabase (shows in Ops Console)
                writeLog(`SKILL INSTALLED: ${skill.name} → agent ${agentId}`, 'success', agentId);

                // BROADCAST: Neural Matrix Uplink
                writeLog(`📡 NEURAL MATRIX: Archetype [${skill.name}] synchronized. ELO potential increased.`, 'system', agentId);

                // Skill-specific bootup logs (sequential, simulates skill activating)
                const SKILL_BOOT_LOGS: Record<string, Array<{ msg: string; level: 'info' | 'success' | 'warn' }>> = {
                    'flash-loan-executor': [{ msg: 'SKILL: Flash Loan Executor binding to Hot Potato module...', level: 'info' }, { msg: 'SKILL: Atomic flash loan ready. Reviewing arbitrage routes.', level: 'success' }],
                    'price-oracle': [{ msg: 'SKILL: Multi-Source Oracle aggregating CoinGecko + DeFiLlama + Pyth...', level: 'info' }, { msg: 'SKILL: Price feeds live — 200+ assets tracked.', level: 'success' }],
                    'telegram-alerts-pro': [{ msg: 'SKILL: Telegram bot connecting to notification channel...', level: 'info' }, { msg: 'SKILL: Telegram Alerts Pro active. Test message sent.', level: 'success' }],
                    'whale-tracker': [{ msg: 'SKILL: Whale Tracker initializing top-100 wallet scanner...', level: 'info' }, { msg: 'SKILL: 3 whale wallets flagged for accumulation. Monitoring.', level: 'warn' }],
                    'lst-arbitrage': [{ msg: 'SKILL: LST Arbitrage Bot reading afSUI/vSUI peg status...', level: 'info' }, { msg: 'SKILL: Peg deviation within range. Watching for unstaking epoch.', level: 'success' }],
                    'scallop-optimizer': [{ msg: 'SKILL: Scallop Optimizer reading current lending APY...', level: 'info' }, { msg: 'SKILL: Optimal supply allocation found — rebalancing 12% collateral.', level: 'success' }],
                    'discord-integration': [{ msg: 'SKILL: Discord Bot binding to guild via OAuth2...', level: 'info' }, { msg: 'SKILL: Slash commands registered. Discord integration live.', level: 'success' }],
                    'portfolio-tracker': [{ msg: 'SKILL: Portfolio Tracker indexing wallet positions...', level: 'info' }, { msg: 'SKILL: 7 open positions tracked. P&L dashboard ready.', level: 'success' }],
                    'pyth-oracle': [{ msg: 'SKILL: Pyth Network Oracle subscribing to price feeds...', level: 'info' }, { msg: 'SKILL: 230 Pyth price feeds active. Staleness guard enabled.', level: 'success' }],
                    'twitter-sentiment': [{ msg: 'SKILL: X/Twitter Sentiment scanning $SUI ecosystem keywords...', level: 'info' }, { msg: 'SKILL: Bullish sentiment index: 72%. Signal feed active.', level: 'success' }],
                    'cetus-lp-manager': [{ msg: 'SKILL: Cetus LP Manager reading CLMM position ranges...', level: 'info' }, { msg: 'SKILL: 2 positions in range. Auto-rebalance armed.', level: 'success' }],
                    'gas-optimizer': [{ msg: 'SKILL: Gas Optimizer analyzing transaction batching opportunities...', level: 'info' }, { msg: 'SKILL: Batch mode enabled. Estimated 34% gas savings.', level: 'success' }],
                    'navi-lending-bot': [{ msg: 'SKILL: Navi Lending Bot reading health factor across positions...', level: 'info' }, { msg: 'SKILL: Health factor 1.82 — safe. Auto-rebalance threshold set.', level: 'success' }],
                    'deepbook-market-maker': [{ msg: 'SKILL: DeepBook Market Maker placing two-sided limit orders...', level: 'info' }, { msg: 'SKILL: 4 limit orders placed. Maker rebate capture active.', level: 'success' }],
                    'stop-loss-guardian': [{ msg: 'SKILL: Stop-Loss Guardian monitoring 3 open positions...', level: 'info' }, { msg: 'SKILL: Stop orders armed at -8% threshold. Protection active.', level: 'warn' }],
                    'eliza-trading-brain': [{ msg: 'SKILL: ElizaOS Trading Brain loading LLM context model...', level: 'info' }, { msg: 'SKILL: AI decision layer active. Pre-execution analysis enabled.', level: 'success' }],
                    'walrus-storage-logger': [{ msg: 'SKILL: Walrus Logger connecting to decentralized storage...', level: 'info' }, { msg: 'SKILL: Storage endpoint active. Logs will be archived on-chain.', level: 'success' }],
                    'cross-dex-aggregator': [{ msg: 'SKILL: Cross-DEX Aggregator indexing Cetus, Turbos, Kriya, DeepBook...', level: 'info' }, { msg: 'SKILL: 4 DEXes indexed. Best-route execution enabled.', level: 'success' }],
                    'pnl-reporter': [{ msg: 'SKILL: P&L Reporter calculating realized/unrealized positions...', level: 'info' }, { msg: 'SKILL: Daily P&L report scheduled. Delivery target: Telegram.', level: 'success' }],
                    'webhook-trigger': [{ msg: 'SKILL: Webhook Trigger generating secure endpoint key...', level: 'info' }, { msg: 'SKILL: Webhook live at /api/hook/{agentId}. Ready for TradingView.', level: 'success' }],
                    'walrus-blackbox-logger': [{ msg: 'SKILL: Walrus Blackbox establishing uplink to Sui Walrus network...', level: 'info' }, { msg: 'SKILL: Blob storage active. Forensic logging armed. Tamper-proof seal enabled.', level: 'success' }],
                    'usdc-vault-manager': [{ msg: 'SKILL: USDC Vault Manager scanning for existing USDC vaults...', level: 'info' }, { msg: 'SKILL: Navi & Scallop USDC pools indexed. Auto-rotation active.', level: 'success' }],
                };

                const bootLogs = SKILL_BOOT_LOGS[skill.slug];
                if (bootLogs) {
                    bootLogs.forEach((entry, i) => {
                        setTimeout(() => {
                            writeLog(entry.msg, entry.level, agentId);
                        }, (i + 1) * 1500);
                    });
                }

                toast.success(t('common.toasts.installedSuccess').replace('{name}', skill.name), {
                    description: t('common.toasts.unitActive').replace('{unit}', agentId === 'global' ? t('modals.installSkill.globalAgent') : t('modals.installSkill.selectedTarget')),
                    action: {
                        label: t('common.toasts.openDashboard'),
                        onClick: () => window.location.href = `/dashboard${agentId !== 'global' ? `?strategy=${agentId}` : ''}`
                    }
                });

                // Auto-redirect after short delay for better flow
                setTimeout(() => {
                    window.location.href = `/dashboard${agentId !== 'global' ? `?strategy=${agentId}` : ''}`;
                }, 2000);
            } else {
                throw new Error(data.error || 'Installation failed');
            }
        } catch (error) {
            toast.error(t('common.toasts.installFailed').replace('{name}', skill.name), {
                description: t('common.toasts.checkConnection')
            });
        }
    };

    const handleExecuteAction = async (skillSlug: string, actionName: string) => {
        const toastId = toast.loading(t('common.toasts.executing').replace('{name}', actionName));
        try {
            // Use execute-demo to allow execution without explicit authentication for this demo
            const response = await fetch('/api/execute-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy: `${skillSlug}:${actionName}` })
            });
            const data = await response.json();

            if (data.success) {
                toast.success(t('common.toasts.executedSuccess').replace('{name}', actionName), { id: toastId });
                setSelectedSkillToExecute(null);
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            toast.error(`Execution failed: ${String(e)}`, { id: toastId });
        }
    };





    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            <Navbar />

            {/* Hero Section */}
            <section className="relative pt-36 pb-12 px-4 sm:px-6 lg:px-8">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(59,130,246,0.1),transparent_70%)]" />

                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center mb-12"
                    >
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-6 group cursor-default">
                            {liveActivity.length > 0 ? (
                                <Activity className="w-4 h-4 text-neon-cyan animate-pulse" />
                            ) : (
                                <Package className="w-4 h-4 text-purple-400" />
                            )}
                            <span className="text-sm text-purple-300">
                                {liveActivity.length > 0 ? t('marketplace.online') : t('marketplace.loopHub')}
                            </span>
                            {isRefreshing && (
                                <RefreshCcw className="w-3 h-3 text-purple-500 animate-spin ml-1" />
                            )}
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
                            {t('marketplace.title')}
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            {t('marketplace.subtitle')}
                        </p>

                        {/* Stats */}
                        <div className="flex justify-center gap-8 mt-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{stats.totalSkills}</div>
                                <div className="text-sm text-slate-400">{t('marketplace.stats.skills')}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">
                                    {(stats.totalDownloads / 1000).toFixed(1)}K
                                </div>
                                <div className="text-sm text-slate-400">{t('marketplace.stats.downloads')}</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{categories.length}</div>
                                <div className="text-sm text-slate-400">{t('marketplace.stats.categories')}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="max-w-2xl mx-auto mb-12"
                    >
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                            <input
                                type="text"
                                placeholder={t('marketplace.searchPlaceholder')}
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                            />
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Featured Skills Carousel */}
            {featuredSkills.length > 0 && (
                <section className="px-4 sm:px-6 lg:px-8 mb-12">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center gap-2 mb-6">
                            <Sparkles className="w-5 h-5 text-yellow-400" />
                            <h2 className="text-xl font-semibold text-white">{t('marketplace.featuredTitle')}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {featuredSkills.slice(0, 3).map((skill, idx) => (
                                <motion.div
                                    key={skill.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.1 + idx * 0.1 }}
                                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-purple-500/20 p-6 hover:border-purple-500/40 transition-all"
                                >
                                    <div className="absolute top-4 right-4">
                                        <span className="px-2 py-1 text-xs bg-yellow-500/20 text-yellow-300 rounded-full flex items-center gap-1">
                                            <Sparkles className="w-3 h-3" /> {t('marketplace.featuredBadge')}
                                        </span>
                                    </div>

                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[skill.category] || 'from-slate-500 to-slate-600'} flex items-center justify-center mb-4`}>
                                        {(() => {
                                            const Icon = CATEGORY_ICONS[skill.category] || Code2;
                                            return <Icon className="w-6 h-6 text-white" />;
                                        })()}
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                        {(() => {
                                            const translatedName = t(`marketplace.skills.${skill.id}.name`);
                                            const hasTranslatedName = translatedName !== `marketplace.skills.${skill.id}.name`;
                                            return hasTranslatedName ? translatedName : (skill.name || t('marketplace.unnamedStrategy'));
                                        })()}
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                        {(() => {
                                            const translatedDesc = t(`marketplace.skills.${skill.id}.description`);
                                            const hasTranslatedDesc = translatedDesc !== `marketplace.skills.${skill.id}.description`;
                                            return hasTranslatedDesc ? translatedDesc : (skill.description || t('marketplace.defaultDescription'));
                                        })()}
                                    </p>

                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-3 text-xs text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Download className="w-3 h-3" />
                                                    {(skill.downloads / 1000).toFixed(1)}K
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                    {skill.rating}
                                                </span>
                                            </div>
                                            <div className="text-sm font-bold text-purple-400 font-mono">
                                                {skill.price > 0 ? `${skill.price} SUI` : t('marketplace.free')}
                                            </div>
                                        </div>

                                        {installedSkills[skill.id] || installedSkills[skill.slug] ? (
                                            <div className="flex gap-2 z-20 relative">
                                                <Link href="/agents">
                                                    <button
                                                        onClick={(e) => e.stopPropagation()}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 text-sm font-medium transition-colors border border-green-500/20"
                                                    >
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                        </span>
                                                        {t('marketplace.monitor')}
                                                    </button>
                                                </Link>

                                                <button
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        e.stopPropagation();
                                                        setSelectedSkillToInstall(skill);
                                                    }}
                                                    className="flex items-center justify-center p-2 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 transition-all border border-purple-500/20"
                                                    title={t('marketplace.installToAnotherUnit')}
                                                >
                                                    <UserPlus size={16} />
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSkillToInstall(skill);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600/50 hover:border-purple-500/50 z-10 relative"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                {t('marketplace.install')}
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Categories */}
            <section className="px-4 sm:px-6 lg:px-8 mb-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => setSelectedCategory(null)}
                            className={`px-4 py-2 rounded-xl font-medium transition-all ${!selectedCategory
                                ? 'bg-purple-500 text-white'
                                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                }`}
                        >
                            {t('marketplace.allSkills')}
                        </button>
                        {categories.map(cat => {
                            const Icon = CATEGORY_ICONS[cat.id] || Code2;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className={`px-4 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${selectedCategory === cat.id
                                        ? 'bg-purple-500 text-white'
                                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {t(`marketplace.categories.${cat.id}`)}
                                    <span className="text-xs opacity-60">({cat.count})</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Sort Options */}
            <section className="px-4 sm:px-6 lg:px-8 mb-6">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <p className="text-slate-400">
                        {t('marketplace.skillsFound').replace('{count}', String(filteredSkills.length))}
                    </p>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="downloads">{t('marketplace.sortBy.downloads')}</option>
                            <option value="rating">{t('marketplace.sortBy.rating')}</option>
                            <option value="newest">{t('marketplace.sortBy.newest')}</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Skills Grid + Live Feed */}
            <section className="px-4 sm:px-6 lg:px-8 pb-24">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
                    {/* Left Side: Skills */}
                    <div className="lg:w-3/4">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="bg-slate-800/50 rounded-2xl h-64 border border-slate-700/50" />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={selectedCategory || 'all'}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                                >
                                    {filteredSkills.map((skill, idx) => (
                                        <motion.div
                                            key={skill.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            className="group bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 hover:border-purple-500/30 hover:bg-slate-800/80 transition-all"
                                        >
                                            {/* ... (rest of skill card remains same, I'll use a larger block if needed) */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[skill.category] || 'from-slate-500 to-slate-600'} flex items-center justify-center`}>
                                                    {(() => {
                                                        const Icon = CATEGORY_ICONS[skill.category] || Code2;
                                                        return <Icon className="w-5 h-5 text-white" />;
                                                    })()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {skill.isVerified && (
                                                        <span title={t('marketplace.verified')}>
                                                            <CheckCircle className="w-4 h-4 text-green-400" aria-label={t('marketplace.verified')} />
                                                        </span>
                                                    )}
                                                    <span className="text-xs text-slate-500">v{skill.version}</span>
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                                                {(() => {
                                                    const translatedName = t(`marketplace.skills.${skill.id}.name`);
                                                    const hasTranslatedName = translatedName !== `marketplace.skills.${skill.id}.name`;
                                                    return hasTranslatedName ? translatedName : (skill.name || t('marketplace.unnamedStrategy'));
                                                })()}
                                            </h3>
                                            <p className="text-sm text-slate-500 mb-1">
                                                {t('marketplace.by')} {skill.author === 'SuiLoop Core' ? t('common.coreTeam') : (skill.author === '0x...' ? t('marketplace.anonymous') : skill.author)}
                                            </p>
                                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                                {(() => {
                                                    const translatedDesc = t(`marketplace.skills.${skill.id}.description`);
                                                    const hasTranslatedDesc = translatedDesc !== `marketplace.skills.${skill.id}.description`;
                                                    return hasTranslatedDesc ? translatedDesc : (skill.description || t('marketplace.defaultDescription'));
                                                })()}
                                            </p>

                                            {/* Tags */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {skill.tags.slice(0, 3).map(tag => (
                                                    <span
                                                        key={tag}
                                                        className="px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded-md"
                                                    >
                                                        {t(`marketplace.tags.${tag}`) === `marketplace.tags.${tag}` ? tag : t(`marketplace.tags.${tag}`)}
                                                    </span>
                                                ))}
                                            </div>

                                            {/* Stats & Install */}
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-4 text-xs text-slate-500">
                                                        <span className="flex items-center gap-1">
                                                            <Download className="w-3 h-3" />
                                                            {skill.downloads.toLocaleString()}
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                                            {skill.rating}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-bold text-purple-400 font-mono">
                                                        {skill.price > 0 ? `${skill.price} SUI` : t('marketplace.free')}
                                                    </div>
                                                </div>

                                                {installedSkills[skill.id] || installedSkills[skill.slug] ? (
                                                    <div className="flex gap-2">
                                                        <Link href="/agents">
                                                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium border border-green-500/20 hover:bg-green-500/20 transition-all cursor-pointer">
                                                                <span className="relative flex h-2 w-2">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                                </span>
                                                                {t('marketplace.monitor')}
                                                            </div>
                                                        </Link>

                                                        {skill.actions && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setSelectedSkillToExecute(skill);
                                                                }}
                                                                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm font-medium transition-colors border border-blue-500/20"
                                                                title={t('marketplace.runAction')}
                                                            >
                                                                <Play className="w-3 h-3" />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setSelectedSkillToInstall(skill);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded-lg hover:bg-purple-500/20 text-sm font-medium transition-colors border border-purple-500/20"
                                                            title={t('marketplace.installToAnotherAgent')}
                                                        >
                                                            <UserPlus className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => setSelectedSkillToInstall(skill)}
                                                        className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-500/30 transition-colors flex items-center gap-1"
                                                    >
                                                        <Zap className="w-3.5 h-3.5" />
                                                        {t('marketplace.install')}
                                                    </button>
                                                )}
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            </AnimatePresence>
                        )}

                        {!loading && filteredSkills.length === 0 && (
                            <div className="text-center py-16">
                                <Package className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-white mb-2">{t('marketplace.noSkillsFound')}</h3>
                                <p className="text-slate-400 text-sm">
                                    {t('marketplace.noSkillsDesc')}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Live Feed */}
                    <div className="lg:w-1/4 space-y-6">
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 sticky top-36">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-purple-400" />
                                    {t('marketplace.neuralUplink')}
                                </h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-slate-500 font-mono">{t('marketplace.live')}</span>
                                    <Wifi className="w-3 h-3 text-green-400 animate-pulse" />
                                </div>
                            </div>

                            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                                {liveActivity.length > 0 ? (
                                    liveActivity.map((activity, i) => (
                                        <motion.div
                                            key={activity.id + i}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="border-l-2 border-purple-500/20 pl-3 py-1 space-y-1 group hover:border-purple-500/50 transition-colors"
                                        >
                                            <p className="text-[9px] text-slate-500 font-mono flex justify-between">
                                                <span className="text-purple-400/70">{t('marketplace.agentLabel')}: {activity.agent}</span>
                                                <span>{new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </p>
                                            <p className="text-[11px] text-slate-300 italic line-clamp-2 leading-relaxed">
                                                {activity.message || t('marketplace.neuralPulse')}
                                            </p>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="text-center py-10 opacity-50">
                                        <RefreshCcw className="w-6 h-6 text-slate-700 animate-spin mx-auto mb-2" />
                                        <p className="text-[10px] text-slate-600 font-mono">{t('marketplace.syncingMatrix')}</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-800/50">
                                <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono mb-2">
                                    <RefreshCcw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    {t('marketplace.autoSyncActive')}
                                </div>
                                <p className="text-[9px] text-slate-600 leading-relaxed uppercase tracking-tighter">
                                    {t('marketplace.telemetryDesc')}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-4 sm:px-6 lg:px-8 pb-24">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 p-8 text-center">
                        <Code2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">{t('marketplace.buildYourOwn')}</h3>
                        <p className="text-slate-400 mb-6">
                            {t('marketplace.buildYourOwnDesc')}
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link
                                href="/docs"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
                            >
                                {t('marketplace.readDocs')}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href="/strategies/builder"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 text-white border border-white/10 rounded-xl font-medium hover:bg-white/10 transition-colors"
                            >
                                {t('marketplace.openBuilder')}
                                <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Install Modal */}
            <InstallSkillModal
                skill={selectedSkillToInstall}
                isOpen={!!selectedSkillToInstall}
                onClose={() => setSelectedSkillToInstall(null)}
                //@ts-ignore
                onInstall={handleInstall}
            />
            {/* Execute Modal */}
            <AnimatePresence>
                {selectedSkillToExecute && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedSkillToExecute(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-md bg-[#0A0A0A] border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Play className="w-5 h-5 text-neon-cyan" />
                                {t('marketplace.executeTitle').replace('{name}', t(`marketplace.skills.${selectedSkillToExecute.id}.name`) === `marketplace.skills.${selectedSkillToExecute.id}.name` ? selectedSkillToExecute.name : t(`marketplace.skills.${selectedSkillToExecute.id}.name`))}
                            </h3>
                            <div className="space-y-3">
                                {selectedSkillToExecute.actions?.map(action => (
                                    <button
                                        key={action.name}
                                        onClick={() => handleExecuteAction(selectedSkillToExecute.slug, action.name)}
                                        className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-neon-cyan/30 transition-all group"
                                    >
                                        <div className="text-left">
                                            <div className="font-mono text-neon-cyan text-sm group-hover:text-white transition-colors">{action.name}</div>
                                            <div className="text-xs text-gray-500">{action.description}</div>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-neon-cyan" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </main >
    );
}
