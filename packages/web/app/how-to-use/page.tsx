"use client";

import Navbar from "@/components/layout/Navbar";
import {
    BookOpen,
    ChevronRight,
    ArrowRight,
    Zap,
    Shield,
    Cpu,
    Wallet,
    MousePointer2,
    Settings,
    LayoutDashboard,
    Play,
    Terminal,
    CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import Footer from "@/components/layout/Footer";

export default function HowToUsePage() {
    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-neon-cyan/30">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 right-0 w-full h-[600px] bg-gradient-to-b from-neon-cyan/10 to-transparent opacity-50" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-neon-purple/5 blur-[150px] rounded-full" />
            </div>

            <div className="relative z-10 pt-32 pb-20">
                <div className="max-w-5xl mx-auto px-6">
                    {/* Header */}
                    <div className="text-center mb-20 section-lift">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full text-neon-cyan text-xs font-mono mb-6">
                            <BookOpen size={14} />
                            OPERATIONS MANUAL V1.0
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6">
                            HOW TO <span className="text-gradient">OPERATE</span>
                        </h1>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Master the SuiLoop Neural Matrix. From visual strategy architecture to autonomous agent deployment.
                        </p>
                    </div>

                    {/* Step by Step Guide */}
                    <div className="space-y-12">
                        {STEPS.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="glass-panel p-8 rounded-3xl border border-white/10 hover:border-white/20 transition-all group section-lift"
                            >
                                <div className="flex flex-col md:flex-row gap-8">
                                    <div className="shrink-0">
                                        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center text-black shadow-lg group-hover:scale-110 transition-transform`}>
                                            <step.icon size={32} />
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-4">
                                            <span className="text-neon-cyan font-mono text-sm tracking-widest uppercase opacity-50">Step {i + 1}</span>
                                            <h2 className="text-2xl font-bold">{step.title}</h2>
                                        </div>
                                        <p className="text-gray-400 leading-relaxed mb-6">
                                            {step.description}
                                        </p>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            {step.features.map((feature, idx) => (
                                                <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                                                    <CheckCircle2 size={16} className="text-neon-cyan shrink-0" />
                                                    {feature}
                                                </div>
                                            ))}
                                        </div>

                                        {step.actionLabel && (
                                            <Link
                                                href={step.actionHref}
                                                className="inline-flex items-center gap-2 mt-8 text-neon-cyan font-bold hover:gap-3 transition-all"
                                            >
                                                {step.actionLabel} <ArrowRight size={18} />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Pro Tips Section */}
                    <div className="mt-32 section-lift">
                        <div className="glass-panel p-12 rounded-3xl border border-neon-purple/20 bg-gradient-to-br from-neon-purple/5 to-transparent relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-10">
                                <Zap size={120} className="text-neon-purple" />
                            </div>

                            <h3 className="text-3xl font-bold mb-8 flex items-center gap-4">
                                <Settings className="text-neon-purple" />
                                ADVANCED PROTOCOLS
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <h4 className="text-white font-bold flex items-center gap-2">
                                        <Cpu size={18} className="text-neon-cyan" />
                                        Agent Reliability
                                    </h4>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        Ensure your browser tab remains active or deploy the companion desktop app for 100% heartbeat uptime. The ElizaOS core works best with constant telemetry.
                                    </p>
                                </div>
                                <div className="space-y-4">
                                    <h4 className="text-white font-bold flex items-center gap-2">
                                        <Shield size={18} className="text-neon-purple" />
                                        Safety Latency
                                    </h4>
                                    <p className="text-sm text-gray-400 leading-relaxed">
                                        While the "Atomic Loop" is near-instant, always verify your drawdown limits in the Architect builder before high-volume deployment.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CTA Footer */}
                    <div className="mt-32 text-center section-lift">
                        <h2 className="text-3xl font-bold mb-8">Ready to initiate the Matrix?</h2>
                        <div className="flex flex-wrap justify-center gap-6">
                            <Link
                                href="/strategies"
                                className="bg-neon-cyan text-black font-bold px-10 py-4 rounded-full hover:shadow-[0_0_30px_rgba(0,243,255,0.4)] transition-all flex items-center gap-2"
                            >
                                <Zap size={20} /> Deploy Now
                            </Link>
                            <Link
                                href="/docs"
                                className="border border-white/10 text-white font-bold px-10 py-4 rounded-full hover:bg-white/5 transition-all"
                            >
                                Technical Specs
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </main>
    );
}

const STEPS = [
    {
        title: "Uplink Wallet",
        description: "Connect your Sui wallet to establish an encrypted session. SuiLoop supports all major Sui wallets with persistent session restoration.",
        icon: Wallet,
        color: "from-blue-400 to-cyan-400",
        features: [
            "Support for Sui Wallet & OKX",
            "Hardware wallet compatible",
            "Auto-restores session",
            "Low-gas optimization"
        ],
        actionLabel: "Connect Now",
        actionHref: "/dashboard"
    },
    {
        title: "Architect Logic",
        description: "Use the Visual Strategy Builder to create your financial kernel. Drag and drop triggers, conditions, and actions without writing a single line of Move code.",
        icon: MousePointer2,
        color: "from-neon-purple to-purple-600",
        features: [
            "Node-based editor",
            "Custom triggers & CRONs",
            "DEX & Lending connectors",
            "Real-time validation"
        ],
        actionLabel: "Open Builder",
        actionHref: "/strategies/builder"
    },
    {
        title: "Select Arsenal",
        description: "Browse the Protocol Arsenal for institutional-grade strategy templates. Clone optimized loops for Arbitrage, Yield Aggregation, and LST Peg Restoration.",
        icon: Zap,
        color: "from-amber-400 to-orange-500",
        features: [
            "Verified templates",
            "Live APY performance",
            "One-click cloning",
            "Risk/Reward metrics"
        ],
        actionLabel: "Browse Arsenal",
        actionHref: "/strategies"
    },
    {
        title: "Deploy Agent",
        description: "Initialize your ElizaOS autonomous agent. Scale your strategies across the Sui Network with mathematical safety guaranteed by the Hot Potato pattern.",
        icon: Cpu,
        color: "from-green-400 to-emerald-500",
        features: [
            "Autonomous execution",
            "Single-block atomicity",
            "Walrus forensic logging",
            "Fail-safe protection"
        ],
        actionLabel: "Command Enclave",
        actionHref: "/dashboard"
    }
];
