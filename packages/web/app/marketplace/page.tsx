"use client";

import Navbar from "@/components/layout/Navbar";
import {
    Download, Star, Search, Filter, TrendingUp, Sparkles,
    CheckCircle, Package, ExternalLink, ChevronRight, Zap,
    Code2, Bell, BarChart3, Database, Link2, Settings, Play, UserPlus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import InstallSkillModal from "@/components/marketplace/InstallSkillModal";

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
    utility: "from-gray-500 to-slate-600"
};

export default function MarketplacePage() {
    const [skills, setSkills] = useState<MarketplaceSkill[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [featuredSkills, setFeaturedSkills] = useState<MarketplaceSkill[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<"downloads" | "rating" | "newest">("downloads");
    const [installedSkills, setInstalledSkills] = useState<{ [key: string]: boolean }>({});
    const [stats, setStats] = useState({ totalSkills: 0, totalDownloads: 0 });
    const [selectedSkillToInstall, setSelectedSkillToInstall] = useState<MarketplaceSkill | null>(null);
    const [selectedSkillToExecute, setSelectedSkillToExecute] = useState<MarketplaceSkill | null>(null);

    // Fetch marketplace data
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // In production, these would be real API calls
                // For now, we'll use mock data

                const mockSkills: MarketplaceSkill[] = [
                    {
                        id: 'flash-loan-executor',
                        name: 'Flash Loan Executor',
                        slug: 'flash-loan-executor',
                        version: '2.1.0',
                        description: 'Execute atomic flash loans using the Hot Potato pattern.',
                        author: 'SuiLoop Team',
                        category: 'trading',
                        tags: ['flash-loan', 'defi', 'atomic'],
                        downloads: 12453,
                        rating: 4.8,
                        reviewCount: 234,
                        isVerified: true,
                        isFeatured: true
                    },
                    {
                        id: 'price-oracle',
                        name: 'Multi-Source Price Oracle',
                        slug: 'price-oracle',
                        version: '1.5.0',
                        description: 'Aggregate prices from CoinGecko, DeFiLlama, Pyth.',
                        author: 'DeFi Labs',
                        category: 'data',
                        tags: ['oracle', 'price', 'data'],
                        downloads: 8932,
                        rating: 4.6,
                        reviewCount: 156,
                        isVerified: true,
                        isFeatured: true
                    },
                    {
                        id: 'telegram-alerts-pro',
                        name: 'Telegram Alerts Pro',
                        slug: 'telegram-alerts-pro',
                        version: '3.0.0',
                        description: 'Advanced Telegram notifications with rich formatting.',
                        author: 'NotifyBot',
                        category: 'notification',
                        tags: ['telegram', 'alerts', 'bot'],
                        downloads: 15678,
                        rating: 4.9,
                        reviewCount: 412,
                        isVerified: true,
                        isFeatured: true
                    },
                    {
                        id: 'whale-tracker',
                        name: 'Whale Tracker',
                        slug: 'whale-tracker',
                        version: '1.2.0',
                        description: 'Track large wallet movements on Sui.',
                        author: 'OnChainInsights',
                        category: 'analysis',
                        tags: ['whale', 'tracking', 'analysis'],
                        downloads: 6234,
                        rating: 4.5,
                        reviewCount: 89,

                        isVerified: true,
                        isFeatured: false,
                        actions: [
                            { name: 'scanWhales', description: 'Trigger manual whale scan' }
                        ]
                    },
                    {
                        id: 'lst-arbitrage',
                        name: 'LST Arbitrage Bot',
                        slug: 'lst-arbitrage',
                        version: '2.0.0',
                        description: 'Automated arbitrage between liquid staking tokens.',
                        author: 'ArbitrageDAO',
                        category: 'trading',
                        tags: ['lst', 'arbitrage', 'automation'],
                        downloads: 4521,
                        rating: 4.4,
                        reviewCount: 67,
                        isVerified: true,
                        isFeatured: false
                    },
                    {
                        id: 'scallop-optimizer',
                        name: 'Scallop Yield Optimizer',
                        slug: 'scallop-optimizer',
                        version: '1.8.0',
                        description: 'Optimize Scallop lending positions for best APY.',
                        author: 'YieldFarm',
                        category: 'trading',
                        tags: ['scallop', 'lending', 'yield'],
                        downloads: 7845,
                        rating: 4.7,
                        reviewCount: 134,
                        isVerified: true,
                        isFeatured: false
                    },
                    {
                        id: 'discord-integration',
                        name: 'Discord Bot Integration',
                        slug: 'discord-integration',
                        version: '2.5.0',
                        description: 'Full Discord integration with slash commands.',
                        author: 'DiscordDevs',
                        category: 'integration',
                        tags: ['discord', 'bot', 'integration'],
                        downloads: 9123,
                        rating: 4.6,
                        reviewCount: 178,
                        isVerified: true,
                        isFeatured: false
                    },
                    {
                        id: 'portfolio-tracker',
                        name: 'Portfolio Tracker',
                        slug: 'portfolio-tracker',
                        version: '1.3.0',
                        description: 'Track DeFi portfolio with P&L analytics.',
                        author: 'PortfolioLabs',
                        category: 'analysis',
                        tags: ['portfolio', 'tracking', 'analytics'],
                        downloads: 5678,
                        rating: 4.3,
                        reviewCount: 92,
                        isVerified: false,
                        isFeatured: false
                    },
                    {
                        id: 'pyth-oracle',
                        name: 'Pyth Network Oracle',
                        slug: 'pyth-oracle',
                        version: '2.1.0',
                        description: 'Pyth Network high-fidelity price feeds for 200+ assets.',
                        author: 'Pyth Contributors',
                        category: 'data',
                        tags: ['pyth', 'oracle', 'price'],
                        downloads: 9876,
                        rating: 4.9,
                        reviewCount: 234,
                        isVerified: true,
                        isFeatured: true
                    },
                    {
                        id: 'twitter-sentiment',
                        name: 'Twitter/X Sentiment Analyzer',
                        slug: 'twitter-sentiment',
                        version: '2.0.0',
                        description: 'Real-time sentiment analysis of crypto Twitter.',
                        author: 'SocialFi',
                        category: 'analysis',
                        tags: ['twitter', 'sentiment', 'ai'],
                        downloads: 8765,
                        rating: 4.6,
                        reviewCount: 145,
                        isVerified: true,
                        isFeatured: true
                    },
                    {
                        id: 'cetus-lp-manager',
                        name: 'Cetus LP Manager',
                        slug: 'cetus-lp-manager',
                        version: '2.0.0',
                        description: 'Manage Cetus CLMM positions with auto-rebalance.',
                        author: 'LPMasters',
                        category: 'trading',
                        tags: ['cetus', 'lp', 'liquidity'],
                        downloads: 6789,
                        rating: 4.5,
                        reviewCount: 112,
                        isVerified: true,
                        isFeatured: false
                    },
                    {
                        id: 'gas-optimizer',
                        name: 'Gas Optimizer',
                        slug: 'gas-optimizer',
                        version: '1.0.0',
                        description: 'Optimize transaction gas costs with batching.',
                        author: 'GasDAO',
                        category: 'utility',
                        tags: ['gas', 'optimization', 'cost'],
                        downloads: 3421,
                        rating: 4.2,
                        reviewCount: 45,
                        isVerified: false,
                        isFeatured: false
                    }
                ];

                const mockCategories: Category[] = [
                    { id: 'trading', name: 'Trading', count: 5, icon: '📈' },
                    { id: 'analysis', name: 'Analysis', count: 3, icon: '🔍' },
                    { id: 'notification', name: 'Notifications', count: 1, icon: '🔔' },
                    { id: 'integration', name: 'Integrations', count: 1, icon: '🔗' },
                    { id: 'data', name: 'Data', count: 2, icon: '📊' },
                    { id: 'utility', name: 'Utilities', count: 1, icon: '🛠️' }
                ];

                setSkills(mockSkills);
                setCategories(mockCategories);
                setFeaturedSkills(mockSkills.filter(s => s.isFeatured));
                setStats({
                    totalSkills: mockSkills.length,
                    totalDownloads: mockSkills.reduce((sum, s) => sum + s.downloads, 0)
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
                            console.log('[Marketplace] Syncing installed skills:', installedMap);
                            setInstalledSkills(installedMap);
                        }
                    }
                } catch (e) {
                    console.warn("Could not fetch installed skills", e);
                }

            } catch (error) {
                console.error('Failed to fetch marketplace data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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

        const toastId = toast.loading(`Installing ${skill.name} to unit ${agentId.slice(0, 10)}...`);

        try {
            // El backend está proxyado en Next.js (rewrites) o accesible directamente
            // Asumimos que /api está configurado correctamente
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
                setInstalledSkills(prev => ({ ...prev, [skill.id]: true }));
                toast.success(`${skill.name} installed successfully!`, {
                    description: "The skill is now available in your agent and ready to use. Check the Ops Unit for logs.",
                    action: {
                        label: "View Logs",
                        onClick: () => window.location.href = "/agents"
                    }
                });
            } else {
                throw new Error(data.error || 'Installation failed');
            }
        } catch (error) {
            toast.error(`Failed to install ${skill.name}`, {
                description: String(error) || "Please try again later or check your connection."
            });
        }
    };

    const handleExecuteAction = async (skillSlug: string, actionName: string) => {
        const toastId = toast.loading(`Executing ${actionName}...`);
        try {
            // Use execute-demo to allow execution without explicit authentication for this demo
            const response = await fetch('/api/execute-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strategy: `${skillSlug}:${actionName}` })
            });
            const data = await response.json();

            if (data.success) {
                toast.success('Action executed successfully', { id: toastId });
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 mb-6">
                            <Package className="w-4 h-4 text-purple-400" />
                            <span className="text-sm text-purple-300">LoopHub Marketplace</span>
                        </div>

                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
                            Extend Your Agent
                        </h1>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
                            Discover and install community-built skills to supercharge your SuiLoop agent.
                        </p>

                        {/* Stats */}
                        <div className="flex justify-center gap-8 mt-8">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{stats.totalSkills}</div>
                                <div className="text-sm text-slate-400">Skills</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">
                                    {(stats.totalDownloads / 1000).toFixed(1)}K
                                </div>
                                <div className="text-sm text-slate-400">Downloads</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-white">{categories.length}</div>
                                <div className="text-sm text-slate-400">Categories</div>
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
                                placeholder="Search skills by name, description, or tag..."
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
                            <h2 className="text-xl font-semibold text-white">Featured Skills</h2>
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
                                            <Sparkles className="w-3 h-3" /> Featured
                                        </span>
                                    </div>

                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${CATEGORY_COLORS[skill.category] || 'from-slate-500 to-slate-600'} flex items-center justify-center mb-4`}>
                                        {(() => {
                                            const Icon = CATEGORY_ICONS[skill.category] || Code2;
                                            return <Icon className="w-6 h-6 text-white" />;
                                        })()}
                                    </div>

                                    <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-purple-300 transition-colors">
                                        {skill.name}
                                    </h3>
                                    <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                        {skill.description}
                                    </p>

                                    <div className="flex items-center justify-between text-sm text-slate-500">
                                        <div className="flex items-center gap-3">
                                            <span className="flex items-center gap-1">
                                                <Download className="w-4 h-4" />
                                                {(skill.downloads / 1000).toFixed(1)}K
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                {skill.rating}
                                            </span>
                                        </div>

                                        {installedSkills[skill.id] ? (
                                            <Link href="/dashboard">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                    }}
                                                    className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg hover:bg-green-500/20 text-sm font-medium transition-colors border border-green-500/20 z-10 relative"
                                                >
                                                    <span className="relative flex h-2 w-2 mr-1">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                    Monitor
                                                </button>
                                            </Link>
                                        ) : (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedSkillToInstall(skill);
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 hover:bg-purple-600 text-white rounded-lg text-sm font-medium transition-colors border border-slate-600/50 hover:border-purple-500/50 z-10 relative"
                                            >
                                                <Zap className="w-3.5 h-3.5" />
                                                Install
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
                            All Skills
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
                                    {cat.name}
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
                        {filteredSkills.length} skills found
                    </p>
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        >
                            <option value="downloads">Most Downloads</option>
                            <option value="rating">Highest Rated</option>
                            <option value="newest">Newest</option>
                        </select>
                    </div>
                </div>
            </section>

            {/* Skills Grid */}
            <section className="px-4 sm:px-6 lg:px-8 pb-24">
                <div className="max-w-7xl mx-auto">
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
                                        <div className="flex items-start justify-between mb-4">
                                            <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${CATEGORY_COLORS[skill.category] || 'from-slate-500 to-slate-600'} flex items-center justify-center`}>
                                                {(() => {
                                                    const Icon = CATEGORY_ICONS[skill.category] || Code2;
                                                    return <Icon className="w-5 h-5 text-white" />;
                                                })()}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {skill.isVerified && (
                                                    <span title="Verified">
                                                        <CheckCircle className="w-4 h-4 text-green-400" aria-label="Verified" />
                                                    </span>
                                                )}
                                                <span className="text-xs text-slate-500">v{skill.version}</span>
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-purple-300 transition-colors">
                                            {skill.name}
                                        </h3>
                                        <p className="text-sm text-slate-500 mb-1">by {skill.author}</p>
                                        <p className="text-sm text-slate-400 mb-4 line-clamp-2">
                                            {skill.description}
                                        </p>

                                        {/* Tags */}
                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {skill.tags.slice(0, 3).map(tag => (
                                                <span
                                                    key={tag}
                                                    className="px-2 py-1 text-xs bg-slate-700/50 text-slate-300 rounded-md"
                                                >
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>

                                        {/* Stats & Install */}
                                        <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                                            <div className="flex items-center gap-4 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Download className="w-4 h-4" />
                                                    {skill.downloads.toLocaleString()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                                    {skill.rating} ({skill.reviewCount})
                                                </span>
                                            </div>

                                            {installedSkills[skill.id] || installedSkills[skill.slug] ? (
                                                <div className="flex gap-2">
                                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-lg text-sm font-medium border border-green-500/20 cursor-default">
                                                        <span className="relative flex h-2 w-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                        </span>
                                                        Active
                                                    </div>

                                                    {skill.actions && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setSelectedSkillToExecute(skill);
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 text-sm font-medium transition-colors border border-blue-500/20"
                                                            title="Run Action"
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
                                                        title="Install to another agent"
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
                                                    Install
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
                            <h3 className="text-xl font-semibold text-white mb-2">No skills found</h3>
                            <p className="text-slate-400">
                                Try adjusting your search or filter criteria.
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* CTA Section */}
            <section className="px-4 sm:px-6 lg:px-8 pb-24">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-2xl border border-purple-500/20 p-8 text-center">
                        <Code2 className="w-12 h-12 text-purple-400 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-white mb-2">Build Your Own Skill</h3>
                        <p className="text-slate-400 mb-6">
                            Create and publish skills for the SuiLoop community.
                            Share your trading strategies, integrations, and automation tools.
                        </p>
                        <Link
                            href="/docs"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-purple-500 text-white rounded-xl font-medium hover:bg-purple-600 transition-colors"
                        >
                            Read the Developer Docs
                            <ChevronRight className="w-4 h-4" />
                        </Link>
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
                                Execute {selectedSkillToExecute.name}
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
