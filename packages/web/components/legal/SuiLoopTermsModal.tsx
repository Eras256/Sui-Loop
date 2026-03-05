"use client";

import { useState, useEffect } from "react";
import { useCurrentAccount, useSignPersonalMessage } from "@mysten/dapp-kit";
import { supabase } from "@/lib/supabase"; // Adjusted to project path
import { AlertTriangle, Shield, Check } from "lucide-react";

export default function SuiLoopTermsModal() {
    const account = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();
    const [hasSigned, setHasSigned] = useState<boolean>(true); // Assume true until check
    const [isSigning, setIsSigning] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!account?.address || !supabase) return;

        // Verificar en Supabase si esta wallet ya firmó los términos
        const checkSignature = async () => {
            try {
                const { data, error } = await supabase
                    .from("user_signatures" as any)
                    .select("signature_hash")
                    .eq("wallet_address", account.address)
                    .single();

                if (error || !data) {
                    setHasSigned(false);
                } else {
                    setHasSigned(true);
                }
            } catch (err) {
                console.error("Legal check failed:", err);
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

            // La wallet pedirá firmar este string
            const signature = await signPersonalMessage({
                message: new TextEncoder().encode(message),
            });

            // Guardar el hash de la firma y la wallet en tu DB para auditoría legal
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
            console.error("User rejected signature or error occurred:", error);
            setError(error.message || "Failed to sign terms. Please try again.");
        } finally {
            setIsSigning(false);
        }
    };

    if (!account || hasSigned) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md px-4">
            <div className="w-full max-w-xl border border-red-500/30 bg-black/95 rounded-2xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-50" />

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-red-500" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white tracking-tight">CRITICAL: Risk Acknowledgment</h2>
                        <p className="text-red-500/60 text-xs font-mono uppercase tracking-widest">Protocol Compliance Requirement</p>
                    </div>
                </div>

                <div className="space-y-4 mb-8">
                    <p className="text-gray-300 text-sm leading-relaxed">
                        Before accessing the <span className="text-red-400 font-bold">SuiLoop Neural Swarm</span> and activating autonomous on-chain agents, you must cryptographically sign your acceptance of the following terms:
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-5 space-y-3 font-mono text-xs">
                        <div className="flex gap-3 text-gray-400">
                            <Shield className="w-4 h-4 text-red-400 shrink-0" />
                            <p><span className="text-white">Non-Custodial Tool:</span> SuiLoop is software infrastructure, not a financial entity or custodian.</p>
                        </div>
                        <div className="flex gap-3 text-gray-400">
                            <Shield className="w-4 h-4 text-red-400 shrink-0" />
                            <p><span className="text-white">AI Volatility:</span> LLM agents can hallucinate or fail due to API offsets, leading to strategy errors.</p>
                        </div>
                        <div className="flex gap-3 text-gray-400">
                            <Shield className="w-4 h-4 text-red-400 shrink-0" />
                            <p><span className="text-white">Atomic Risk:</span> DeFi interactions and flash loans carry the risk of total capital loss.</p>
                        </div>
                        <div className="flex gap-3 text-gray-400">
                            <Shield className="w-4 h-4 text-red-400 shrink-0" />
                            <p><span className="text-white">Jurisdiction:</span> You waive class-action rights and accept Estado de México jurisdiction.</p>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleSignTerms}
                    disabled={isSigning}
                    className={`w-full relative overflow-hidden group py-4 rounded-xl font-mono font-bold text-sm transition-all duration-300 ${isSigning
                            ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-500 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)]"
                        }`}
                >
                    {isSigning ? (
                        <span className="flex items-center justify-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            AWAITING WALLET SIGNATURE...
                        </span>
                    ) : (
                        <span className="flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            CRYPTOGRAPHICALLY SIGN & PROCEED
                        </span>
                    )}
                </button>

                <p className="mt-4 text-[10px] text-center text-gray-500 uppercase tracking-widest font-mono">
                    Security Provided by Sui Network Cryptography
                </p>
            </div>
        </div>
    );
}
