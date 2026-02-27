"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, Zap, ShieldCheck, ChevronRight, ExternalLink, Info } from "lucide-react";

interface MatrixFeePanelProps {
    /** Total realized profit across all strategies (in base asset units) */
    grossProfit: number;
    baseAsset?: string;
    txDigest?: string | null;
}

/** Smooth animated number counter */
function AnimatedNumber({ value, decimals = 4, prefix = "", suffix = "" }: {
    value: number; decimals?: number; prefix?: string; suffix?: string;
}) {
    const [display, setDisplay] = useState(0);
    const ref = useRef(0);

    useEffect(() => {
        const start = ref.current;
        const end = value;
        const duration = 800;
        const startTime = performance.now();

        const animate = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out-cubic
            ref.current = start + (end - start) * eased;
            setDisplay(ref.current);
            if (progress < 1) requestAnimationFrame(animate);
        };

        requestAnimationFrame(animate);
    }, [value]);

    return <>{prefix}{display.toFixed(decimals)}{suffix}</>;
}

export default function MatrixFeePanel({ grossProfit, baseAsset = "SUI", txDigest }: MatrixFeePanelProps) {
    const MATRIX_FEE_RATE = 0.01; // 1%
    const matrixFee = grossProfit * MATRIX_FEE_RATE;
    const netProfit = grossProfit - matrixFee;
    const [showInfo, setShowInfo] = useState(false);

    const hasProfits = grossProfit > 0;

    return (
        <div className="glass-panel rounded-2xl p-5 border border-white/5 hover:border-white/10 transition-all relative overflow-hidden">
            {/* Ambient Glow */}
            {hasProfits && (
                <div className="absolute -top-16 -right-16 w-48 h-48 bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none" />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-5 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl">
                        <TrendingUp className="w-5 h-5 text-neon-cyan" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">Matrix Fee Breakdown</h3>
                        <p className="text-[10px] text-gray-500 font-mono">1% performance protocol fee</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowInfo(!showInfo)}
                    className="p-1.5 text-gray-500 hover:text-neon-cyan bg-white/5 hover:bg-neon-cyan/10 rounded-lg transition-colors"
                    aria-label="Info"
                >
                    <Info className="w-4 h-4" />
                </button>
            </div>

            {/* Info Tooltip */}
            <AnimatePresence>
                {showInfo && (
                    <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="mb-4 p-3 bg-neon-purple/10 border border-neon-purple/20 rounded-xl text-xs text-gray-300 leading-relaxed relative z-10"
                    >
                        <span className="text-neon-purple font-bold">Matrix Fee</span> is charged exclusively on{" "}
                        <span className="text-white">net realized profits</span>. If a trade reverts atomically (loss),{" "}
                        <span className="text-white">no fee is deducted</span>. Revenue goes to the SuiLoop treasury
                        to fund protocol development and ELO rewards.
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 3-Column Breakdown */}
            <div className="grid grid-cols-3 gap-2 mb-5 relative z-10">
                {/* Gross */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex flex-col gap-1">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Gross Profit</p>
                    <p className={`text-base font-mono font-bold ${hasProfits ? "text-white" : "text-gray-600"}`}>
                        {hasProfits ? (
                            <AnimatedNumber value={grossProfit} decimals={4} />
                        ) : "0.0000"}
                    </p>
                    <p className="text-[9px] text-gray-600 font-mono">{baseAsset}</p>
                </div>

                {/* Fee (1%) */}
                <div className={`border rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden ${hasProfits ? "bg-amber-500/5 border-amber-500/20" : "bg-white/5 border-white/10"}`}>
                    {hasProfits && (
                        <div className="absolute inset-0 bg-amber-500/5 blur-sm" />
                    )}
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono relative z-10">Matrix Fee</p>
                    <p className={`text-base font-mono font-bold relative z-10 ${hasProfits ? "text-amber-400" : "text-gray-600"}`}>
                        {hasProfits ? (
                            <AnimatedNumber value={matrixFee} decimals={4} prefix="-" />
                        ) : "0.0000"}
                    </p>
                    <p className="text-[9px] text-amber-600 font-mono relative z-10">1% on profits</p>
                </div>

                {/* Net */}
                <div className={`border rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden ${hasProfits ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/10"}`}>
                    {hasProfits && (
                        <div className="absolute inset-0 bg-green-500/5 blur-sm" />
                    )}
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider font-mono relative z-10">Net Profit</p>
                    <p className={`text-base font-mono font-bold relative z-10 ${hasProfits ? "text-green-400" : "text-gray-600"}`}>
                        {hasProfits ? (
                            <AnimatedNumber value={netProfit} decimals={4} prefix="+" />
                        ) : "0.0000"}
                    </p>
                    <p className="text-[9px] text-green-700 font-mono relative z-10">{baseAsset}</p>
                </div>
            </div>

            {/* Visual Bar */}
            {hasProfits && (
                <div className="relative z-10 mb-4">
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: "99%" }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full"
                        />
                    </div>
                    <div className="flex justify-between text-[9px] text-gray-600 mt-1 font-mono">
                        <span>Your Net: {((netProfit / grossProfit) * 100).toFixed(1)}%</span>
                        <span>Protocol: 1%</span>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="relative z-10 flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-gray-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                    <span>Atomic revert protection — fee only on realized profit</span>
                </div>
                {txDigest && (
                    <a
                        href={`https://suiscan.xyz/testnet/tx/${txDigest}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-[10px] text-neon-cyan hover:text-white transition-colors"
                    >
                        <span>View Tx</span>
                        <ExternalLink className="w-3 h-3" />
                    </a>
                )}
                {!hasProfits && (
                    <div className="flex items-center gap-1 text-[10px] text-gray-600">
                        <Zap className="w-3 h-3" />
                        <span>Start a strategy to track profits</span>
                    </div>
                )}
            </div>
        </div>
    );
}
