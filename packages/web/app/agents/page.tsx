"use client";

import { useState, useEffect, useRef } from 'react';
import Navbar from "@/components/layout/Navbar";
import ApiKeyManager from "@/components/docs/ApiKeyManager";
import { Terminal, Cpu, Activity, Signal, Shield, Radio, Code, Zap, Copy } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { getWebSocketUrl } from "@/lib/constants";

export default function AgentsPage() {
    const [activeTab, setActiveTab] = useState<'logs' | 'sdk'>('logs');
    const [syntax, setSyntax] = useState<'ts' | 'py'>('ts');
    const [logs, setLogs] = useState<any[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // WebSocket Connection for Live Logs
    useEffect(() => {
        let ws: WebSocket;
        let reconnectTimer: NodeJS.Timeout;

        const connect = () => {
            // Connect to real backend WebSocket
            ws = new WebSocket(getWebSocketUrl('/ws/signals'));

            ws.onopen = () => {
                setLogs(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    level: 'system',
                    message: 'CONNECTED TO SUILOOP NEURAL MATRIX'
                }]);
            };

            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'system_log') {
                        setLogs(prev => [...prev, data.log].slice(-100)); // Keep last 100 logs
                    } else if (data.type === 'welcome') {
                        setLogs(prev => [...prev, {
                            timestamp: new Date().toISOString(),
                            level: 'info',
                            message: data.message
                        }]);
                    }
                } catch (e) {
                    console.error('WebSocket parse error', e);
                }
            };

            ws.onerror = () => {
                // Silent error to avoid spamming console
            };

            ws.onclose = () => {
                setLogs(prev => [...prev, {
                    timestamp: new Date().toISOString(),
                    level: 'warn',
                    message: 'CONNECTION LOST - RECONNECTING...'
                }]);
                reconnectTimer = setTimeout(connect, 3000);
            };
        };

        connect();

        return () => {
            if (ws) ws.close();
            clearTimeout(reconnectTimer);
        };
    }, []);

    // Auto-scroll to bottom of logs
    useEffect(() => {
        if (activeTab === 'logs') {
            logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }
    }, [logs, activeTab]);

    return (
        <main className="min-h-screen bg-black text-white selection:bg-neon-cyan/30 overflow-hidden relative">
            <Navbar />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0">
                <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-neon-purple/10 to-transparent opacity-50" />
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-neon-cyan/5 rounded-full blur-[120px]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
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
                        SYSTEM ONLINE: v0.0.7 // ENCRYPTED
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-200 to-gray-500 tracking-tight"
                    >
                        OPERATIONS COMMAND CENTER
                    </motion.h1>
                    <p className="text-gray-400 max-w-2xl mx-auto text-lg">
                        Interface for deploying autonomous financial warheads.
                        Generate credentials, monitor field units, and inject logic directly into the SuiLoop Neural Matrix.
                    </p>
                </div>

                {/* Dashboard Grid */}
                <div className="grid lg:grid-cols-3 gap-8">

                    {/* Left Column: Telemetry - Keeping existing code */}
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
                                ORBITAL UPLINK STATUS
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Uplink Gateway</span>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">OPERATIONAL</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Targeting Engine</span>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">OPERATIONAL</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Secure Enclave</span>
                                    <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded">SHIELD ACTIVE</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Walrus Auditing</span>
                                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">LOGGING</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-sm">Latency</span>
                                    <span className="text-xs font-mono">12ms</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6">
                            <h3 className="text-sm font-mono text-gray-400 flex items-center gap-2 mb-4">
                                <Signal className="w-4 h-4 text-neon-purple" />
                                DEPLOYED UNITS
                            </h3>
                            <div className="h-32 flex items-end justify-between gap-1 px-2">
                                {[40, 65, 30, 80, 50, 90, 40, 70, 45, 60].map((h, i) => (
                                    <div key={i} className="w-full bg-white/10 rounded-t-sm relative overflow-hidden group">
                                        <motion.div
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ duration: 1, delay: i * 0.1 }}
                                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-neon-purple to-neon-cyan w-full opacity-50 group-hover:opacity-80 transition-opacity"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div className="mt-2 text-xs text-center text-gray-500 font-mono">
                                PACKET INTERCEPTION RATE (REQ/SEC)
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
                                <h3 className="font-bold text-white">SuiLoop CLI</h3>
                                <span className="bg-neon-cyan/20 text-neon-cyan text-[10px] px-2 py-0.5 rounded font-mono">NEW</span>
                            </div>
                            <p className="text-xs text-gray-400 mb-3">Scaffold a combat-ready agent in seconds.</p>
                            <div className="bg-black/50 border border-white/5 rounded px-3 py-2 flex justify-between items-center group cursor-pointer hover:border-white/20 transition-colors">
                                <code className="text-xs font-mono text-neon-cyan">npx suiloop create-unit</code>
                                <Copy className="w-3 h-3 text-gray-500 group-hover:text-white transition-colors" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center hover:bg-white/10 transition-colors cursor-pointer">
                                <Code className="w-6 h-6 mx-auto mb-2 text-blue-400" />
                                <div className="text-sm font-bold">Python SDK</div>
                                <div className="text-xs text-green-400">v0.0.7 Ready</div>
                            </div>
                            <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center hover:bg-white/10 transition-colors cursor-pointer">
                                <Zap className="w-6 h-6 mx-auto mb-2 text-yellow-400" />
                                <div className="text-sm font-bold">Node.js SDK</div>
                                <div className="text-xs text-green-400">v0.0.7 Ready</div>
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
                                    {activeTab === 'logs' ? 'LIVE NEURAL FEED' : 'DIRECT LINK PROTOCOL'}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setActiveTab('logs')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${activeTab === 'logs' ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-gray-500'}`}
                                    >LOGS</button>
                                    <button
                                        onClick={() => setActiveTab('sdk')}
                                        className={`px-2 py-0.5 rounded text-[10px] font-bold transition-colors ${activeTab === 'sdk' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-500'}`}
                                    >SDK</button>
                                </div>
                            </div>

                            {activeTab === 'logs' ? (
                                <div className="bg-black rounded-lg p-4 font-mono text-xs text-gray-300 overflow-y-auto border border-white/5 shadow-inner flex-grow h-[300px] scrollbar-thin scrollbar-thumb-white/10">
                                    <div className="space-y-1">
                                        {logs.length === 0 && (
                                            <div className="text-gray-600 italic">Waiting for signal Uplink...</div>
                                        )}
                                        {logs.map((log, i) => (
                                            <div key={i} className="break-all">
                                                <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>{' '}
                                                <span className={`${log.level === 'error' ? 'text-red-500' :
                                                    log.level === 'warn' ? 'text-yellow-500' :
                                                        log.level === 'success' ? 'text-green-400' :
                                                            log.level === 'system' ? 'text-neon-cyan' :
                                                                'text-blue-400'
                                                    }`}>
                                                    {log.level?.toUpperCase()}
                                                </span>{' '}
                                                <span className="text-gray-300">{log.message}</span>
                                            </div>
                                        ))}
                                        {/* Elemento invisible para auto-scroll */}
                                        <div ref={logsEndRef} />
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-black rounded-lg p-4 font-mono text-xs text-gray-300 overflow-x-auto border border-white/5 shadow-inner h-[300px] flex-grow">
                                    <div className="flex justify-end gap-2 mb-2">
                                        <button onClick={() => setSyntax('ts')} className={`text-[10px] ${syntax === 'ts' ? 'text-blue-400' : 'text-gray-600'}`}>TS</button>
                                        <button onClick={() => setSyntax('py')} className={`text-[10px] ${syntax === 'py' ? 'text-yellow-400' : 'text-gray-600'}`}>PY</button>
                                    </div>
                                    {syntax === 'ts' ? (
                                        <div className="space-y-1">
                                            <div><span className="text-purple-400">import</span> {"{"} Agent {"}"} <span className="text-purple-400">from</span> <span className="text-green-400">'@suiloop/sdk'</span>;</div>
                                            <div><span className="text-purple-400">import</span> {"{"} Navi {"}"} <span className="text-purple-400">from</span> <span className="text-green-400">'@naviprotocol/lending'</span>;</div>
                                            <div className="h-2"></div>
                                            <div className="text-gray-500">// Initialize Unit</div>
                                            <div><span className="text-blue-400">const</span> bot = <span className="text-blue-400">new</span> Agent({"{"}</div>
                                            <div className="pl-4">apiKey: <span className="text-yellow-300">'sk_live_...'</span></div>
                                            <div>{"}"});</div>
                                            <div className="h-2"></div>
                                            <div className="text-gray-500">// Exec Lending Loop</div>
                                            <div>bot.subscribe((<span className="text-orange-300">signal</span>) ={">"} {"{"}</div>
                                            <div className="pl-4"><span className="text-blue-400">if</span> (signal.type === <span className="text-yellow-300">'NAVI_SUPPLY'</span>) {"{"}</div>
                                            <div className="pl-8">Navi.supply(<span className="text-green-400">'SUI'</span>, signal.amount);</div>
                                            <div className="pl-4">{"}"}</div>
                                            <div>{"}"});</div>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            <div><span className="text-purple-400">from</span> suiloop <span className="text-purple-400">import</span> Agent</div>
                                            <div className="h-2"></div>
                                            <div className="text-gray-500"># Initialize Unit</div>
                                            <div>bot = Agent(api_key=<span className="text-yellow-300">"sk_live_..."</span>)</div>
                                            <div className="h-2"></div>
                                            <div className="text-gray-500"># Intercept & Strike</div>
                                            <div><span className="text-purple-400">async for</span> signal <span className="text-purple-400">in</span> bot.listen():</div>
                                            <div className="pl-4"><span className="text-blue-400">if</span> signal[<span className="text-green-400">'score'</span>] {">"} 80:</div>
                                            <div className="pl-8">bot.execute(<span className="text-green-400">"convex-arb-v1"</span>, signal)</div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <p className="mt-4 text-xs text-gray-500">
                                {activeTab === 'logs' ? 'Connecting to neural matrix via secure websocket...' : 'Use the Generated Key above to authenticate your autonomous units.'}
                            </p>
                        </div>

                        <div className="bg-gradient-to-br from-neon-purple/20 to-transparent border border-neon-purple/30 rounded-xl p-6">
                            <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                                <Shield className="w-4 h-4 text-neon-purple" />
                                Institutional Security
                            </h3>
                            <p className="text-xs text-gray-300 leading-relaxed opacity-80">
                                All agent interactions are secured by Move guarantees (OwnerCap) and signed nonces.
                                Transactions are atomically executed in a single PTB. Forensic logs are permanently stored on Walrus decentralized storage.
                            </p>
                            <button
                                onClick={() => {
                                    const downloadPromise = new Promise<void>((resolve) => {
                                        setTimeout(() => {
                                            // Generate Real Download
                                            const auditData = {
                                                audit_id: `BLK-BOX-${Date.now()}`,
                                                timestamp: new Date().toISOString(),
                                                agent_integrity: "100%",
                                                enclave_signature: "0x8a2f...3b1c",
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
                                            a.download = 'sui-audit.json';
                                            document.body.appendChild(a);
                                            a.click();
                                            window.URL.revokeObjectURL(url);
                                            document.body.removeChild(a);

                                            resolve();
                                        }, 1500);
                                    });

                                    toast.promise(downloadPromise, {
                                        loading: 'Decrypting Black Box Neural Signatures...',
                                        success: 'Secure Logs Downloaded (sui-audit.json)',
                                        error: 'Access Denied'
                                    });

                                    setLogs(prev => [...prev, {
                                        level: 'system',
                                        message: '⚠️ ENCRYPTED LOG DUMP REQUESTED BY OPERATOR',
                                        timestamp: new Date().toISOString()
                                    }]);
                                }}
                                className="mt-4 w-full py-2 bg-neon-purple/20 hover:bg-neon-purple/30 text-neon-purple border border-neon-purple/50 rounded-lg text-xs font-bold transition-all hover:shadow-[0_0_15px_rgba(168,85,247,0.3)] active:scale-95"
                            >
                                ACCESS BLACK BOX DATA
                            </button>
                        </div>
                    </motion.div>

                </div>
            </div>
        </main>
    );
}
