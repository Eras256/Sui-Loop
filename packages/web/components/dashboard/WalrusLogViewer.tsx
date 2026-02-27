"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileCode2, Link2, AlertCircle, Loader2, Copy, ExternalLink, RefreshCw } from "lucide-react";

export interface AgentLog {
    agentId: string;
    strategyId: string;
    timestamp: number;
    action: string;
    reasoning: string;
    txDigest?: string;
    profit?: number;
    status: "success" | "reverted" | "pending";
}

interface WalrusLogViewerProps {
    logs: AgentLog[];
    agentId?: string;
}

const WALRUS_PUBLISHER = "https://publisher.walrus-testnet.walrus.space";
const WALRUS_AGGREGATOR = "https://aggregator.walrus-testnet.walrus.space";

/** Upload a single agent log JSON blob to the Sui Walrus Testnet */
async function uploadLogToWalrus(log: AgentLog): Promise<{ blobId: string; url: string }> {
    const payload = JSON.stringify({
        type: "suiloop_agent_reasoning_log",
        kernel_version: "0.0.7",
        content: log,
        timestamp: new Date(log.timestamp).toISOString(),
    });

    const response = await fetch(`${WALRUS_PUBLISHER}/v1/blobs?epochs=5`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: payload,
    });

    if (!response.ok) throw new Error(`Walrus PUT failed: ${response.statusText}`);

    const data = await response.json();
    const blobId =
        data.newlyCreated?.blobObject?.blobId ||
        data.alreadyCertified?.blobId;

    if (!blobId) throw new Error("Walrus response missing blobId");

    return {
        blobId,
        url: `https://walruscan.com/testnet/blob/${blobId}`,
    };
}

export default function WalrusLogViewer({ logs, agentId }: WalrusLogViewerProps) {
    const [uploading, setUploading] = useState<string | null>(null);
    const [uploadedBlobs, setUploadedBlobs] = useState<Record<string, { blobId: string; url: string }>>({});
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    const handleUpload = useCallback(async (log: AgentLog) => {
        const key = `${log.agentId}-${log.timestamp}`;
        if (uploadedBlobs[key]) return;

        setUploading(key);
        setError(null);
        try {
            const result = await uploadLogToWalrus(log);
            setUploadedBlobs(prev => ({ ...prev, [key]: result }));
        } catch (err: any) {
            setError(err.message || "Walrus upload failed");
        } finally {
            setUploading(null);
        }
    }, [uploadedBlobs]);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
    };

    const filteredLogs = agentId ? logs.filter(l => l.agentId === agentId) : logs;

    return (
        <div className="space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-neon-cyan/10 border border-neon-cyan/20 rounded-lg">
                        <FileCode2 className="w-4 h-4 text-neon-cyan" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-white">Walrus Blackbox Logs</h4>
                        <p className="text-[9px] text-gray-500 font-mono">Tamper-proof Sui Walrus audit trail</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {/* Walrus badge */}
                    <span className="text-[9px] bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse" />
                        Walrus Testnet
                    </span>
                    <span className="text-[9px] bg-white/5 text-gray-400 border border-white/10 px-2 py-0.5 rounded-full font-mono">
                        {filteredLogs.length} entries
                    </span>
                </div>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-2 text-xs text-red-400"
                    >
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                        <button onClick={() => setError(null)} className="ml-auto text-gray-500 hover:text-white">
                            ✕
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Log List */}
            {filteredLogs.length === 0 ? (
                <div className="py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                    <FileCode2 className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-500 font-mono">No agent decisions logged yet.</p>
                    <p className="text-[10px] text-gray-600 mt-1">Start a strategy to record AI reasoning on Walrus.</p>
                </div>
            ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
                    {filteredLogs.map((log) => {
                        const key = `${log.agentId}-${log.timestamp}`;
                        const blob = uploadedBlobs[key];
                        const isExpanded = expanded === key;
                        const isUploading = uploading === key;

                        return (
                            <motion.div
                                key={key}
                                layout
                                className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors"
                            >
                                {/* Summary Row */}
                                <div
                                    className="p-3 flex items-center gap-3 cursor-pointer"
                                    onClick={() => setExpanded(isExpanded ? null : key)}
                                >
                                    {/* Status dot */}
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${log.status === "success" ? "bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.6)]" :
                                            log.status === "reverted" ? "bg-red-400" : "bg-yellow-400 animate-pulse"
                                        }`} />

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-white truncate">{log.action}</p>
                                        <p className="text-[9px] text-gray-500 font-mono">
                                            {new Date(log.timestamp).toLocaleTimeString()} · {log.strategyId}
                                        </p>
                                    </div>

                                    {/* Blob badge or upload btn */}
                                    {blob ? (
                                        <div className="flex items-center gap-1.5 shrink-0 bg-neon-cyan/10 px-2 py-1 rounded-lg border border-neon-cyan/20">
                                            <Link2 className="w-3 h-3 text-neon-cyan" />
                                            <span className="text-[9px] text-neon-cyan font-mono">
                                                {blob.blobId.slice(0, 8)}...
                                            </span>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleUpload(log); }}
                                            disabled={isUploading}
                                            className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-bold rounded-lg bg-neon-cyan/10 hover:bg-neon-cyan/20 border border-neon-cyan/20 text-neon-cyan transition-colors disabled:opacity-40"
                                        >
                                            {isUploading ? (
                                                <Loader2 className="w-3 h-3 animate-spin" />
                                            ) : (
                                                <RefreshCw className="w-3 h-3" />
                                            )}
                                            {isUploading ? "Sealing..." : "→ Walrus"}
                                        </button>
                                    )}
                                </div>

                                {/* Expanded Reasoning + Blob Details */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="border-t border-white/5"
                                        >
                                            <div className="p-3 space-y-3">
                                                {/* AI Reasoning */}
                                                <div>
                                                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1 font-mono">AI Reasoning</p>
                                                    <p className="text-xs text-gray-300 leading-relaxed font-mono bg-black/40 p-2.5 rounded-lg border border-white/5">
                                                        {log.reasoning}
                                                    </p>
                                                </div>

                                                {/* Profit row */}
                                                {log.profit !== undefined && (
                                                    <div className="flex items-center justify-between text-[10px] bg-white/5 rounded-lg px-3 py-2">
                                                        <span className="text-gray-500">Realized Profit</span>
                                                        <span className={log.profit >= 0 ? "text-green-400 font-mono font-bold" : "text-red-400 font-mono font-bold"}>
                                                            {log.profit >= 0 ? "+" : ""}{log.profit.toFixed(6)} SUI
                                                        </span>
                                                    </div>
                                                )}

                                                {/* TxDigest */}
                                                {log.txDigest && (
                                                    <a
                                                        href={`https://suiscan.xyz/testnet/tx/${log.txDigest}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-2 text-[10px] text-neon-cyan hover:text-white transition-colors"
                                                    >
                                                        <ExternalLink className="w-3 h-3" />
                                                        View on SuiScan: {log.txDigest.slice(0, 8)}...
                                                    </a>
                                                )}

                                                {/* Walrus Blob ID */}
                                                {blob && (
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex-1 bg-black/40 border border-neon-cyan/20 rounded-lg px-3 py-2 flex items-center gap-2 overflow-hidden">
                                                            <span className="text-[9px] text-gray-500 shrink-0 font-mono">Blob:</span>
                                                            <span className="text-[10px] text-neon-cyan font-mono truncate">
                                                                {blob.blobId}
                                                            </span>
                                                        </div>
                                                        <button
                                                            onClick={() => copyToClipboard(blob.blobId)}
                                                            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors shrink-0"
                                                            title="Copy Blob ID"
                                                        >
                                                            <Copy className="w-3 h-3" />
                                                        </button>
                                                        <a
                                                            href={blob.url}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="p-2 bg-white/5 hover:bg-neon-cyan/20 border border-white/10 rounded-lg text-gray-400 hover:text-neon-cyan transition-colors shrink-0"
                                                            title="View on Walruscan"
                                                        >
                                                            <ExternalLink className="w-3 h-3" />
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
