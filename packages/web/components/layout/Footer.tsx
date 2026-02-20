import Link from "next/link";
import { Twitter, Github, Globe, ExternalLink, Trophy, Sparkles } from "lucide-react";

export default function Footer() {
    return (
        <footer className="w-full border-t border-white/5 bg-black/30 backdrop-blur-md pt-12 pb-8 relative z-10">


            <div className="max-w-7xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-12">
                {/* Brand */}
                <div className="col-span-2 md:col-span-1">
                    <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
                        <div className="w-8 h-8 bg-gradient-to-br from-neon-purple to-neon-cyan rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(189,0,255,0.3)] group-hover:scale-110 transition-transform">
                            <span className="text-white font-mono font-bold">S</span>
                        </div>
                        <span className="font-bold text-white tracking-tighter text-xl group-hover:text-neon-cyan transition-colors">SUILOOP</span>
                    </Link>
                    <p className="text-gray-400 text-sm max-w-sm leading-relaxed mb-4">
                        The first Atomic Intelligence Protocol on Sui.
                        Autonomous Financial Warfare via ElizaOS agents and DeepBook V3 flash vectors.
                    </p>
                    {/* Tech Stack Badges */}
                    <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">Scallop</span>
                        <span className="px-2 py-1 text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">Cetus</span>
                        <span className="px-2 py-1 text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full">ElizaOS</span>
                        <span className="px-2 py-1 text-[10px] font-mono bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">DeepBook V3</span>
                        <span className="px-2 py-1 text-[10px] font-mono bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full">Walrus Storage</span>
                        <span className="px-2 py-1 text-[10px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 rounded-full">Move Verified</span>
                    </div>
                </div>

                {/* Protocol */}
                <div>
                    <h4 className="text-white font-bold mb-4 text-sm sm:text-base tracking-tight">Mainframe</h4>
                    <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-400">
                        <li><Link href="/dashboard" className="hover:text-neon-cyan transition-colors">Enclave Dashboard</Link></li>
                        <li><Link href="/analytics" className="hover:text-neon-cyan transition-colors">Intel Ops</Link></li>
                        <li><Link href="/strategies" className="hover:text-neon-cyan transition-colors">Strategy Arsenal</Link></li>
                        <li><Link href="/strategies/builder" className="hover:text-neon-cyan transition-colors">Visual Architect</Link></li>
                        <li><Link href="/marketplace" className="hover:text-neon-cyan transition-colors">Neural Marketplace</Link></li>
                        <li><Link href="/plugins" className="hover:text-neon-cyan transition-colors">Cognitive Plugins</Link></li>
                    </ul>
                </div>

                {/* Technical */}
                <div>
                    <h4 className="text-white font-bold mb-4 text-sm sm:text-base tracking-tight">Intelligence</h4>
                    <ul className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-gray-400">
                        <li><Link href="/agents" className="hover:text-neon-cyan transition-colors">Active Agents</Link></li>
                        <li><Link href="/manifesto" className="hover:text-neon-cyan transition-colors">Protocol Manifesto</Link></li>
                        <li><Link href="/how-to-use" className="hover:text-neon-cyan transition-colors">Operations Manual</Link></li>
                        <li><Link href="/docs" className="hover:text-neon-cyan transition-colors">Technical Docs</Link></li>
                        <li>
                            <a
                                href="https://suiscan.xyz/testnet/object/0x673686ac6a1a259b1d39553e6cdb2fb2478a13db4bccd83ea6f7c079af89a7fb"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-neon-cyan transition-colors flex items-center gap-1.5"
                            >
                                Kernel Source
                                <ExternalLink size={10} className="opacity-50" />
                            </a>
                        </li>
                    </ul>
                </div>

                {/* Social */}
                <div className="col-span-2 md:col-span-1">
                    <h4 className="text-white font-bold mb-4 text-sm sm:text-base">Community</h4>
                    <div className="flex flex-wrap gap-3">
                        <a href="https://x.com/Vaiosx" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] border border-transparent hover:border-white/20">
                            {/* X Logo SVG */}
                            <svg viewBox="0 0 24 24" aria-hidden="true" className="w-5 h-5 fill-current">
                                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
                            </svg>
                        </a>
                    </div>

                </div>
            </div>

            {/* Bottom Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 text-xs text-gray-500">
                <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 text-center sm:text-left">
                    <span>&copy; 2026 SuiLoop Autonomous Systems.</span>
                    <span className="hidden sm:inline">•</span>
                    <a
                        href="https://t.me/Vaiosx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-cyan hover:text-white transition-colors font-medium"
                    >
                        Architect: Vaiosx
                    </a>
                </div>
                <div className="flex flex-wrap justify-center gap-4 sm:gap-6 font-mono">
                    <span className="flex items-center gap-1.5">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        UPLINK ESTABLISHED
                    </span>
                    <span className="text-gray-600">KERNEL v0.0.7 // ENCRYPTED</span>
                </div>
            </div>
        </footer>
    );
}
