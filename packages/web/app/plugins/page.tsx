"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import {
    Cpu,
    Search,
    Twitter,
    Globe,
    Zap,
    CheckCircle2,
    Download,
    Shield,
    Terminal,
    BrainCircuit,
    UserPlus
} from "lucide-react";
import Link from "next/link";
import InstallSkillModal from "@/components/marketplace/InstallSkillModal";
import { toast } from "sonner";
import { useCurrentAccount } from "@mysten/dapp-kit";

// Core Plugins Definition
const CORE_PLUGINS = [
    {
        id: "sui-deep-research",
        slug: "sui-deep-research",
        name: "Sui Deep Research",
        description: "Autonomous web scraping and analysis engine. Reads whitepapers, news, and protocol docs to inform decisions.",
        icon: Globe,
        color: "from-blue-500 to-cyan-400",
        category: "Intelligence",
        features: ["Autonomous Browsing", "Verified Info", "Doc Parsing"],
        version: "0.0.7",
        author: "SuiLoop Core",
        tags: ["research", "web", "analysis"]
    },
    {
        id: "social-sentiment",
        slug: "social-sentiment",
        name: "Social Sentiment",
        description: "Listen to the pulse of the market. Monitors Twitter/X for bullish/bearish trends and social volume spikes.",
        icon: Twitter,
        color: "from-sky-400 to-blue-600",
        category: "SocialOps",
        features: ["Sentiment Scoring", "Trend Detection", "Hype Cycle Analysis"],
        version: "0.0.7",
        author: "SuiLoop Core",
        tags: ["social", "sentiment", "twitter"]
    },
    {
        id: "knowledge-graph",
        slug: "knowledge-graph",
        name: "Knowledge Graph",
        description: "Universal search engine and context builder. Understands 'why' the market is moving by querying real-world data.",
        icon: BrainCircuit,
        color: "from-violet-500 to-purple-600",
        category: "Cognition",
        features: ["Contextual Search", "Market Explanations", "Tavily Integration"],
        version: "0.0.7",
        author: "SuiLoop Core",
        tags: ["knowledge", "search", "graph"]
    }
];

export default function PluginsPage() {
    const [selectedPlugin, setSelectedPlugin] = useState<any>(null);
    const [installedSkills, setInstalledSkills] = useState<Record<string, boolean>>({});
    const [isInstalling, setIsInstalling] = useState(false);
    const account = useCurrentAccount();

    const fetchInstalledStatus = async () => {
        try {
            const response = await fetch('/api/marketplace/installed');
            const data = await response.json();
            if (data.success) {
                const map: Record<string, boolean> = {};
                data.skills.forEach((s: any) => {
                    map[s.slug] = true;
                });
                setInstalledSkills(map);
            }
        } catch (error) {
            console.error('Failed to fetch installed status:', error);
        }
    };

    const handleInstall = async (agentId: string) => {
        if (!selectedPlugin) return;

        setIsInstalling(true);
        const toastId = toast.loading(`Installing ${selectedPlugin.name}...`);

        try {
            // Use relative path to leverage Next.js rewrites (prevents CORS/port issues)
            const response = await fetch(`/api/marketplace/install/${selectedPlugin.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('suiloop-token') || ''}`
                },
                body: JSON.stringify({ targetAgent: agentId })
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to install plugin');
            }

            toast.success(`${selectedPlugin.name} installed successfully!`, {
                id: toastId,
                description: "The neural extension is now active. Intelligence logs are available in the console.",
                action: {
                    label: "View Logs",
                    onClick: () => window.location.href = "/dashboard"
                }
            });

            // Close modal after success
            setSelectedPlugin(null);
            fetchInstalledStatus();
        } catch (error: any) {
            console.error('Failed to install plugin:', error);
            toast.error(error.message || 'Installation failed', { id: toastId });
        } finally {
            setIsInstalling(false);
        }
    };

    useEffect(() => {
        fetchInstalledStatus();
    }, []);

    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-neon-cyan/30">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-neon-purple/5 to-transparent opacity-40" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-neon-cyan/5 blur-[150px] rounded-full" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('/grid.svg')] bg-repeat opacity-[0.03]" />
            </div>

            <div className="relative z-10 pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">

                    {/* Header */}
                    <div className="text-center mb-16 section-lift">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="inline-flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-neon-cyan text-xs font-mono mb-6"
                        >
                            <Cpu size={14} />
                            CORE NEURAL EXTENSIONS
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-4xl md:text-6xl font-black tracking-tighter mb-6"
                        >
                            <span className="text-white">LOOP</span> <span className="text-gradient">PLUGINS</span>
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed"
                        >
                            Upgrade your agents with advanced cognitive capabilities. <br />
                            Seamlessly integrate web browsing, social sentiment, and global knowledge.
                        </motion.p>
                    </div>

                    {/* Plugins Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {CORE_PLUGINS.map((plugin, idx) => (
                            <motion.div
                                key={plugin.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (idx * 0.1) }}
                                className="group relative"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/20 to-neon-cyan/20 rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                <div className="relative h-full glass-panel p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all flex flex-col">
                                    {/* Icon */}
                                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${plugin.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        <plugin.icon size={32} className="text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-mono text-neon-cyan tracking-wider uppercase border border-neon-cyan/20 px-2 py-1 rounded bg-neon-cyan/5">
                                                {plugin.category}
                                            </span>
                                            <span className="text-xs text-gray-500 font-mono">v{plugin.version}</span>
                                        </div>

                                        <h3 className="text-2xl font-bold mb-3 group-hover:text-white transition-colors">
                                            {plugin.name}
                                        </h3>

                                        <p className="text-gray-400 leading-relaxed mb-6 text-sm">
                                            {plugin.description}
                                        </p>

                                        {/* Features */}
                                        <ul className="space-y-2 mb-8">
                                            {plugin.features.map((feature, i) => (
                                                <li key={i} className="flex items-center gap-2 text-sm text-gray-300">
                                                    <CheckCircle2 size={14} className="text-green-400 shrink-0" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Action */}
                                    {installedSkills[plugin.slug] ? (
                                        <div className="flex gap-2">
                                            <Link href="/dashboard" className="flex-1">
                                                <button className="w-full py-4 rounded-xl bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 transition-all flex items-center justify-center gap-2 font-bold">
                                                    <span className="relative flex h-2 w-2">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                                    </span>
                                                    Monitor
                                                </button>
                                            </Link>
                                            <button
                                                onClick={() => setSelectedPlugin(plugin)}
                                                className="px-6 py-4 rounded-xl bg-neon-cyan/10 hover:bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/20 transition-all flex items-center justify-center"
                                                title="Install to another agent"
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedPlugin(plugin)}
                                            className="w-full py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 group-hover:bg-neon-cyan group-hover:text-black group-hover:font-bold"
                                        >
                                            <Download size={18} />
                                            <span>Install Plugin</span>
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Info Section */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className="mt-24 p-8 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-sm"
                    >
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="shrink-0 p-4 bg-black/30 rounded-full border border-white/10">
                                <Shield size={40} className="text-neon-purple" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Verified Core Modules</h3>
                                <p className="text-gray-400">
                                    These plugins are developed and maintained by the SuiLoop Core team. They run in a secure sandbox with restricted permissions and are audited for safety. Unlike community skills, these have direct access to optimized native bindings.
                                </p>
                            </div>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* Install Modal */}
            <InstallSkillModal
                isOpen={!!selectedPlugin}
                onClose={() => !isInstalling && setSelectedPlugin(null)}
                onInstall={handleInstall}
                skill={selectedPlugin}
                isInstalling={isInstalling}
            />
        </main>
    );
}
