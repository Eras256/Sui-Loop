"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity, TrendingUp, DollarSign, Zap, Server } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

// Mock Data for Charts
const data = [
    { name: '00:00', volume: 4000, tvl: 2400 },
    { name: '04:00', volume: 3000, tvl: 1398 },
    { name: '08:00', volume: 2000, tvl: 9800 },
    { name: '12:00', volume: 2780, tvl: 3908 },
    { name: '16:00', volume: 1890, tvl: 4800 },
    { name: '20:00', volume: 2390, tvl: 3800 },
    { name: '24:00', volume: 3490, tvl: 4300 },
];

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-${color}/50 transition-colors`}
    >
        <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity`}>
            <Icon className={`w-24 h-24 text-${color}`} />
        </div>
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-${color}/20 text-${color}`}>
                <Icon className="w-5 h-5" />
            </div>
            <span className="text-gray-400 text-sm font-medium">{title}</span>
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className={`text-xs font-mono flex items-center gap-1 ${change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>
            {change.startsWith('+') ? <TrendingUp className="w-3 h-3" /> : <Activity className="w-3 h-3" />}
            {change} vs last 24h
        </div>
    </motion.div>
);

export default function AnalyticsPage() {
    return (
        <main className="min-h-screen bg-black text-white pt-24 px-4 pb-12">
            <Navbar />
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-neon-cyan/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-neon-purple/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-7xl mx-auto relative z-10">
                <header className="mb-10">
                    <h1 className="text-4xl font-bold mb-2">Protocol Analytics</h1>
                    <p className="text-gray-400">Real-time metrics from SuiLoop Atomic Engine & Flash Loans</p>
                </header>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                    <StatCard title="Total Volume (24h)" value="$4.2M" change="+12.5%" icon={Activity} color="neon-cyan" />
                    <StatCard title="Flash Loans Executed" value="1,248" change="+8.3%" icon={Zap} color="neon-purple" />
                    <StatCard title="Active Agents" value="342" change="+24.1%" icon={Server} color="amber-500" />
                    <StatCard title="Protocol Revenue" value="$12.4k" change="+5.2%" icon={DollarSign} color="green-500" />
                </div>

                {/* Charts Area */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Chart */}
                    <div className="lg:col-span-2 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xl font-bold">Flash Loan Volume</h3>
                            <div className="flex gap-2">
                                <button className="px-3 py-1 text-xs rounded-full bg-white/10 text-white hover:bg-white/20">1D</button>
                                <button className="px-3 py-1 text-xs rounded-full bg-transparent text-gray-400 hover:text-white">1W</button>
                                <button className="px-3 py-1 text-xs rounded-full bg-transparent text-gray-400 hover:text-white">1M</button>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={data}>
                                    <defs>
                                        <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#00f3ff" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#00f3ff" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                    <XAxis dataKey="name" stroke="#666" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#666" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                                        itemStyle={{ color: '#fff' }}
                                    />
                                    <Area type="monotone" dataKey="volume" stroke="#00f3ff" strokeWidth={2} fillOpacity={1} fill="url(#colorVolume)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Side Stats */}
                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                            <h3 className="text-lg font-bold mb-4 text-gray-200">Top Pools</h3>
                            <div className="space-y-4">
                                {[
                                    { name: "SUI/USDC", vol: "$1.2M", apy: "12%" },
                                    { name: "SUI/DEEP", vol: "$850k", apy: "45%" },
                                    { name: "DeepBook V3", vol: "$420k", apy: "8.5%" },
                                ].map((pool, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-cyan/30 transition-colors">
                                        <span className="font-mono text-sm">{pool.name}</span>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-white">{pool.vol}</div>
                                            <div className="text-xs text-green-400">APY {pool.apy}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-gradient-to-br from-neon-purple/20 to-black border border-neon-purple/30 rounded-2xl p-6 relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-2">Simulation Status</h3>
                                <div className="text-3xl font-bold text-white mb-2">Active</div>
                                <div className="text-sm text-gray-300 mb-4">Fallback Layer Operational</div>
                                <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-500 w-[98%] rounded-full animate-pulse" />
                                </div>
                                <div className="flex justify-between text-xs mt-1 text-gray-400">
                                    <span>Uptime</span>
                                    <span>99.9%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
