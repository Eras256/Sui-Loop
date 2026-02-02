import Link from "next/link";
import { Twitter, Github, Globe, ExternalLink, Trophy, Sparkles } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/5 bg-black/30 backdrop-blur-md pt-12 pb-8 relative z-10">
            {/* ETHGlobal HackMoney 2026 Banner */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-10">
                <a
                    href="https://ethglobal.com/events/hackmoney2026"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group block w-full p-4 sm:p-6 rounded-2xl bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-orange-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all duration-300 hover:shadow-[0_0_40px_rgba(234,179,8,0.15)]"
                >
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <Trophy size={24} className="text-white sm:w-7 sm:h-7" />
                            </div>
                            <div className="text-center sm:text-left">
                                <div className="flex items-center gap-2 justify-center sm:justify-start">
                                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-yellow-500">Official Submission</span>
                                    <Sparkles size={12} className="text-yellow-500 animate-pulse" />
                                </div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">ETHGlobal HackMoney 2026</h3>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-400 font-mono text-xs sm:text-sm group-hover:bg-yellow-500 group-hover:text-black transition-all">
                            View Event
                            <ExternalLink size={14} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </div>
                    </div>
                </a>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12">
                {/* Brand */}
                <div className="col-span-2">
                    <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
                        <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(189,0,255,0.3)] group-hover:scale-110 transition-transform">
                            <span className="text-white font-mono font-bold">S</span>
                        </div>
                        <span className="font-bold text-white tracking-tighter text-xl group-hover:text-neon-cyan transition-colors">SUILOOP</span>
                    </Link>
                    <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-4">
                        The first Atomic Intelligence Protocol on Sui.
                        Unlocking institutional-grade BTCfi strategies through autonomous ElizaOS agents and DeepBook V3 flash loans.
                    </p>
                    {/* Tech Stack Badges */}
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">Sui Network</span>
                        <span className="px-2 py-1 text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">ElizaOS</span>
                        <span className="px-2 py-1 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">DeepBook V3</span>
                    </div>
                </div>

                {/* Links */}
                <div>
                    <h4 className="text-white font-bold mb-4 text-sm sm:text-base">Protocol</h4>
                    <ul className="space-y-2 sm:space-y-3 text-sm text-gray-400">
                        <li><Link href="/dashboard" className="hover:text-neon-cyan transition-colors">Dashboard</Link></li>
                        <li><Link href="/strategies" className="hover:text-neon-cyan transition-colors">Strategy Marketplace</Link></li>
                        <li><Link href="/strategies/builder" className="hover:text-neon-cyan transition-colors">Strategy Builder</Link></li>
                        <li><Link href="/analytics" className="hover:text-neon-cyan transition-colors">Analytics</Link></li>
                        <li><Link href="/docs" className="hover:text-neon-cyan transition-colors">Documentation</Link></li>
                    </ul>
                </div>

                {/* Social */}
                <div>
                    <h4 className="text-white font-bold mb-4 text-sm sm:text-base">Community</h4>
                    <div className="flex flex-wrap gap-3">
                        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#1DA1F2] hover:text-white transition-all hover:shadow-[0_0_15px_rgba(29,161,242,0.4)]">
                            <Twitter size={18} />
                        </a>
                        <a href="https://github.com/Eras256/Sui-Loop" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white hover:text-black transition-all">
                            <Github size={18} />
                        </a>
                        <a href="https://sui.io" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-[#4DA2FF] hover:text-white transition-all hover:shadow-[0_0_15px_rgba(77,162,255,0.4)]">
                            <Globe size={18} />
                        </a>
                    </div>
                    {/* ETHGlobal Link */}
                    <a
                        href="https://ethglobal.com/events/hackmoney2026"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 inline-flex items-center gap-1.5 text-xs text-yellow-500 hover:text-yellow-400 transition-colors"
                    >
                        <Trophy size={12} />
                        HackMoney 2026
                        <ExternalLink size={10} />
                    </a>
                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs text-gray-500">
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
                    <span>&copy; 2026 SuiLoop Protocol.</span>
                    <span className="hidden sm:inline">•</span>
                    <a
                        href="https://ethglobal.com/events/hackmoney2026"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-yellow-500/80 hover:text-yellow-400 transition-colors font-medium"
                    >
                        Built for ETHGlobal HackMoney 2026 🏆
                    </a>
                </div>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-mono">
                    <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        Operational
                    </span>
                    <span className="text-gray-600">Testnet v0.0.4</span>
                </div>
            </div>
        </footer>
    );
}
