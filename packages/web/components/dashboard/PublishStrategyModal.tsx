"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Globe, Lock, Star, Zap, Upload, ChevronRight, Shield, TrendingUp, Eye, EyeOff } from "lucide-react";

interface PublishStrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
    strategy: {
        id: string;
        name: string;
        emoji: string;
        strategy_id: string;
        yield?: string;
    } | null;
    agentElo?: number;
}

export default function PublishStrategyModal({ isOpen, onClose, strategy, agentElo = 1200 }: PublishStrategyModalProps) {
    const [visibility, setVisibility] = useState<"public" | "private">("public");
    const [price, setPrice] = useState("0"); // 0 = free
    const [description, setDescription] = useState("");
    const [isPublishing, setIsPublishing] = useState(false);
    const [published, setPublished] = useState(false);

    const eloTier = agentElo >= 2000 ? "Matrix" : agentElo >= 1600 ? "Gold" : agentElo >= 1200 ? "Silver" : "Bronze";
    const eloColor = eloTier === "Matrix" ? "text-neon-cyan" :
        eloTier === "Gold" ? "text-amber-400" :
            eloTier === "Silver" ? "text-gray-300" : "text-amber-700";

    const handlePublish = async () => {
        if (!strategy) return;
        setIsPublishing(true);

        // TODO: POST to /api/strategies/publish with strategy details
        await new Promise(r => setTimeout(r, 1800)); // Simulated

        setIsPublishing(false);
        setPublished(true);
        setTimeout(() => {
            setPublished(false);
            onClose();
        }, 2000);
    };

    if (!isOpen || !strategy) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/85 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-md bg-black border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_60px_rgba(0,243,255,0.08)]"
                >
                    {/* Published Success Overlay */}
                    <AnimatePresence>
                        {published && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/95"
                            >
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: "spring", bounce: 0.5 }}
                                >
                                    <Globe className="w-16 h-16 text-neon-cyan mb-4 mx-auto" />
                                </motion.div>
                                <p className="text-xl font-bold text-white">Strategy Published!</p>
                                <p className="text-sm text-gray-400 mt-1">Now visible in the Matrix Marketplace</p>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Header */}
                    <div className="p-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-cyan/10 border border-neon-cyan/20 rounded-xl text-2xl">
                                    {strategy.emoji}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white tracking-tight">Publish Strategy</h2>
                                    <p className="text-xs text-gray-500 font-mono truncate max-w-[200px]">{strategy.name}</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-5">
                        {/* ELO Badge */}
                        <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl">
                            <div className="flex items-center gap-2">
                                <Star className="w-4 h-4 text-amber-400" />
                                <span className="text-xs text-gray-400">Publisher ELO</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold font-mono ${eloColor}`}>{agentElo}</span>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${eloTier === "Matrix" ? "bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan" :
                                        eloTier === "Gold" ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                                            "bg-gray-500/10 border-gray-500/30 text-gray-300"
                                    } font-mono`}>{eloTier}</span>
                            </div>
                        </div>

                        {/* Visibility Toggle */}
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2 block">Visibility</label>
                            <div className="grid grid-cols-2 gap-2">
                                <button
                                    onClick={() => setVisibility("public")}
                                    className={`p-3 rounded-xl border text-left transition-all ${visibility === "public"
                                            ? "border-neon-cyan bg-neon-cyan/5 shadow-[0_0_15px_rgba(0,243,255,0.1)]"
                                            : "border-white/10 bg-white/5 hover:bg-white/10"
                                        }`}
                                >
                                    <Globe className={`w-4 h-4 mb-1.5 ${visibility === "public" ? "text-neon-cyan" : "text-gray-400"}`} />
                                    <p className="text-xs font-bold text-white">Public</p>
                                    <p className="text-[9px] text-gray-500">Visible in Marketplace</p>
                                </button>
                                <button
                                    onClick={() => setVisibility("private")}
                                    className={`p-3 rounded-xl border text-left transition-all ${visibility === "private"
                                            ? "border-neon-purple bg-neon-purple/5"
                                            : "border-white/10 bg-white/5 hover:bg-white/10"
                                        }`}
                                >
                                    <Lock className={`w-4 h-4 mb-1.5 ${visibility === "private" ? "text-neon-purple" : "text-gray-400"}`} />
                                    <p className="text-xs font-bold text-white">Private</p>
                                    <p className="text-[9px] text-gray-500">Invite-only access</p>
                                </button>
                            </div>
                        </div>

                        {/* Strategy Stats Preview */}
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Target Yield</p>
                                <p className="text-sm font-mono text-neon-cyan font-bold">{strategy.yield || "~12.4%"}</p>
                            </div>
                            <div className="p-3 bg-white/5 border border-white/10 rounded-xl">
                                <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-1">Protocol Fee</p>
                                <p className="text-sm font-mono text-amber-400 font-bold">1% profits</p>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="text-xs text-gray-400 uppercase tracking-wider font-bold mb-2 block">Signal Description</label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe your strategy's edge, risk profile, and target markets..."
                                maxLength={280}
                                rows={3}
                                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-neon-cyan focus:bg-neon-cyan/5 transition-all placeholder:text-gray-600 resize-none"
                            />
                            <p className="text-[9px] text-gray-600 text-right mt-1 font-mono">{description.length}/280</p>
                        </div>

                        {/* Disclaimer */}
                        <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-xl flex gap-2 text-[10px] text-amber-400/80">
                            <Shield className="w-4 h-4 shrink-0 mt-0.5" />
                            <p>Publishing imposes a <span className="text-white font-bold">1% performance fee</span> on profits generated by copiers. This accrues to the protocol treasury.</p>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-5 border-t border-white/5 flex gap-3 bg-black/50">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handlePublish}
                            disabled={isPublishing}
                            className="flex-1 px-4 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-neon-cyan to-blue-500 hover:opacity-90 text-black transition-all shadow-[0_4px_20px_rgba(0,243,255,0.3)] disabled:opacity-50"
                        >
                            {isPublishing ? (
                                <>
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                    >
                                        <Zap size={16} />
                                    </motion.div>
                                    Publishing...
                                </>
                            ) : (
                                <>
                                    <Upload size={16} />
                                    Publish Signal
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
