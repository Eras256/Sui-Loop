import { useState, useEffect, useRef } from "react";
import { AlertOctagon, RefreshCw, Wifi, WifiOff, ExternalLink, Brain, Zap, Database } from "lucide-react";

const AGENT_URL = (import.meta as any).env?.VITE_AGENT_URL || "http://localhost:3001";
const SUISCAN_BASE = "https://suiscan.xyz/testnet/tx/";

interface LogEntry {
    ts: string;
    msg: string;
    type: "info" | "success" | "warn" | "error";
    txHash?: string;
}

function logColor(type: LogEntry["type"]): string {
    if (type === "success") return "text-green-400";
    if (type === "warn") return "text-amber-400";
    if (type === "error") return "text-red-400";
    return "text-gray-400";
}

function App() {
    const [suiPrice, setSuiPrice] = useState<string>("—");
    const [usdcApy, setUsdcApy] = useState<string>("—");
    const [suiApy, setSuiApy] = useState<string>("—");
    const [agentStatus, setAgentStatus] = useState<"ACTIVE" | "PAUSED" | "OFFLINE">("OFFLINE");
    const [loopRunning, setLoopRunning] = useState<boolean>(false);
    const [lastProfit, setLastProfit] = useState<string | null>(null);
    const [lastTxHash, setLastTxHash] = useState<string | null>(null);
    const [llmActive, setLlmActive] = useState<boolean>(false);
    const [usdcPoolLiquid, setUsdcPoolLiquid] = useState<boolean>(false);
    const [logs, setLogs] = useState<LogEntry[]>([
        { ts: "--:--:--", msg: "Connecting to SuiLoop agent...", type: "info" }
    ]);
    const wsRef = useRef<WebSocket | null>(null);

    const addLog = (msg: string, type: LogEntry["type"] = "info", txHash?: string) => {
        const ts = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
        setLogs(prev => [...prev.slice(-20), { ts, msg, type, txHash }]);
    };

    // Fetch market data from agent
    const fetchMarket = async () => {
        try {
            const res = await fetch(`${AGENT_URL}/api/market`);
            if (!res.ok) throw new Error("Agent offline");
            const data = await res.json();
            setSuiPrice(parseFloat(data.suiPrice || 0).toFixed(4));
            setSuiApy(parseFloat(data.scallopApy?.supply || 0).toFixed(1));
            setUsdcApy(parseFloat(data.naviUsdcApy?.supply || 0).toFixed(1));
            setLlmActive(!!data.llmEnabled);
            setUsdcPoolLiquid(!!data.usdcPoolActive);
            setAgentStatus("ACTIVE");
        } catch {
            setAgentStatus("OFFLINE");
            setSuiPrice("—");
        }
    };

    // Poll market data every 5s
    useEffect(() => {
        fetchMarket();
        const t = setInterval(fetchMarket, 5000);
        return () => clearInterval(t);
    }, []);

    // WebSocket signal stream
    useEffect(() => {
        const wsUrl = AGENT_URL.replace("http", "ws") + "/ws/signals";
        const connect = () => {
            try {
                const ws = new WebSocket(wsUrl);
                wsRef.current = ws;

                ws.onopen = () => addLog("Signal stream connected ⚡", "success");
                ws.onmessage = (e) => {
                    try {
                        const data = JSON.parse(e.data);
                        if (data.type === "signal") {
                            const { signalType, pair, confidence } = data.payload || {};
                            addLog(`${signalType} | ${pair} | conf=${confidence}%`,
                                confidence >= 80 ? "success" : "info");
                            if (confidence >= 80) setLlmActive(true);
                        } else if (data.type === "loop_status") {
                            setLoopRunning(!!data.isRunning);
                        } else if (data.type === "log") {
                            // Real logs from the agent backend
                            const { level, message } = data;
                            const msgType: LogEntry["type"] = level === "success" ? "success" : level === "error" ? "error" : level === "warn" ? "warn" : "info";
                            const txMatch = message?.match(/Hash: ([A-Za-z0-9]+)/);
                            const txHash = txMatch ? txMatch[1] : undefined;
                            const profitMatch = message?.match(/Yield: (.+)/);
                            if (profitMatch) setLastProfit(profitMatch[1]);
                            if (txHash) setLastTxHash(txHash);
                            addLog(message, msgType, txHash);
                        }
                    } catch { /* ignore */ }
                };
                ws.onclose = () => addLog("Signal stream disconnected", "warn");
                ws.onerror = () => addLog("WS error — retrying in 10s", "error");
            } catch { /* WS not available in this context */ }
        };

        connect();
        const retry = setInterval(() => {
            if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) connect();
        }, 10000);

        return () => {
            clearInterval(retry);
            wsRef.current?.close();
        };
    }, []);

    const toggleAgent = () => {
        if (agentStatus === "OFFLINE") return;
        setAgentStatus(prev => prev === "ACTIVE" ? "PAUSED" : "ACTIVE");
        addLog(agentStatus === "ACTIVE" ? "⏸ Agent paused by user" : "▶ Agent resumed by user",
            agentStatus === "ACTIVE" ? "warn" : "success");
    };

    const openTxOnChain = () => {
        if (lastTxHash) {
            window.open(`${SUISCAN_BASE}${lastTxHash}`, "_blank");
        }
    };

    return (
        <div className="w-[300px] h-[480px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col relative text-white">

            {/* Header */}
            <div className="h-12 border-b border-white/10 bg-white/5 flex items-center justify-between px-4" data-tauri-drag-region>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-cyan-400 rounded flex items-center justify-center font-bold text-xs">S</div>
                    <span className="font-bold text-sm tracking-tight">SuiLoop</span>
                    <span className="text-[10px] text-white/30 font-mono">v0.0.8</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-cyan-400">${suiPrice}</span>
                    {agentStatus === "OFFLINE"
                        ? <WifiOff size={12} className="text-red-400" />
                        : <Wifi size={12} className="text-green-400" />}
                </div>
            </div>

            {/* APY Strip */}
            <div className="flex border-b border-white/5 bg-white/[0.02]">
                <div className="flex-1 flex flex-col items-center py-1.5">
                    <span className="text-[9px] text-gray-500 uppercase">SUI APY</span>
                    <span className="text-[11px] font-mono text-purple-400">{suiApy}%</span>
                </div>
                <div className="w-px bg-white/5" />
                <div className="flex-1 flex flex-col items-center py-1.5">
                    <span className="text-[9px] text-gray-500 uppercase">USDC APY</span>
                    <span className="text-[11px] font-mono text-blue-400">{usdcApy}%</span>
                </div>
                <div className="w-px bg-white/5" />
                <div className="flex-1 flex flex-col items-center py-1.5">
                    <span className="text-[9px] text-gray-500 uppercase">Loop</span>
                    <span className={`text-[11px] font-mono ${loopRunning ? "text-green-400" : "text-gray-600"}`}>
                        {loopRunning ? "ON ⚡" : "OFF"}
                    </span>
                </div>
            </div>

            {/* Status Row */}
            <div className="px-3 pt-2.5 flex gap-2">
                {/* Agent Status */}
                <div className="flex-1 bg-white/5 border border-white/5 rounded-lg p-2">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[9px] text-gray-400 uppercase font-bold">Agent</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${agentStatus === "ACTIVE" ? "bg-green-500/20 text-green-400" :
                            agentStatus === "PAUSED" ? "bg-amber-500/20 text-amber-400" :
                                "bg-red-500/20 text-red-400"
                            }`}>
                            {agentStatus}
                        </span>
                    </div>
                    <div className="h-0.5 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${agentStatus === "ACTIVE" ? "w-2/3 bg-cyan-400 animate-pulse" :
                            agentStatus === "PAUSED" ? "w-1/3 bg-amber-400" : "w-0"
                            }`} />
                    </div>
                </div>

                {/* LLM + USDC indicators */}
                <div className="flex flex-col gap-1 justify-center">
                    <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border ${llmActive ? "text-purple-400 border-purple-500/30 bg-purple-500/10" : "text-gray-600 border-white/5"}`}>
                        <Brain size={8} /> LLM
                    </div>
                    <div className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border ${usdcPoolLiquid ? "text-blue-400 border-blue-500/30 bg-blue-500/10" : "text-gray-600 border-white/5"}`}>
                        <Database size={8} /> USDC
                    </div>
                </div>
            </div>

            {/* Last Profit + TxHash */}
            {lastProfit && (
                <div className="mx-3 mt-2 bg-green-500/10 border border-green-500/20 rounded-lg px-2.5 py-2 flex items-center justify-between">
                    <div>
                        <div className="text-[9px] text-gray-500 uppercase font-bold">Last Yield</div>
                        <div className="text-[11px] text-green-400 font-mono font-bold flex items-center gap-1">
                            <Zap size={9} /> {lastProfit}
                        </div>
                    </div>
                    {lastTxHash && (
                        <button
                            onClick={openTxOnChain}
                            className="flex items-center gap-1 text-[9px] text-cyan-400 hover:text-cyan-300 border border-cyan-500/20 bg-cyan-500/10 rounded px-1.5 py-1 transition-all"
                        >
                            <ExternalLink size={8} /> SuiScan
                        </button>
                    )}
                </div>
            )}

            {/* Live Logs */}
            <div className="flex-1 mx-3 mt-2 mb-2 bg-black/50 rounded-lg p-2 font-mono text-[9px] overflow-y-auto border border-white/5 flex flex-col gap-0.5">
                {logs.map((log, i) => (
                    <div key={i} className={`${logColor(log.type)}`}>
                        <span className="text-white/20 mr-1">[{log.ts}]</span>
                        <span className="break-all">{log.msg}</span>
                    </div>
                ))}
            </div>

            {/* Emergency Stop */}
            <div className="px-3 pb-3">
                <button
                    onClick={toggleAgent}
                    disabled={agentStatus === "OFFLINE"}
                    className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed
                        ${agentStatus === "ACTIVE"
                            ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20"
                            : "bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20"
                        }`}
                >
                    {agentStatus === "ACTIVE" ? (
                        <><AlertOctagon size={13} /> EMERGENCY STOP</>
                    ) : (
                        <><RefreshCw size={13} /> RESUME AGENT</>
                    )}
                </button>
            </div>

            {/* Glow decorations */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/20 blur-[40px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-400/10 blur-[40px] pointer-events-none" />
        </div>
    );
}

export default App;
