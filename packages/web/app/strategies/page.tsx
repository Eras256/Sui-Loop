"use client";

import Navbar from "@/components/layout/Navbar";
import { Copy, ArrowRight, Zap, TrendingUp, ShieldAlert, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

const strategies = [
    {
        id: "sui-usdc-loop",
        name: "SUI/USDC Kinetic Loop",
        description: "High-frequency triangular arbitrage between DeepBook, Cetus, and Turbos. Executes only when spread > 0.4%.",
        apy: "14.2%",
        risk: "Low",
        tvl: "$1.2M",
        tags: ["Stable", "Blue Chip"],
        color: "from-blue-500 to-cyan-500"
    },
    {
        id: "turbo-sniper",
        name: "Meme Volatility Sniper",
        description: "Monitors creating pools for high-velocity meme tokens. Enters and exits within the same block.",
        apy: "420.69%",
        risk: "High",
        tvl: "$450K",
        tags: ["Degen", "High Yield"],
        color: "from-purple-500 to-pink-500"
    },
    {
        id: "liquid-staking-arb",
        name: "LST Peg Restoration",
        description: "Arbitrages de-pegged afSUI/vSUI against native SUI during unstaking epochs.",
        apy: "8.5%",
        risk: "Very Low",
        tvl: "$2.8M",
        tags: ["Safe", "Institutional"],
        color: "from-green-500 to-emerald-500"
    }
];

export default function StrategiesPage() {
    const [deployingId, setDeployingId] = useState<string | null>(null);

    const handleDeploy = async (strategy: typeof strategies[0]) => {
        setDeployingId(strategy.id);
        const toastId = toast.loading(`Deploying ${strategy.name}...`);

        try {
            await new Promise(r => setTimeout(r, 1000)); // Fake delay for UX

            const res = await fetch('http://localhost:3001/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    strategy: strategy.name,
                    params: { risk: strategy.risk }
                })
            });

            if (!res.ok) throw new Error("Agent unreachable");

            const data = await res.json();

            if (data.success) {
                toast.success(`Agent Deployed: ${strategy.name}`, { id: toastId });
            } else {
                toast.error(`Deployment Failed: ${data.error}`, { id: toastId });
            }
        } catch (err) {
            console.error(err);
            toast.error("Failed to connect to Agent Node", {
                id: toastId,
                description: "Is the agent running? (pnpm serve)"
            });
        } finally {
            setDeployingId(null);
        }
    };

    return (
        <main className="min-h-screen relative overflow-x-hidden flex flex-col pt-32 pb-20">
            {/* Background elements */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px] opacity-50"></div>
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[120px] opacity-50"></div>
            </div>

            <Navbar />

            <div className="max-w-7xl mx-auto px-6 w-full relative z-10">

                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
                        STRATEGY <span className="text-gradient">MARKETPLACE</span>
                    </h1>
                    <p className="text-gray-400 max-w-2xl text-lg">
                        Clone institutional-grade agent/kernels. Deploy them with one click to run on your own local ElizaOS runtime.
                    </p>
                </div>

                {/* Strategies Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {strategies.map((strat, i) => (
                        <motion.div
                            key={strat.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            whileHover={{ y: -5 }}
                            className="glass-panel p-6 rounded-2xl flex flex-col border border-white/5 hover:border-white/20 transition-all group"
                        >
                            <div className={`h-32 w-full rounded-xl bg-gradient-to-br ${strat.color} mb-6 relative overflow-hidden`}>
                                <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Cpu size={48} className="text-white opacity-90 drop-shadow-lg" />
                                </div>
                                <div className="absolute top-2 right-2 bg-black/40 backdrop-blur-md px-2 py-1 rounded text-xs font-mono border border-white/10">
                                    v3.0.1
                                </div>
                            </div>

                            <div className="flex justify-between items-start mb-2">
                                <h3 className="text-xl font-bold tracking-tight">{strat.name}</h3>
                                <div className={`text-xs px-2 py-1 rounded font-bold ${strat.risk === 'High' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {strat.risk} Risk
                                </div>
                            </div>

                            <p className="text-sm text-gray-400 mb-6 flex-1 leading-relaxed">
                                {strat.description}
                            </p>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Target APY</div>
                                    <div className="text-xl font-mono text-neon-cyan">{strat.apy}</div>
                                </div>
                                <div className="bg-white/5 rounded-lg p-3">
                                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">TVL</div>
                                    <div className="text-xl font-mono text-white">{strat.tvl}</div>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <button className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-white/10">
                                    <Copy size={16} /> Simulate
                                </button>
                                <button
                                    onClick={() => handleDeploy(strat)}
                                    disabled={deployingId === strat.id}
                                    className="flex-1 bg-neon-cyan text-black py-3 rounded-lg text-sm font-bold hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                    {deployingId === strat.id ? (
                                        <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <>Deploy <ArrowRight size={16} /></>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    ))}

                    {/* "Create New" Card */}
                    <Link href="/strategies/builder" className="border border-dashed border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-4 hover:bg-white/5 transition-all text-gray-500 hover:text-white cursor-pointer min-h-[400px]">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-2">
                            <Zap size={32} />
                        </div>
                        <h3 className="text-xl font-bold">Build Custom Strategy</h3>
                        <p className="text-sm max-w-xs">Use our Drag-and-Drop builder to create custom logic for the ElizaOS runtime.</p>
                    </Link>
                </div>
            </div>
        </main>
    )
}
