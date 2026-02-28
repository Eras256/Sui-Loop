'use client';

import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
    LucideIcon, Plus, Play, Save, Box, Activity, Zap, ArrowRight, Trash2,
    Settings, Search, ZoomIn, ZoomOut, Undo, Redo,
    LayoutGrid, Cpu, History, Clock, Landmark, Coins, Shield, Database,
    Twitter, MessageSquare, Bell, Share2, BarChart3, Fingerprint, Lock, Repeat, RefreshCw,
    Layers, MousePointer2, Info, ChevronRight, Download, Bolt, KeyRound, TrendingUp, FlaskConical
} from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const ICON_MAP: any = {
    Plus, Play, Save, Box, Activity, Zap, ArrowRight, Trash2,
    Settings, Search, ZoomIn, ZoomOut, Undo, Redo,
    LayoutGrid, Cpu, History, Clock, Landmark, Coins, Shield, Database,
    Twitter, MessageSquare, Bell, Share2, BarChart3, Fingerprint, Lock, Repeat, RefreshCw,
    Layers, MousePointer2, Info, ChevronRight, Download,
    // Atomic Engine icons
    Bolt, KeyRound, TrendingUp, FlaskConical
};

export interface CustomNodeData {
    label: string;
    icon: LucideIcon;
    type: string;
    sublabel?: string;
    color?: string;
}

const CustomNode = ({ data: rawData, selected }: NodeProps) => {
    const data = rawData as unknown as CustomNodeData;
    const { t } = useLanguage();
    const Icon = typeof data.icon === 'string' ? ICON_MAP[data.icon] || Box : (data.icon as LucideIcon || Box);
    const gradColor = (data.color as string) || 'from-gray-500 to-gray-700';

    const nodeName = t(`builder.nodes.${data.label}.name`);
    const translatedLabel = data.label === 'INIT_KERNEL' ? t('builder.initKernel') : (nodeName !== `builder.nodes.${data.label}.name` ? nodeName : data.label);

    return (
        <div className={`
            w-48 sm:w-56 md:w-64
            rounded-2xl backdrop-blur-md border transition-all duration-500
            ${selected
                ? 'border-neon-cyan shadow-[0_0_25px_rgba(0,243,255,0.2)] bg-[#0A0A0A]/90 ring-1 ring-neon-cyan/50'
                : 'border-white/5 bg-[#121212]/80 hover:border-white/20'
            }
        `}>
            {/* Header Accent Line */}
            <div className={`h-1 w-full rounded-t-2xl bg-gradient-to-r ${gradColor} opacity-70 group-hover:opacity-100`} />

            {/* Input Port */}
            <Handle
                type="target"
                position={Position.Left}
                className="!w-3 !h-3 !border-[3px] !border-[#0A0A0A] !bg-neon-cyan !left-[-7px] shadow-[0_0_8px_rgba(0,243,255,0.6)]"
            />

            <div className="p-3 sm:p-4">
                <div className="flex items-center gap-3 md:gap-4 relative z-10">
                    <div className={`
                        p-2 sm:p-2.5 rounded-xl shrink-0 transition-colors
                        ${selected ? 'bg-neon-cyan/10 text-neon-cyan' : 'bg-white/5 text-gray-400 group-hover:text-gray-200'}
                        border border-white/5
                    `}>
                        <Icon size={14} className="sm:hidden" />
                        <Icon size={18} className="hidden sm:block" />
                    </div>
                    <div className="flex-1 overflow-hidden min-w-0">
                        <h4 className="text-[10px] sm:text-[11px] md:text-xs font-black text-white/90 truncate leading-tight mb-1 uppercase tracking-wider font-orbitron">
                            {String(translatedLabel)}
                        </h4>
                        <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`
                                text-[8px] sm:text-[9px] font-mono font-bold uppercase 
                                px-1.5 py-0.5 rounded-md border
                                ${selected ? 'bg-neon-cyan/5 border-neon-cyan/20 text-neon-cyan/80' : 'bg-black/40 border-white/5 text-gray-500'}
                            `}>
                                {t(`builder.nodeTypes.${data.type}`) || data.type}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Output Port */}
            <Handle
                type="source"
                position={Position.Right}
                className="!w-3 !h-3 !border-[3px] !border-[#0A0A0A] !bg-neon-cyan !right-[-7px] shadow-[0_0_8px_rgba(0,243,255,0.6)] animate-pulse"
            />
        </div>
    );
};

export default memo(CustomNode);
