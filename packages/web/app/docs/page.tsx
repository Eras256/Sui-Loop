import Link from "next/link";
import { ArrowLeft, Book, Code, Shield, Layers, Cpu, Database } from "lucide-react";
import Navbar from "@/components/layout/Navbar";

export default function DocsPage() {
    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-neon-cyan/30">
            <Navbar />
            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-neon-purple/20 to-transparent opacity-50" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-cyan/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-6 py-24">
                <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Protocol
                </Link>

                <header className="mb-16 border-b border-white/10 pb-10">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-neon-cyan/20 p-2 rounded-lg">
                            <Book className="w-6 h-6 text-neon-cyan" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                            Technical Documentation
                        </h1>
                    </div>
                    <p className="text-xl text-gray-400 max-w-2xl">
                        SuiLoop is a high-frequency DeFi protocol on Sui integrating atomic leverage execution with autonomous AI agents.
                    </p>
                </header>

                <div className="space-y-16">
                    {/* Section 1: Executive Summary */}
                    <section>
                        <h2 className="text-3xl font-bold mb-6 flex items-center gap-3 text-white">
                            <Shield className="text-neon-purple" />
                            1. Executive Summary
                        </h2>
                        <div className="prose prose-invert prose-lg max-w-none text-gray-300">
                            <p>
                                The project leverages <strong>Move 2024</strong> for secure, risk-free flash loan interactions, while using <strong>ElizaOS</strong> to power an intelligent off-chain agent that analyzes market conditions and orchestrates on-chain transactions via Programmable Transaction Blocks (PTB).
                            </p>
                            <p className="mt-4">
                                The platform is fully deployed on <strong>Sui Testnet (v0.0.4)</strong>, featuring a "State of Art" Next.js dashboard that allows users to seamlessly trigger AI trading strategies.
                            </p>
                        </div>
                    </section>

                    {/* Section 2: Progressive Automation */}
                    <section className="bg-white/5 border border-white/10 rounded-2xl p-8">
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            <Cpu className="text-neon-cyan" />
                            2. Progressive Automation
                        </h2>
                        <p className="text-gray-300 mb-6">
                            SuiLoop solves the biggest AI-Crypto dilemma: <strong>Security vs. Autonomy</strong>.
                        </p>

                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-black/40 p-6 rounded-xl border border-neon-purple/30">
                                <h3 className="text-xl font-bold text-neon-purple mb-2">🛡️ Copilot Mode</h3>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li>• User signs every transaction</li>
                                    <li>• Human-speed execution</li>
                                    <li>• Best for: Security-focused users</li>
                                    <li>• Non-custodial & Trustless</li>
                                </ul>
                            </div>
                            <div className="bg-black/40 p-6 rounded-xl border border-neon-cyan/30">
                                <h3 className="text-xl font-bold text-neon-cyan mb-2">🤖 Autonomous Mode</h3>
                                <ul className="space-y-2 text-sm text-gray-300">
                                    <li>• Agent signs with Private Key</li>
                                    <li>• Superhuman speed (ms)</li>
                                    <li>• Best for: High-frequency traders</li>
                                    <li>• Fully Agentic Loop</li>
                                </ul>
                            </div>
                        </div>
                        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-300 text-sm font-mono text-center">
                            "Start safely with Copilot Mode to learn the strategy, then graduate to Autonomous Mode."
                        </div>
                    </section>

                    {/* Section 3: Architecture & Resilience */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            <Layers className="text-amber-500" />
                            3. Resilience & Simulation Layer
                        </h2>
                        <div className="prose prose-invert max-w-none text-gray-300">
                            <p>
                                To ensure strict uptime guarantees during demos and Hackathons, the Agent implements a <strong>Real-Time Health Check</strong>:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 mt-4">
                                <li><strong>Scanning:</strong> The agent queries the official DeepBook V3 Testnet Package.</li>
                                <li><strong>Verification:</strong> If the protocol is unreachable or liquidity is fragmented.</li>
                                <li><strong>Fallback:</strong> The system automatically switches to the <strong>Deterministic Simulation Layer</strong> (MockPool).</li>
                            </ul>
                            <div className="mt-4 flex items-center gap-2 text-amber-400 text-sm font-bold bg-amber-950/30 p-2 rounded w-fit px-4 border border-amber-500/30">
                                <span className="relative flex h-2 w-2 mr-1">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                                </span>
                                UX Indicator: Using Sandbox Liquidity
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Deployed Contracts */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            <Code className="text-green-500" />
                            4. Deployed Contracts (Testnet v0.0.4)
                        </h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 text-gray-400 text-sm">
                                        <th className="py-3 px-4">Component</th>
                                        <th className="py-3 px-4">Address</th>
                                        <th className="py-3 px-4">Description</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm font-mono">
                                    <tr className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-white">Package</td>
                                        <td className="py-3 px-4 text-neon-cyan break-all">0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043</td>
                                        <td className="py-3 px-4 text-gray-400">Immutable Move Logic</td>
                                    </tr>
                                    <tr className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-3 px-4 text-white">Simulation Layer</td>
                                        <td className="py-3 px-4 text-amber-500 break-all">0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0</td>
                                        <td className="py-3 px-4 text-gray-400">Deterministic Liquidity (SUI)</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </section>

                    {/* Section 5: Ecosystem Stack */}
                    <section className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-2xl border border-white/10">
                        <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
                            <Database className="text-pink-500" />
                            5. Ecosystem Stack
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {[
                                "Sui Move 2024",
                                "Sui dApp Kit",
                                "Sui TypeScript SDK",
                                "DeepBook V3",
                                "Sui GraphQL",
                                "ElizaOS (Agent)"
                            ].map((tech) => (
                                <div key={tech} className="bg-white/5 p-3 rounded-lg text-center text-sm font-mono text-gray-300 border border-white/5 hover:border-neon-cyan/50 hover:text-white transition-colors cursor-default">
                                    {tech}
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>
        </main>
    );
}
