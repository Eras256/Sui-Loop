import { useState, useEffect } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";

function App() {
    const [suiPrice, setSuiPrice] = useState<string>("Loading...");
    const [agentStatus, setAgentStatus] = useState<"IDLE" | "ACTIVE" | "PAUSED">("ACTIVE");
    const [logs] = useState<string[]>([
        "[10:42:05] Scanning pools...",
        "[10:42:08] Arb opportunity found: SUI/USDC",
        "[10:42:09] Execution skipped (profit < gas)",
    ]);

    // Simulate live data
    useEffect(() => {
        const interval = setInterval(() => {
            setSuiPrice((1.5 + Math.random() * 0.05).toFixed(4));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="w-[300px] h-[400px] bg-black/90 backdrop-blur-xl border border-white/10 rounded-xl overflow-hidden flex flex-col relative text-white">
            {/* Header */}
            <div className="h-12 border-b border-white/10 bg-white/5 flex items-center justify-between px-4 draggable" data-tauri-drag-region>
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-br from-neon-purple to-neon-cyan rounded flex items-center justify-center font-bold text-xs">S</div>
                    <span className="font-bold text-sm tracking-tight">SuiLoop</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-neon-cyan">${suiPrice}</span>
                    <div className={`w-2 h-2 rounded-full ${agentStatus === 'ACTIVE' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-4 flex flex-col gap-4">

                {/* Status Card */}
                <div className="bg-white/5 border border-white/5 rounded-lg p-3">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-400 uppercase font-bold">Agent Status</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${agentStatus === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {agentStatus}
                        </span>
                    </div>
                    <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-neon-cyan w-2/3 animate-[shimmer_2s_infinite]" />
                    </div>
                </div>

                {/* Mini Logs */}
                <div className="flex-1 bg-black/50 rounded-lg p-2 font-mono text-[10px] text-gray-400 overflow-hidden border border-white/5 font-mono">
                    {logs.map((log, i) => (
                        <div key={i} className="mb-1 truncate hover:text-white transition-colors">
                            {log}
                        </div>
                    ))}
                </div>

                {/* Panic Button */}
                <button
                    onClick={() => setAgentStatus(prev => prev === 'ACTIVE' ? 'PAUSED' : 'ACTIVE')}
                    className={`
                group w-full py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all
                ${agentStatus === 'ACTIVE'
                            ? 'bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-500 border border-green-500/20'
                        }
            `}
                >
                    {agentStatus === 'ACTIVE' ? (
                        <>
                            <AlertOctagon size={16} /> EMERGENCY STOP
                        </>
                    ) : (
                        <>
                            <RefreshCw size={16} /> RESUME AGENT
                        </>
                    )}
                </button>
            </div>

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-[100px] h-[100px] bg-neon-purple/20 blur-[50px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[100px] h-[100px] bg-neon-cyan/10 blur-[50px] pointer-events-none" />
        </div>
    );
}

export default App;
