"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { supabase } from "@/lib/supabase";
import { AlertTriangle, Shield, Check } from "lucide-react";
import Link from "next/link";

export default function SuiLoopTermsModal() {
    const account = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const [hasSigned, setHasSigned] = useState<boolean>(true); // Assume true until check
    const [isSigning, setIsSigning] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!account?.address || !supabase) return;

        const checkSignature = async () => {
            try {
                const { data, error } = await supabase
                    .from("user_signatures" as any)
                    .select("signature_hash")
                    .eq("wallet_address", account.address)
                    .eq("network", "sui:testnet")
                    .single();

                if (error || !data) {
                    setHasSigned(false);
                } else {
                    setHasSigned(true);
                }
            } catch (err) {
                setHasSigned(false);
            }
        };

        checkSignature();
    }, [account]);

    const handleSignTerms = async () => {
        if (!account || !supabase) return;
        setIsSigning(true);
        setError(null);

        try {
            const message = "I have read and accept the SuiLoop Terms of Service, Risk Disclosures, and explicitly acknowledge the risk of total fund loss and AI algorithmic hallucinations. I confirm I am not a Restricted Person.";

            const signature = await signPersonalMessage({
                message: new TextEncoder().encode(message),
            });

            const { error: insertError } = await supabase.from("user_signatures" as any).insert({
                wallet_address: account.address,
                signature_hash: signature.signature,
                message_signed: message,
                network: "sui:testnet",
                accepted_at: new Date().toISOString(),
            });

            if (insertError) throw insertError;
            setHasSigned(true);
        } catch (error: any) {
            setError(error.message || "Failed to sign terms. Please try again.");
        } finally {
            setIsSigning(false);
        }
    };

    if (!account || hasSigned) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-md px-4 py-6 overflow-y-auto">
            <div className="w-full max-w-xl border border-red-500/30 bg-[#050510] rounded-2xl p-6 md:p-10 shadow-[0_0_60px_rgba(239,68,68,0.15)] relative my-auto">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-40" />

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-8 text-center sm:text-left">
                    <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center shrink-0 animate-pulse">
                        <AlertTriangle className="w-7 h-7 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-white tracking-tight">CRITICAL: Risk Acknowledgment</h2>
                        <p className="text-red-500/60 text-[10px] md:text-xs font-mono uppercase tracking-[0.2em] mt-1">Institutional Compliance Protocol</p>
                    </div>
                </div>

                <div className="space-y-5 mb-10">
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                        Access to the <span className="text-red-400 font-bold">Neural Swarm Engine</span> requires cryptographic confirmation of our legal framework.
                    </p>

                    <div className="bg-[#0A0A1A] border border-white/5 rounded-xl p-6 space-y-4 font-mono">
                        {[
                            { label: "Non-Custodial", desc: "Software infrastructure, no custodial access to your funds." },
                            { label: "AI Volatility", desc: "Agents can fail due to LLM non-determinism or API spikes." },
                            { label: "Atomic Loss", desc: "Exposure to flash loans carries risk of 100% capital loss." },
                            { label: "Jurisdiction", desc: "Governed by Estado de México (MX) laws. Class-action waiver." }
                        ].map((item, i) => (
                            <div key={i} className="flex gap-4 group">
                                <Shield className="w-4 h-4 text-red-500/50 shrink-0 mt-0.5 group-hover:text-red-500 transition-colors" />
                                <p className="text-[11px] md:text-xs text-gray-400 leading-normal">
                                    <span className="text-gray-200 font-bold">{item.label}:</span> {item.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8 p-4 bg-white/3 border border-white/10 rounded-xl text-center sm:text-left">
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest leading-relaxed">
                        Full documentation & terms available for review:
                    </p>
                    <div className="flex gap-4">
                        <Link href="/terms" className="text-[11px] font-bold text-neon-cyan hover:underline decoration-neon-cyan/30">TERMS OF SERVICE</Link>
                        <Link href="/terms#risk" className="text-[11px] font-bold text-neon-cyan hover:underline decoration-neon-cyan/30">RISK DISCLOSURE</Link>
                    </div>
                </div>

                {error && (
                    <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center font-mono">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSignTerms}
                    disabled={isSigning}
                    className={`w-full relative overflow-hidden group py-5 rounded-2xl font-mono font-bold text-sm tracking-widest transition-all duration-500 ${isSigning
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_30px_rgba(220,38,38,0.3)] active:scale-[0.98]"
                        }`}
                >
                    {isSigning ? (
                        <span className="flex items-center justify-center gap-3">
                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            WAITING FOR WALLET...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-3">
                            <Shield className="w-5 h-5 group-hover:animate-pulse" />
                            SIGN & AUTHORIZE ACCESS
                        </span>
                    )}
                </button>

                <div className="mt-6 flex items-center justify-center gap-2 opacity-40">
                    <Check className="w-3 h-3 text-red-500" />
                    <p className="text-[9px] text-center text-gray-500 uppercase tracking-[0.3em] font-mono">
                        Sui Testnet Cryptographic Confirmation
                    </p>
                </div>
            </div>
        </div>
    );
}
