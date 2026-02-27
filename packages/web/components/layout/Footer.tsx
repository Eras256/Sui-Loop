'use client';

import Link from "next/link";
import { ExternalLink, Zap, Shield, Activity } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const PROTOCOL_LINK_KEYS = [
    { key: "footer.links.dashboard", href: "/dashboard" },
    { key: "footer.links.analytics", href: "/analytics" },
    { key: "footer.links.strategies", href: "/strategies" },
    { key: "footer.links.builder", href: "/strategies/builder" },
    { key: "footer.links.marketplace", href: "/marketplace" },
    { key: "footer.links.plugins", href: "/plugins" },
];

const INTEL_LINK_KEYS = [
    { key: "footer.links.agents", href: "/agents" },
    { key: "footer.links.manifesto", href: "/manifesto" },
    { key: "footer.links.howToUse", href: "/how-to-use" },
    { key: "footer.links.docs", href: "/docs" },
    { key: "footer.links.terms", href: "/terms" },
    { key: "footer.links.risk", href: "/risk-disclosure" },
    {
        key: "footer.links.source",
        href: "https://suiscan.xyz/mainnet/object/0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0",
        external: true,
    },
];

const TECH_BADGES = [
    { label: "Scallop", color: "teal" },
    { label: "Cetus", color: "cyan" },
    { label: "Navi", color: "blue" },
    { label: "ElizaOS", color: "purple" },
    { label: "DeepBook V3", color: "indigo" },
    { label: "Walrus Storage", color: "orange" },
    { label: "Move Verified", color: "green" },
    { label: "Supabase", color: "emerald" },
    { label: "USDC", color: "violet" },
    { label: "Pyth Network", color: "amber" },
];

const COLOR_MAP: Record<string, string> = {
    teal: "bg-teal-500/10 text-teal-400 border-teal-500/20",
    cyan: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
    purple: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    orange: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    green: "bg-green-500/10 text-green-400 border-green-500/20",
    emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    violet: "bg-violet-500/10 text-violet-300 border-violet-500/20",
    amber: "bg-amber-500/10 text-amber-400 border-amber-500/20",
};

export default function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="w-full relative z-10 border-t border-white/5 bg-[#030303]">
            {/* Glow accent top */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-neon-cyan/30 to-transparent" />

            {/* Protocol Status Banner */}
            <div className="border-b border-white/5 py-3 px-4">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3 sm:gap-6 text-[9px] sm:text-[10px] font-mono whitespace-nowrap overflow-x-auto custom-scrollbar-hidden py-1">
                        <span className="flex items-center gap-1.5 text-green-400 shrink-0">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className=" absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
                            </span>
                            {t('footer.status.uplink')}
                        </span>
                        <span className="text-gray-600 shrink-0 uppercase tracking-tighter">{t('footer.status.kernel')} v0.0.7-Neural</span>
                        <span className="hidden sm:flex items-center gap-1.5 text-blue-400">
                            <Shield className="w-3 h-3" />
                            {t('footer.status.verified')}
                        </span>
                        <span className="hidden md:flex items-center gap-1.5 text-neon-cyan">
                            <Activity className="w-3 h-3" />
                            {t('footer.status.mainnet')}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-[9px] sm:text-[10px] font-mono text-gray-500 shrink-0">
                        <Zap className="w-3 h-3 text-yellow-500" />
                        {t('footer.status.builtFor')}
                    </div>
                </div>
            </div>

            {/* Main Footer Grid */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-12 pb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 md:gap-12">

                {/* Brand Column */}
                <div className="sm:col-span-2 lg:col-span-1 space-y-5">
                    <Link href="/" className="flex items-center gap-2.5 w-fit">
                        <div className="relative flex items-center justify-center w-9 h-9 -">

                            <img src="/logo_transparent.png" alt="SuiLoop Logo" className="w-full h-full object-contain object-center scale-[1.3] drop-shadow-[0_0_10px_rgba(189,0,255,0.4)]" />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-white tracking-tighter text-lg leading-none -">
                                SUILOOP</span>
                            <span className="text-[9px] text-gray-500 font-mono tracking-widest leading-none">NEURAL MATRIX</span>
                        </div>
                    </Link>

                    <p className="text-gray-400 text-sm leading-relaxed">
                        {t('footer.tagline')}
                    </p>

                    {/* Tech Badges */}
                    <div className="flex flex-wrap gap-1.5">
                        {TECH_BADGES.map((b) => (
                            <span
                                key={b.label}
                                className={`px-2 py-0.5 text-[9px] font-mono border rounded-full ${COLOR_MAP[b.color]}`}
                            >
                                {b.label}
                            </span>
                        ))}
                    </div>

                    {/* Social */}
                    <div className="flex items-center gap-3 pt-1">
                        <a
                            href="https://x.com/Vaiosx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400"
                        >
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-4 h-4 fill-current">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                        </a>
                    </div>
                </div>

                {/* Protocol Links */}
                <div>
                    <h4 className="text-white font-bold mb-5 text-xs tracking-widest uppercase font-mono">
                        <span className="text-neon-cyan mr-1">{'>'}</span> {t('footer.mainframe')}
                    </h4>
                    <ul className="space-y-3">
                        {PROTOCOL_LINK_KEYS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="text-sm text-gray-400 flex items-center gap-1.5"
                                >
                                    <span className="w-1 h-1 rounded-full bg-gray-700 -" />
                                    {t(link.key)}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Intelligence Links */}
                <div>
                    <h4 className="text-white font-bold mb-5 text-xs tracking-widest uppercase font-mono">
                        <span className="text-neon-purple mr-1">{'>'}</span> {t('footer.intelligence')}
                    </h4>
                    <ul className="space-y-3">
                        {INTEL_LINK_KEYS.map((link) => (
                            <li key={link.href}>
                                {"external" in link && link.external ? (
                                    <a
                                        href={link.href}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-gray-400 flex items-center gap-1.5"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-gray-700 -" />
                                        {t(link.key)}
                                        <ExternalLink className="w-2.5 h-2.5 opacity-40 -" />
                                    </a>
                                ) : (
                                    <Link
                                        href={link.href}
                                        className="text-sm text-gray-400 flex items-center gap-1.5"
                                    >
                                        <span className="w-1 h-1 rounded-full bg-gray-700 -" />
                                        {t(link.key)}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Stats / CTA Column */}
                <div className="sm:col-span-2 lg:col-span-1 space-y-4">
                    <h4 className="text-white font-bold mb-5 text-xs tracking-widest uppercase font-mono">
                        <span className="text-green-400 mr-1">{'>'}</span> {t('footer.stats')}
                    </h4>

                    <div className="space-y-3">
                        {[
                            { label: t('footer.statsLabels.synced'), value: "2,890+", color: "text-neon-cyan", dot: "bg-neon-cyan" },
                            { label: t('footer.statsLabels.elo'), value: "1,120", color: "text-neon-purple", dot: "bg-neon-purple" },
                            { label: t('footer.statsLabels.network'), value: "Sui Mainnet", color: "text-green-400", dot: "bg-green-400" },
                            { label: t('footer.statsLabels.assets'), value: "SUI + USDC", color: "text-blue-400", dot: "bg-blue-400" },
                            { label: t('footer.statsLabels.kernel'), value: "v0.0.7-N", color: "text-gray-400", dot: "bg-gray-400" },
                            { label: t('footer.statsLabels.walrus'), value: "ARCHIVING ◉", color: "text-pink-400", dot: "bg-pink-400" },
                            { label: t('footer.statsLabels.uptime'), value: "99.9%", color: "text-yellow-400", dot: "bg-yellow-400" },
                        ].map((stat) => (
                            <div key={stat.label} className="flex items-center justify-between py-2 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${stat.dot}`} />
                                    <span className="text-xs text-gray-500 font-mono">{stat.label}</span>
                                </div>
                                <span className={`text-xs font-mono font-bold ${stat.color}`}>{stat.value}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <Link
                        href="/dashboard"
                        className="mt-4 flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-neon-cyan/10 to-neon-purple/10 border border-neon-cyan/20 rounded-xl text-xs font-bold text-neon-cyan font-mono"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        {t('footer.launch')}
                    </Link>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="border-t border-white/5">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-[11px] text-gray-600 font-mono">
                    <div className="flex items-center gap-2">
                        <span>{t('footer.copyright')}</span>
                        <span className="text-gray-700">•</span>
                        <a
                            href="https://t.me/Vaiosx"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-neon-cyan"
                        >
                            {t('footer.architect')}
                        </a>
                    </div>
                    <div className="flex items-center gap-4 flex-wrap justify-center">
                        <Link href="/terms" className="">
                            {t('footer.links.terms')}</Link>
                        <Link href="/risk-disclosure" className="">
                            {t('footer.links.risk')}</Link>
                        <span className="text-gray-700 hidden sm:inline">•</span>
                        <span className="text-gray-700 hidden sm:inline">{t('footer.legal')}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}
