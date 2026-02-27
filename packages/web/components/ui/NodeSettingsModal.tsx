import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Network, Brain, Shield, Key, Server, CheckCircle2, ChevronRight, Activity, Zap } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import toast from "react-hot-toast";

interface NodeSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function NodeSettingsModal({ isOpen, onClose }: NodeSettingsModalProps) {
    const { t } = useLanguage();
    const [provider, setProvider] = useState<'openai' | 'anthropic' | 'ollama'>('openai');
    const [apiKey, setApiKey] = useState("");
    const [isLocalConnected, setIsLocalConnected] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    // Initialize from local storage
    useEffect(() => {
        if (isOpen) {
            const savedKey = localStorage.getItem("suiloop_api_key");
            const savedProvider = localStorage.getItem("suiloop_llm_provider");
            if (savedKey) setApiKey(savedKey);
            if (savedProvider) setProvider(savedProvider as any);

            // If ollama is default, test conn automatically
            if (savedProvider === 'ollama') {
                testLocalConnection();
            }
        }
    }, [isOpen]);

    const handleSave = () => {
        if (provider !== 'ollama' && !apiKey) {
            toast.error(t('settings?.keyRequired') || "API Key is required for Cloud AI.");
            return;
        }

        localStorage.setItem("suiloop_llm_provider", provider);

        if (provider !== 'ollama') {
            localStorage.setItem("suiloop_api_key", apiKey);
        } else {
            localStorage.removeItem("suiloop_api_key");
        }

        toast.success(t('settings?.saved') || "Node configuration updated securely.");
        setTimeout(() => onClose(), 500);
    };

    const testLocalConnection = async () => {
        setIsTesting(true);
        try {
            // Test connection to Ollama local server
            const res = await fetch("http://localhost:11434/api/tags", { method: "GET" }).catch(() => null);
            if (res && res.ok) {
                setIsLocalConnected(true);
                toast.success("Matrix linked to local hardware.");
            } else {
                setIsLocalConnected(false);
                toast.error("Ollama not detected on Localhost:11434");
                setProvider('openai'); // fallback
            }
        } catch (error) {
            setIsLocalConnected(false);
            setProvider('openai');
        } finally {
            setIsTesting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                    onClick={onClose}
                />

                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    className="relative w-full max-w-lg bg-black border border-white/10 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(189,0,255,0.1)]"
                >
                    {/* Header */}
                    <div className="p-4 sm:p-5 border-b border-white/5 bg-gradient-to-b from-white/[0.02] to-transparent">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-neon-cyan/20 rounded-xl border border-neon-cyan/30">
                                    <Brain className="w-6 h-6 text-neon-cyan" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Node & AI Settings</h2>
                                    <p className="text-sm text-gray-400 font-mono flex items-center gap-2">
                                        <Shield size={12} className="text-green-400" />
                                        Bring Your Own Key (BYOK)
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 sm:p-5 space-y-4 sm:space-y-5">
                        {/* Information Banner */}
                        <div className="p-3 rounded-xl bg-neon-purple/10 border border-neon-purple/20 flex gap-3 text-xs sm:text-sm">
                            <Shield className="w-5 h-5 text-neon-purple shrink-0 mt-0.5" />
                            <p className="text-gray-300">
                                Keys are stored locally in your browser. They are explicitly routed to your operational agent when dispatching blockchain tasks.
                            </p>
                        </div>

                        {/* Top Toggles Container */}
                        <div className="grid grid-cols-2 gap-3">
                            {/* Cloud Section */}
                            <button
                                onClick={() => { setProvider('openai'); setIsLocalConnected(false); }}
                                className={`
                                    p-3 sm:p-4 rounded-xl border transition-all text-left flex flex-col gap-2 relative overflow-hidden
                                    ${provider !== 'ollama' ? 'border-neon-cyan bg-neon-cyan/5 shadow-[0_0_20px_rgba(0,243,255,0.1)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}
                                `}
                            >
                                {provider !== 'ollama' && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-neon-cyan/10 blur-2xl rounded-full" />
                                )}
                                <div className="flex items-center justify-between w-full relative z-10">
                                    <Network className={`w-5 h-5 ${provider !== 'ollama' ? 'text-neon-cyan' : 'text-gray-400'}`} />
                                    {provider !== 'ollama' && <CheckCircle2 className="w-4 h-4 text-neon-cyan" />}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-white font-bold leading-none">Cloud Matrix</h3>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">OpenAI / Claude</p>
                                </div>
                            </button>

                            {/* Local Section */}
                            <button
                                onClick={() => { setProvider('ollama'); testLocalConnection(); }}
                                className={`
                                    p-3 sm:p-4 rounded-xl border transition-all text-left flex flex-col gap-2 relative overflow-hidden
                                    ${provider === 'ollama' ? 'border-green-500 bg-green-500/5 shadow-[0_0_20px_rgba(34,197,94,0.1)]' : 'border-white/10 bg-white/5 hover:bg-white/10'}
                                `}
                            >
                                {provider === 'ollama' && (
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-500/10 blur-2xl rounded-full" />
                                )}
                                <div className="flex items-center justify-between w-full relative z-10">
                                    <Server className={`w-5 h-5 ${provider === 'ollama' ? 'text-green-500' : 'text-gray-400'}`} />
                                    {provider === 'ollama' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                </div>
                                <div className="relative z-10">
                                    <h3 className="text-white font-bold leading-none">Local Mode</h3>
                                    <p className="text-[10px] sm:text-xs text-gray-500 mt-1.5">Ollama Decentralized</p>
                                </div>
                            </button>
                        </div>

                        {/* Hardware Specific Configs */}
                        <AnimatePresence mode="popLayout">
                            {provider !== 'ollama' ? (
                                <motion.div
                                    key="cloud"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="space-y-4 pt-2"
                                >
                                    {/* Selector Cloud Type */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setProvider('openai')}
                                            className={`px-4 py-2 text-xs font-mono font-bold rounded flex-1 border transition-colors ${provider === 'openai' ? 'border-neon-cyan bg-neon-cyan/20 text-white' : 'border-white/10 bg-black text-gray-500 hover:text-white hover:bg-white/5'}`}
                                        >
                                            OPEN_AI_KEY
                                        </button>
                                        <button
                                            onClick={() => setProvider('anthropic')}
                                            className={`px-4 py-2 text-xs font-mono font-bold rounded flex-1 border transition-colors ${provider === 'anthropic' ? 'border-neon-cyan bg-neon-cyan/20 text-white' : 'border-white/10 bg-black text-gray-500 hover:text-white hover:bg-white/5'}`}
                                        >
                                            ANTHROPIC_KEY
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder={`sk-...${provider === 'openai' ? 'proj-XXXX' : 'ant-api-XXXX'}`}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-white text-[13px] sm:text-sm focus:outline-none focus:border-neon-cyan focus:bg-neon-cyan/5 transition-all placeholder:text-gray-600 font-mono shadow-inner"
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="local"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="pt-2"
                                >
                                    <div className={`p-4 sm:p-6 rounded-xl border flex flex-col items-center justify-center gap-3 sm:gap-4 text-center transition-colors ${isLocalConnected ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                                        <div className="relative">
                                            <div className={`absolute inset-0 rounded-full blur-xl opacity-60 ${isTesting ? 'bg-yellow-500 animate-pulse' : isLocalConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                                            <Activity className={`relative z-10 w-10 h-10 ${isTesting ? 'text-yellow-400 animate-pulse' : isLocalConnected ? 'text-green-400' : 'text-red-400'}`} />
                                        </div>
                                        <div>
                                            <p className="text-white text-lg font-bold tracking-tight">{isTesting ? 'Pinging Localhost:11434...' : isLocalConnected ? 'Local Link Active' : 'Ollama Offline'}</p>
                                            <p className="text-sm text-gray-400 mt-1 max-w-[250px] mx-auto">
                                                {isLocalConnected ? 'Ready for 100% private decentralized inference.' : 'Could not reach Ollama API on port 11434.'}
                                            </p>
                                        </div>
                                        {!isLocalConnected && !isTesting && (
                                            <button
                                                onClick={testLocalConnection}
                                                className="mt-2 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-sm font-bold text-white transition-all active:scale-95"
                                            >
                                                Retry Connection
                                            </button>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 sm:p-5 border-t border-white/5 flex gap-3 bg-black/50">
                        <button
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 sm:py-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold transition-all text-sm sm:text-base"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={provider === 'ollama' && !isLocalConnected}
                            className={`
                                flex-1 px-4 py-2.5 sm:py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-[0_4px_20px_rgba(0,243,255,0.3)] text-sm sm:text-base
                                ${provider === 'ollama' && !isLocalConnected ? 'opacity-50 cursor-not-allowed bg-white/5 text-gray-500 border border-white/10 shadow-none' : 'bg-gradient-to-r from-neon-cyan to-blue-500 hover:opacity-90 text-black'}
                            `}
                        >
                            <Zap size={18} />
                            Commit Protocol
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
