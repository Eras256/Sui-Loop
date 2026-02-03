'use client';

import { useState, useRef, useEffect } from 'react';
import Navbar from "@/components/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import {
    Plus, Play, Save, Box, Activity, Zap, ArrowRight, Trash2,
    Settings, Copy, Search, ZoomIn, ZoomOut, Undo, Redo,
    Maximize, MoreVertical, X, CheckCircle2, Menu, LayoutGrid
} from "lucide-react";
import Link from 'next/link';

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
            { type: 'trigger', label: 'Price Hits Target', icon: Activity, inputs: [], outputs: ['On Hit'] },
            { type: 'trigger', label: 'Interval Timer', icon: Zap, inputs: [], outputs: ['Tick'] },
            { type: 'trigger', label: 'Wallet Event', icon: Box, inputs: [], outputs: ['Tx Found'] },
        ]
    },
    {
        category: 'Logic & Conditions',
        color: 'from-blue-400 to-indigo-500',
        items: [
            { type: 'condition', label: 'Compare Price', icon: Box, inputs: ['In'], outputs: ['True', 'False'] },
            { type: 'condition', label: 'Check Solvency', icon: ShieldCheckIcon, inputs: ['In'], outputs: ['Safe', 'Unsafe'] },
        ]
    },
    {
        category: 'On-Chain Actions',
        color: 'from-neon-cyan to-teal-400',
        items: [
            { type: 'action', label: 'Flash Loan', icon: Zap, inputs: ['Trigger'], outputs: ['Success', 'Fail'] },
            { type: 'action', label: 'Swap Tokens', icon: ArrowRight, inputs: ['Liquidity'], outputs: ['Done'] },
            { type: 'action', label: 'Repay Loan', icon: CheckCircle2, inputs: ['Receipt'], outputs: ['Completed'] },
        ]
    }
];

function ShieldCheckIcon(props: any) {
    return <Box {...props} /> // Fallback icon
}

export default function StrategyBuilderPro() {
    const [nodes, setNodes] = useState<NodeData[]>([
        {
            id: 'start', type: 'trigger', label: 'START FLOW', icon: Play, x: 100, y: 300,
            inputs: [], outputs: ['Run']
        }
    ]);
    const [selectedNode, setSelectedNode] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(false); // Mobile sidebar state
    const canvasRef = useRef<HTMLDivElement>(null);

    // --- Actions ---
    const addNode = (item: any, clientX?: number, clientY?: number) => {
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
        setShowSidebar(false); // Close sidebar on mobile after adding
    };

    const removeNode = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setNodes(nodes.filter(n => n.id !== id));
        if (selectedNode === id) setSelectedNode(null);
    };

    const updateNodePosition = (id: string, x: number, y: number) => {
        setNodes(nodes.map(n => n.id === id ? { ...n, x, y } : n));
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
                        <span className="font-bold tracking-tight text-sm md:text-base">Strategy 1</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 w-fit">Draft</span>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-2">
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Undo size={18} /></button>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><Redo size={18} /></button>
                    <div className="h-6 w-[1px] bg-white/10 mx-2"></div>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><ZoomOut size={18} /></button>
                    <span className="text-xs font-mono text-gray-500">100%</span>
                    <button className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"><ZoomIn size={18} /></button>
                </div>

                <div className="flex items-center gap-2 md:gap-3">
                    <button className="hidden md:flex px-4 py-1.5 rounded-md bg-white/5 hover:bg-white/10 text-sm font-medium border border-white/10 transition-all items-center gap-2">
                        <Save size={14} /> Save
                    </button>
                    {/* Mobile Save Icon only */}
                    <button className="md:hidden p-2 rounded-md bg-white/5 text-gray-300">
                        <Save size={18} />
                    </button>

                    <button className="px-3 md:px-4 py-1.5 rounded-md bg-neon-cyan hover:bg-cyan-400 text-black text-xs md:text-sm font-bold shadow-[0_0_15px_rgba(0,243,255,0.3)] transition-all flex items-center gap-2">
                        <Play size={14} fill="currentColor" /> <span className="hidden md:inline">Run Test</span><span className="md:hidden">Run</span>
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
                        backgroundSize: '20px 20px'
                    }}
                >
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
        </main>
    );
}
