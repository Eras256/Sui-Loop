"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity, TrendingUp, DollarSign, Zap, Server, Wallet } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";


const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-${color}/50 transition-colors`}
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
            {/* Dynamic color class handling needs explicit classes or style */}
            <Icon className={`w-24 h-24 text-${color}`} style={{ color: color === 'neon-cyan' ? '#00f3ff' : undefined }} />
        </div>
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-${color}/20 text-${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-gray-400 text-sm font-medium">{title}</span>
        </div>
        <div className="text-3xl font-bold text-white mb-1 font-mono">{value}</div>
        <div className={`text-xs font-mono flex items-center gap-1 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {change.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
            {change}
        </div>
    </motion.div>
);

export default function AnalyticsPage() {
    const account = useCurrentAccount();
    const [activeStrategies, setActiveStrategies] = useState<any[]>([]);
    const [scallopData, setScallopData] = useState<any>(null);
    const [chartData, setChartData] = useState<any[]>([]);

    // Get SUI Balance
    const { data: balanceData } = useSuiClientQuery(
        "getBalance",
        { owner: account?.address || "" },
        { enabled: !!account }
    );

    const userBalance = balanceData ? parseInt(balanceData.totalBalance) / 1_000_000_000 : 0;

    // Load Data
    useEffect(() => {
        // 1. Load Fleet (only RUNNING strategies, same as Dashboard)
        if (account?.address) {
            const saved = localStorage.getItem(`sui-loop-fleet-${account.address}`);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Filter out DRAFT strategies to match Dashboard count
                const running = parsed.filter((s: any) => s.status !== 'DRAFT');
                setActiveStrategies(running);
            }
        } else {
            setActiveStrategies([]);
        }

        // 2. Load Scallop Data (Simulated Fetch for this page if service not shared)
        // Ideally import { getScallopData } from '@/services/...'
        const fetchData = async () => {
            // Re-using logic: fetch from API or mock live data
            try {
                // Mock live fetch for demo (or use real fetch if endpoint exists)
                const mockDiff = (Math.random() * 0.5).toFixed(2);
                setScallopData({ supplyApy: 11.45 + Number(mockDiff), borrowApy: 8.2 });
            } catch (e) { }
        };
        fetchData();

        // 3. Generate "Real" Chart based on balance
        // In a real app, this comes from an indexer. Here we project based on current balance.
        const now = new Date();
        const mockHistory = Array.from({ length: 7 }).map((_, i) => {
            const time = new Date(now.getTime() - (6 - i) * 4 * 60 * 60 * 1000);
            return {
                name: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                value: userBalance > 0 ? (userBalance * (1 + (i * 0.001))).toFixed(2) : (1000 + i * 50).toFixed(0), // Fake growth if 0
                apy: (10 + Math.random() * 2).toFixed(2)
            };
        });
        setChartData(mockHistory);
    }, [userBalance]);

    // Calculate Dynamic Metrics
    const dailyYield = userBalance * ((scallopData?.supplyApy || 12) / 100 / 365);
    const totalValueLocked = activeStrategies.length * 500 + userBalance; // Assuming ~500 SUI per strategy logic

    return (
        <main className="min-h-screen pt-36 px-4 pb-12 relative overflow-hidden">
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-neon-purple/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-white tracking-tight">INTELLIGENCE OPS</h1>
                            <span className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] font-mono rounded border border-neon-cyan/20">
                                v0.0.7
                            </span>
                        </div>
                        <p className="text-gray-400 font-mono text-sm">Real-time surveillance of on-chain liquidity vectors {account ? `// TARGET: ${account.address.slice(0, 6)}...${account.address.slice(-4)}` : '// GUEST MODE'}</p>
                    </div>
                    {!account && (
                        <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-xs font-mono animate-pulse">
                            [!] ENCRYPTED FEED - CONNECT WALLET
                        </div>
                    )}
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard
                        title="Liquidity Deployed"
                        value={userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        change="READY"
                        icon={Wallet}
                        color="neon-cyan"
                    />
                    <StatCard
                        title="Active Agents"
                        value={activeStrategies.length}
                        change={activeStrategies.length > 0 ? "ENGAGED" : "STANDBY"}
                        icon={Server}
                        color="amber-500"
                    />
                    <StatCard
                        title="Alpha Capture (24h)"
                        value={`+${dailyYield.toFixed(3)} SUI`}
                        change={`APROX $${(dailyYield * 3.42).toFixed(2)}`}
                        icon={TrendingUp}
                        color="green-500"
                    />
                    <StatCard
                        title="Benchmark Rate"
                        value={`${scallopData?.supplyApy.toFixed(2) || '0.00'}%`}
                        change="+0.45% (24h)"
                        icon={Activity}
                        color="neon-purple"
                    />
                </div>

                {/* Charts Area */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 glass-panel border border-white/10 rounded-2xl p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold flex items-center gap-2 tracking-tight">
                                PERFORMANCE VECTOR
                                <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded font-mono">[PROJECTION]</span>
                            </h3>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 text-xs rounded-full bg-white/10 text-white hover:bg-white/20 font-mono">24H</button>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={10} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#00f3ff' }}
                                    />
                                    <Area type="monotone" dataKey="value" stroke="#00f3ff" strokeWidth={2} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Side Stats */}
                    <div className="space-y-6">
                        <div className="glass-panel border border-white/10 rounded-2xl p-6">
                            <h3 className="text-lg font-bold mb-4 text-gray-200 tracking-tight">TARGET ACQUISITION RADAR</h3>
                            <div className="space-y-4">
                                {[
                                    { name: "Scallop SUI Supply", vol: "STABLE", apy: `${(scallopData?.supplyApy || 11).toFixed(2)}%` },
                                    { name: "Cetus SUI/USDC", vol: "VOLATILE", apy: "45.2%" },
                                    { name: "DeepBook V3 Limit", vol: "LOW RISK", apy: "8.5%" },
                                ].map((pool, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-cyan/30 transition-colors cursor-pointer group">
                                        <span className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors">{pool.name}</span>
                                        <div className="text-right">
                                            <div className="text-xs text-green-400 font-bold font-mono">{pool.apy}</div>
                                            <div className="text-[10px] text-gray-500 font-mono">{pool.vol}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-panel border border-neon-purple/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2 text-white tracking-tight">ATOMIC INTEGRITY</h3>
                                <div className="text-4xl font-bold text-white mb-2 font-mono">100%</div>
                                <div className="text-sm text-gray-300 mb-4 font-mono">ZERO_SLIPPAGE_ACTIVE</div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-neon-purple w-full rounded-full shadow-[0_0_10px_#bd00ff]" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
