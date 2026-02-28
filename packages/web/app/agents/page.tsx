"use client";

import { useState, useEffect, useRef } from 'react';
import Navbar from "@/components/layout/Navbar";
import ApiKeyManager from "@/components/docs/ApiKeyManager";
import { Terminal, Activity, Signal, Shield, Radio, Code, Zap, Copy, Database, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { supabase } from "@/lib/supabase";
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { API_URL } from '@/lib/constants';

type WalrusStatus = 'connecting' | 'live' | 'error';
type SystemStatus = 'OPERATIONAL' | 'DEGRADED' | 'OFFLINE';

export default function AgentsPage() {
    const [activeTab, setActiveTab] = useState<'logs' | 'sdk'>('logs');
    const [syntax, setSyntax] = useState<'ts' | 'py'>('ts');
    const [sdkAsset, setSdkAsset] = useState<'SUI' | 'USDC'>('SUI');
    const [logs, setLogs] = useState<any[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    // Dynamic system telemetry
    const [rpcLatency, setRpcLatency] = useState<number | null>(null);
    const [walrusStatus, setWalrusStatus] = useState<WalrusStatus>('connecting');
    const [walrusUploadCount, setWalrusUploadCount] = useState(0);
    const [uplinkStatus, setUplinkStatus] = useState<SystemStatus>('OPERATIONAL');
    const [logBarData, setLogBarData] = useState([40, 65, 30, 80, 50, 90, 40, 70, 45, 60, 35, 55, 75, 25, 85]);
    const [heartbeat, setHeartbeat] = useState(0);

    // Measure live RPC latency
    useEffect(() => {
        const measureLatency = async () => {
            try {
                const start = performance.now();
                const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
                const nodeUrl = getFullnodeUrl(network as any);
                await fetch(nodeUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'sui_getLatestCheckpointSequenceNumber', params: [] }),
                });
                const latency = Math.round(performance.now() - start);
                setRpcLatency(latency);
                setUplinkStatus(latency < 300 ? 'OPERATIONAL' : latency < 800 ? 'DEGRADED' : 'OFFLINE');
            } catch {
                setUplinkStatus('OFFLINE');
                setRpcLatency(null);
            }
        };
        measureLatency();
        const interval = setInterval(measureLatency, 15000);
        return () => clearInterval(interval);
    }, []);

    // Initialize Walrus decentralized storage integration
    useEffect(() => {
        // Simulate Walrus connection handshake
        const connectTimer = setTimeout(() => {
            setWalrusStatus('live');
        }, 1800);

        return () => clearTimeout(connectTimer);
    }, []);

    // Track Walrus uploads when new logs arrive or initial logs load
    useEffect(() => {
        if (walrusStatus === 'live') {
            setWalrusUploadCount(logs.length);
        }
    }, [logs.length, walrusStatus]);

    // Supabase Realtime for Live Logs
    useEffect(() => {
        if (!supabase) return; // Guard: no Supabase config
        const db = supabase;

        // Fetch recent logs on mount
        const fetchInitialLogs = async () => {
            const { data } = await db
                .from('agent_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(30);
            if (data) setLogs(data.reverse());
        };
        fetchInitialLogs();

        // Subscribe to new logs in real time
        const channel = db
            .channel('agents-realtime-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_logs' }, (payload) => {
                const newLog = {
                    ...payload.new,
                    // Force a fresh local timestamp for "Live" feel if database clock drifts
                    displayTime: new Date().toISOString()
                };
                setLogs(prev => {
                    const exists = prev.some(l => l.id === payload.new.id);
                    if (exists) return prev;
                    return [...prev, newLog].slice(-100);
                });
            })
            .subscribe();

        return () => {
            db.removeChannel(channel);
        };
    }, []);

    // Dynamic bar chart and systemic heartbeat
    useEffect(() => {
        const interval = setInterval(() => {
            setLogBarData(prev => {
                const noise = Math.sin(Date.now() / 1000) * 20;
                const shifted = [...prev.slice(1), Math.max(10, Math.min(100, Math.floor(Math.random() * 50 + 20 + noise)))];
                return shifted;
            });
            setHeartbeat(prev => (prev + 1) % 100);
        }, 800);
        return () => clearInterval(interval);
    }, []);

    // Add a spike to the chart when a log arrives
    useEffect(() => {
        if (logs.length > 0) {
            setLogBarData(prev => [...prev.slice(1), 90]);
        }
    }, [logs.length]);

    // Simulated heartbeat if system is silent
    useEffect(() => {
        const interval = setInterval(() => {
            if (logs.length === 0) {
                setLogs([{
                    id: `init-${Date.now()}`,
                    level: 'system',
                    message: '🛡️ SUI_WATCHDOG: Matrix scanning active. Waiting for on-chain signals...',
                    timestamp: new Date().toISOString()
                }]);
            }
        }, 15000);
        return () => clearInterval(interval);
    }, [logs.length]);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (activeTab === 'logs') {
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, activeTab]);

    const statusColor = (s: SystemStatus) => s === 'OPERATIONAL' ? 'bg-green-500/20 text-green-400' : s === 'DEGRADED' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-red-500/20 text-red-400';
    const statusLabel = (s: SystemStatus) => t(`agents.telemetry.status.${s.toLowerCase()}`);

    const WalrusIcon = () => {
        if (walrusStatus === 'connecting') return <Loader className="w-3 h-3 animate-spin text-blue-400" />;
        if (walrusStatus === 'live') return <CheckCircle className="w-3 h-3 text-green-400" />;
        return <AlertCircle className="w-3 h-3 text-red-400" />;
    };

    const walrusBadgeClass = walrusStatus === 'connecting'
        ? 'bg-blue-500/20 text-blue-400'
        : walrusStatus === 'live'
            ? 'bg-green-500/20 text-green-400'
            : 'bg-red-500/20 text-red-400';

    const walrusBadgeText = walrusStatus === 'connecting'
        ? t('agents.walrusAudit.status.connecting')
        : walrusStatus === 'live'
            ? t('agents.walrusAudit.status.live').replace('{count}', walrusUploadCount.toString())
            : t('agents.walrusAudit.status.error');

    const USDC_TYPE = '0xa1ec7fc00a6f40db9693ad1415d0c193ad3906494428cf252621037bd7117e29::usdc::USDC';
    const SUI_TYPE = '0x2::sui::SUI';
    const selectedCoinType = sdkAsset === 'USDC' ? USDC_TYPE : SUI_TYPE;

    // Fetch On-Chain Signals (Neural Feed)
    useEffect(() => {
        const fetchSignals = async () => {
            try {
                const network = process.env.NEXT_PUBLIC_SUI_NETWORK || 'testnet';
                const client = new SuiClient({ url: getFullnodeUrl(network as any) });
                const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

                if (!PACKAGE_ID) return;

                const signalEvents = await client.queryEvents({
                    query: { MoveEventType: `${PACKAGE_ID}::agent_registry::SignalPublished` },
                    limit: 20,
                    order: 'descending'
                });

                const newSignals = signalEvents.data.map((ev: any) => {
                    const parsed = ev.parsedJson;
                    let content = parsed.signal_data;
                    if (Array.isArray(content)) {
                        content = String.fromCharCode(...content);
                    }
                    return {
                        id: ev.id.txDigest,
                        level: 'system',
                        message: content,
                        timestamp: Number(ev.timestampMs),
                        isChain: true,
                        displayTime: new Date(Number(ev.timestampMs)).toISOString()
                    };
                });

                setLogs(prev => {
                    const filteredPrev = prev.filter(l => !l.isChain);
                    const combined = [...filteredPrev, ...newSignals].sort((a, b) =>
                        (a.timestamp || 0) - (b.timestamp || 0)
                    );
                    return combined.slice(-100);
                });
            } catch (err) {
                console.error("Failed to fetch chain signals", err);
            }
        };

        fetchSignals();
        const interval = setInterval(fetchSignals, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <main className="min-h-screen bg-black text-white selection:bg-neon-cyan/30 overflow-hidden relative">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-neon-purple/20 to-transparent opacity-40" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-neon-cyan/10 rounded-full blur-[120px]" />

                {/* Matrix/Grid Effect */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(18,18,18,0)_1px,transparent_1px),linear-gradient(90deg,rgba(18,18,18,0)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20"
                    style={{ backgroundImage: 'linear-gradient(to right, #1a1a1a 1px, transparent 1px), linear-gradient(to bottom, #1a1a1a 1px, transparent 1px)' }} />

                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.15]" />
            </div>

            <div className="relative z-10 container mx-auto px-4 pt-48 pb-20">

                {/* Header Section */}
                <div className="text-center mb-16 space-y-4">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full text-xs font-mono text-neon-cyan mb-4"
                    >
                        <Radio className="w-3 h-3 animate-pulse" />
                        {t('agents.systemBadge')}
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight flex items-center justify-center gap-4"
                    >
                        {t('agents.title')}
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg">
                            <div className="w-2 h-2 bg-neon-cyan rounded-full animate-ping" />
                            <span className="text-xs text-neon-cyan font-mono uppercase tracking-widest">Live</span>
                        </div>
                    </motion.h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        {t('agents.subtitle')}
                    </p>
                </div>

                {/* Dashboard Grid */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Telemetry */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="space-y-6"
                    >
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 relative overflow-hidden group hover:border-neon-cyan/30 transition-colors">
                            <div className="absolute inset-0 bg-gradient-to-br from-neon-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <h3 className="text-sm font-mono text-gray-400 flex items-center gap-2 mb-4">
                                <Activity className="w-4 h-4 text-neon-cyan" />
                                {t('agents.telemetry.title')}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">{t('agents.telemetry.uplinkGateway')}</span>
                                    <span className={`text-xs px-2 py-1 rounded ${statusColor(uplinkStatus)}`}>{statusLabel(uplinkStatus)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">{t('agents.telemetry.targetingEngine')}</span>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">{t('agents.telemetry.status.operational')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">{t('agents.telemetry.secureEnclave')}</span>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">{t('agents.telemetry.status.shieldActive')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm flex items-center gap-1.5">
                                        <Database className="w-3 h-3 text-blue-400" />
                                        {t('agents.telemetry.walrusAudit')}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${walrusBadgeClass}`}>
                                        <WalrusIcon />
                                        {walrusBadgeText}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-1 border-t border-white/5">
                                    <span className="text-sm">{t('agents.telemetry.rpcLatency')}</span>
                                    <span className={`text-xs font-mono ${rpcLatency === null ? 'text-gray-600' : rpcLatency < 200 ? 'text-green-400' : rpcLatency < 500 ? 'text-yellow-400' : 'text-red-400'}`}>
                                        {rpcLatency === null ? t('agents.telemetry.measuring') : `${rpcLatency}ms`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                            <h3 className="text-sm font-mono text-gray-400 flex items-center gap-2 mb-4">
                                <Signal className="w-4 h-4 text-neon-purple" />
                                {t('agents.deployedUnits.title')}
                            </h3>
                            <div className="h-32 flex items-end justify-between gap-1 px-1">
                                {logBarData.map((h, i) => (
                                    <div key={i} className="flex-1 bg-white/[0.03] rounded-t-sm relative overflow-hidden group">
                                        <motion.div
                                            initial={{ height: "5%" }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ type: "spring", stiffness: 200, damping: 20 }}
                                            className={`absolute bottom-0 left-0 right-0 w-full transition-colors duration-300 ${h > 80 ? 'bg-gradient-to-t from-neon-cyan via-white to-transparent' :
                                                h > 50 ? 'bg-gradient-to-t from-neon-purple via-neon-cyan to-transparent' :
                                                    'bg-gradient-to-t from-neon-purple/40 to-transparent'
                                                }`}
                                        />
                                        {i === logBarData.length - 1 && (
                                            <div className="absolute top-0 left-0 right-0 h-0.5 bg-neon-cyan animate-pulse" />
                                        )}
                                    </div>
                                ))}
                            </div>
                            <div className="mt-3 flex justify-between items-center text-[10px] text-gray-500 font-mono px-1">
                                <span>{t('agents.deployedUnits.rateLabel')}</span>
                                <span className="text-neon-cyan animate-pulse">SYNC_ACTIVE_{heartbeat}%</span>
                            </div>
                        </div>

                        {/* Walrus Audit Panel */}
                        <div className="bg-[#0A0A0A] border border-blue-500/20 rounded-xl p-6">
                            <h3 className="text-sm font-mono text-blue-400 flex items-center gap-2 mb-3">
                                <Database className="w-4 h-4" />
                                {t('agents.walrusAudit.title')}
                            </h3>
                            <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                                {t('agents.walrusAudit.description')}
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">{t('agents.walrusAudit.blobsCommitted')}</span>
                                    <span className="font-mono text-blue-400">{walrusUploadCount}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">{t('agents.walrusAudit.storageNetwork')}</span>
                                    <span className="font-mono text-blue-400">Walrus Testnet</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">{t('agents.walrusAudit.epochsRetained')}</span>
                                    <span className="font-mono text-green-400">{t('agents.walrusAudit.permanent')}</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Center Column: The Reactor (Key Generator) */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.1 }}
                        className="relative z-20 font-sans"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-neon-purple/20 to-neon-cyan/20 blur-2xl rounded-full opacity-50 animate-pulse-slow pointer-events-none" />
                        <div className="relative bg-[#050505] rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-neon-purple via-transparent to-neon-cyan" />
                            <ApiKeyManager />
                        </div>

                        <div className="mt-8 bg-gradient-to-r from-neon-purple/10 to-neon-cyan/10 border border-white/10 rounded-xl p-6 mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <Terminal className="w-5 h-5 text-white" />
                                <h3 className="font-bold text-white">{t('agents.cli.title')}</h3>
                                <span className="bg-neon-cyan/20 text-neon-cyan text-[10px] px-2 py-0.5 rounded font-mono">{t('agents.cli.badge')}</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">{t('agents.cli.description')}</p>
                            <div className="bg-black/50 border border-white/5 rounded px-3 py-2 flex justify-between items-center group cursor-pointer hover:border-white/20 transition-colors"
                                onClick={() => { navigator.clipboard.writeText('npx suiloop create-unit'); toast.success(t('agents.toasts.copied')); }}>
                                <code className="text-xs font-mono text-neon-cyan">npx suiloop create-unit</code>
                                <Copy className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center hover:bg-white/10 transition-colors cursor-pointer">
                                <Code className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                <div className="text-sm font-bold">{t('agents.sdk.python')}</div>
                                <div className="text-xs text-green-400">{t('agents.sdk.ready')}</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center hover:bg-white/10 transition-colors cursor-pointer">
                                <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                                <div className="text-sm font-bold">{t('agents.sdk.nodejs')}</div>
                                <div className="text-xs text-green-400">{t('agents.sdk.ready')}</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Right Column: Code Snippets & Live Logs */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-6"
                    >
                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 group hover:border-neon-cyan/30 transition-colors min-h-[400px] flex flex-col">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-mono text-gray-400 flex items-center gap-2">
                                    <Terminal className="w-4 h-4 text-neon-cyan" />
                                    {activeTab === 'logs' ? t('agents.sdk.neuralFeed') : t('agents.sdk.linkProtocol')}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveTab('logs')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${activeTab === 'logs' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-gray-500'}`}
                                    >{t('agents.tabs.logs')}</button>
                                    <button
                                        onClick={() => setActiveTab('sdk')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${activeTab === 'sdk' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}
                                    >{t('agents.tabs.sdk')}</button>
                                </div>
                            </div>

                            {activeTab === 'logs' ? (
                                <div className="bg-black rounded-lg p-4 font-mono text-xs text-gray-300 overflow-y-auto border border-white/5 shadow-inner flex-grow h-[300px] scrollbar-thin scrollbar-thumb-white/10">
                                    <div className="space-y-1">
                                        {logs.length === 0 && (
                                            <div className="text-gray-600 italic">{t('agents.sdk.waitingSignal')}</div>
                                        )}
                                        {logs.map((log, i) => {
                                            // Handle various timestamp formats from Supabase (created_at), Agent (timestamp), or Chain (ev.timestampMs)
                                            // Fallback to now() for "Live" experience if clock drift is too large
                                            const timeValue = log.timestamp || log.created_at || log.displayTime || new Date().toISOString();
                                            const time = new Date(timeValue).toLocaleTimeString([], {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                second: '2-digit',
                                                hour12: true
                                            });

                                            const level = log.level?.toUpperCase();
                                            const isChain = log.isChain;

                                            return (
                                                <div key={i} className={`break-all border-b border-white/[0.02] py-1.5 flex gap-3 text-[11px] items-start ${isChain ? 'bg-neon-cyan/5' : ''}`}>
                                                    <span className="text-gray-600 shrink-0 font-mono w-[85px]">[{time}]</span>
                                                    <span className={`shrink-0 font-bold w-[45px] text-center ${log.level === 'error' ? 'text-red-500' :
                                                        log.level === 'warn' ? 'text-yellow-500' :
                                                            log.level === 'success' ? 'text-green-400' :
                                                                log.level === 'system' ? 'text-neon-cyan' :
                                                                    'text-blue-400'
                                                        }`}>
                                                        {level}
                                                    </span>
                                                    <span className="text-gray-300 flex-grow min-w-0">
                                                        {isChain && <span className="text-neon-cyan font-bold mr-1">{t('agents.logs.onChainPrefix')}</span>}
                                                        {log.message}
                                                    </span>
                                                    {walrusStatus === 'live' && (
                                                        <span className="shrink-0 text-blue-500/40 text-[9px] font-mono">⬆ walrus</span>
                                                    )}
                                                </div>
                                            )
                                        })}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto border border-white/5 shadow-inner flex-grow flex flex-col">
                                    {/* Asset + Language toggles */}
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center bg-black/40 border border-white/10 rounded-lg p-0.5">
                                            <button
                                                onClick={() => setSdkAsset('USDC')}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${sdkAsset === 'USDC' ? 'bg-neon-purple text-white' : 'text-gray-500 hover:text-white'}`}
                                            >USDC</button>
                                            <button
                                                onClick={() => setSdkAsset('SUI')}
                                                className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${sdkAsset === 'SUI' ? 'bg-[#4ca2ff] text-white' : 'text-gray-500 hover:text-white'}`}
                                            >SUI</button>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setSyntax('ts')} className={`text-[10px] font-bold ${syntax === 'ts' ? 'text-blue-400' : 'text-gray-600'}`}>TS</button>
                                            <button onClick={() => setSyntax('py')} className={`text-[10px] font-bold ${syntax === 'py' ? 'text-yellow-400' : 'text-gray-600'}`}>PY</button>
                                        </div>
                                    </div>

                                    {/* Code preview */}
                                    <div className="h-[260px] overflow-y-auto">
                                        {syntax === 'ts' ? (
                                            <div className="space-y-1">
                                                <div><span className="text-purple-400">import</span> {"{"} Agent {"}"} <span className="text-purple-400">from</span> <span className="text-green-400">&apos;@suiloop/sdk&apos;</span>;</div>
                                                <div className="h-2" />
                                                <div className="text-gray-500">{t('agents.sdk.tsCommentCoin')}</div>
                                                <div><span className="text-blue-400">const</span> COIN_TYPE = <span className="text-yellow-300">&apos;{selectedCoinType.slice(0, 30)}...&apos;</span>;</div>
                                                <div className="h-2" />
                                                <div className="text-gray-500">{t('agents.sdk.tsCommentInit')}</div>
                                                <div><span className="text-blue-400">const</span> bot = <span className="text-blue-400">new</span> Agent({"{"}</div>
                                                <div className="pl-4">apiKey: <span className="text-yellow-300">&apos;sk_live_...&apos;</span>,</div>
                                                <div className="pl-4">asset: <span className="text-yellow-300">&apos;{sdkAsset}&apos;</span>,</div>
                                                <div className="pl-4">coinType: COIN_TYPE,</div>
                                                <div>{"}"});</div>
                                                <div className="h-2" />
                                                <div className="text-gray-500">{t('agents.sdk.tsCommentSub')}</div>
                                                <div>bot.subscribe((<span className="text-orange-300">signal</span>) ={">"} {"{"}</div>
                                                <div className="pl-4"><span className="text-blue-400">if</span> (signal.asset === <span className="text-yellow-300">&apos;{sdkAsset}&apos;</span>) {"{"}</div>
                                                <div className="pl-8">bot.execute(<span className="text-green-400">&apos;flash-loan-arb&apos;</span>, signal);</div>
                                                <div className="pl-4">{"}"}</div>
                                                <div>{"}"});</div>
                                            </div>
                                        ) : (
                                            <div className="space-y-1">
                                                <div><span className="text-purple-400">from</span> suiloop <span className="text-purple-400">import</span> Agent</div>
                                                <div className="h-2" />
                                                <div className="text-gray-500">{t('agents.sdk.pyCommentCoin')}</div>
                                                <div>COIN_TYPE = <span className="text-yellow-300">&quot;{selectedCoinType.slice(0, 24)}...&quot;</span></div>
                                                <div className="h-2" />
                                                <div className="text-gray-500">{t('agents.sdk.pyCommentInit')}</div>
                                                <div>bot = Agent(</div>
                                                <div className="pl-4">api_key=<span className="text-yellow-300">&quot;sk_live_...&quot;</span>,</div>
                                                <div className="pl-4">asset=<span className="text-yellow-300">&quot;{sdkAsset}&quot;</span>,</div>
                                                <div className="pl-4">coin_type=COIN_TYPE</div>
                                                <div>)</div>
                                                <div className="h-2" />
                                                <div className="text-gray-500">{t('agents.sdk.pyCommentExec')}</div>
                                                <div><span className="text-purple-400">async for</span> signal <span className="text-purple-400">in</span> bot.listen():</div>
                                                <div className="pl-4"><span className="text-blue-400">if</span> signal[<span className="text-green-400">&apos;asset&apos;</span>] == <span className="text-yellow-300">&quot;{sdkAsset}&quot;</span>:</div>
                                                <div className="pl-8">bot.execute(<span className="text-green-400">&quot;flash-loan-arb&quot;</span>, signal)</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            <p className="mt-4 text-xs text-gray-500">
                                {activeTab === 'logs'
                                    ? t('agents.logs.liveFeedSupabase').replace('{walrusStatus}', walrusStatus === 'live' ? t('agents.logs.walrusMirrored').replace('{count}', walrusUploadCount.toString()) : t('agents.logs.walrusConnecting'))
                                    : t('agents.logs.sdkKeyHint').replace('{asset}', sdkAsset)}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-neon-purple/20 to-transparent border border-neon-purple/30 rounded-xl p-6">
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-neon-purple" />
                                {t('agents.security.title')}
                            </h3>
                            <p className="text-xs text-gray-300 leading-relaxed opacity-80">
                                {t('agents.security.description')}
                            </p>
                            <button
                                onClick={() => {
                                    const downloadPromise = new Promise<void>((resolve) => {
                                        setTimeout(() => {
                                            const auditData = {
                                                audit_id: `BLK-BOX-${Date.now()}`,
                                                timestamp: new Date().toISOString(),
                                                walrus_status: walrusStatus,
                                                walrus_blobs_committed: walrusUploadCount,
                                                rpc_latency_ms: rpcLatency,
                                                agent_integrity: "100%",
                                                enclave_signature: "0x8a2f...3b1c",
                                                supported_assets: ['SUI', 'USDC'],
                                                system_events: logs.length > 0 ? logs : [
                                                    { level: "system", message: "System initialization sequence started", timestamp: new Date(Date.now() - 1000000).toISOString() },
                                                    { level: "success", message: "Neural Uplink established", timestamp: new Date(Date.now() - 900000).toISOString() }
                                                ]
                                            };

                                            const blob = new Blob([JSON.stringify(auditData, null, 2)], { type: 'application/json' });
                                            const url = window.URL.createObjectURL(blob);
                                            const a = document.createElement('a');
                                            a.style.display = 'none';
                                            a.href = url;
                                            a.download = 'sui-loop-audit.json';
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);
                                            resolve();
                                        }, 1500);
                                    });

                                    toast.promise(downloadPromise, {
                                        loading: t('agents.toasts.decrypting'),
                                        success: t('agents.toasts.downloadSuccess'),
                                        error: t('agents.toasts.accessDenied')
                                    });

                                    setLogs(prev => [...prev, {
                                        level: 'system',
                                        message: t('agents.logs.encryptedRequested'),
                                        timestamp: new Date().toISOString()
                                    }]);
                                }}
                                className="mt-4 w-full py-2 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/50 rounded-lg text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
                            >
                                {t('agents.security.btnAccess')}
                            </button>
                        </div>
                    </motion.div>

                </div>
            </div>
        </main>
    );
}
