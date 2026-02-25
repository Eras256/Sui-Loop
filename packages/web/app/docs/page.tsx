"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation"; // Added
import { Suspense, useState, useEffect } from "react"; // Restored useEffect
import {
    ArrowLeft, Book, Code, Shield, Layers, Cpu, Database, Zap,
    GitBranch, FileCode, Rocket, CheckCircle, AlertTriangle,
    Terminal, Globe, Lock, TrendingUp, ChevronRight, ExternalLink,
    Play, Settings, Users, User, Landmark, Workflow, Key, Lightbulb, HardDrive, FileCheck, BookOpen, FileJson
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import ApiKeyManager from "@/components/docs/ApiKeyManager";
import { useLanguage } from "@/lib/i18n/LanguageContext";

type TabId = 'overview' | 'architecture' | 'contracts' | 'agent' | 'frontend' | 'api' | 'security' | 'ideas' | 'builder';

const getTabs = (t: any) => [
    { id: 'overview' as TabId, label: t('docs.tabs.overview'), icon: Book },
    { id: 'ideas' as TabId, label: t('docs.tabs.ideas'), icon: Lightbulb },
    { id: 'architecture' as TabId, label: t('docs.tabs.architecture'), icon: Layers },
    { id: 'contracts' as TabId, label: t('docs.tabs.contracts'), icon: Code },
    { id: 'agent' as TabId, label: t('docs.tabs.agent'), icon: Cpu },
    { id: 'builder' as TabId, label: t('docs.tabs.builder'), icon: Workflow },
    { id: 'frontend' as TabId, label: t('docs.tabs.frontend'), icon: Globe },
    { id: 'api' as TabId, label: t('docs.tabs.api'), icon: Terminal },
    { id: 'security' as TabId, label: t('docs.tabs.security'), icon: Shield },
];

function DocsContent() {
    const { t } = useLanguage();
    const tabs = getTabs(t);
    const searchParams = useSearchParams();
    const initialTabParam = searchParams.get('tab');
    const isValidTab = (t: string | null): t is TabId => tabs.some(tab => tab.id === t);
    const initialTab = isValidTab(initialTabParam) ? initialTabParam : 'overview';

    const [activeTab, setActiveTab] = useState<TabId>(initialTab);

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (isValidTab(tab)) {
            setActiveTab(tab);
        }
    }, [searchParams]);

    return (
        <main className="min-h-screen bg-black text-white font-sans selection:bg-neon-cyan/30">
            <Navbar />

            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-neon-purple/20 to-transparent opacity-50" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-neon-cyan/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative z-10 pt-36">
                <div className="max-w-7xl mx-auto px-6 pb-8 border-b border-white/10">
                    <Link href="/" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        {t('docs.backLink')}
                    </Link>

                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-gradient-to-r from-neon-cyan to-neon-purple p-2 rounded-lg">
                                    <Book className="w-6 h-6 text-white" />
                                </div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-4xl md:text-5xl font-bold font-mono tracking-tight">{t('docs.title')}</h1>
                                    <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-mono rounded-full border border-green-500/30">
                                        {t('docs.version')}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xl text-gray-400 max-w-2xl">
                                {t('docs.subtitle')}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <a href="https://github.com/Eras256/Sui-Loop" target="_blank" className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors flex items-center gap-2">
                                <GitBranch className="w-4 h-4" />
                                {t('docs.ghLink')}
                            </a>
                            <a href="https://suiscan.xyz/testnet/object/0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0" target="_blank" className="px-4 py-2 bg-neon-cyan/10 border border-neon-cyan/30 rounded-lg text-sm font-medium text-neon-cyan hover:bg-neon-cyan/20 transition-colors flex items-center gap-2">
                                <ExternalLink className="w-4 h-4" />
                                {t('docs.scanLink')}
                            </a>
                        </div>
                    </div>
                </div>

                <div className="sticky top-16 z-20 bg-black/80 backdrop-blur-xl border-b border-white/10">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="flex overflow-x-auto scrollbar-hide gap-1 py-2">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id
                                        ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
                                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                                        }`}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12">
                    {activeTab === 'overview' && <OverviewSection />}
                    {activeTab === 'ideas' && <IdeasSection />}
                    {activeTab === 'architecture' && <ArchitectureSection />}
                    {activeTab === 'contracts' && <ContractsSection />}
                    {activeTab === 'agent' && <AgentSection />}
                    {activeTab === 'builder' && <BuilderSection />}
                    {activeTab === 'frontend' && <FrontendSection />}
                    {activeTab === 'api' && <ApiSection />}
                    {activeTab === 'security' && <SecuritySection />}
                </div>
            </div>
        </main>
    );
}

export default function DocsPage() {
    const { t } = useLanguage();
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-pulse text-neon-cyan font-mono">
                    {(() => {
                        try { return t('docs.loading'); } catch (e) { return 'LOADING FIELD MANUAL...'; }
                    })()}
                </div>
            </div>
        }>
            <DocsContent />
        </Suspense>
    );
}

function OverviewSection() {
    const { t, tRaw } = useLanguage();
    return (
        <div className="space-y-12">
            {/* Hero Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                    { label: t('docs.overview.stats.version'), value: 'v0.0.7', color: 'text-neon-cyan' },
                    { label: t('docs.overview.stats.tests'), value: '12/12 ✓', color: 'text-green-400' },
                    { label: t('docs.overview.stats.plugins'), value: '13+ Active', color: 'text-purple-400' },
                    { label: t('docs.overview.stats.fee'), value: '0.3%', color: 'text-amber-400' },
                    { label: t('docs.overview.stats.assets'), value: 'SUI + USDC', color: 'text-blue-400' },
                ].map((stat) => (
                    <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">{stat.label}</div>
                        <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Executive Summary */}
            <section className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Shield className="text-neon-purple" />
                    {t('docs.overview.summary.title')}
                </h2>
                <div className="prose prose-invert max-w-none text-gray-300 space-y-4">
                    <p className="text-lg leading-relaxed">
                        <strong>SuiLoop</strong> {t('docs.overview.summary.p1').replace('SuiLoop', '')}
                    </p>
                    <p>
                        {t('docs.overview.summary.p2')}
                    </p>
                </div>
            </section>

            {/* Progressive Automation */}
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Cpu className="text-neon-cyan" />
                    {t('docs.overview.automation.title')}
                </h2>
                <p className="text-gray-400 mb-6">
                    {t('docs.overview.automation.subtitle').split(':').map((part, i) => (
                        <span key={i}>
                            {i === 0 ? part + ':' : <strong className="text-white">{part}</strong>}
                        </span>
                    ))}
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-black/40 p-6 rounded-xl border border-neon-purple/30 hover:border-neon-purple/50 transition-colors">
                        <h3 className="text-xl font-bold text-neon-purple mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5" />
                            {t('docs.overview.automation.copilot.title')}
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                            {(tRaw('docs.overview.automation.copilot.features') || []).map((f: string, i: number) => (
                                <li key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {f}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-black/40 p-6 rounded-xl border border-neon-cyan/30 hover:border-neon-cyan/50 transition-colors">
                        <h3 className="text-xl font-bold text-neon-cyan mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5" />
                            {t('docs.overview.automation.autonomous.title')}
                        </h3>
                        <ul className="space-y-3 text-gray-300">
                            {(tRaw('docs.overview.automation.autonomous.features') || []).map((f: string, i: number) => (
                                <li key={i} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-green-400" /> {f}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* Key Features */}
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Rocket className="text-amber-400" />
                    {t('docs.overview.features.title')}
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                    {[
                        { icon: Workflow, title: t('docs.overview.features.items.builder.title'), desc: t('docs.overview.features.items.builder.desc'), color: 'text-purple-400' },
                        { icon: BookOpen, title: t('docs.overview.features.items.manual.title'), desc: t('docs.overview.features.items.manual.desc'), color: 'text-neon-cyan' },
                        { icon: Layers, title: t('docs.overview.features.items.marketplace.title'), desc: t('docs.overview.features.items.marketplace.desc'), color: 'text-blue-400' },
                        { icon: TrendingUp, title: t('docs.overview.features.items.dashboard.title'), desc: t('docs.overview.features.items.dashboard.desc'), color: 'text-green-400' },
                        { icon: Lock, title: t('docs.overview.features.items.vaults.title'), desc: t('docs.overview.features.items.vaults.desc'), color: 'text-amber-400' },
                        { icon: HardDrive, title: t('docs.overview.features.items.storage.title'), desc: t('docs.overview.features.items.storage.desc'), color: 'text-pink-400' },
                    ].map((feature) => (
                        <div key={feature.title} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-all group">
                            <feature.icon className={`w-6 h-6 ${feature.color} mb-3 group-hover:scale-110 transition-transform`} />
                            <h3 className="font-bold text-white mb-1">{feature.title}</h3>
                            <p className="text-sm text-gray-400">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Business Model / Capture Value */}
            <section className="relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-neon-purple/5 blur-[100px] -z-10" />
                <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <TrendingUp className="text-neon-cyan" />
                    {t('docs.overview.business.title')}
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="glass-panel p-8 rounded-2xl border-t-2 border-neon-purple/50 bg-white/5 hover:bg-white/10 transition-all">
                        <div className="w-12 h-12 rounded-full bg-neon-purple/10 flex items-center justify-center mb-6">
                            <User className="text-neon-purple" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{t('docs.overview.business.b2c.title')}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            {t('docs.overview.business.b2c.desc')}
                        </p>
                        <div className="pt-4 border-t border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold font-mono">{t('docs.overview.business.b2c.label')}</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-white">0.1 SUI</span>
                                <span className="text-xs text-gray-500 line-through tracking-tighter">{t('docs.overview.business.b2c.sub')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-2xl border-t-2 border-neon-cyan/50 bg-white/5 hover:bg-white/10 transition-all">
                        <div className="w-12 h-12 rounded-full bg-neon-cyan/10 flex items-center justify-center mb-6">
                            <Landmark className="text-neon-cyan" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{t('docs.overview.business.b2b.title')}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            {t('docs.overview.business.b2b.desc')}
                        </p>
                        <div className="pt-4 border-t border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold font-mono">{t('docs.overview.business.b2b.label')}</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-white">Custom</span>
                                <span className="text-xs text-gray-500 font-mono tracking-tighter">{t('docs.overview.business.b2b.sub')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="glass-panel p-8 rounded-2xl border-t-2 border-green-500/50 bg-white/5 hover:bg-white/10 transition-all">
                        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-6">
                            <Zap className="text-green-400" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-3">{t('docs.overview.business.dev.title')}</h3>
                        <p className="text-gray-400 text-sm leading-relaxed mb-6">
                            {t('docs.overview.business.dev.desc')}
                        </p>
                        <div className="pt-4 border-t border-white/5">
                            <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-2 font-bold font-mono">{t('docs.overview.business.dev.label')}</div>
                            <div className="flex items-baseline gap-2">
                                <span className="text-2xl font-black text-green-400">1.0%</span>
                                <span className="text-xs text-gray-500 font-mono tracking-tighter">{t('docs.overview.business.dev.sub')}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verified Transactions */}
            <section className="bg-green-500/5 border border-green-500/20 rounded-2xl p-8">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <CheckCircle className="text-green-400" />
                    {t('docs.overview.verified.title')}
                </h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/10 text-gray-400 text-sm">
                                <th className="py-3 px-4">{t('docs.overview.verified.table.tx')}</th>
                                <th className="py-3 px-4">{t('docs.overview.verified.table.amount')}</th>
                                <th className="py-3 px-4">{t('docs.overview.verified.table.fee')}</th>
                                <th className="py-3 px-4">{t('docs.overview.verified.table.status')}</th>
                                <th className="py-3 px-4">{t('docs.overview.verified.table.link')}</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm">
                            <tr className="border-b border-white/5">
                                <td className="py-3 px-4 font-mono text-neon-cyan">5X6TDFkYvjvCb2LS...</td>
                                <td className="py-3 px-4">0.1 SUI</td>
                                <td className="py-3 px-4 text-gray-400">0.0003 SUI</td>
                                <td className="py-3 px-4"><span className="text-green-400">✓ {t('docs.overview.verified.success')}</span></td>
                                <td className="py-3 px-4">
                                    <a href="https://suiscan.xyz/testnet/tx/5X6TDFkYvjvCb2LSE37DC7qNFs7UDgNy9izTs7amNanG" target="_blank" className="text-neon-cyan hover:underline flex items-center gap-1">
                                        View <ExternalLink className="w-3 h-3" />
                                    </a>
                                </td>
                            </tr>
                            <tr className="border-b border-white/5">
                                <td className="py-3 px-4 font-mono text-neon-cyan">ExYe8kirfrUVkehc...</td>
                                <td className="py-3 px-4">0.05 SUI</td>
                                <td className="py-3 px-4 text-gray-400">0.0001 SUI</td>
                                <td className="py-3 px-4"><span className="text-green-400">✓ {t('docs.overview.verified.success')}</span></td>
                                <td className="py-3 px-4">
                                    <a href="https://suiscan.xyz/testnet/tx/ExYe8kirfrUVkehcz63NvDzSzZPz2gAoLoVyCpUcVESP" target="_blank" className="text-neon-cyan hover:underline flex items-center gap-1">
                                        View <ExternalLink className="w-3 h-3" />
                                    </a>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-sm text-gray-400">
                    <strong>{t('docs.overview.verified.agentWallet')}:</strong> <code className="text-neon-cyan">0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0</code>
                </div>
            </section>
        </div>
    );
}

function ArchitectureSection() {
    const { t } = useLanguage();
    return (
        <div className="space-y-16">
            <section>
                <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
                    <Layers className="text-neon-cyan" />
                    {t('docs.architecture.title')}
                </h2>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-neon-cyan/5 blur-[80px] -z-10" />
                    <h3 className="text-xl font-bold text-gray-400 mb-8 uppercase tracking-widest">{t('docs.architecture.layers')}</h3>

                    <div className="space-y-6">
                        {/* Layer 1 */}
                        <div className="flex gap-6 group">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-neon-cyan/20 border border-neon-cyan/50 flex items-center justify-center font-bold text-neon-cyan group-hover:scale-110 transition-transform">1</div>
                                <div className="flex-1 w-0.5 bg-gradient-to-b from-neon-cyan to-neon-purple mt-2" />
                            </div>
                            <div className="pb-8">
                                <h4 className="text-xl font-bold text-white mb-2 underline decoration-neon-cyan/30 underline-offset-4 decoration-2">Off-Chain Intelligence Layer</h4>
                                <p className="text-gray-400 leading-relaxed">
                                    Powered by <strong>ElizaOS</strong>. This layer handles market data ingestion, sentient strategy generation, and risk modeling.
                                    It generates the "Intent" which is then compiled into a Programmable Transaction Block (PTB).
                                </p>
                            </div>
                        </div>

                        {/* Layer 2 */}
                        <div className="flex gap-6 group">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-neon-purple/20 border border-neon-purple/50 flex items-center justify-center font-bold text-neon-purple group-hover:scale-110 transition-transform">2</div>
                                <div className="flex-1 w-0.5 bg-gradient-to-b from-neon-purple to-green-500/50 mt-2" />
                            </div>
                            <div className="pb-8">
                                <h4 className="text-xl font-bold text-white mb-2 underline decoration-neon-purple/30 underline-offset-4 decoration-2">Protocol Execution Layer (Move)</h4>
                                <p className="text-gray-400 leading-relaxed">
                                    The "On-Chain Kernel". Written in <strong>Sui Move 2024</strong>. Enforces safety constraints via linear types.
                                    Contains the <code>AtomicLoop</code> and <code>NeuralVault</code> modules. Ensures that any borrowed capital MUST return to the pool by the end of the transaction.
                                </p>
                            </div>
                        </div>

                        {/* Layer 3 */}
                        <div className="flex gap-6 group">
                            <div className="flex flex-col items-center">
                                <div className="w-10 h-10 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center font-bold text-green-400 group-hover:scale-110 transition-transform">3</div>
                            </div>
                            <div>
                                <h4 className="text-xl font-bold text-white mb-2 underline decoration-green-500/30 underline-offset-4 decoration-2">Observability & Audit Layer</h4>
                                <p className="text-gray-400 leading-relaxed">
                                    Hybrid storage using <strong>Walrus Protocol</strong> (for immutable transaction witnesses) and <strong>Supabase</strong> (for real-time dashboard state).
                                    Every agent action is cryptographically signed and stored for forensic audit.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-2xl font-bold mb-8 flex items-center gap-3">
                    <Workflow className="text-neon-purple" />
                    {t('docs.architecture.flow')}
                </h3>

                <div className="grid md:grid-cols-4 gap-4">
                    {[
                        { step: "01", title: "Visual Design", desc: "User builds logic in Visual Builder" },
                        { step: "02", title: "Codegen", desc: "Builder exports JSON strategy spec" },
                        { step: "03", title: "Agent Ingest", desc: "ElizaOS agent loads spec & signs keys" },
                        { step: "04", title: "Atomic Execution", desc: "PTB executed on Sui Mainnet/Testnet" },
                    ].map((step, i) => (
                        <div key={i} className="bg-[#0A0A0A] border border-white/10 p-6 rounded-xl relative group">
                            <div className="text-4xl font-black text-white/5 absolute top-2 right-4 group-hover:text-neon-cyan/10 transition-colors uppercase italic">{step.step}</div>
                            <h4 className="font-bold text-white mb-2">{step.title}</h4>
                            <p className="text-sm text-gray-500">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function ContractsSection() {
    const { t } = useLanguage();
    return (
        <div className="space-y-12">
            <section>
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-neon-cyan/10 p-3 rounded-2xl">
                        <Code className="text-neon-cyan" size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold">{t('docs.contracts.title')}</h2>
                        <p className="text-gray-400">{t('docs.contracts.subtitle')}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Database className="text-neon-cyan w-5 h-5" />
                            {t('docs.contracts.objects')}
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: 'Pool<SUI, USDC>', type: 'Shared Object', desc: 'Stores the protocol liquidity and manages flash loan issuance.' },
                                { name: 'AdminCap', type: 'Owned Object', desc: 'Grants administrative rights for fee adjustments and withdrawals.' },
                                { name: 'Receipt', type: 'Hot Potato', desc: 'A linear type object that MUST be consumed by repaying the loan.' },
                                { name: 'NeuralVault', type: 'Strategy Container', desc: 'Holds capital dedicated to a specific agentic strategy.' },
                            ].map((obj) => (
                                <div key={obj.name} className="p-3 bg-black/40 rounded-lg border border-white/5">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-mono text-neon-cyan text-sm">{obj.name}</span>
                                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded uppercase">{obj.type}</span>
                                    </div>
                                    <p className="text-xs text-gray-500">{obj.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Cpu className="text-neon-purple w-5 h-5" />
                            {t('docs.contracts.code')}
                        </h3>
                        <div className="bg-black rounded-lg p-4 font-mono text-xs overflow-x-auto">
                            <pre className="text-neon-purple">
                                {`// The "Hot Potato" Receipt
public struct Receipt {
    id: ID,
    amount: u64,
    fee: u64
}

// Flash Loan Function
public fun flash_loan(
    pool: &mut Pool, 
    amount: u64, 
    ctx: &mut TxContext
): (Coin<SUI>, Receipt) {
    // ... logic
}

// Repayment Function (Consumes Receipt)
public fun repay(
    pool: &mut Pool, 
    payment: Coin<SUI>, 
    receipt: Receipt
) {
    // ... MUST consume receipt
}`}
                            </pre>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function AgentSection() {
    const { t } = useLanguage();
    return (
        <div className="space-y-12">
            <section>
                <div className="flex items-center gap-4 mb-6">
                    <div className="bg-neon-purple/10 p-3 rounded-2xl">
                        <Cpu className="text-neon-purple" size={32} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold">{t('docs.agent.title')}</h2>
                        <p className="text-gray-400">{t('docs.agent.subtitle')}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <FileJson className="w-5 h-5 text-neon-cyan" />
                            {t('docs.agent.structure')}
                        </h3>
                        <div className="space-y-2 font-mono text-xs">
                            <div className="text-neon-cyan">/packages/agent</div>
                            <div className="pl-4 text-gray-400">├── /src</div>
                            <div className="pl-8 text-gray-400">├── /actions</div>
                            <div className="pl-12 text-green-400 text-[10px]"># Loop Logic</div>
                            <div className="pl-8 text-gray-400">├── /providers</div>
                            <div className="pl-12 text-neon-purple text-[10px]"># Sui Client API</div>
                            <div className="pl-8 text-gray-400">├── index.ts</div>
                            <div className="pl-4 text-gray-400">├── .env</div>
                            <div className="pl-4 text-gray-400">├── character.json</div>
                        </div>
                    </div>

                    <div className="md:col-span-2 bg-[#0A0A0A] border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Terminal className="w-5 h-5 text-neon-purple" />
                            {t('docs.agent.actions')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { name: 'EXECUTE_PTB', desc: 'Compiles strategy JSON into a Sui Programmable Transaction Block.' },
                                { name: 'EVALUATE_RISK', desc: 'Queries Sui RPC for collateral health before deciding on a loan.' },
                                { name: 'SUBSCRIBE_LOGS', desc: 'Opens a WebSocket to SuiLoop backend for real-time reporting.' },
                                { name: 'PUBLISH_EVIDENCE', desc: 'Signs the execution manifest and uploads it to Walrus/Supabase.' },
                            ].map((action) => (
                                <div key={action.name} className="p-4 bg-white/5 rounded-xl border border-white/5 group hover:border-neon-purple/50 transition-colors">
                                    <div className="font-mono text-neon-purple mb-1">{action.name}</div>
                                    <p className="text-xs text-gray-500">{action.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function BuilderSection() {
    const { t } = useLanguage();
    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Workflow className="text-neon-purple" />
                    {t('docs.builder.title')}
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {t('docs.builder.subtitle')}
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Layers className="w-5 h-5 text-neon-cyan" />
                            {t('docs.builder.categories')}
                        </h3>
                        <ul className="space-y-2 text-sm text-gray-400">
                            <li>• <strong className="text-neon-cyan">Atomic Engine</strong>: FLASH_LOAN, EXECUTE_LOOP, CREATE_AGENT_CAP, REPAY_LOAN</li>
                            <li>• <strong>Signal Inputs</strong>: Price thresholds, CRON ticks, Mempool scans, Whale alerts</li>
                            <li>• <strong>AI Intelligence</strong>: Eliza sentiment, Kelly Criterion, Market Regime</li>
                            <li>• <strong>Trading & Swaps</strong>: Cetus CLMM, Turbos, DeepBook limit orders</li>
                            <li>• <strong>Security & Vault</strong>: Vault deposit/withdraw, Enclave Guard, Walrus Blackbox</li>
                            <li>• <strong>Social Messaging</strong>: Twitter relay, Discord alarm, Telegram push</li>
                        </ul>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors">
                        <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                            <Zap className="w-5 h-5 text-amber-500" />
                            {t('docs.builder.dragDrop')}
                        </h3>
                        <div className="bg-black/50 rounded-lg p-4 aspect-video flex items-center justify-center border border-white/5 group overflow-hidden">
                            <div className="grid grid-cols-2 gap-4 w-full opacity-50 group-hover:opacity-100 transition-opacity">
                                <div className="p-3 bg-neon-cyan/20 border border-neon-cyan/50 rounded text-[10px] font-mono">NODE A: TICKER</div>
                                <div className="p-3 bg-neon-purple/20 border border-neon-purple/50 rounded text-[10px] font-mono">NODE B: SWAP</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function FrontendSection() {
    const { t } = useLanguage();
    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Globe className="text-neon-cyan" />
                    {t('docs.frontend.title')}
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {t('docs.frontend.subtitle')}
                </p>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Settings className="text-neon-cyan w-5 h-5" />
                            {t('docs.frontend.stack')}
                        </h3>
                        <ul className="space-y-3">
                            {[
                                { name: 'Next.js 15 (App Router)', desc: 'Server-side rendering & optimized routing.' },
                                { name: 'Tailwind CSS', desc: 'Utility-first styling with Glassmorphism.' },
                                { name: '@mysten/dapp-kit', desc: 'Sui wallet adapters and React hooks.' },
                                { name: 'Lucide React', desc: 'Lightweight & customizable icon set.' },
                            ].map((tech) => (
                                <li key={tech.name} className="flex gap-3">
                                    <CheckCircle className="w-4 h-4 text-green-400 shrink-0 mt-1" />
                                    <div>
                                        <div className="text-sm font-bold text-white">{tech.name}</div>
                                        <div className="text-xs text-gray-500">{tech.desc}</div>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                            <Layers className="text-neon-purple w-5 h-5" />
                            {t('docs.frontend.pages')}
                        </h3>
                        <div className="space-y-2">
                            {[
                                '/dashboard', '/marketplace', '/builder', '/fleets', '/docs', '/settings'
                            ].map((page) => (
                                <div key={page} className="p-2 bg-black/40 border border-white/5 rounded font-mono text-xs text-neon-purple">
                                    {page}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}

function ApiSection() {
    const { t } = useLanguage();
    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Terminal className="text-neon-purple" />
                    {t('docs.api.title')}
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {t('docs.api.subtitle')}
                </p>

                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 mb-8">
                    <h3 className="text-xl font-bold text-white mb-4">{t('docs.api.auth.title')}</h3>
                    <p className="text-gray-400 text-sm mb-6">
                        {t('docs.api.auth.desc')}
                    </p>
                    <div className="bg-black rounded-lg p-4 font-mono text-sm border border-neon-purple/30">
                        <span className="text-gray-500"># Example request</span><br />
                        <span className="text-purple-400">curl</span> -H <span className="text-neon-cyan">"Authorization: Bearer loop_sk_..."</span> https://api.suiloop.fi/v1/agents
                    </div>
                </div>

                <ApiKeyManager />
            </section>
        </div>
    );
}

function SecuritySection() {
    const { t } = useLanguage();
    return (
        <div className="space-y-12">
            <section>
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
                    <Shield className="text-neon-cyan" />
                    {t('docs.security.title')}
                </h2>
                <p className="text-gray-400 mb-8 leading-relaxed">
                    {t('docs.security.subtitle')}
                </p>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <Lock className="text-neon-purple w-5 h-5" />
                            {t('docs.security.hotPotato.title')}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            {t('docs.security.hotPotato.desc')}
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
                        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                            <AlertTriangle className="text-amber-500 w-5 h-5" />
                            {t('docs.security.attack.title')}
                        </h3>
                        <p className="text-sm text-gray-400 leading-relaxed">
                            {t('docs.security.attack.desc')}
                        </p>
                    </div>
                </div>
            </section>

            <section className="bg-green-500/5 border border-green-500/20 rounded-xl p-8">
                <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-green-400">
                    <FileCheck />
                    Verification Manifest
                </h3>
                <div className="space-y-4">
                    {[
                        { label: ' линейный (Linear Type)', status: 'ENFORCED', desc: 'Receipt object cannot be dropped.' },
                        { label: 'Solvency Check', status: 'VERIFIED', desc: 'Pool invariant k = x * y is maintained.' },
                        { label: 'Oracle Slippage', status: 'ACTIVE', desc: 'Max 0.5% deviation allowed.' },
                    ].map((item) => (
                        <div key={item.label} className="flex justify-between items-center p-3 bg-black/40 rounded border border-white/5">
                            <div>
                                <span className="font-mono text-neon-cyan text-sm">{item.label}</span>
                                <p className="text-[10px] text-gray-500">{item.desc}</p>
                            </div>
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded font-bold">{item.status}</span>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}

function IdeasSection() {
    const { t } = useLanguage();
    return (
        <div className="space-y-12">
            <section className="text-center max-w-3xl mx-auto mb-16">
                <h2 className="text-4xl font-black mb-6">{t('docs.ideas.title')} 🏗️</h2>
                <p className="text-xl text-gray-400">
                    {t('docs.ideas.subtitle')} <br />
                    {t('docs.ideas.subtitle2')}
                </p>
            </section>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Idea 1 */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:border-yellow-500/50 transition-colors group">
                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-yellow-500/10 rounded-xl text-yellow-500">
                            <Shield size={32} />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-gray-400">{t('docs.ideas.difficulty')}: {t('docs.ideas.medium')}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{t('docs.ideas.items.portfolio.title')}</h3>
                    <p className="text-gray-400 mb-6 min-h-[60px]">
                        {t('docs.ideas.items.portfolio.desc')}
                    </p>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-yellow-500/80">
                        <span className="text-gray-500"># Use Python SDK</span><br />
                        agent.listen(portfolio_health, (health) =&gt; {'{'}<br />
                        &nbsp;&nbsp;if health &lt; 1.1: agent.execute("Repay")<br />
                        {'}'})
                    </div>
                </div>

                {/* Idea 2 */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:border-neon-cyan/50 transition-colors group">
                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-neon-cyan/10 rounded-xl text-neon-cyan">
                            <Zap size={32} />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-gray-400">{t('docs.ideas.difficulty')}: {t('docs.ideas.hard')}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{t('docs.ideas.items.arb.title')}</h3>
                    <p className="text-gray-400 mb-6 min-h-[60px]">
                        {t('docs.ideas.items.arb.desc')}
                    </p>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-neon-cyan/80">
                        <span className="text-gray-500"># Use TypeScript SDK</span><br />
                        const profit = await calculateArb(poolA, poolB);<br />
                        if (profit &gt; gas) await loop.execute(flashLoan);
                    </div>
                </div>

                {/* Idea 3 */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:border-purple-500/50 transition-colors group">
                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-purple-500/10 rounded-xl text-purple-500">
                            <Globe size={32} />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-gray-400">{t('docs.ideas.difficulty')}: {t('docs.ideas.easy')}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{t('docs.ideas.items.news.title')}</h3>
                    <p className="text-gray-400 mb-6 min-h-[60px]">
                        {t('docs.ideas.items.news.desc')}
                    </p>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-purple-500/80">
                        <span className="text-gray-500"># Use JS SDK + Vercel</span><br />
                        onNewsReceived(async (headline) =&gt; {'{'}<br />
                        &nbsp;&nbsp;if (isBullish(headline)) loop.buy("SUI")<br />
                        {'}'})
                    </div>
                </div>

                {/* Idea 4 */}
                <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:border-green-500/50 transition-colors group">
                    <div className="flex items-start justify-between mb-6">
                        <div className="p-3 bg-green-500/10 rounded-xl text-green-500">
                            <Users size={32} />
                        </div>
                        <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-gray-400">{t('docs.ideas.difficulty')}: {t('docs.ideas.hard')}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{t('docs.ideas.items.gamefi.title')}</h3>
                    <p className="text-gray-400 mb-6 min-h-[60px]">
                        {t('docs.ideas.items.gamefi.desc')}
                    </p>
                    <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-green-500/80">
                        <span className="text-gray-500"># Use Unity + C# (API)</span><br />
                        npc.OnTradeOffer((item) =&gt; {'{'}<br />
                        &nbsp;&nbsp;if (market.val(item) &gt; offer) npc.pay(offer)<br />
                        {'}'})
                    </div>
                </div>
            </div>

            {/* Idea 5 */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:border-blue-500/50 transition-colors group">
                <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400">
                        <TrendingUp size={32} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-gray-400">{t('docs.ideas.difficulty')}: {t('docs.ideas.medium')}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('docs.ideas.items.yield.title')}</h3>
                <p className="text-gray-400 mb-6 min-h-[60px]">
                    {t('docs.ideas.items.yield.desc')}
                </p>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-blue-400/80">
                    <span className="text-gray-500"># Use TypeScript SDK — USDC vault</span><br />
                    const best = await findBestRate(['scallop', 'navi', 'cetus']);<br />
                    await loop.deposit(vault, 'USDC', 100);<br />
                    await loop.supply(best.protocol, amount);
                </div>
            </div>

            {/* Idea 6 */}
            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 hover:border-rose-500/50 transition-colors group">
                <div className="flex items-start justify-between mb-6">
                    <div className="p-3 bg-rose-500/10 rounded-xl text-rose-400">
                        <Zap size={32} />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/5 text-xs font-mono text-gray-400">{t('docs.ideas.difficulty')}: {t('docs.ideas.hard')}</span>
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{t('docs.ideas.items.sniper.title')}</h3>
                <p className="text-gray-400 mb-6 min-h-[60px]">
                    {t('docs.ideas.items.sniper.desc')}
                </p>
                <div className="bg-black/50 rounded-lg p-4 font-mono text-sm text-rose-400/80">
                    <span className="text-gray-500">// Monitor + strike in one block</span><br />
                    onHealthAlert(async (pos) =&gt; {'{'}<br />
                    &nbsp;&nbsp;const loan = await loop.flashLoan(pos.debt);<br />
                    &nbsp;&nbsp;await navi.liquidate(pos.id, loan);<br />
                    {'}'})
                </div>
            </div>
        </div>
    );
}
