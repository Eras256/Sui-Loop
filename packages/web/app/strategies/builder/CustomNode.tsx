'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
    LucideIcon, Plus, Play, Save, Box, Activity, Zap, ArrowRight, Trash2,
    Settings, Search, ZoomIn, ZoomOut, Undo, Redo,
    LayoutGrid, Cpu, History, Clock, Landmark, Coins, Shield, Database,
    Twitter, MessageSquare, Bell, Share2, BarChart3, Fingerprint, Lock, Repeat, RefreshCw,
    Layers, MousePointer2, Info, ChevronRight, Download
} from 'lucide-react';

const ICON_MAP: any = {
    Plus, Play, Save, Box, Activity, Zap, ArrowRight, Trash2,
    Settings, Search, ZoomIn, ZoomOut, Undo, Redo,
    LayoutGrid, Cpu, History, Clock, Landmark, Coins, Shield, Database,
    Twitter, MessageSquare, Bell, Share2, BarChart3, Fingerprint, Lock, Repeat, RefreshCw,
    Layers, MousePointer2, Info, ChevronRight, Download
};

export interface CustomNodeData {
    label: string;
    icon: LucideIcon;
    type: string;
    sublabel?: string;
    color?: string;
}

const CustomNode = ({ data, selected }: NodeProps) => {
    const Icon = typeof data.icon === 'string' ? ICON_MAP[data.icon] || Box : (data.icon as LucideIcon || Box);
    const gradColor = (data.color as string) || 'from-gray-500 to-gray-700';

    return (
        <div className={`w-64 rounded-xl backdrop-blur-xl border shadow-2xl group transition-all
            ${selected ? 'border-neon-cyan ring-1 ring-neon-cyan z-50 animate-pulse-slow' : 'border-white/10 bg-[#151515]/90'}
        `}>
            {/* Header / Accent Bar */}
            <div className={`h-1.5 w-full rounded-t-xl bg-gradient-to-r ${gradColor} opacity-80 group-hover:opacity-100 transition-opacity`}></div>

            {/* Input Port (Target) */}
            <Handle
                type="target"
                position={Position.Left}
                className="w-3 h-3 border border-white/20 rounded-full !left-[-7px] !bg-neon-cyan"
            />

            <div className="p-4">
                <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-lg bg-white/5 border border-white/5 ${selected ? 'text-neon-cyan' : 'text-gray-300'}`}>
                        <Icon size={18} />
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <h4 className="text-sm font-bold text-gray-100 truncate leading-tight mb-1 uppercase tracking-tight font-mono">
                            {String(data.label)}
                        </h4>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-mono uppercase bg-white/5 px-1.5 py-0.5 rounded">
                                {data.type as string}
                            </span>
                            {!!data.sublabel && (
                                <span className="text-[9px] text-neon-purple font-mono uppercase truncate opacity-70">
                                    {data.sublabel as string}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Output Port (Source) */}
            <Handle
                type="source"
                position={Position.Right}
                className="w-3 h-3 border border-white/20 rounded-full !right-[-7px] !bg-neon-cyan animate-pulse"
            />
        </div>
    );
};

export default memo(CustomNode);
