'use client';

import { ConnectButton, useCurrentAccount, useSignTransaction, useSuiClient } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Zap, Shield, Cpu, Layers, Terminal as TerminalIcon, Globe, Github, MessageSquare, Activity, ArrowRight, Bot, User, Copy, ChevronRight, Download, Landmark, BookOpen, Database, HardDrive, FileCheck, CheckCircle, Workflow } from "lucide-react";
import { PulsingOrb } from "./components/NeuralOrb";

import Navbar from "@/components/layout/Navbar";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Home() {
    const router = useRouter();
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutateAsync: signTransaction } = useSignTransaction();
    const { t } = useLanguage();
    const [agentLog, setAgentLog] = useState<string[]>([]);
    const [pkgManager, setPkgManager] = useState("npm");

    // Helper: Sign transaction with wallet, then execute via suiClient directly.
    // This completely bypasses the wallet's built-in gas sponsorship mechanism.
    const signAndExecuteTransaction = async ({ transaction }: { transaction: any }): Promise<{ digest: string }> => {
        const { bytes, signature } = await signTransaction({ transaction });
        const result = await suiClient.executeTransactionBlock({
            transactionBlock: bytes,
            signature,
            options: { showEffects: true },
        });
        return { digest: result.digest };
    };

    const handleDeploy = async () => {
        if (!account) {
            toast.error(t('home.toasts.walletRequired'));
            return;
        }

        // Network Check (Strict)
        if (account.chains?.[0] && account.chains[0] !== 'sui:testnet') {
            toast.error(t('home.toasts.wrongNetwork'), {
                description: t('home.toasts.wrongNetworkDesc')
            });
            return;
        }

        const toastId = toast.loading(t('common.toasts.executing').replace('{name}', 'Deployment'));

        try {
            const tx = new Transaction();
            tx.setSender(account.address);
            // Create a self-transfer of 1000 MIST (0.000001 SUI) to simulate"Activation Cost"
            const [coin] = tx.splitCoins(tx.gas, [1000]);
            tx.transferObjects([coin], account.address);

            const result = await signAndExecuteTransaction({ transaction: tx as any });
            toast.dismiss(toastId);
            toast.success(t('home.toasts.activationSuccess'), {
                description: t('home.toasts.activationDesc')
            });

            setTimeout(() => {
                router.push("/dashboard");
            }, 2000);
        } catch (e: any) {
            toast.dismiss(toastId);
            toast.error(t('home.toasts.txFailed'), {
                description: e?.message || t('home.toasts.txFailedDesc')
            });
        }
    };

    // Simulation of Agent Thoughts
    useEffect(() => {
        const logs = [
            "Initializing Neural Core v0.0.7...",
            "Establishing Matrix Uplink via Sui RPC...",
            "Neural Registry Status: SYNCED",
            "Sentinel ELO: 1240 (Top 5% Tier)",
            "Walrus Forensic Log: ACTIVE (Sector 7)",
            "Scanning for Alpha Vectors...",
            "Pattern Recognized: Navi/Scallop Loop [SUI]",
            "Neural Flash Loan Requested: 10M MIST",
            "Matrix Heartbeat: STABLE (Latency: 12ms)"
        ];
        let i = 0;
        const interval = setInterval(() => {
            if (i < logs.length) {
                setAgentLog(prev => [...prev, logs[i]]);
                i++;
            }
        }, 1200);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen flex flex-col relative overflow-x-hidden">

            {/* Navbar */}
            <Navbar />

            {/* Hero Section */}
            <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 pt-32 md:pt-40 px-4 pb-32">

                {/* Left: Text & Terminal */}
                <div className="flex flex-col justify-center space-y-6 md:space-y-8 z-10 order-2 lg:order-1">
                    <div className="space-y-4 text-center lg:text-left z-20 relative">
                        {/* Mainnet Ready Badge */}
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neon-cyan/10 border border-neon-cyan/30 rounded-full mb-4 mx-auto lg:mx-0 w-fit">
                            <span className="relative flex h-2 w-2">
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan"></span>
                            </span>
                            <span className="text-[10px] uppercase tracking-wider font-bold text-neon-cyan whitespace-nowrap">
                                {t('home.hero.badge')}
                            </span>
                        </div>
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                            {t('home.hero.title1')} <br />
                            <span className="text-gradient">{t('home.hero.title2')}</span>
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg max-w-md mx-auto lg:mx-0">
                            {t('home.hero.description')}
                        </p>
                    </div>

                    {/* Glass Terminal */}
                    <div className="glass-panel rounded-xl p-3 md:p-4 font-mono text-sm h-40 md:h-48 overflow-y-auto w-full max-w-lg border-l-4 border-neon-cyan bg-black/40 mx-auto lg:mx-0">
                        <div className="text-xs text-gray-500 mb-2 border-b border-gray-800 pb-1">AGENT_KERNEL_v0.0.7 // LIVE FEED</div>
                        {agentLog.map((log, i) => (
                            <div key={i} className="text-neon-cyan/80 mb-1 text-xs md:text-sm">
                                <span className="text-gray-600 mr-2">{">"}</span>
                                {log}
                            </div>
                        ))}
                        <div className="text-neon-purple mt-2">_</div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                        <button onClick={handleDeploy} className="bg-neon-cyan text-black font-bold px-8 py-3 md:py-4 rounded-lg w-full sm:w-auto text-center flex items-center justify-center text-sm md:text-base cursor-pointer">
                            {t('home.hero.launch')}
                        </button>
                        <Link href="/docs" className="glass-panel px-8 py-3 md:py-4 rounded-lg w-full sm:w-auto text-sm md:text-base flex items-center justify-center">
                            {t('home.hero.docs')}
                        </Link>
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
            <div className="w-full border-y border-white/5 bg-black/40 mb-32">
                <div className="max-w-7xl mx-auto px-4 py-8">
                    <p className="text-center text-xs font-mono text-gray-500 mb-6 tracking-[0.2em]">{t('home.sections.poweredBy')}</p>
                    <div className="flex flex-wrap justify-center gap-8 md:gap-16 items-center opacity-70 grayscale">

                        {/* Navi */}
                        <div className="flex items-center gap-2 cursor-pointer">
                            <Landmark className="text-neon-cyan" size={24} />
                            <span className="text-xl font-bold text-white">
                                NAVI Protocol</span>
                        </div>
                        {/* DeepBook */}
                        <div className="flex items-center gap-2 cursor-pointer">
                            <BookOpen className="text-blue-500" size={24} />
                            <span className="text-xl font-bold text-white">
                                DeepBook V3</span>
                        </div>
                        {/* Eliza */}
                        <div className="flex items-center gap-2 cursor-pointer">
                            <Bot className="text-orange-500" size={24} />
                            <span className="text-xl font-bold text-white">
                                ElizaOS</span>
                        </div>
                        {/* Cetus */}
                        <div className="flex items-center gap-2 cursor-pointer">
                            <Database className="text-teal-400" size={24} />
                            <span className="text-xl font-bold text-white">
                                Cetus</span>
                        </div>
                        {/* Walrus */}
                        <div className="flex items-center gap-2 cursor-pointer">
                            <HardDrive className="text-pink-500" size={24} />
                            <span className="text-xl font-bold text-white">
                                Walrus</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- AUDIENCE SPLITTER --- */}
            <div className="w-full max-w-7xl mx-auto px-4 mb-32 relative z-20">
                <div className="text-center mb-12">
                    <h2 className="text-2xl md:text-3xl font-bold tracking-tight text-white mb-4">{t('home.sections.interface.title')} <span className="text-neon-cyan">{t('home.sections.interface.subtitle')}</span></h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                        {t('home.sections.interface.desc')}
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* For Humans */}
                    <Link href="/dashboard" className=" relative overflow-hidden rounded-2xl bg-[#0A0A0A] border border-white/10 p-8 flex flex-col justify-between min-h-[240px] cursor-pointer">

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/5 rounded-lg text-neon-purple">
                                    <User size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">{t('home.sections.interface.human.title')}</h3>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                <strong>{t('home.sections.interface.human.gain')}</strong> {t('home.sections.interface.human.desc1')}
                                <br />
                                {t('home.sections.interface.human.desc2')}<strong>{t('home.sections.interface.human.desc3')}</strong>{t('home.sections.interface.human.desc4')}
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-sm font-bold text-white">

                            {t('home.sections.interface.human.cta')} <ArrowRight size={16} />
                        </div>
                    </Link>

                    {/* For Agents */}
                    <Link href="/agents" className=" relative overflow-hidden rounded-2xl bg-[#0A0A0A] border border-white/10 p-8 flex flex-col justify-between min-h-[240px] cursor-pointer">

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-white/5 rounded-lg text-neon-cyan">
                                    <Bot size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-white">{t('home.sections.interface.agent.title')}</h3>
                            </div>
                            <p className="text-gray-400 text-sm leading-relaxed">
                                <strong>{t('home.sections.interface.agent.gain')}</strong> {t('home.sections.interface.agent.desc1')}
                                <br />
                                {t('home.sections.interface.agent.desc2')}
                            </p>
                        </div>
                        <div className="relative z-10 flex items-center gap-2 text-sm font-bold text-white">

                            {t('home.sections.interface.agent.cta')} <ArrowRight size={16} />
                        </div>
                    </Link>
                </div>
            </div>

            {/* --- QUICK START (TERMINAL) --- */}
            <div className="w-full max-w-4xl mx-auto px-4 mb-32 relative z-20">
                <div className="flex items-center gap-3 mb-6">
                    <ChevronRight className="text-neon-cyan" size={24} />
                    <h2 className="text-2xl font-bold text-white tracking-tight">{t('home.quickStart.title')}</h2>
                </div>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-1 overflow-hidden shadow-2xl relative">
                    {/* Terminal Header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/5">
                        <div className="flex gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500/80" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                            <div className="w-3 h-3 rounded-full bg-green-500/80" />
                        </div>
                        <div className="flex bg-black/50 rounded-lg p-1 text-xs font-mono text-gray-400 px-3">
                            bash — 80x24
                        </div>
                    </div>

                    {/* Terminal Content */}
                    <div className="p-6 md:p-8 font-mono relative">

                        <div className="text-gray-500 select-none mb-4 font-mono text-sm"># Initialize the Neural Matrix (Linux/Mac)</div>
                        <div className="flex flex-col gap-2 text-lg md:text-xl font-mono overflow-x-auto">
                            <div className="flex items-center gap-3">
                                <span className="text-neon-purple select-none">$</span>
                                <span className="text-neon-cyan">./suiloop sync</span>
                            </div>
                            <div className="text-base text-gray-500 mt-2 font-mono">
                                [SYSTEM] <span className="text-green-400">Registry Connection: SECURE</span><br />
                                [SYSTEM] <span className="text-green-400">Kernel Version: 0.0.7-Neural</span><br />
                                <span className="text-neon-purple mt-2 block">
                                    Connecting to Neural Matrix Uplink...</span>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                navigator.clipboard.writeText("./suiloop sync");
                                toast.success(t('home.toasts.copied'));
                            }}
                            className="absolute top-6 right-6 p-2 bg-white/5 rounded-lg text-gray-400"
                        >
                            <Copy size={20} />
                        </button>
                    </div>
                </div>

                <div className="text-center mt-6 text-gray-500 text-sm">
                    {t('home.quickStart.desc')}
                </div>

            </div>

            {/* --- COMPANION APP --- */}
            <div className="w-full max-w-4xl mx-auto px-4 mb-40 relative z-20 text-center">
                <h3 className="text-xl font-bold text-white mb-4">{t('home.companion.title')}</h3>
                <p className="text-gray-400 mb-8 max-w-lg mx-auto">
                    {t('home.companion.desc')}
                </p>
                <div className="flex flex-col items-center">
                    <a
                        href="https://github.com/Eras256/Sui-Loop/releases/latest"
                        target="_blank"
                        rel="noopener noreferrer"
                        className=" relative overflow-hidden bg-black/40 border border-white/10 text-white font-bold py-6 px-10 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center gap-4 mx-auto min-w-[320px]"
                    >
                        <div className="relative flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-white/5 border border-white/10">

                                <Download size={24} className="text-gray-300" />
                            </div>
                            <div className="text-left">
                                <span className="block text-xs uppercase tracking-widest text-neon-cyan/80 mb-0.5">{t('home.companion.available')}</span>
                                <span className="block text-lg font-bold tracking-tight">{t('home.companion.download')}</span>
                            </div>
                        </div>
                    </a>

                    <div className="mt-6 flex items-center gap-6 text-sm text-gray-400 font-mono">
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan">
                            </span> macOS
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan">
                            </span> Windows
                        </span>
                        <span className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan">
                            </span> Linux
                        </span>
                    </div>
                </div>
            </div>


            {/* --- TECH STACK MARQUEE --- */}
            <div className="w-full border-y border-white/5 bg-black/20 overflow-hidden py-10">
                <div className="flex gap-12 md:gap-24 items-center justify-center opacity-70 grayscale flex-wrap px-4">
                    {[
                        { label: t('home.marquee.tvl'), value: '$1.4B', color: 'text-green-400' },
                        { label: t('home.marquee.synced'), value: '2,890', color: 'text-neon-cyan' },
                        { label: t('home.marquee.plugins'), value: '16+ Active', color: 'text-purple-400' },
                        { label: t('home.marquee.elo'), value: '1,120', color: 'text-amber-400' },
                        { label: t('home.marquee.latency'), value: '12ms', color: 'text-blue-400' },
                    ].map((stat) => (
                        <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                            <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</div>
                            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Executive Summary */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <div className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                        <Shield className="text-neon-purple" />
                        {t('home.executive.title')}
                    </h2>
                    <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
                        <p className="text-lg leading-relaxed">
                            {t('home.executive.p1')}
                            <strong className="text-neon-cyan"> {t('home.executive.p1_hl1')} </strong> {t('home.executive.p1_mid')}
                            <strong className="text-neon-purple"> {t('home.executive.p1_hl2')}</strong>.
                        </p>
                        <p>
                            {t('home.executive.p2')}
                        </p>
                    </div>
                </div>
            </section>

            {/* Progressive Automation */}
            <section className="max-w-7xl mx-auto px-4 py-24">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Cpu className="text-neon-cyan" />
                    {t('home.progressive.title')}
                </h2>
                <p className="text-gray-400 mb-6">
                    {t('home.progressive.desc')} <strong className="text-white">{t('home.progressive.desc_hl')}</strong>
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-6 rounded-xl border border-neon-purple/30">

                        <h3 className="text-xl font-bold text-neon-purple mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            {t('home.progressive.copilot.title')}
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('home.progressive.copilot.l1')}</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('home.progressive.copilot.l2')}</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('home.progressive.copilot.l3')}</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('home.progressive.copilot.l4')}</li>
                        </ul>
                    </div>
                    <div className="bg-black/40 p-6 rounded-xl border border-neon-cyan/30">

                        <h3 className="text-xl font-bold text-neon-cyan mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            {t('home.progressive.autonomous.title')}
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('home.progressive.autonomous.l1')}</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('home.progressive.autonomous.l2')}</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('home.progressive.autonomous.l3')}</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {t('home.progressive.autonomous.l4')}</li>
                        </ul>
                    </div>
                </div>
            </section>

            {/* --- DIGITAL TEAM CONCEPT --- */}
            <section className="py-24 border-b border-white/5 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 relative z-10">
                    <div className="text-center mb-16">
                        <span className="text-neon-cyan text-sm font-bold tracking-widest uppercase mb-2 block">{t('home.workforce.badge')}</span>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter text-white">{t('home.workforce.title1')} <span className="text-gradient">{t('home.workforce.title2')}</span></h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* Analyst */}
                        <div className="glass-panel p-8 rounded-2xl border-t-4 border-neon-purple">
                            <div className="text-xs font-mono text-gray-500 mb-2">{t('home.workforce.analyst.role')}</div>
                            <h3 className="text-2xl font-bold text-white mb-4">{t('home.workforce.analyst.title')}</h3>
                            <p className="text-gray-400 mb-6">
                                {t('home.workforce.analyst.desc')}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-neon-purple bg-neon-purple/5 px-3 py-2 rounded-lg w-fit">
                                <Activity size={16} /> {t('home.workforce.analyst.stat')}
                            </div>
                        </div>

                        {/* Trader */}
                        <div className="glass-panel p-8 rounded-2xl border-t-4 border-neon-cyan">
                            <div className="text-xs font-mono text-gray-500 mb-2">{t('home.workforce.executioner.role')}</div>
                            <h3 className="text-2xl font-bold text-white mb-4">{t('home.workforce.executioner.title')}</h3>
                            <p className="text-gray-400 mb-6">
                                {t('home.workforce.executioner.desc')}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-neon-cyan bg-neon-cyan/5 px-3 py-2 rounded-lg w-fit">
                                <Zap size={16} /> {t('home.workforce.executioner.stat')}
                            </div>
                        </div>

                        {/* Risk Manager */}
                        <div className="glass-panel p-8 rounded-2xl border-t-4 border-green-500">
                            <div className="text-xs font-mono text-gray-500 mb-2">{t('home.workforce.validator.role')}</div>
                            <h3 className="text-2xl font-bold text-white mb-4">{t('home.workforce.validator.title')}</h3>
                            <p className="text-gray-400 mb-6">
                                {t('home.workforce.validator.desc')}
                            </p>
                            <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/5 px-3 py-2 rounded-lg w-fit">
                                <Shield size={16} /> {t('home.workforce.validator.stat')}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- FEATURES GRID --- */}
            <section className="max-w-7xl mx-auto px-4 py-24 relative z-10">
                <div className="text-center mb-16 space-y-4">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tighter">{t('home.architecture.title')} <span className="text-gradient">{t('home.architecture.subtitle')}</span> {t('home.architecture.suffix')}</h2>
                    <p className="text-gray-400 max-w-2xl mx-auto text-sm md:text-base">
                        {t('home.architecture.p')}
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {[
                        { icon: Workflow, title: t('home.architecture.f1.title'), desc: t('home.architecture.f1.desc'), color: 'text-purple-400' },
                        { icon: BookOpen, title: t('home.architecture.f2.title'), desc: t('home.architecture.f2.desc'), color: 'text-neon-cyan' },
                        { icon: Layers, title: t('home.architecture.f3.title'), desc: t('home.architecture.f3.desc'), color: 'text-blue-400' },
                        { icon: Shield, title: t('home.architecture.f4.title'), desc: t('home.architecture.f4.desc'), color: 'text-purple-400' },
                        { icon: Cpu, title: t('home.architecture.f5.title'), desc: t('home.architecture.f5.desc'), color: 'text-blue-400' },
                        { icon: HardDrive, title: t('home.architecture.f6.title'), desc: t('home.architecture.f6.desc'), color: 'text-pink-500' },
                        { icon: MessageSquare, title: t('home.architecture.f7.title'), desc: t('home.architecture.f7.desc'), color: 'text-yellow-400' },
                        { icon: TerminalIcon, title: t('home.architecture.f8.title'), desc: t('home.architecture.f8.desc'), color: 'text-gray-400' },
                        { icon: Zap, title: t('home.architecture.f9.title'), desc: t('home.architecture.f9.desc'), color: 'text-green-500' }
                    ].map((feature, i) => (
                        <div key={i} className="glass-panel p-6 rounded-xl border border-white/5">
                            <div className={`w-12 h-12 rounded-lg bg-white/5 flex items-center justify-center mb-4 ${feature.color}`}>
                                <feature.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                            <p className="text-gray-400 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            <section className="border-t border-white/5 bg-black/40 py-24 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 z-10 relative">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">{t('home.loop.title')} <span className="text-neon-cyan">{t('home.loop.subtitle')}</span></h2>
                        <p className="text-gray-400 mt-4 text-lg">{t('home.loop.p')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
                        {[
                            { step: "01", title: t('home.loop.s1.title'), desc: t('home.loop.s1.desc') },
                            { step: "02", title: t('home.loop.s2.title'), desc: t('home.loop.s2.desc') },
                            { step: "03", title: t('home.loop.s3.title'), desc: t('home.loop.s3.desc') },
                            { step: "04", title: t('home.loop.s4.title'), desc: t('home.loop.s4.desc') }
                        ].map((s, i) => (
                            <div key={i} className="relative z-10 flex flex-col items-center text-center">

                                <div className="text-6xl md:text-8xl font-black text-white/5 mb-4 select-none">
                                    {s.step}</div>
                                <div className="w-4 h-4 rounded-full bg-neon-cyan mb-6">
                                </div>
                                <h3 className="text-xl font-bold mb-3">{s.title}</h3>
                                <p className="text-gray-400 text-sm max-w-[200px]">{s.desc}</p>
                                {i < 3 && <div className="hidden md:block absolute top-[110px] left-1/2 w-full h-[2px] bg-gradient-to-r from-neon-cyan/30 to-transparent -z-10 translate-x-1/2"></div>}
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* --- BUILDER HIGHLIGHT --- */}
            <section className="py-24 px-4 relative overflow-hidden border-t border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                    {/* Left: Description */}
                    <div className="space-y-6 z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-neon-purple/10 border border-neon-purple/30 rounded-full text-neon-purple text-sm font-mono">
                            <span className="w-2 h-2 bg-neon-purple rounded-full">
                            </span>
                            {t('home.builderHighlight.badge')}
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">
                            {t('home.builderHighlight.title')} <span className="text-gradient">{t('home.builderHighlight.subtitle')}</span>
                        </h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            {t('home.builderHighlight.desc')}
                        </p>
                        <ul className="space-y-3 text-gray-300">
                            {[
                                t('home.builderHighlight.l1'),
                                t('home.builderHighlight.l2'),
                                t('home.builderHighlight.l3'),
                                t('home.builderHighlight.l4')
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
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-neon-purple to-neon-cyan text-black font-bold px-8 py-3 rounded-full"
                        >
                            <Layers size={18} />
                            {t('home.builderHighlight.cta')}
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
                                    {["Price> $2.50", "Every 1 Hour", "High Gas"].map((t, i) => (
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
                        <h2 className="text-3xl md:text-5xl font-black tracking-tighter">{t('home.devTools.title')} <span className="text-gradient">{t('home.devTools.subtitle')}</span></h2>
                        <p className="text-gray-400 max-w-2xl mx-auto">
                            {t('home.devTools.desc')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* CLI */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8">

                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6">

                                <TerminalIcon className="text-neon-cyan" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">{t('home.devTools.cli.title')}</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">{t('home.devTools.cli.desc')}</p>
                            <div className="bg-black border border-white/10 rounded px-4 py-3 font-mono text-xs text-neon-cyan flex justify-between items-center">
                                <span>./install.sh</span>
                                <div className="w-2 h-2 rounded-full bg-neon-cyan">
                                </div>
                            </div>
                        </div>

                        {/* TS SDK */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8">

                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6">

                                <Cpu className="text-blue-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">{t('home.devTools.ts.title')}</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">{t('home.devTools.ts.desc')}</p>
                            <div className="bg-black border border-white/10 rounded px-4 py-3 font-mono text-xs text-blue-400">
                                npm i @suiloop/sdk
                            </div>
                        </div>

                        {/* Python SDK */}
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-8">

                            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mb-6">

                                <Activity className="text-yellow-500" size={24} />
                            </div>
                            <h3 className="text-xl font-bold mb-2 text-white">{t('home.devTools.py.title')}</h3>
                            <p className="text-gray-400 text-sm mb-6 h-10">{t('home.devTools.py.desc')}</p>
                            <div className="bg-black border border-white/10 rounded px-4 py-3 font-mono text-xs text-yellow-400">
                                pip install suiloop
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link href="https://x.com/Vaiosx" className="text-gray-400 underline underline-offset-4 decoration-neon-cyan/50 text-sm">
                            {t('home.devTools.cta')} <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="py-32 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neon-purple/10 pointer-events-none"></div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">{t('home.cta.title')}</h2>
                <div className="flex flex-wrap justify-center gap-4">
                    <Link href="/strategies" className="bg-neon-cyan text-black font-bold px-10 py-4 rounded-full text-lg active: cursor-pointer">
                        {t('home.ctaLinks.browse')}
                    </Link>
                    <Link href="/strategies/builder" className="border border-neon-purple text-neon-purple font-bold px-10 py-4 rounded-full text-lg cursor-pointer">
                        {t('home.ctaLinks.builder')}
                    </Link>
                    <Link href="/marketplace" className="border border-blue-500/50 text-blue-400 font-bold px-10 py-4 rounded-full text-lg cursor-pointer">
                        {t('home.ctaLinks.marketplace')}
                    </Link>
                    <Link href="/plugins" className="border border-pink-500/50 text-pink-400 font-bold px-10 py-4 rounded-full text-lg cursor-pointer">
                        {t('home.ctaLinks.plugins')}
                    </Link>
                    <Link href="/docs" className="border border-white/10 text-white font-bold px-10 py-4 rounded-full text-lg cursor-pointer">
                        {t('home.ctaLinks.docs')}
                    </Link>
                </div>
            </section>



        </main >
    );
}

