import type { Metadata } from "next";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Link from "next/link";
import { AlertTriangle, TrendingDown, Zap, Globe, Shield, BarChart2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Risk Disclosure | SuiLoop Protocol",
    description: "Comprehensive risk disclosure for SuiLoop DeFi software. Flash loans, smart contract risks, market risks, and regulatory risks explained.",
};

const risks = [
    {
        level: "CRITICAL",
        color: "red",
        icon: AlertTriangle,
        title: "Total Loss of Funds",
        description: "You may lose all funds deposited into a Vault. DeFi strategies are experimental and operate in volatile, adversarial market conditions. No amount of simulation or backtesting guarantees profitability on mainnet. Flash loans that fail revert, but gas fees are still consumed. Smart contract exploits, oracle manipulation, and liquidity crises can cause permanent, unrecoverable loss."
    },
    {
        level: "CRITICAL",
        color: "red",
        icon: TrendingDown,
        title: "Smart Contract Risk",
        description: "The SuiLoop smart contracts (atomic_engine.move) have been developed with formal verification via Move Prover and follow security best practices (Hot Potato Pattern, capability-based access control). However, NO smart contract can be guaranteed to be free from bugs. An exploit in the contract code or in a dependency (Scallop, Cetus, Navi, DeepBook) could result in total loss of funds locked in Vaults."
    },
    {
        level: "HIGH",
        color: "orange",
        icon: BarChart2,
        title: "Market & Liquidity Risk",
        description: "Flash loan arbitrage strategies depend on the existence of price inefficiencies between DeFi pools. Market conditions change rapidly. During periods of high volatility, low liquidity, or market stress (e.g., a token depeg event), strategy execution may fail repeatedly, consuming gas fees without generating profit. Strategies that were profitable in simulation may be consistently unprofitable on mainnet due to MEV bots, front-running, or spread compression."
    },
    {
        level: "HIGH",
        color: "orange",
        icon: Zap,
        title: "Network & Gas Risk",
        description: "All on-chain operations require SUI for gas fees. Network congestion on Sui can increase gas prices unpredictably. Failed transactions (due to insufficient profit, slippage exceeding minimums, or other on-chain errors) still consume gas. Over many failed attempts, cumulative gas costs may exceed any profits generated. Ensure you maintain sufficient SUI in your wallet for ongoing gas coverage."
    },
    {
        level: "HIGH",
        color: "yellow",
        icon: Globe,
        title: "Regulatory & Legal Risk",
        description: "The legal status of DeFi software varies by jurisdiction and is subject to rapid change. In Mexico, the LFPIORPI (reformed July 16, 2025) may impose reporting obligations on certain operators of virtual asset infrastructure. Users are solely responsible for ensuring their use of SuiLoop complies with all applicable laws, including tax laws, AML/KYC regulations, and any local restrictions on DeFi activity. Failure to comply may result in fines, sanctions, or criminal liability. SuiLoop provides no legal advice."
    },
    {
        level: "MEDIUM",
        color: "blue",
        icon: Shield,
        title: "Oracle & Data Risk",
        description: "SuiLoop integration with Pyth Network oracles for real-time price data. Oracle data may be stale, incorrect, or subject to manipulation attacks. Strategy decisions made based on incorrect oracle data may result in losses. External API data displayed in the dashboard (Scallop APY, Navi rates, market sentiment) is obtained from third-party sources and may be delayed, inaccurate, or become unavailable."
    }
];

const colorMap: Record<string, { border: string; bg: string; text: string; badge: string; badgeText: string }> = {
    red: {
        border: "border-red-500/30",
        bg: "bg-red-500/5",
        text: "text-red-400",
        badge: "bg-red-500/20 border-red-500/40",
        badgeText: "text-red-300"
    },
    orange: {
        border: "border-orange-500/30",
        bg: "bg-orange-500/5",
        text: "text-orange-400",
        badge: "bg-orange-500/20 border-orange-500/40",
        badgeText: "text-orange-300"
    },
    yellow: {
        border: "border-yellow-500/30",
        bg: "bg-yellow-500/5",
        text: "text-yellow-400",
        badge: "bg-yellow-500/20 border-yellow-500/40",
        badgeText: "text-yellow-300"
    },
    blue: {
        border: "border-blue-500/30",
        bg: "bg-blue-500/5",
        text: "text-blue-400",
        badge: "bg-blue-500/20 border-blue-500/40",
        badgeText: "text-blue-300"
    }
};

export default function RiskDisclosurePage() {
    return (
        <div className="min-h-screen bg-[#030014] text-white">
            <Navbar />

            {/* Hero */}
            <div className="relative pt-28 pb-12 px-4">
                <div className="absolute inset-0 z-0 bg-gradient-radial from-red-900/10 to-transparent" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-4 py-2 mb-6">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-xs font-mono text-red-300 uppercase tracking-wider">Risk Disclosure</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        Extended Risk Disclosure
                    </h1>
                    <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                        Read this document carefully before using SuiLoop. By deploying a Vault or executing any on-chain strategy, you acknowledge you have read, understood, and accepted all risks described herein.
                    </p>
                </div>
            </div>

            {/* Absolute Warning */}
            <div className="max-w-4xl mx-auto px-4 mb-10">
                <div className="bg-red-900/20 border-2 border-red-500/50 rounded-2xl p-6">
                    <div className="flex gap-4">
                        <AlertTriangle className="w-8 h-8 text-red-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-red-300 font-bold text-base mb-2">⚠️ CRITICAL WARNING — READ BEFORE PROCEEDING</p>
                            <p className="text-red-200/80 text-sm leading-relaxed">
                                DeFi is highly experimental. Only interact with SuiLoop using funds you can afford to lose entirely. SuiLoop is software infrastructure, not a financial product. No entity — including SuiLoop operators — can recover funds lost due to smart contract failures, market volatility, or user error. Transactions on Sui are irreversible. There is no customer support for on-chain operations.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Cards */}
            <div className="max-w-4xl mx-auto px-4 pb-24 space-y-5">
                {risks.map((risk, i) => {
                    const styles = colorMap[risk.color];
                    const Icon = risk.icon;
                    return (
                        <div
                            key={i}
                            className={`border ${styles.border} ${styles.bg} rounded-2xl p-6`}
                        >
                            <div className="flex items-start gap-4 mb-3">
                                <Icon className={`w-6 h-6 ${styles.text} shrink-0 mt-0.5`} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={`text-[9px] font-mono font-bold border px-2 py-0.5 rounded-full ${styles.badge} ${styles.badgeText} uppercase tracking-widest`}>
                                            {risk.level}
                                        </span>
                                        <h3 className="font-bold text-white text-base">{risk.title}</h3>
                                    </div>
                                    <p className="text-gray-400 text-sm leading-relaxed">
                                        {risk.description}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Acknowledgement Box */}
                <div className="bg-white/3 border border-white/10 rounded-2xl p-8 text-center">
                    <Shield className="w-10 h-10 text-neon-cyan mx-auto mb-4" />
                    <h3 className="text-white font-bold text-lg mb-2">By Using SuiLoop, You Acknowledge</h3>
                    <ul className="text-gray-400 text-sm space-y-2 text-left max-w-lg mx-auto mt-4">
                        {[
                            "You have read the full Terms of Service and Risk Disclosure.",
                            "You understand you may lose all deposited funds.",
                            "SuiLoop is software-only and not a regulated financial service.",
                            "You take sole responsibility for compliance with your local laws.",
                            "You are not a Restricted Person under applicable sanctions laws.",
                            "You are at least 18 years old.",
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-2">
                                <span className="text-neon-cyan mt-1 shrink-0">✓</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-wrap gap-3 justify-center pt-2">
                    <Link href="/terms" className="text-xs font-mono text-gray-400 hover:text-neon-cyan transition-colors border border-white/10 px-4 py-2 rounded-lg hover:border-neon-cyan/30">
                        ← Terms of Service
                    </Link>
                    <Link href="/dashboard" className="text-xs font-mono text-gray-400 hover:text-neon-cyan transition-colors border border-white/10 px-4 py-2 rounded-lg hover:border-neon-cyan/30">
                        → Launch Dashboard
                    </Link>
                </div>
            </div>

            <Footer />
        </div>
    );
}
