'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Play, Save, Box, Activity, Zap, ArrowRight, Trash2,
    Settings, Copy, Search, ZoomIn, ZoomOut, Undo, Redo,
    Maximize, MoreVertical, X, CheckCircle2, Menu, LayoutGrid, Cpu, History, Clock
} from "lucide-react";
import Link from 'next/link';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// --- Types ---
type NodeType = 'trigger' | 'action' | 'condition' | 'variable';

interface NodeData {
    id: string;
    type: NodeType;
    label: string;
    icon: any;
    x: number;
    y: number;
    inputs: string[];
    outputs: string[];
    config?: any;
}

// --- Configuration ---
const NODE_TYPES = [
    {
        category: 'Triggers',
        color: 'from-amber-400 to-orange-500',
        items: [
            { type: 'trigger', label: 'Price > $2.50', icon: Activity, inputs: [], outputs: ['On Hit'] },
            { type: 'trigger', label: 'Every 1 Hour', icon: Zap, inputs: [], outputs: ['Tick'] },
            { type: 'trigger', label: 'High Gas Fee', icon: Box, inputs: [], outputs: ['Tx Found'] },
        ]
    },
    {
        category: 'Logic & Conditions',
        color: 'from-blue-400 to-indigo-500',
        items: [
            { type: 'condition', label: 'SUI Balance > 100', icon: Box, inputs: ['In'], outputs: ['True', 'False'] },
            { type: 'condition', label: 'Slippage < 0.5%', icon: ShieldCheckIcon, inputs: ['In'], outputs: ['Safe', 'Unsafe'] },
        ]
    },
    {
        category: 'On-Chain Actions',
        color: 'from-neon-cyan to-teal-400',
        items: [
            { type: 'action', label: 'Flash Loan SUI', icon: Zap, inputs: ['Trigger'], outputs: ['Success', 'Fail'] },
            { type: 'action', label: 'Swap SUI -> USDC', icon: ArrowRight, inputs: ['Liquidity'], outputs: ['Done'] },
            { type: 'action', label: 'Supply to Scallop', icon: CheckCircle2, inputs: ['Receipt'], outputs: ['Completed'] },
        ]
    }
];

function ShieldCheckIcon(props: any) {
    return <Box {...props} /> // Fallback icon
}

export default function StrategyBuilderPro() {
    const account = useCurrentAccount();
    const { mutateAsync: signMessage } = useSignPersonalMessage();
    const router = useRouter();
    const [nodes, setNodes] = useState<NodeData[]>([
        {
            id: 'start', type: 'trigger', label: 'START FLOW', icon: Play, x: 100, y: 300,
            inputs: [], outputs: ['Run']
        }
    ]);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);
    const [strategyName, setStrategyName] = useState('Custom Strategy');
    const [isSaving, setIsSaving] = useState(false);

    const [showHistory, setShowHistory] = useState(false);
    const [savedBuilds, setSavedBuilds] = useState<any[]>([]);

    // Undo/Redo State
    const [history, setHistory] = useState<NodeData[][]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    // Zoom State
    const [zoom, setZoom] = useState(1);

    const canvasRef = useRef<HTMLDivElement>(null);

    // --- Helpers ---
    const saveToHistory = (currentNodes: NodeData[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(currentNodes);
        if (newHistory.length > 50) newHistory.shift();
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    // --- Load Draft & History on Mount ---
    useEffect(() => {
        if (account?.address) {
            const key = `sui-loop-fleet-${account.address}`;
            try {
                const savedRaw = localStorage.getItem(key);
                if (savedRaw) {
                    const stratList = JSON.parse(savedRaw);

                    // Filter for custom builds
                    const customBuilds = stratList.filter((s: any) =>
                        (s.tags && s.tags.includes("Builder")) || s.id.startsWith("custom-")
                    ).reverse(); // Newest first

                    setSavedBuilds(customBuilds);

                    // Auto-load most recent if we have one and canvas is default (optional)
                    if (customBuilds.length > 0 && nodes.length <= 1) {
                        loadBuild(customBuilds[0], false);
                    }
                }
            } catch (e) {
                console.error("Failed to load draft", e);
            }
        }
    }, [account]);

    const loadBuild = (build: any, notify = true) => {
        if (!build.nodes) return;

        // Rehydrate icons
        const rehydratedNodes = build.nodes.map((n: any) => {
            const template = NODE_TYPES.flatMap(c => c.items).find(i => i.label === n.label);
            return {
                ...n,
                icon: template ? template.icon : Box
            };
        });

        setNodes(rehydratedNodes);
        saveToHistory(rehydratedNodes);
        setStrategyName(build.name);
        setShowHistory(false);
        if (notify) toast.success(`Loaded "${build.name}"`);
    };

    const handleUndo = () => {
        if (historyIndex > 0) {
            const prevNodes = history[historyIndex - 1];
            setNodes(prevNodes);
            setHistoryIndex(historyIndex - 1);
        }
    };

    const handleRedo = () => {
        if (historyIndex < history.length - 1) {
            const nextNodes = history[historyIndex + 1];
            setNodes(nextNodes);
            setHistoryIndex(historyIndex + 1);
        }
    };

    const handleZoom = (delta: number) => {
        setZoom(prev => Math.min(Math.max(prev + delta, 0.5), 2));
    };

    // --- Actions ---
    const addNode = (item: any, clientX?: number, clientY?: number) => {
        saveToHistory(nodes);

        const rect = canvasRef.current?.getBoundingClientRect();
        const startX = rect ? (rect.width / 2) - 100 : 100; // Adjusted for mobile
        const startY = rect ? (rect.height / 2) - 50 : 300;

        const newNode: NodeData = {
            id: `node-${Date.now()}`,
            type: item.type,
            label: item.label,
            icon: item.icon,
            x: startX + (Math.random() * 40 - 20),
            y: startY + (Math.random() * 40 - 20),
            inputs: item.inputs,
            outputs: item.outputs
        };
        setNodes([...nodes, newNode]);
        setShowSidebar(false);
        toast.success(`added block: ${item.label}`);
    };

    const removeNode = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        saveToHistory(nodes);

        setNodes(nodes.filter(n => n.id !== id));
        if (selectedNode === id) setSelectedNode(null);
    };

    const updateNodePosition = (id: string, x: number, y: number) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
    };

    // --- Persistence Logic ---
    const handleSave = async (deploy = false) => {
        if (!account?.address) {
            toast.error("Connect Wallet to save strategies");
            return;
        }

        // Require Signature for Deployment (Verification)
        if (deploy) {
            try {
                const message = new TextEncoder().encode(
                    `Authorize Deployment of Custom Strategy: "${strategyName}"\n\nI confirm this configuration and authorize the agent to execute actions on behalf of my wallet address: ${account.address}`
                );
                await signMessage({ message });
                toast.success("Signature Verified. Deploying...");
            } catch (sigError) {
                console.warn("Signature rejected", sigError);
                toast.error("Deployment Cancelled (Signature Required)");
                return;
            }
        }

        setIsSaving(true);
        try {
            // 1. Build Payload
            const newStrategy = {
                id: `custom-${Date.now()}`,
                name: strategyName,
                description: `Custom flow with ${nodes.length} nodes. Built in Editor.`,
                risk: "Medium",
                tags: ["Custom", "Builder"],
                color: "from-purple-500 to-indigo-600",
                apy: "Calculating...",
                tvl: "0",
                nodes: nodes // Save the graph configuration local
            };

            // 2. Read Existing Fleet (Local Sync)
            const key = `sui-loop-fleet-${account.address}`;
            const existingRaw = localStorage.getItem(key);
            const existing = existingRaw ? JSON.parse(existingRaw) : [];

            // Remove if already exists (update scenario)
            const cleanExisting = existing.filter((s: any) => s.id !== newStrategy.id);
            const updated = [...cleanExisting, newStrategy];

            localStorage.setItem(key, JSON.stringify(updated));

            // Update Local State for History immediately
            setSavedBuilds(updated.filter((s: any) =>
                (s.tags && s.tags.includes("Builder")) || s.id.startsWith("custom-")
            ).reverse());

            // 3. Supabase Cloud Sync
            try {
                const { StrategyService } = await import("@/lib/strategyService");
                await StrategyService.deployStrategy(account.address, {
                    strategy_id: newStrategy.id, // Use unique timestamp ID
                    name: strategyName,
                    emoji: '🛠️',
                    status: 'DRAFT', // Start as Draft, Dashboard confirms to Running
                    yield: 'Pending',
                    // Config payload includes the full graph
                    ...{
                        config: {
                            displayName: strategyName, // Ensure consistent naming
                            nodes: nodes,
                            description: newStrategy.description,
                            tags: newStrategy.tags
                        }
                    } as any
                });
            } catch (supaError) {
                console.warn("Supabase sync failed (offline mode?):", supaError);
            }

            // 4. Feedback & Redirect
            await new Promise(r => setTimeout(r, 800)); // Simulate packing
            toast.success(deploy ? "Strategy Ready for Activation" : "Draft Saved to Cloud");

            if (deploy) {
                // Redirect to Dashboard with Auto-Start and name for immediate display
                router.push(`/dashboard?autostart=true&strategy=${newStrategy.id}&name=${encodeURIComponent(strategyName)}`);
            }
        } catch (e) {
            console.error(e);
            toast.error("Failed to save strategy");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <main className="h-screen w-screen overflow-hidden bg-[#0A0A0A] text-white flex flex-col font-sans">
            {/* Top Toolbar */}
            <header className="h-14 border-b border-white/10 bg-[#0F0F0F] flex items-center px-4 justify-between z-50 shrink-0">
                <div className="flex items-center gap-3">
                    <Link href="/strategies" className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors text-gray-400 hover:text-white">
                        <ArrowRight className="rotate-180" size={18} />
                    </Link>

                    {/* Mobile: Toggle Sidebar */}
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`md:hidden p-2 rounded-lg ${showSidebar ? 'bg-neon-cyan/20 text-neon-cyan' : 'bg-white/5 text-gray-400'}`}
                    >
                        <LayoutGrid size={18} />
                    </button>

                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                        <input
                            value={strategyName}
                            onChange={(e) => setStrategyName(e.target.value)}
                            className="bg-transparent border-none focus:outline-none font-bold tracking-tight text-sm md:text-base text-white w-32 md:w-auto"
                        />
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 w-fit">
                            {account ? 'Connected' : 'Offline'}
                        </span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <button onClick={handleUndo} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Undo size={18} /></button>
                    <button onClick={handleRedo} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Redo size={18} /></button>
                    <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                    <button onClick={() => handleZoom(-0.1)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><ZoomOut size={18} /></button>
                    <span className="text-xs font-mono text-gray-500">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => handleZoom(0.1)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><ZoomIn size={18} /></button>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    {/* History Button */}
                    <button
                        onClick={() => setShowHistory(true)}
                        className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-2"
                        title="Load Previous Builds"
                    >
                        <History size={18} />
                        <span className="hidden md:inline text-xs font-medium">History</span>
                    </button>

                    <div className="h-6 w-[1px] bg-white/10 mx-2 hidden md:block"></div>

                    <button
                        onClick={() => handleSave(false)}
                        className="hidden md:flex px-4 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm font-medium border border-white/10 transition-all items-center gap-2"
                        disabled={isSaving}
                    >
                        <Save size={14} /> {isSaving ? 'Saving...' : 'Save Draft'}
                    </button>
                    {/* Mobile Save Icon only */}
                    <button onClick={() => handleSave(false)} className="md:hidden p-2 rounded-md bg-white/5 text-gray-300">
                        <Save size={18} />
                    </button>

                    <button
                        onClick={() => handleSave(true)}
                        className="px-3 md:px-4 py-1.5 rounded-md bg-neon-cyan hover:bg-cyan-400 text-black text-xs md:text-sm font-bold shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all flex items-center gap-2 disabled:opacity-50"
                        disabled={isSaving}
                    >
                        {isSaving ? <div className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin" /> : <Play size={14} fill="currentColor" />}
                        <span className="hidden md:inline">Deploy Agent</span><span className="md:hidden">Run</span>
                    </button>
                </div>
            </header>

            <div className="flex-1 flex overflow-hidden relative">

                {/* Left Sidebar: Components (Responsive Drawer) */}
                <aside className={`
                    w-72 bg-[#0F0F0F] border-r border-white/10 flex flex-col z-40 shadow-2xl transition-transform duration-300 absolute md:static h-full
                    ${showSidebar ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
                `}>
                    <div className="p-4 border-b border-white/10 flex justify-between items-center">
                        <div className="relative flex-1 mr-2">
                            <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                            <input
                                type="text"
                                placeholder="Search..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-[#1A1A1A] border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan/50 transition-all"
                            />
                        </div>
                        <button onClick={() => setShowSidebar(false)} className="md:hidden text-gray-500"><X size={20} /></button>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-6 pb-20 md:pb-2">
                        {NODE_TYPES.map((category, idx) => (
                            <div key={idx} className="px-2">
                                <h3 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 pl-1">{category.category}</h3>
                                <div className="grid grid-cols-2 gap-2">
                                    {category.items.filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase())).map((item, i) => (
                                        <button
                                            key={i}
                                            onClick={() => addNode(item)}
                                            className="flex flex-col items-center justify-center gap-2 p-3 bg-[#1A1A1A] border border-white/5 rounded-xl hover:border-white/20 hover:bg-[#222] transition-all group relative overflow-hidden active:scale-95 touch-manipulation"
                                        >
                                            {/* Color Stripe */}
                                            <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${category.color} opacity-70 group-hover:opacity-100 transition-opacity`}></div>

                                            <div className={`p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors`}>
                                                <item.icon size={18} className="text-gray-300 group-hover:text-white" />
                                            </div>
                                            <span className="text-[10px] font-medium text-center text-gray-400 group-hover:text-gray-200 leading-tight">
                                                {item.label}
                                            </span>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus size={12} className="text-white/50" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Canvas Area */}
                <div
                    ref={canvasRef}
                    onClick={() => setShowSidebar(false)} // Click canvas to close sidebar
                    className="flex-1 relative bg-[#0A0A0A] overflow-hidden cursor-grab active:cursor-grabbing touch-pan-x touch-pan-y"
                    style={{
                        backgroundImage: 'radial-gradient(#333 1px, transparent 1px)',
                        backgroundSize: `${20 * zoom}px ${20 * zoom}px`, // Scale grid too
                    }}
                >
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: '0 0', width: '100%', height: '100%' }}>
                        {/* Render Connections */}
                        <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible z-0">
                            {nodes.length > 1 && nodes.slice(1).map((node, i) => {
                                const startNode = nodes.find(n => n.id === 'start');
                                if (!startNode) return null;

                                const startX = startNode.x + 200;
                                const startY = startNode.y + 40;
                                const endX = node.x;
                                const endY = node.y + 30;

                                const cp1X = startX + (endX - startX) / 2;
                                const cp1Y = startY;
                                const cp2X = startX + (endX - startX) / 2;
                                const cp2Y = endY;

                                const path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX} ${endY}`;

                                return (
                                    <motion.g key={`conn-${i}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                                        <path d={path} stroke="#333" strokeWidth="4" fill="none" />
                                        <path d={path} stroke="#00f3ff" strokeWidth="2" fill="none" className="animate-pulse-slow" strokeDasharray="5,5" />
                                    </motion.g>
                                )
                            })}
                        </svg>

                        {/* Render Nodes */}
                        <AnimatePresence>
                            {nodes.map((node) => {
                                const isSelected = selectedNode === node.id;
                                const category = NODE_TYPES.find(c => c.items.some(i => i.label === node.label));
                                const gradColor = category ? category.color : 'from-gray-500 to-gray-700';

                                return (
                                    <motion.div
                                        key={node.id}
                                        layout
                                        drag
                                        dragMomentum={false}
                                        onDrag={(e, info) => {
                                            updateNodePosition(node.id, node.x + info.delta.x, node.y + info.delta.y);
                                        }}
                                        initial={{ opacity: 0, scale: 0.8, x: node.x, y: node.y }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        onClick={(e) => { e.stopPropagation(); setSelectedNode(node.id); }}
                                        className={`absolute w-56 md:w-64 rounded-xl backdrop-blur-xl border shadow-2xl group transition-all z-10
                                        ${isSelected ? 'border-neon-cyan ring-1 ring-neon-cyan z-50' : 'border-white/10 bg-[#151515]/90'}
                                    `}
                                        style={{ left: 0, top: 0, touchAction: 'none' }}
                                    >
                                        <div className={`h-2 w-full rounded-t-xl bg-gradient-to-r ${gradColor} opacity-80`}></div>
                                        <div className="p-3 md:p-4">
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-1.5 md:p-2 rounded-lg bg-white/5 border border-white/5 ${isSelected ? 'text-neon-cyan' : 'text-gray-300'}`}>
                                                        <node.icon size={16} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-xs md:text-sm font-bold text-gray-100 leading-none mb-1">{node.label}</h4>
                                                        <span className="text-[9px] text-gray-500 font-mono uppercase">{node.type}</span>
                                                    </div>
                                                </div>
                                                {node.id !== 'start' && (
                                                    <button onClick={(e) => removeNode(node.id, e)} className="text-gray-600 hover:text-red-400 p-1">
                                                        <Trash2 size={14} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* History Modal */}
                    <AnimatePresence>
                        {showHistory && (
                            <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
                                >
                                    <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#151515]">
                                        <h2 className="text-lg font-bold flex items-center gap-2">
                                            <History size={20} className="text-neon-cyan" /> Version History
                                        </h2>
                                        <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                                            <X size={20} />
                                        </button>
                                    </div>
                                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-2 space-y-2">
                                        {savedBuilds.length === 0 ? (
                                            <div className="p-8 text-center text-gray-500 text-sm">No saved builds found for this account.</div>
                                        ) : (
                                            savedBuilds.map((build: any, i: number) => (
                                                <button
                                                    key={build.id || i}
                                                    onClick={() => loadBuild(build)}
                                                    className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-between group text-left"
                                                >
                                                    <div>
                                                        <div className="font-bold text-sm text-gray-200 group-hover:text-white mb-1">{build.name}</div>
                                                        <div className="text-[11px] text-gray-500 font-mono flex items-center gap-3">
                                                            <span>{build.nodes?.length || 0} Nodes</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1"><Clock size={10} /> {new Date(parseInt(build.id.split('-')[1]) || Date.now()).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs font-bold text-neon-cyan opacity-0 group-hover:opacity-100 transition-opacity">
                                                        LOAD
                                                    </div>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </motion.div>
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Mobile: Floating Toolbox Button (if sidebar closed) */}
                    {!showSidebar && (
                        <button
                            onClick={() => setShowSidebar(true)}
                            className="md:hidden absolute bottom-6 right-6 w-12 h-12 bg-neon-cyan text-black rounded-full shadow-lg shadow-neon-cyan/50 flex items-center justify-center z-50"
                        >
                            <Plus size={24} />
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}
