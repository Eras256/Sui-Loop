'use client';

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
    ReactFlow,
    MiniMap,
    Controls,
    Background,
    useNodesState,
    useEdgesState,
    addEdge,
    Panel,
    Connection,
    Edge,
    ReactFlowProvider,
    Node,
    BackgroundVariant,
    XYPosition
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import Navbar from "@/components/layout/Navbar";
import {
    Plus, Play, Save, Box, Activity, Zap, ArrowRight, Trash2,
    Settings, Search, ZoomIn, ZoomOut, Undo, Redo,
    LayoutGrid, Cpu, History, Clock, Landmark, Coins, Shield, Database,
    Twitter, MessageSquare, Bell, Share2, BarChart3, Fingerprint, Lock, Repeat, RefreshCw,
    Layers, MousePointer2, Info, ChevronRight, Download, X
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import CustomNode from './CustomNode';

// --- Icon Registry for Serialization ---
const ICON_MAP: any = {
    Plus, Play, Save, Box, Activity, Zap, ArrowRight, Trash2,
    Settings, Search, ZoomIn, ZoomOut, Undo, Redo,
    LayoutGrid, Cpu, History, Clock, Landmark, Coins, Shield, Database,
    Twitter, MessageSquare, Bell, Share2, BarChart3, Fingerprint, Lock, Repeat, RefreshCw,
    Layers, MousePointer2, Info, ChevronRight, Download
};

// --- Configuration ---
const nodeTypes: any = {
    suiNode: CustomNode,
};

const NODE_TEMPLATES = [
    {
        category: 'SIGNAL INPUTS',
        color: 'from-amber-400 to-orange-500',
        items: [
            { type: 'trigger', label: 'PRICE_THRESHOLD', icon: 'Activity', desc: 'Triggers on target price hit' },
            { type: 'trigger', label: 'CRON_TICK', icon: 'Zap', desc: 'Execution on time intervals' },
            { type: 'trigger', label: 'MEMPOOL_SCAN', icon: 'Box', desc: 'Real-time transaction tracking' },
            { type: 'trigger', label: 'WHALE_ALERT', icon: 'Bell', desc: 'Tracks large wallet movements' },
        ]
    },
    {
        category: 'AI INTELLIGENCE',
        color: 'from-purple-500 to-indigo-600',
        items: [
            { type: 'action', label: 'ELIZA_SENTIMENT', icon: 'Cpu', desc: 'Analyzes social sentiment (NLP)' },
            { type: 'action', label: 'KELLY_CRITERION', icon: 'BarChart3', desc: 'Optimal position sizing logic' },
            { type: 'condition', label: 'MARKET_REGIME', icon: 'Activity', desc: 'Detects Bull/Bear transitions' },
        ]
    },
    {
        category: 'TRADING & SWAPS',
        color: 'from-blue-400 to-cyan-500',
        items: [
            { type: 'action', label: 'CETUS_SWAP', icon: 'RefreshCw', desc: 'Atomic swap on Cetus CLMM' },
            { type: 'action', label: 'TURBOS_SWAP', icon: 'Repeat', desc: 'Liquidity pool swap on Turbos' },
            { type: 'action', label: 'DEEPBOOK_LIMIT', icon: 'ArrowRight', desc: 'CLOB order placement' },
        ]
    },
    {
        category: 'SECURITY & VAULT',
        color: 'from-emerald-500 to-green-600',
        items: [
            { type: 'action', label: 'VAULT_DEPOSIT', icon: 'Lock', desc: 'Secure Enclave capital locking' },
            { type: 'action', label: 'VAULT_WITHDRAW', icon: 'Fingerprint', desc: 'OwnerCap verified liquidation' },
            { type: 'condition', label: 'ENCLAVE_GUARD', icon: 'Shield', desc: 'Move-native safety filter' },
            { type: 'action', label: 'WALRUS_BLACKBOX', icon: 'Database', desc: 'Decentralized forensic logging' },
        ]
    },
    {
        category: 'SOCIAL MESSAGING',
        color: 'from-pink-500 to-rose-600',
        items: [
            { type: 'action', label: 'TWITTER_RELAY', icon: 'Twitter', desc: 'Automated status reporting' },
            { type: 'action', label: 'DISCORD_ALARM', icon: 'MessageSquare', desc: 'Urgent critical notifications' },
            { type: 'action', label: 'TELEGRAM_PUSH', icon: 'Share2', desc: 'Async execution logs' },
        ]
    }
];

const initialNodes: Node[] = [
    {
        id: 'start-0',
        type: 'suiNode',
        data: { label: 'INIT_KERNEL', icon: 'Play', type: 'trigger', color: 'from-green-400 to-emerald-500' },
        position: { x: 100, y: 100 },
    },
];

const initialEdges: Edge[] = [];

let id = 0;
const getId = () => `node_${Date.now()}_${id++}`;

function StrategyBuilderInner() {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [strategyName, setStrategyName] = useState('UNNAMED_KERNEL');
    const [strategyId, setStrategyId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [mounted, setMounted] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [history, setHistory] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const account = useCurrentAccount();
    const router = useRouter();

    useEffect(() => { setMounted(true); }, []);

    const onConnect = useCallback(
        (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#00f3ff' } }, eds)),
        [setEdges]
    );

    const onDragStart = (event: React.DragEvent, nodeData: any) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
        event.dataTransfer.effectAllowed = 'move';
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onAddNode = useCallback((template: any) => {
        let position = { x: 300, y: 300 };

        if (reactFlowInstance) {
            const { x, y, zoom } = reactFlowInstance.getViewport();
            const wrapper = reactFlowWrapper.current?.getBoundingClientRect();

            if (wrapper) {
                position = {
                    x: (wrapper.width / 2 - x) / zoom,
                    y: (wrapper.height / 2 - y) / zoom,
                };
            }
        }

        const newId = getId();
        const newNode: Node = {
            id: newId,
            type: 'suiNode',
            position: position,
            data: {
                label: template.label,
                icon: template.icon,
                type: template.type,
                color: NODE_TEMPLATES.find(c => c.items.some(i => i.label === template.label))?.color
            },
        };

        setNodes((nds) => {
            const lastNode = nds[nds.length - 1];
            if (lastNode) {
                const newEdge: Edge = {
                    id: `e-${lastNode.id}-${newId}`,
                    source: lastNode.id,
                    target: newId,
                    animated: true,
                    style: { stroke: '#00f3ff' }
                };
                setEdges((eds) => addEdge(newEdge, eds));
            }
            return [...nds, newNode];
        });

        toast.success(`Matrix Enhanced: ${template.label} connected`);
    }, [reactFlowInstance, setNodes, setEdges]);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();

            const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
            const rawData = event.dataTransfer.getData('application/reactflow');

            if (!rawData || !reactFlowBounds) return;

            const template = JSON.parse(rawData);
            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newId = getId();
            const newNode: Node = {
                id: newId,
                type: 'suiNode',
                position,
                data: {
                    label: template.label,
                    icon: template.icon,
                    type: template.type,
                    color: NODE_TEMPLATES.find(c => c.items.some(i => i.label === template.label))?.color
                },
            };

            setNodes((nds) => {
                const lastNode = nds[nds.length - 1];
                if (lastNode) {
                    const newEdge: Edge = {
                        id: `e-${lastNode.id}-${newId}`,
                        source: lastNode.id,
                        target: newId,
                        animated: true,
                        style: { stroke: '#00f3ff' }
                    };
                    setEdges((eds) => addEdge(newEdge, eds));
                }
                return [...nds, newNode];
            });
        },
        [reactFlowInstance, setNodes, setEdges]
    );

    const handleSave = async (deploy = false) => {
        if (!account?.address) {
            toast.error("Connect Wallet to Architect Protocol");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading(deploy ? "Compiling Neural Kernel..." : "Committing Draft...");

        try {
            const flow = reactFlowInstance.toObject();
            const sid = strategyId || `custom-${Date.now()}`;
            if (!strategyId) setStrategyId(sid);

            const { StrategyService } = await import("@/lib/strategyService");
            const newStrat = {
                strategy_id: sid,
                name: strategyName,
                emoji: '🏗️',
                status: deploy ? 'RUNNING' : 'DRAFT',
                yield: '0.00%',
                created_at: new Date().toISOString(),
                config: flow
            };

            // 1. Local Persistence (Fast & Reliable)
            try {
                const localKey = `sui-loop-fleet-${account.address}`;
                const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
                const filtered = existing.filter((s: any) => s.id !== sid && s.strategy_id !== sid);
                localStorage.setItem(localKey, JSON.stringify([{ ...newStrat, id: sid }, ...filtered]));
                console.log('[Builder] Local cache updated');
            } catch (le) {
                console.warn("Local cache failed", le);
            }

            // 2. Cloud Synchronization (Supabase)
            try {
                await StrategyService.deployStrategy(account.address, newStrat);
                console.log('[Builder] Supabase sync successful');
            } catch (dbError: any) {
                console.warn('[Builder] Cloud sync failed, but local saved:', dbError);
                toast.error(`Cloud Sync Offline: ${dbError.message || 'Persistence Error'}`, {
                    description: "Kernel saved locally in your browser. Archive may be incomplete."
                });
            }

            toast.dismiss(toastId);
            if (deploy) {
                toast.success("Kernel Compiled and Uplinked!");
                router.push(`/dashboard?autostart=true&strategy=${sid}&name=${encodeURIComponent(strategyName)}`);
            } else {
                toast.success("Draft Persisted (Local + Cloud Sync Attempted)");
                // Refresh history to show the new/updated entry
                fetchHistory();
            }
        } catch (e: any) {
            console.error(e);
            toast.error(`Transmission Error: ${e.message || 'Unknown Failure'}`);
        } finally {
            setIsSaving(false);
        }
    };

    const fetchHistory = async () => {
        if (!account?.address) return;
        setIsLoadingHistory(true);
        try {
            const { StrategyService } = await import("@/lib/strategyService");
            const dbStrategies = await StrategyService.getStrategies(account.address);

            // Merge with local fallback
            const localKey = `sui-loop-fleet-${account.address}`;
            const localRaw = localStorage.getItem(localKey);
            let merged = [...dbStrategies];

            if (localRaw) {
                const local = JSON.parse(localRaw) as any[];
                // Add locals that aren't in DB
                const uniqueLocals = local.filter((l: any) =>
                    !dbStrategies.some(dbS => (dbS.strategy_id === l.strategy_id) || (dbS.id === l.id))
                );
                merged = [...merged, ...uniqueLocals];
            }

            setHistory(merged);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        if (showHistory && account?.address) {
            fetchHistory();
        }
    }, [showHistory, account?.address]);

    const loadKernel = (strat: any) => {
        if (strat.config && strat.config.nodes) {
            setNodes(strat.config.nodes || []);
            setEdges(strat.config.edges || []);
            setStrategyName(strat.name);
            setStrategyId(strat.strategy_id || strat.id);
            setShowHistory(false);
            toast.success(`Kernel Reconstructed: ${strat.name}`);

            // Fit view after a small delay to allow React Flow to render
            setTimeout(() => {
                reactFlowInstance?.fitView({ duration: 800 });
            }, 100);
        }
    };

    if (!mounted) return null;

    return (
        <div className="flex-1 flex overflow-hidden">
            {/* Professional Component Library Sidebar */}
            <aside className="w-80 bg-[#0F0F0F] border-r border-white/10 flex flex-col z-40">
                <div className="p-4 border-b border-white/10 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xs font-black tracking-[0.2em] text-gray-500 uppercase">Component Lab</h2>
                        <span className="text-[10px] font-mono text-neon-cyan/50">v0.0.7</span>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                        <input
                            type="text"
                            placeholder="Find Kernel Core..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-neon-cyan/50 transition-all font-mono"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-8">
                    {NODE_TEMPLATES.map((category, idx) => (
                        <div key={idx} className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className={`w-1 h-3 rounded-full bg-gradient-to-b ${category.color}`}></div>
                                <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{category.category}</h3>
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                {category.items
                                    .filter(i => i.label.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .map((item, i) => (
                                        <div
                                            key={i}
                                            draggable
                                            onDragStart={(e) => onDragStart(e, item)}
                                            className="flex items-center gap-3 p-3 bg-[#1A1A1A] border border-white/5 rounded-xl hover:border-white/20 hover:bg-[#222] transition-all group cursor-grab active:cursor-grabbing"
                                        >
                                            <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                                                {ICON_MAP[item.icon] ? (
                                                    React.createElement(ICON_MAP[item.icon], { size: 16, className: "text-gray-400 group-hover:text-neon-cyan" })
                                                ) : (
                                                    <Box size={16} />
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-[11px] font-bold text-gray-200 group-hover:text-white truncate font-mono uppercase">
                                                    {item.label}
                                                </div>
                                                <div className="text-[9px] text-gray-500 truncate">{item.desc}</div>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onAddNode(item);
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-neon-cyan/20 text-white/20 hover:text-neon-cyan transition-all opacity-0 group-hover:opacity-100"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-black/40 border-t border-white/5">
                    <div className="flex items-center gap-3 p-3 bg-neon-cyan/5 rounded-xl border border-neon-cyan/10">
                        <Info size={14} className="text-neon-cyan" />
                        <p className="text-[10px] text-gray-400 leading-tight">
                            Drag components onto the matrix to architect your autonomous protocol.
                        </p>
                    </div>
                </div>
            </aside>

            {/* Main Canvas Area */}
            <div className="flex-1 relative bg-[#0A0A0A]" ref={reactFlowWrapper}>
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onConnect={onConnect}
                    onInit={setReactFlowInstance}
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    nodeTypes={nodeTypes}
                    fitView
                    colorMode="dark"
                    snapToGrid
                    snapGrid={[20, 20]}
                >
                    <Background
                        variant={BackgroundVariant.Dots}
                        color="#222"
                        gap={20}
                        size={1}
                    />
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black via-transparent to-transparent opacity-60"></div>

                    <Controls
                        className="!bg-[#0F0F0F] !border-white/10 !rounded-xl overflow-hidden custom-flow-controls"
                        showInteractive={false}
                    />

                    <MiniMap
                        className="!bg-[#0F0F0F] !border-white/10 !rounded-xl"
                        maskColor="rgba(0, 0, 0, 0.7)"
                        nodeColor={(n: any) => n.data?.color ? n.data.color.split(' ')[1].replace('to-', '#') : '#333'}
                        nodeStrokeWidth={3}
                        zoomable
                        pannable
                    />

                    <Panel position="top-left" className="bg-[#0F0F0F]/80 backdrop-blur-md border border-white/10 p-4 rounded-2xl m-4 flex items-center gap-4 shadow-2xl">
                        <div className="bg-neon-cyan/20 p-2 rounded-xl border border-neon-cyan/30">
                            <Layers className="text-neon-cyan" size={20} />
                        </div>
                        <div>
                            <input
                                value={strategyName}
                                onChange={(e) => setStrategyName(e.target.value)}
                                className="bg-transparent border-none focus:outline-none font-black text-xl tracking-tighter text-white w-48 uppercase font-mono"
                            />
                            <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${account ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></span>
                                <span className="text-[10px] font-mono text-gray-500">{account ? 'UPLINK: ACTIVE' : 'OFFLINE'}</span>
                            </div>
                        </div>
                    </Panel>

                    <Panel position="top-right" className="m-4 flex gap-2">
                        <button
                            onClick={() => handleSave(false)}
                            className="bg-[#0F0F0F]/80 backdrop-blur-md border border-white/10 px-6 py-2.5 rounded-xl font-mono text-[11px] font-bold tracking-widest text-gray-400 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2"
                        >
                            <Save size={14} /> COMMIT DRAFT
                        </button>
                        <button
                            onClick={() => handleSave(true)}
                            className="bg-neon-cyan px-8 py-2.5 rounded-xl font-mono text-[11px] font-black tracking-widest text-black hover:bg-cyan-400 shadow-[0_0_20px_rgba(0,243,255,0.3)] transition-all flex items-center gap-2"
                        >
                            <Play size={14} fill="currentColor" /> COMPILE KERNEL
                        </button>
                    </Panel>

                    <Panel position="bottom-right" className="m-4">
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => setShowHistory(true)}
                                className="bg-[#0F0F0F]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl text-gray-400 hover:text-white transition-all shadow-xl group relative"
                            >
                                <History size={18} />
                                <span className="absolute right-full mr-2 px-2 py-1 bg-black text-[10px] text-neon-cyan border border-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">VIEW KERNEL LOGS</span>
                            </button>
                            <button className="bg-[#0F0F0F]/80 backdrop-blur-md border border-white/10 p-3 rounded-xl text-gray-400 hover:text-white transition-all shadow-xl group relative">
                                <Download size={18} />
                                <span className="absolute right-full mr-2 px-2 py-1 bg-black text-[10px] text-gray-400 border border-white/10 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">EXPORT SCHEMA</span>
                            </button>
                        </div>
                    </Panel>
                </ReactFlow>
            </div>

            {/* Matrix Kernel History Panel */}
            <AnimatePresence>
                {showHistory && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowHistory(false)}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-[400px] bg-[#0A0A0A] border-l border-white/10 z-[101] shadow-2xl flex flex-col"
                        >
                            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/40">
                                <div>
                                    <h2 className="text-sm font-black tracking-[0.2em] text-white uppercase font-mono">Kernel Archives</h2>
                                    <p className="text-[10px] text-gray-500 font-mono mt-1 uppercase tracking-wider">Neural storage uplink active</p>
                                </div>
                                <button
                                    onClick={() => setShowHistory(false)}
                                    className="p-2 hover:bg-white/5 rounded-lg text-gray-500 hover:text-white transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                {isLoadingHistory ? (
                                    <div className="flex flex-col items-center justify-center h-64 space-y-4">
                                        <div className="w-8 h-8 border-2 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Scanning Uplink...</p>
                                    </div>
                                ) : history.length === 0 ? (
                                    <div className="text-center p-12 space-y-3">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center mx-auto border border-white/5">
                                            <Database size={20} className="text-gray-600" />
                                        </div>
                                        <p className="text-[11px] font-mono text-gray-500 uppercase">Archive Empty</p>
                                    </div>
                                ) : (
                                    history.map((strat, i) => (
                                        <motion.button
                                            key={strat.id || i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            onClick={() => loadKernel(strat)}
                                            className="w-full text-left p-4 bg-[#111] border border-white/5 rounded-2xl hover:border-neon-cyan/30 hover:bg-[#161616] transition-all group flex gap-4"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-neon-cyan/5 border border-neon-cyan/10 flex items-center justify-center shrink-0 group-hover:bg-neon-cyan/20 transition-colors">
                                                <span className="text-lg">{strat.emoji || '🤖'}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h3 className="text-xs font-bold text-gray-200 group-hover:text-white truncate font-mono uppercase tracking-tight">
                                                        {strat.name}
                                                    </h3>
                                                    <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter ${strat.status === 'RUNNING' ? 'bg-green-500/10 text-green-500' : 'bg-amber-500/10 text-amber-500'
                                                        }`}>
                                                        {strat.status}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-[9px] text-gray-500 font-mono">
                                                    <span className="flex items-center gap-1"><Clock size={10} /> {new Date(strat.created_at).toLocaleDateString()}</span>
                                                    <span className="flex items-center gap-1 font-bold text-neon-cyan/60">{strat.yield} APIA</span>
                                                </div>
                                            </div>
                                            <div className="self-center">
                                                <ChevronRight size={14} className="text-gray-700 group-hover:text-neon-cyan transition-colors" />
                                            </div>
                                        </motion.button>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default function StrategyBuilderPro() {
    return (
        <main className="h-screen w-screen bg-[#0A0A0A] text-white flex flex-col font-sans selection:bg-neon-cyan/30">
            <Navbar />

            {/* Professional Separator / Breathing Room */}
            <div className="h-[90px] w-full shrink-0"></div>

            <div className="flex-1 flex overflow-hidden border-t border-white/5 bg-[radial-gradient(circle_at_top,rgba(0,243,255,0.05),transparent_40%)]">
                <ReactFlowProvider>
                    <StrategyBuilderInner />
                </ReactFlowProvider>
            </div>

            <style jsx global>{`
                .react-flow__handle {
                    width: 8px;
                    height: 8px;
                    background: #00f3ff !important;
                    border: 2px solid #000 !important;
                }
                .react-flow__attribution {
                    display: none;
                }
                .react-flow__controls-button {
                    background: #1A1A1A !important;
                    border-bottom: 1px solid #333 !important;
                    color: #666 !important;
                    fill: #666 !important;
                }
                .react-flow__controls-button:hover {
                    background: #222 !important;
                    color: #fff !important;
                    fill: #fff !important;
                }
                .react-flow__edge-path {
                    stroke-width: 2.5;
                }
                .glass-card {
                    background: rgba(15, 15, 15, 0.8);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #00f3ff;
                }
            `}</style>
        </main>
    );
}
