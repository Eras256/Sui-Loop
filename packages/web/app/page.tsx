'use client';

import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import Link from "next/link";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { Suspense, useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Zap, Shield, Cpu, Layers, Terminal as TerminalIcon, Globe, Github, MessageSquare } from "lucide-react";
import { PulsingOrb } from "./components/NeuralOrb";

import Navbar from "@/components/layout/Navbar";

export default function Home() {
    const router = useRouter();
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [agentLog, setAgentLog] = useState<string[]>([]);

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
                        <h1 className="text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.9]">
                            ATOMIC <br />
                            <span className="text-gradient">LEVERAGE</span>
                        </h1>
                        <p className="text-gray-400 text-base md:text-lg max-w-md mx-auto lg:mx-0">
                            Institutional grade execution on Sui. Powered by DeepBook V3 Flash Loans and ElizaOS Agents.
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

            {/* --- TECH STACK MARQUEE --- */}
            <div className="w-full border-y border-white/5 bg-black/20 backdrop-blur-sm overflow-hidden py-10">
                <div className="flex gap-12 md:gap-24 items-center justify-center opacity-70 grayscale hover:grayscale-0 transition-all duration-500 flex-wrap px-4">
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-white">SUI</div>
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-blue-400">DeepBook V3</div>
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-orange-400">ElizaOS</div>
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-purple-400">Walrus</div>
                    <div className="text-xl md:text-2xl font-bold tracking-tighter text-cyan-400">Navi</div>
                </div>
            </div>

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
                        { icon: Shield, title: "Atomic Safety", desc: "Zero-Risk execution. If a trade isn't profitable, the transaction reverts entirely. You only pay gas for successful loops.", color: "text-green-400" },
                        { icon: Layers, title: "DeepBook V3 Liquidity", desc: "Integrated with Sui's central limit order book (CLOB) for institutional-grade pricing and depth.", color: "text-blue-400" },
                        { icon: Cpu, title: "ElizaOS Intelligence", desc: "Autonomous agents that observe, reason, and act. Powered by heuristic models running 24/7.", color: "text-orange-400" },
                        { icon: Zap, title: "Instant Flash Loans", desc: "Leverage capital you don't own. Borrow, trade, and repay in a single atomic transaction block.", color: "text-yellow-400" },
                        { icon: TerminalIcon, title: "Fully Transparent", desc: "Every decision is logged on-chain. Verify the agent's 'thought process' and execution logic via explorer.", color: "text-gray-400" },
                        { icon: Globe, title: "Permissionless", desc: "Deploy your own agent kernel and participate in the liquidity arbitrage optimization wars.", color: "text-neon-cyan" }
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
                            { step: "01", title: "OBSERVE", desc: "Agent scans RPC for price dislocations across DeepBook and DEXs." },
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

            {/* --- CTA --- */}
            <section className="py-32 px-4 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-neon-purple/10 pointer-events-none"></div>
                <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-8 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">READY TO DEPLOY?</h2>
                <div className="flex justify-center gap-4">
                    <button onClick={handleDeploy} className="bg-neon-cyan text-black font-bold px-10 py-4 rounded-full hover:shadow-[0_0_40px_rgba(0,243,255,0.4)] transition-all text-lg scale-100 hover:scale-105 active:scale-95 duration-200 cursor-pointer">
                        Launch Agent V1
                    </button>
                    <button className="border border-white/10 text-white font-bold px-10 py-4 rounded-full hover:bg-white/5 transition-all text-lg cursor-pointer">
                        Read Whitepaper
                    </button>
                </div>
            </section>



        </main>
    );
}

