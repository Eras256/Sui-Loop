'use client';

import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Zap, Shield, Cpu, Layers, Terminal as TerminalIcon, Globe, Github, MessageSquare, Activity, ArrowRight, Bot, User, Copy, ChevronRight, Download, Landmark, BookOpen, Database } from "lucide-react";
import { PulsingOrb } from "./components/NeuralOrb";

import Navbar from "@/components/layout/Navbar";

export default function Home() {
    const router = useRouter();
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [agentLog, setAgentLog] = useState<string[]>([]);
    const [pkgManager, setPkgManager] = useState("npm");

    const handleDeploy = () => {
        if (!account) {
            toast.error("Please connect your Sui Wallet first");
            return;
        }

        const toastId = toast.loading("Building Deployment Transaction...");

        try {
            const tx = new Transaction();
            // Create a self-transfer of 1000 MIST (0.000001 SUI) to simulate "Activation Cost"
            const [coin] = tx.splitCoins(tx.gas, [1000]);
            tx.transferObjects([coin], account.address);

            signAndExecuteTransaction(
                {
                    transaction: tx as any,
                },
                {
                    onSuccess: (result) => {
                        toast.dismiss(toastId);
                        toast.success("Agent Activated On-Chain", {
                            description: `Digest: ${result.digest.slice(0, 10)}...`
                        });

                        setTimeout(() => {
                            router.push("/dashboard");
                        }, 2000);
                    },
                    onError: (error) => {
                        toast.dismiss(toastId);
                        toast.error("Transaction Failed", {
                            description: error.message
                        });
                    },
                }
            );
        } catch (e) {
            toast.dismiss(toastId);
            toast.error("Failed to build transaction");
        }
    };

    // Simulation of Agent Thoughts
    useEffect(() => {
        const logs = [
            "Initializing core agent...",
            "Connecting to Sui Devnet...",
            "DeepBook Liquidity: OPTIMAL",
            "Navi Protocol: CONNECTED",
            "Scanning for arb opportunities...",
            "Calculated spread: 0.45%"
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setAgentLog(prev => [...prev, logs[i]]);
                i++;
            }
        }, 1500);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen flex flex-col relative overflow-x-hidden">

            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pt-28 px-4 pb-32">

                {/* Left: Text & Terminal */}
                <div className="flex flex-col justify-center space-y-6 md:space-y-8 z-10 order-2 lg:order-1">
                    <div className="space-y-4 text-center lg:text-left z-20 relative">
                        {/* Mainnet Ready Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-full mb-4 mx-auto lg:mx-0 w-fit">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-green-500 whitespace-nowrap">
                                MAINNET READY
                            </span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                            AUTONOMOUS <br />
                            <span className="text-gradient">TERMINAL</span>
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg max-w-md mx-auto lg:mx-0">
                            The operating system for DeFi on Sui. Aggregating liquidity from Navi, Scallop & DeepBook. Powered by ElizaOS Agents.
                        </p>
                    </div>

                    {/* Glass Terminal */}
                    <div className="glass-panel rounded-xl p-3 md:p-4 font-mono text-sm h-40 md:h-48 overflow-y-auto w-full max-w-lg border-l-4 border-neon-cyan bg-black/40 mx-auto lg:mx-0">
                        <div className="text-xs text-gray-500 mb-2 border-b border-gray-800 pb-1">AGENT_KERNEL_V1 // LIVE FEED</div>
                        {agentLog.map((log, i) => (
                            <div key={i} className="text-neon-cyan/80 mb-1 text-xs md:text-sm">
                                <span className="text-gray-600 mr-2">{">"}</span>
                                {log}
                            </div>
                        ))}
                        <div className="animate-pulse text-neon-purple mt-2">_</div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <button onClick={handleDeploy} className="bg-neon-cyan text-black font-bold px-8 py-3 md:py-4 rounded-lg hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all w-full sm:w-auto text-center flex items-center justify-center text-sm md:text-base cursor-pointer">
                            Deploy Agent
                        </button>
                        <button className="glass-panel px-8 py-3 md:py-4 rounded-lg hover:bg-white/5 transition-all w-full sm:w-auto text-sm md:text-base">
                            View Documentation
                        </button>
                    </div>
                </div>

                {/* Right: 3D Visualization */}
                <div className="h-[300px] md:h-[500px] w-full relative z-0 order-1 lg:order-2">
                    <div className="absolute inset-0 bg-gradient-to-t from-[#030014] to-transparent z-10 pointer-events-none" />
                    <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
                        <ambientLight intensity={0.5} />
                        <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} color="#00f3ff" />
                        <pointLight position={[-10, -10, -10]} intensity={1} color="#bd00ff" />
                        <Suspense fallback={null}>
                            <PulsingOrb />
                            <Environment preset="city" />
                        </Suspense>
                    </Canvas>
                </div>
            </div>

            {/* --- INTEGRATIONS BAR --- */}
            <div className="w-full border-y border-white/5 bg-black/40 backdrop-blur-sm mb-20">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <p className="text-center text-xs font-mono text-gray-500 mb-6 tracking-[0.2em]">POWERED BY PREMIER PROTOCOLS</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Navi */}
                        <div className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform">
                            <Landmark className="text-neon-cyan" size={24} />
                            <span className="text-xl font-bold text-white group-hover:text-neon-cyan transition-colors">NAVI Protocol</span>
                        </div>
                        {/* DeepBook */}
                        <div className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform">
                            <BookOpen className="text-blue-500" size={24} />
                            <span className="text-xl font-bold text-white group-hover:text-blue-500 transition-colors">DeepBook V3</span>
                        </div>
                        {/* Eliza */}
                        <div className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform">
                            <Bot className="text-orange-500" size={24} />
                            <span className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">ElizaOS</span>
                        </div>
                        {/* Cetus */}
                        <div className="flex items-center gap-2 group cursor-pointer hover:scale-105 transition-transform">
                            <Database className="text-teal-400" size={24} />
                            <span className="text-xl font-bold text-white group-hover:text-teal-400 transition-colors">Cetus</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- AUDIENCE SPLITTER --- */}
            <div className="w-full max-w-7xl mx-auto px-4 -mt-20 mb-20 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* For Humans */}
                    <Link href="/dashboard" className="group relative overflow-hidden rounded-2xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-all p-8 flex flex-col justify-between h-[200px] hover:shadow-[0_0_30px_rgba(168,85,247,0.15)] cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-purple/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/5 rounded-lg text-neon-purple">
                                    <User size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">For Humans</h3>
                            </div>
                            <p className="text-gray-400 text-sm max-w-xs">
                                Visual Strategy Builder, Dashboard, and Real-time Analytics. No code required.
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-sm font-bold text-white group-hover:translate-x-1 transition-transform">
                            Launch App <ArrowRight size={16} />
                        </div>
                    </Link>

                    {/* For Agents */}
                    <Link href="/agents" className="group relative overflow-hidden rounded-2xl bg-[#0A0A0A] border border-white/10 hover:border-white/20 transition-all p-8 flex flex-col justify-between h-[200px] hover:shadow-[0_0_30px_rgba(0,243,255,0.15)] cursor-pointer">
                        <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/5 rounded-lg text-neon-cyan">
                                    <Bot size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">For Agents</h3>
                            </div>
                            <p className="text-gray-400 text-sm max-w-xs">
                                TypeScript/Python SDKs, CLI, and Flash Loan API. Pure execution speed.
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-sm font-bold text-white group-hover:translate-x-1 transition-transform">
                            View Developer Hub <ArrowRight size={16} />
                        </div>
                    </Link>
                </div>
            </div>

            {/* --- QUICK START (TERMINAL) --- */}
            <div className="w-full max-w-4xl mx-auto px-4 mb-24 relative z-20">
                <div className="flex items-center gap-3 mb-6">
                    <ChevronRight className="text-neon-cyan" size={24} />
                    <h2 className="text-2xl font-bold text-white tracking-tight">Quick Start</h2>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-1 overflow-hidden shadow-2xl relative">
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="flex bg-black/50 rounded-lg p-1 text-xs font-mono">
                            {['npm', 'pnpm', 'yarn'].map((pm) => (
                                <button
                                    key={pm}
                                    onClick={() => setPkgManager(pm)}
                                    className={`px-3 py-1 rounded transition-colors ${pkgManager === pm
                                        ? "bg-white/10 text-neon-cyan"
                                        : "text-gray-500 hover:text-white"
                                        }`}
                                >
                                    {pm}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Terminal Content */}
                    <div className="p-6 md:p-8 font-mono relative group">
                        <div className="text-gray-500 select-none mb-4 font-mono text-sm"># Install the CLI and scaffold a new agent</div>
                        <div className="flex items-center gap-3 text-lg md:text-xl font-mono overflow-x-auto">
                            <span className="text-neon-purple select-none">$</span>
                            <span className="text-white">
                                {pkgManager === 'npm' ? 'npx' : pkgManager === 'pnpm' ? 'pnpm dlx' : 'yarn dlx'}
                            </span>
                            <span className="text-neon-cyan">suiloop create</span>
                            <span className="text-green-400">my-agent</span>
                        </div>

                        <button
                            onClick={() => {
                                const cmd = pkgManager === 'npm'
                                    ? "npx suiloop create my-agent"
                                    : pkgManager === 'pnpm'
                                        ? "pnpm dlx suiloop create my-agent"
                                        : "yarn dlx suiloop create my-agent";
                                navigator.clipboard.writeText(cmd);
                                toast.success(`Copied ${pkgManager} command!`);
                            }}
                            className="absolute top-1/2 right-6 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                        >
                            <Copy size={20} />
                        </button>
                    </div>
                </div>

                <div className="text-center mt-6 text-gray-500 text-sm">
                    Works on macOS, Windows & Linux. The one-liner installs dependencies and sets up the TypeScript/Python environment.
                </div>
            </div>

            {/* --- COMPANION APP --- */}
            <div className="w-full max-w-4xl mx-auto px-4 mb-32 relative z-20 text-center">
                <h3 className="text-xl font-bold text-white mb-4">Native Desktop Terminal</h3>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                    Professional desktop environment. Native performance for high-frequency monitoring and direct process control.
                </p>
                <div className="flex flex-col items-center">
                    <a
                        href="https://github.com/Eras256/Sui-Loop/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative overflow-hidden bg-black/40 backdrop-blur-xl border border-white/10 hover:border-neon-cyan/50 text-white font-bold py-6 px-10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] hover:shadow-[0_0_50px_rgba(6,182,212,0.3)] transition-all duration-300 transform hover:-translate-y-1 flex items-center justify-center gap-4 mx-auto min-w-[320px]"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-neon-cyan/20 via-transparent to-neon-purple/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10 group-hover:border-neon-cyan/30 transition-colors">
                                <Download size={24} className="text-gray-300 group-hover:text-neon-cyan transition-colors" />
                            </div>
                            <div className="text-left">
                                <span className="block text-xs uppercase tracking-widest text-neon-cyan/80 mb-0.5">v0.1.7 Available</span>
                                <span className="block text-lg font-bold tracking-tight">Download Companion</span>
                            </div>
                        </div>
                    </a>

                    <div className="mt-6 flex items-center gap-6 text-sm text-gray-400 font-mono">
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span> macOS
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span> Windows
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span> Linux
                        </span>
                    </div>
                </div>
            </div>


            {/* --- TECH STACK MARQUEE --- */}
            <div className="w-full border-y border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden py-10">
                <div className="flex gap-12 md:gap-24 items-center justify-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500 flex-wrap px-4">
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-white">SUI</div>
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-blue-400">DeepBook V3</div>
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-orange-400">ElizaOS</div>
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-teal-400">Scallop</div>
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-cyan-400">Cetus</div>
                </div>
            </div>

            {/* --- DIGITAL TEAM CONCEPT --- */}
            <section className="py-24 border-b border-white/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[120px] pointer-events-none"></div>
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-neon-cyan text-sm font-bold tracking-widest uppercase mb-2 block">The New Workforce</span>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">HIRE A <span className="text-gradient">24/7 QUANT TEAM</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Analyst */}
                        <div className="glass-panel p-8 rounded-2xl border-t-4 border-neon-purple">
                            <div className="text-xs font-mono text-gray-500 mb-2">ROLE: ANALYST</div>
                            <h3 className="text-2xl font-bold text-white mb-4">The Observer</h3>
                            <p className="text-gray-400 mb-6">
                                Constantly scans Scallop lending rates and DeepBook order books. Identifies dislocations in milliseconds.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-neon-purple bg-neon-purple/5 px-3 py-2 rounded-lg w-fit">
                                <Activity size={16} /> Heartbeat: 400ms
                            </div>
                        </div>

                        {/* Trader */}
                        <div className="glass-panel p-8 rounded-2xl border-t-4 border-neon-cyan">
                            <div className="text-xs font-mono text-gray-500 mb-2">ROLE: TRADER</div>
                            <h3 className="text-2xl font-bold text-white mb-4">The Executioner</h3>
                            <p className="text-gray-400 mb-6">
                                Routes capital through the most efficient path. Borrows from Navi, swaps on Cetus, repays instantly.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-neon-cyan bg-neon-cyan/5 px-3 py-2 rounded-lg w-fit">
                                <Zap size={16} /> Speed: &lt;1 Block
                            </div>
                        </div>

                        {/* Risk Manager */}
                        <div className="glass-panel p-8 rounded-2xl border-t-4 border-green-500">
                            <div className="text-xs font-mono text-gray-500 mb-2">ROLE: RISK MANAGER</div>
                            <h3 className="text-2xl font-bold text-white mb-4">The Guardian</h3>
                            <p className="text-gray-400 mb-6">
                                Simulates every transaction before broadcasting. If profit &le; 0, the transaction never happens.
                            </p>
                            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/5 px-3 py-2 rounded-lg w-fit">
                                <Shield size={16} /> Loss: Impossible
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="max-w-7xl mx-auto px-4 py-24 relative z-10">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter">BUILT FOR <span className="text-gradient">SPEED & SAFETY</span></h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
                        SuiLoop combines the speed of Sui with the intelligence of ElizaOS to create a self-sustaining DeFi organism.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {[
                        { icon: Shield, title: "Zero-Slippage Execution", desc: "Atomic blocks guarantee logic executes exactly as planned, or not at all. No MEV front-running. No partial fills.", color: "text-green-400" },
                        { icon: Layers, title: "Liquidity Aggregation", desc: "Unified access to DeepBook V3, Cetus, and Scallop. Find the best price across the entire Sui ecosystem.", color: "text-blue-400" },
                        { icon: Cpu, title: "Autonomous Alpha", desc: "Don't just run code. Deploy digital employees. Agents analyze market sentiment and on-chain metrics 24/7.", color: "text-orange-400" },
                        { icon: Zap, title: "Flash Capital", desc: "Access millions in liquidity from Scallop & Navi without collateral. The perfect tool for risk-free arbitrage.", color: "text-yellow-400" },
                        { icon: TerminalIcon, title: "Full Observability", desc: "Watch your agent think in real-time. Live logs, decision trees, and profit/loss tracking on your dashboard.", color: "text-gray-400" },
                        { icon: Globe, title: "Permissionless", desc: "Deploy your own strategy kernel. Compete in the global liquidity wars with institutional-grade tooling.", color: "text-neon-cyan" }
                    ].map((feature, i) => (
                        <div key={i} className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all group border border-white/5">
                            <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                                <feature.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- WORKFLOW STEPS --- */}
            <section className="border-t border-white/5 bg-black/40 py-24 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-cyan/5 rounded-full blur-[100px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-4 z-10 relative">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">THE <span className="text-neon-cyan">LOOP</span></h2>
                        <p className="text-gray-400 mt-4 text-lg">How an Autonomous Agent executes an Atomic Arb</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {[
                            { step: "01", title: "OBSERVE", desc: "Agent scans Scallop APY and Cetus Pools for price dislocations." },
                            { step: "02", title: "CALCULATE", desc: "Computes optimal loan amount and expected spread profitability." },
                            { step: "03", title: "CONSTRUCT", desc: "Builds a Programmable Transaction Block (PTB) with flash loan logic." },
                            { step: "04", title: "EXECUTE", desc: "Submits to blockchain. Profit is captured or tx reverts safely." }
                        ].map((s, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center text-center group">
                                <div className="text-6xl md:text-8xl font-black text-white/5 mb-4 select-none group-hover:text-neon-cyan/10 transition-colors">{s.step}</div>
                                <div className="w-4 h-4 rounded-full bg-neon-cyan mb-6 animate-pulse shadow-[0_0_15px_rgba(0,243,255,0.5)]"></div>
                                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                                <p className="text-gray-400 text-sm max-w-[200px]">{s.desc}</p>
                                {i < 3 && <div className="hidden md:block absolute top-[110px] left-1/2 w-full h-[2px] bg-gradient-to-r from-neon-cyan/30 to-transparent -z-10 transform translate-x-1/2"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- BUILDER HIGHLIGHT --- */}
            <section className="py-24 px-4 relative overflow-hidden border-t border-white/5">
                <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-neon-purple/10 rounded-full blur-[150px] pointer-events-none"></div>

                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Description */}
                    <div className="space-y-6 z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-neon-purple text-sm font-mono">
                            <span className="w-2 h-2 bg-neon-purple rounded-full animate-pulse"></span>
                            NEW IN v0.0.5
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                            VISUAL <span className="text-gradient">STRATEGY BUILDER</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            Create custom trading strategies with our intuitive drag-and-drop editor.
                            Connect triggers, conditions, and actions visually - no coding required.
                        </p>
                        <ul className="space-y-3 text-gray-300">
                            {[
                                "Drag & drop node-based editor",
                                "Save drafts for later editing",
                                "Deploy with one-click wallet signature",
                                "Version history with restore"
                            ].map((item, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-neon-cyan/20 flex items-center justify-center">
                                        <div className="w-2 h-2 bg-neon-cyan rounded-full"></div>
                                    </div>
                                    {item}
                                </li>
                            ))}
                        </ul>
                        <Link
                            href="/strategies/builder"
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-purple to-neon-cyan text-black font-bold px-8 py-3 rounded-full hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all"
                        >
                            <Layers size={18} />
                            Open Builder
                        </Link>
                    </div>

                    {/* Right: Visual Preview */}
                    <div className="relative z-10 hidden lg:block">
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4 shadow-2xl">
                            {/* Mock Builder UI */}
                            <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <span className="text-xs text-gray-500 font-mono">Strategy Builder</span>
                            </div>
                            <div className="grid grid-cols-4 gap-4 min-h-[250px]">
                                {/* Sidebar Mock */}
                                <div className="col-span-1 space-y-2">
                                    <div className="text-xs text-gray-500 uppercase mb-2">Triggers</div>
                                    {["Price > $2.50", "Every 1 Hour", "High Gas"].map((t, i) => (
                                        <div key={i} className="px-2 py-1.5 bg-white/5 rounded text-xs text-gray-400 border border-white/5">
                                            {t}
                                        </div>
                                    ))}
                                </div>
                                {/* Canvas Mock */}
                                <div className="col-span-3 bg-[#0F0F0F] rounded-lg border border-white/5 relative overflow-hidden">
                                    {/* Mock Nodes */}
                                    <div className="absolute top-8 left-8 bg-gradient-to-r from-yellow-500/80 to-orange-500/80 px-3 py-2 rounded-lg border border-white/20 text-xs font-bold shadow-lg">
                                        🕐 Every 1 Hour
                                    </div>
                                    <div className="absolute top-8 right-8 bg-gradient-to-r from-green-500/80 to-emerald-500/80 px-3 py-2 rounded-lg border border-white/20 text-xs font-bold shadow-lg">
                                        ⚡ Execute Swap
                                    </div>
                                    {/* Connection Line */}
                                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                        <path d="M 130 40 Q 180 70 210 40" stroke="rgba(0,243,255,0.5)" strokeWidth="2" fill="none" strokeDasharray="4 2" />
                                    </svg>
                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs text-gray-500 font-mono">
                                        Drag nodes to connect
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- DEVELOPER TOOLS --- */}
            <section className="py-24 px-4 bg-black/40 border-t border-white/5 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">BUILD ON <span className="text-gradient">SUILOOP</span></h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            Institutional-grade tooling for quant developers and data scientists.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* CLI */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8 hover:border-neon-cyan/30 transition-colors group">
                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <TerminalIcon className="text-neon-cyan" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">SuiLoop CLI</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">Scaffold production-ready autonomous agents in seconds.</p>
                            <div className="bg-black border border-white/10 rounded px-4 py-3 font-mono text-xs text-neon-cyan flex justify-between items-center">
                                <span>npx suiloop create</span>
                                <div className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse"></div>
                            </div>
                        </div>

                        {/* TS SDK */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8 hover:border-blue-500/30 transition-colors group">
                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Cpu className="text-blue-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">TypeScript SDK</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">Type-safe bindings for web integrations and frontend dApps.</p>
                            <div className="bg-black border border-white/10 rounded px-4 py-3 font-mono text-xs text-blue-400">
                                npm i @suiloop/sdk
                            </div>
                        </div>

                        {/* Python SDK */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8 hover:border-yellow-500/30 transition-colors group">
                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Activity className="text-yellow-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">Python SDK</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">Async client for algorithmic trading and data science.</p>
                            <div className="bg-black border border-white/10 rounded px-4 py-3 font-mono text-xs text-yellow-400">
                                pip install suiloop
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="/agents" className="inline-flex items-center gap-2 text-neon-cyan hover:text-white transition-colors font-bold uppercase tracking-wider text-sm">
                            Visit Developer Hub <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="py-32 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neon-purple/10 pointer-events-none"></div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">READY TO DEPLOY?</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/strategies" className="bg-neon-cyan text-black font-bold px-10 py-4 rounded-full hover:shadow-[0_0_40px_rgba(0,243,255,0.4)] transition-all text-lg scale-100 hover:scale-105 active:scale-95 duration-200 cursor-pointer">
                        Browse Strategies
                    </Link>
                    <Link href="/strategies/builder" className="border border-neon-purple text-neon-purple font-bold px-10 py-4 rounded-full hover:bg-neon-purple/10 transition-all text-lg cursor-pointer">
                        Open Builder
                    </Link>
                    <Link href="/docs" className="border border-white/10 text-white font-bold px-10 py-4 rounded-full hover:bg-white/5 transition-all text-lg cursor-pointer">
                        Read Docs
                    </Link>
                </div>
            </section>



        </main>
    );
}

