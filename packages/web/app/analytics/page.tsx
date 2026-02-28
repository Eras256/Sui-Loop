"use client";

import { motion } from "framer-motion";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { Activity, TrendingUp, DollarSign, Zap, Server, Wallet, Database } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// ── Helpers ──────────────────────────────────────────────────────────────
type ChangeVariant = 'positive' | 'negative' | 'neutral' | 'status';

function changeColor(change: string): string {
    if (change.startsWith('+')) return 'text-green-400';
    if (change.startsWith('-')) return 'text-red-400';
    // status strings like READY / ENGAGED / STANDBY / LIVE
    if (['ENGAGED', 'LIVE', 'ACTIVE'].includes(change)) return 'text-neon-cyan';
    if (['STANDBY', 'IDLE'].includes(change)) return 'text-amber-400';
    return 'text-gray-400';
}

function changeIcon(change: string) {
    if (change.startsWith('+')) return <TrendingUp className="w-3 h-3" />;
    if (change.startsWith('-')) return <Activity className="w-3 h-3" />;
    return <Zap className="w-3 h-3" />;
}

// ── StatCard ──────────────────────────────────────────────────────────────
const StatCard = ({ title, value, change, icon: Icon, color, isStatus }: any) => {
    const { t } = useLanguage();

    const displayChange = isStatus ? t(`analytics.status.${change.toLowerCase()}`) : change;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group hover:border-white/20 transition-colors"
        >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Icon className="w-24 h-24" style={{
                    color: color === 'neon-cyan' ? '#00f3ff' :
                        color === 'neon-purple' ? '#bd00ff' :
                            color === 'amber-500' ? '#f59e0b' :
                                color === 'green-500' ? '#22c55e' :
                                    color === 'blue-500' ? '#3b82f6' : '#ffffff'
                }} />
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-white/10">
                    <Icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-gray-400 text-sm font-medium">{title}</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1 font-mono">{value}</div>
            <div className={`text-xs font-mono flex items-center gap-1 ${changeColor(change)}`}>
                {changeIcon(change)}
                {displayChange}
            </div>
        </motion.div>
    );
};

// ── generate chart points ─────────────────────────────────────────────────
function generateHistory(points: number, hoursBack: number, baseBalance: number) {
    const now = new Date();
    return Array.from({ length: points }).map((_, i) => {
        const time = new Date(now.getTime() - (points - 1 - i) * hoursBack * 60 * 60 * 1000);
        const label = hoursBack < 24
            ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : time.toLocaleDateString([], { month: 'short', day: 'numeric' });
        const base = baseBalance > 0 ? baseBalance : 1000;
        return {
            name: label,
            // Deterministic curve instead of random
            value: parseFloat((base * (1 + i * 0.001 + Math.sin(i) * 0.0005)).toFixed(2)),
            apy: parseFloat((10 + Math.sin(i) * 1).toFixed(2))
        };
    });
}

// ── Page ──────────────────────────────────────────────────────────────────
type TimeRange = '24H' | '7D' | '30D';

export default function AnalyticsPage() {
    const account = useCurrentAccount();
    const { t } = useLanguage();
    const [activeStrategies, setActiveStrategies] = useState<any[]>([]);
    const [scallopData, setScallopData] = useState<any>(null);
    const [timeRange, setTimeRange] = useState<TimeRange>('24H');
    const [chartData, setChartData] = useState<any[]>([]);

    // Get SUI Balance
    const { data: balanceData } = useSuiClientQuery(
        "getBalance",
        { owner: account?.address || "" },
        { enabled: !!account }
    );

    const userBalance = balanceData ? parseInt(balanceData.totalBalance) / 1_000_000_000 : 0;

    // Rebuild chart whenever timeRange or balance changes
    useEffect(() => {
        const cfg: Record<TimeRange, { points: number; hoursBack: number }> = {
            '24H': { points: 7, hoursBack: 4 },
            '7D': { points: 7, hoursBack: 24 },
            '30D': { points: 10, hoursBack: 72 },
        };
        const { points, hoursBack } = cfg[timeRange];
        setChartData(generateHistory(points, hoursBack, userBalance));
    }, [timeRange, userBalance]);

    // Load strategies & Scallop data
    useEffect(() => {
        if (account?.address) {
            const loadFleet = async () => {
                try {
                    const { StrategyService } = await import("@/lib/strategyService");
                    const fleet = await StrategyService.getStrategies(account.address);

                    const localKey = `sui-loop-fleet-${account.address}`;
                    const localRaw = localStorage.getItem(localKey);
                    let merged = [...fleet];

                    if (localRaw) {
                        const local = JSON.parse(localRaw) as any[];
                        const localMap = new Map();
                        local.forEach(item => {
                            if (item.id) localMap.set(item.id, item);
                        });
                        const distinctLocal = Array.from(localMap.values());
                        const uniqueLocals = distinctLocal.filter((l: any) =>
                            !fleet.some(dbS =>
                                (dbS.strategy_id && dbS.strategy_id === l.id) ||
                                (dbS.name === l.name)
                            )
                        );
                        merged = [...merged, ...uniqueLocals];
                    }

                    if (merged.length > 0) {
                        const finalMap = new Map();
                        merged.forEach(item => {
                            const isCustom = item.id?.startsWith('custom-') || item.strategy_id?.startsWith('custom-');
                            const key = isCustom ? (item.name || item.id) : (item.id || item.name);
                            if (key && !finalMap.has(key)) {
                                finalMap.set(key, item);
                            }
                        });
                        const finalDeduped = Array.from(finalMap.values());
                        const activeOnly = finalDeduped.filter(s => s.status !== 'DRAFT');
                        setActiveStrategies(activeOnly);
                    } else {
                        setActiveStrategies([]);
                    }
                } catch (e) {
                    console.error("Supabase sync failed, using local", e);
                    const saved = localStorage.getItem(`sui-loop-fleet-${account.address}`);
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        setActiveStrategies(parsed.filter((s: any) => s.status !== 'DRAFT'));
                    }
                }
            };
            loadFleet();
        } else {
            setActiveStrategies([]);
        }

        // Deterministic mock data instead of random
        const mockDiff = Math.sin(new Date().getHours()) * 0.5;
        setScallopData({ supplyApy: 11.45 + mockDiff, borrowApy: 8.2 });
    }, [account?.address]);

    // Derived metrics
    const dailyYield = userBalance * ((scallopData?.supplyApy || 12) / 100 / 365);
    const tvl = activeStrategies.length * 500 + userBalance;
    const suiStrategies = activeStrategies.filter(s => !s.asset || s.asset === 'SUI').length;
    const usdcStrategies = activeStrategies.filter(s => s.asset === 'USDC').length;

    return (
        <main className="min-h-screen pt-36 px-4 pb-0 relative overflow-hidden flex flex-col">
            <Navbar />

            {/* Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] right-[-20%] w-[800px] h-[800px] bg-neon-purple/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[120px]"></div>
            </div>

            <div className="max-w-7xl mx-auto relative z-10 flex-1 w-full mb-32">
                {/* Header */}
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-4xl font-bold text-white tracking-tight">{t('analytics.title')}</h1>
                            <span className="px-2 py-0.5 bg-neon-cyan/10 text-neon-cyan text-[10px] font-mono rounded border border-neon-cyan/20">
                                v1.0.0
                            </span>
                        </div>
                        <p className="text-gray-400 font-mono text-sm">
                            {t('analytics.subtitle')}{" "}
                            {account
                                ? `// ${t('analytics.target')}: ${account.address.slice(0, 6)}...${account.address.slice(-4)}`
                                : `// ${t('analytics.guestMode')}`}
                        </p>
                    </div>

                    {/* Asset breakdown pill */}
                    <div className="flex items-center gap-3 flex-wrap">
                        {activeStrategies.length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-mono">
                                <span className="bg-blue-500/20 text-[#4ca2ff] px-2 py-0.5 rounded font-bold">{suiStrategies} SUI</span>
                                <span className="bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded font-bold">{usdcStrategies} USDC</span>
                                <span className="text-gray-500">{t('analytics.vaults')}</span>
                            </div>
                        )}
                        {!account && (
                            <div className="px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 rounded-lg text-xs font-mono animate-pulse">
                                {t('analytics.encryptedFeed')}
                            </div>
                        )}
                    </div>
                </header>

                {/* KPI Grid — 5 cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-10">
                    <StatCard
                        title={t('analytics.kpi.walletBalance')}
                        value={userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        change="READY"
                        isStatus
                        icon={Wallet}
                        color="neon-cyan"
                    />
                    <StatCard
                        title={t('analytics.kpi.activeAgents')}
                        value={activeStrategies.length}
                        change={activeStrategies.length > 0 ? "ENGAGED" : "STANDBY"}
                        isStatus
                        icon={Server}
                        color="amber-500"
                    />
                    <StatCard
                        title={t('analytics.kpi.alphaCapture')}
                        value={`+${dailyYield.toFixed(3)}`}
                        change={`+$${(dailyYield * 3.42).toFixed(2)} ${t('analytics.usd')}`}
                        icon={TrendingUp}
                        color="green-500"
                    />
                    <StatCard
                        title={t('analytics.kpi.tvlManaged')}
                        value={`$${tvl.toFixed(0)}`}
                        change={tvl > 0 ? "LIVE" : "STANDBY"}
                        isStatus
                        icon={Database}
                        color="blue-500"
                    />
                    <StatCard
                        title={t('analytics.kpi.neuralReputation')}
                        value={`742 ${t('analytics.kpi.pts')}`}
                        change={t('analytics.kpi.dailyChange').replace('{unit}', t('analytics.kpi.pts'))}
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
                                {t('analytics.chart.title')}
                                <span className="text-xs font-normal text-gray-500 bg-white/5 px-2 py-0.5 rounded font-mono">[{t('analytics.chart.projection')}]</span>
                            </h3>
                            <div className="flex gap-1.5">
                                {(['24H', '7D', '30D'] as TimeRange[]).map(r => (
                                    <button
                                        key={r}
                                        onClick={() => setTimeRange(r)}
                                        className={`px-3 py-1 text-xs rounded-full font-mono transition-all ${timeRange === r
                                            ? 'bg-neon-cyan text-black font-bold'
                                            : 'bg-white/10 text-white hover:bg-white/20'
                                            }`}
                                    >
                                        {r}
                                    </button>
                                ))}
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
                            <h3 className="text-lg font-bold mb-4 text-gray-200 tracking-tight">{t('analytics.radar.title')}</h3>
                            <div className="space-y-3">
                                {[
                                    { name: t('analytics.radar.pools.scallop'), vol: t('analytics.radar.stable'), apy: `${(scallopData?.supplyApy || 11).toFixed(2)}%`, asset: 'SUI' },
                                    { name: t('analytics.radar.pools.navi'), vol: t('analytics.radar.stable'), apy: "9.40%", asset: 'USDC' },
                                    { name: t('analytics.radar.pools.cetus'), vol: t('analytics.radar.volatile'), apy: "45.2%", asset: 'SUI' },
                                    { name: t('analytics.radar.pools.deepbook'), vol: t('analytics.radar.lowRisk'), apy: "8.5%", asset: 'SUI' },
                                    { name: t('analytics.radar.pools.matrix'), vol: t('analytics.radar.live'), apy: t('analytics.radar.active'), asset: 'LOG' },
                                ].map((pool, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-neon-cyan/30 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${pool.asset === 'USDC' ? 'bg-neon-purple/20 text-neon-purple' :
                                                pool.asset === 'LOG' ? 'bg-pink-500/20 text-pink-400' :
                                                    'bg-blue-500/20 text-[#4ca2ff]'
                                                }`}>{pool.asset}</span>
                                            <span className="font-mono text-sm text-gray-300 group-hover:text-white transition-colors">{pool.name}</span>
                                        </div>
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
                                <h3 className="text-lg font-bold mb-2 text-white tracking-tight">{t('analytics.integrity.title')}</h3>
                                <div className="text-4xl font-bold text-white mb-1 font-mono">100%</div>
                                <div className="text-sm text-gray-300 mb-3 font-mono">{t('analytics.integrity.zeroSlippage')}</div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-[10px] bg-blue-500/20 text-[#4ca2ff] px-2 py-0.5 rounded font-mono font-bold">SUI</span>
                                    <span className="text-[10px] bg-neon-purple/20 text-neon-purple px-2 py-0.5 rounded font-mono font-bold">USDC</span>
                                    <span className="text-[10px] text-gray-500 font-mono">{t('analytics.integrity.vaultTypes')}</span>
                                </div>
                                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-neon-purple w-full rounded-full shadow-[0_0_10px_#bd00ff]" />
                                </div>
                                <div className="mt-3 text-[10px] font-mono text-gray-500 flex items-center gap-1">
                                    <span className="text-pink-400">◉</span> {t('analytics.integrity.walrusArmed')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
