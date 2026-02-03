'use client';

import Navbar from "@/components/layout/Navbar";

import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, Sphere, MeshTransmissionMaterial } from "@react-three/drei";
import Link from 'next/link';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

function NeuralOrbSmall() {
    return (
        <group>
            <Float speed={5} rotationIntensity={1} floatIntensity={2}>
                <Sphere args={[1, 32, 32]}>
                    <MeshTransmissionMaterial
                        backside
                        thickness={2}
                        roughness={0}
                        transmission={1}
                        ior={1.5}
                        chromaticAberration={0.1}
                        anisotropy={20}
                        color="#bd00ff"
                        toneMapped={false}
                    />
                </Sphere>
            </Float>
        </group>
    );
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const account = useCurrentAccount();
    const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [showAutoStartModal, setShowAutoStartModal] = useState(false);

    const [stats, setStats] = useState({
        apy: "14.2%",
        netWorth: "$0.00",
        profit: "+$0.00"
    });

    const [logs, setLogs] = useState<string[]>([
        "[KERNEL] Initializing deep learning modules...",
        "[KERNEL] Connected to Pyth Oracle Network.",
        "[STRATEGY] Identifying arbitrage path SUI -> USDC -> SUI",
        "[EXECUTION] Flash loan approved: 100,000 SUI",
        "[EXECUTION] Swapping via DeepBook V3...",
        "[SUCCESS] Net profit: 12.5 SUI (Tx: 0x82...9a)",
    ]);

    // Auto-deploy logic for Navbar CTA
    useEffect(() => {
        if (searchParams.get('autostart') === 'true' && account) {
            router.replace('/dashboard');
            setShowAutoStartModal(true);
        }
    }, [searchParams, account, router]);

    const handleDeploy = () => {
        if (!account) {
            toast.error("Please connect your Sui Wallet first");
            return;
        }

        // Log the account info for debugging
        console.log("Account connected:", account.address);
        console.log("Wallet chains info:", account.chains);

        // Note: The SuiClientProvider is configured for testnet, so transactions 
        // will be sent to testnet regardless of what the wallet reports.
        // The previous chain detection was unreliable with some wallets (Phantom).

        const toastId = toast.loading("Executing Atomic Flash Loan Loop...");

        try {
            const tx = new Transaction();

            // Get contract IDs from environment variables (v0.0.4 with real Hot Potato)
            const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043";
            const POOL_ID = process.env.NEXT_PUBLIC_POOL_ID || "0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0";

            // Strategy Parameters
            const BORROW_AMOUNT = 100_000_000; // 0.1 SUI to borrow (flash loan)
            const USER_FUNDS_AMOUNT = 1_000; // 0.000001 SUI (Minimal check to ensure coin exists)
            const MIN_PROFIT = 0; // For demo, we accept any profit

            const [userFundsCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(USER_FUNDS_AMOUNT)]);

            tx.moveCall({
                target: `${PACKAGE_ID}::atomic_engine::execute_loop`,
                typeArguments: [
                    "0x2::sui::SUI",
                    "0x2::sui::SUI"
                ],
                arguments: [
                    tx.object(POOL_ID),
                    userFundsCoin,
                    tx.pure.u64(BORROW_AMOUNT),
                    tx.pure.u64(MIN_PROFIT),
                ]
            });

            signAndExecuteTransaction(
                { transaction: tx as any },
                {
                    onSuccess: (result) => {
                        toast.dismiss(toastId);
                        toast.success("⚡ Atomic Loop Executed Successfully!", {
                            description: `Flash Loan + Repay in 1 TX | Digest: ${result.digest.slice(0, 10)}...`
                        });
                        setTimeout(() => {
                            toast.info("Hot Potato Pattern: Loan was repaid atomically", {
                                icon: '🥔🔥',
                                description: "LoopReceipt destroyed, security guaranteed by Move"
                            });
                        }, 1500);

                        setLogs(prev => [
                            `[SUCCESS] ⚡ Atomic Tx: ${result.digest.slice(0, 8)}...`,
                            `[FLASH_LOAN] Borrowed ${BORROW_AMOUNT / 1_000_000_000} SUI, Repaid with 0.3% fee`,
                            ...prev
                        ].slice(0, 15));
                    },
                    onError: (error) => {
                        toast.dismiss(toastId);
                        const errorMessage = error instanceof Error ? error.message : String(error);
                        console.warn("[Transaction Error]:", errorMessage);

                        if (errorMessage.includes("InsufficientGas") || errorMessage.includes("balance")) {
                            toast.error("Insufficient Balance", { description: "You need testnet SUI. Visit faucet.sui.io" });
                        } else if (errorMessage.includes("INSUFFICIENT_PROFIT")) {
                            toast.error("Strategy Failed: Insufficient Profit", { description: "Tx aborted to protect funds" });
                        } else if (errorMessage.includes("POOL_INSUFFICIENT_LIQUIDITY")) {
                            toast.error("Pool Empty", { description: "MockPool needs liquidity." });
                        } else {
                            toast.error("Execution Failed", { description: errorMessage.slice(0, 60) });
                        }
                        setLogs(prev => [`[ERROR] Tx Reverted: ${errorMessage.slice(0, 40)}`, ...prev]);
                    }
                }
            );
        } catch (e) {
            console.error(e);
            toast.dismiss(toastId);
            toast.error("Failed to build transaction");
        }
    };

    const confirmAutoStart = () => {
        setShowAutoStartModal(false);
        handleDeploy();
    };

    useEffect(() => {
        if (account?.address) {
            const seed = account.address.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const randomValue = (seed * 12345) % 100000;
            const randomProfit = (randomValue * 0.12).toFixed(2);

            setStats({
                apy: "14.2%",
                netWorth: `$${randomValue.toLocaleString()}`,
                profit: `+$${randomProfit}`
            });

            setLogs(prev => [`[KERNEL] Authenticated user: ${account.address.slice(0, 6)}...`, ...prev]);
        }
    }, [account]);

    useEffect(() => {
        const interval = setInterval(() => {
            const newLog = `[UPDATE] Market volatility scan: LOW (${new Date().toLocaleTimeString()})`;
            setLogs(prev => [newLog, ...prev].slice(0, 10));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    // SVG Chart Data Generator (Mock)
    const chartPath = "M0,100 C20,90 40,110 60,80 C80,50 100,90 120,40 C140,20 160,60 180,30 C200,10 220,40 240,20 L240,150 L0,150 Z";
    const linePath = "M0,100 C20,90 40,110 60,80 C80,50 100,90 120,40 C140,20 160,60 180,30 C200,10 220,40 240,20";

    // --- ACCESS GUARD: Require Wallet Connection ---
    if (!account) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
                {/* Background Elements */}
                <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[120px]"></div>

                <div className="text-center space-y-6 z-10 glass-panel p-8 md:p-12 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl relative">
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                        <div className="absolute inset-0 bg-neon-cyan/20 rounded-full animate-pulse-slow"></div>
                        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-neon-cyan relative z-10"><rect width="20" height="14" x="2" y="5" rx="2" /><line x1="2" x2="22" y1="10" y2="10" /></svg>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter text-white">DASHBOARD LOCKED</h2>
                        <p className="text-gray-400 text-sm font-light leading-relaxed">
                            Secure connection required using <strong>zkLogin</strong> or <strong>Sui Wallet</strong> to view active agent strategies.
                        </p>
                    </div>

                    <div className="flex justify-center pt-4 pb-2">
                        <ConnectButton className="!bg-neon-cyan !text-black !font-bold !px-8 !py-3 !rounded-lg !hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] !transition-all !w-full !justify-center" />
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">
            <Navbar />

            {/* Auto-Start Confirmation Modal */}
            {showAutoStartModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0f0a1f] border border-neon-cyan/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,243,255,0.2)] text-center"
                    >
                        <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <span className="text-3xl">🚀</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Deploy Autonomous Agent?</h2>
                        <p className="text-gray-400 mb-8">
                            You are about to authorize the AI Agent to execute the atomic flash loan strategy.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowAutoStartModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors font-mono font-bold"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmAutoStart}
                                className="flex-1 px-4 py-3 rounded-xl bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all font-mono font-bold shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                            >
                                CONFIRM DEPLOY
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

                {/* Main Chart Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden min-h-[400px]"
                >
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-1">My Net Worth</h2>
                            <div className="text-4xl font-mono text-white flex items-center gap-2">
                                {stats.netWorth}
                                <span className="text-sm text-green-400 bg-green-400/10 px-2 py-0.5 rounded">+2.4%</span>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {['1H', '1D', '1W', '1M'].map((tf) => (
                                <button key={tf} className="text-xs font-mono px-3 py-1 rounded hover:bg-white/10 transition-colors text-gray-400 hover:text-white">
                                    {tf}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom SVG Chart */}
                    <div className="flex-1 w-full h-full relative flex items-end">
                        <svg className="w-full h-64 overflow-visible" viewBox="0 0 240 150" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#00f3ff" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#00f3ff" stopOpacity="0" />
                                </linearGradient>
                            </defs>

                            {/* Fake Volume/Depth Bars */}
                            {[20, 40, 60, 80, 100, 120, 140, 160, 180, 200, 220].map((x, i) => (
                                <rect
                                    key={i}
                                    x={x}
                                    y={140}
                                    width={15}
                                    height={10}
                                    fill="#00f3ff"
                                    opacity={0.1}
                                >
                                    <animate attributeName="height" values="10;40;10" dur={`${1.5 + (i % 3) * 0.5}s`} repeatCount="indefinite" />
                                    <animate attributeName="y" values="140;110;140" dur={`${1.5 + (i % 3) * 0.5}s`} repeatCount="indefinite" />
                                </rect>
                            ))}

                            <path d={chartPath} fill="url(#chartGradient)" />
                            <path d={linePath} fill="none" stroke="#00f3ff" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                            {/* Animated dot at the end */}
                            <circle cx="240" cy="20" r="3" fill="#fff" className="animate-pulse">
                                <animate attributeName="r" values="3;6;3" dur="2s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="1;0.5;1" dur="2s" repeatCount="indefinite" />
                            </circle>
                        </svg>
                    </div>
                </motion.div>

                {/* Right Column: Stats & Agent Controls */}
                <div className="space-y-6">

                    {/* Active Strategy Card */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-6 rounded-2xl relative overflow-hidden"
                    >
                        <div className="absolute -right-10 -top-10 h-32 w-32 opacity-50">
                            <Canvas>
                                <Suspense fallback={null}>
                                    <NeuralOrbSmall />
                                    <Environment preset="city" />
                                </Suspense>
                            </Canvas>
                        </div>

                        <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4">Agent Status</h3>

                        <div className="space-y-4 relative z-10">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span>Status</span>
                                <span className="text-green-400 font-mono text-sm flex items-center gap-2">
                                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                                    RUNNING
                                </span>
                            </div>
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                <span>Risk Level</span>
                                <span className="text-yellow-400 font-mono text-sm">MODERATE</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Daily Yield</span>
                                <span className="text-neon-cyan font-mono text-sm">0.45%</span>
                            </div>
                        </div>

                        <div className="mt-6 flex gap-2">
                            <button
                                onClick={handleDeploy}
                                className="flex-1 bg-neon-cyan text-black py-2 rounded-lg text-xs font-bold hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all font-mono flex items-center justify-center gap-2 group"
                            >
                                <span className="group-hover:animate-pulse">⚡</span> DEPLOY STRATEGY
                            </button>
                            <button className="w-1/4 bg-red-500/10 text-red-400 border border-red-500/30 py-2 rounded-lg text-xs hover:bg-red-500/20 transition-all font-mono">
                                STOP
                            </button>
                        </div>
                    </motion.div>

                    {/* Agent Logs */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-4 rounded-2xl h-[300px] flex flex-col"
                    >
                        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Execution Log</span>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">LIVE</span>
                        </h3>
                        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="text-white/70 border-l-2 border-neon-purple/50 pl-2 py-0.5 hover:bg-white/5 transition-colors">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[120px]"></div>
            </div>

        </div>
    );
}

export default function Dashboard() {
    return (
        <main className="min-h-screen">
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-neon-cyan font-mono animate-pulse">Initializing Dashboard...</p>
                    </div>
                </div>
            }>
                <DashboardContent />
            </Suspense>
        </main>
    )
}
