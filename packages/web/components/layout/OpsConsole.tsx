"use client";

import { useState, useEffect, useRef } from 'react';
import { Terminal, Activity, Maximize2, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

export default function OpsConsole({ isExpanded, onToggleExpand }: { isExpanded: boolean, onToggleExpand: () => void }) {
    const [logs, setLogs] = useState<any[]>([]);
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Supabase Connection
    useEffect(() => {
        // Initial Fetch
        const fetchInitialLogs = async () => {
            try {
                const { data, error } = await supabase!
                    .from('logs')
                    .select('*')
                    .order('timestamp', { ascending: false })
                    .limit(20);

                if (data && !error) {
                    // Reverse to show oldest first (chronological) because we fetch newest first
                    setLogs(data.reverse());
                }
            } catch (e) {
                console.error("Failed to fetch logs", e);
            }
        };
        fetchInitialLogs();

        // Realtime Subscription
        const channel = supabase!
            .channel('realtime-logs')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'logs' }, (payload) => {
                const newLog = payload.new;
                setLogs(prev => [...prev, newLog].slice(-50));
            })
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setLogs(prev => [...prev, {
                        timestamp: new Date().toISOString(),
                        level: 'system',
                        message: 'CONNECTED TO SUILOOP MATRIX v0.0.7'
                    }]);
                }
            });

        return () => {
            supabase!.removeChannel(channel);
        };
    }, []);

    // Auto-scroll
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <motion.div
            layout
            className={`bg-[#050505] border border-white/10 rounded-xl overflow-hidden flex flex-col transition-all duration-300 ${isExpanded ? 'fixed inset-4 z-[100] h-auto shadow-2xl' : 'h-[300px]'}`}
        >
            {/* Header */}
            <div className="bg-white/5 border-b border-white/5 px-4 py-3 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-neon-cyan" />
                    <span className="text-xs font-mono font-bold text-gray-300">OPS CONSOLE // LIVE FEED</span>
                    <span className="flex items-center gap-1.5 ml-2 px-1.5 py-0.5 rounded bg-green-500/10 text-[10px] text-green-400 border border-green-500/20">
                        <span className="w-1 h-1 rounded-full bg-green-400 animate-pulse"></span>
                        ONLINE
                    </span>
                </div>
                <button
                    onClick={onToggleExpand}
                    className="text-gray-500 hover:text-white transition-colors"
                >
                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
            </div>

            {/* Logs Area */}
            <div className="flex-1 bg-black/50 p-4 font-mono text-[11px] overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                    {logs.length === 0 && (
                        <div className="text-gray-600 italic">Initializing Neural Uplink...</div>
                    )}
                    {logs.map((log, i) => (
                        <div key={i} className="break-all border-l-2 custom-log-entry pl-2 py-0.5 hover:bg-white/5 transition-colors"
                            style={{
                                borderColor: log.level === 'error' ? '#ef4444' :
                                    log.level === 'success' ? '#4ade80' :
                                        log.level === 'system' ? '#06b6d4' : '#3b82f6'
                            }}
                        >
                            <span className="text-gray-600 mr-2">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                            <span
                                className={`font-bold mr-2 ${log.level === 'error' ? 'text-red-500' :
                                    log.level === 'warn' ? 'text-yellow-500' :
                                        log.level === 'success' ? 'text-green-400' :
                                            log.level === 'system' ? 'text-neon-cyan' :
                                                'text-blue-400'
                                    }`}
                            >
                                {log.level?.toUpperCase()}
                            </span>
                            <span className="text-gray-300">{log.message}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            </div>
        </motion.div>
    );
}
