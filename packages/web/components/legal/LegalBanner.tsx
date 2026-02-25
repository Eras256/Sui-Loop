'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, X, Shield } from 'lucide-react';

const STORAGE_KEY = 'suiloop-legal-accepted-v1';

export default function LegalBanner() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const accepted = localStorage.getItem(STORAGE_KEY);
            if (!accepted) {
                setVisible(true);
            }
        } catch {
            // localStorage not available (SSR etc.)
        }
    }, []);

    const accept = () => {
        try {
            localStorage.setItem(STORAGE_KEY, 'true');
        } catch { }
        setVisible(false);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 sm:p-4">
            <div className="max-w-5xl mx-auto bg-[#0a0a1a]/95 border border-amber-500/30 backdrop-blur-xl rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">
                    {/* Icon */}
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <p className="text-white font-bold text-sm mb-1 flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-neon-cyan" />
                            Important Legal Notice — SuiLoop is Software, Not a Financial Service
                        </p>
                        <p className="text-gray-400 text-xs leading-relaxed">
                            SuiLoop is open-source DeFi infrastructure software. It is{' '}
                            <span className="text-white font-semibold">not a bank, exchange, broker, or ITF</span> under any jurisdiction.
                            It does not custody your funds or private keys. DeFi strategies carry{' '}
                            <span className="text-amber-400 font-semibold">significant financial risk including total loss of funds</span>.
                            By using this platform you accept our{' '}
                            <Link href="/terms" className="text-neon-cyan hover:underline" onClick={accept}>Terms of Service</Link>
                            {' '}and{' '}
                            <Link href="/risk-disclosure" className="text-neon-cyan hover:underline" onClick={accept}>Risk Disclosure</Link>.
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 mt-0.5">
                        <button
                            id="legal-banner-accept"
                            onClick={accept}
                            className="bg-neon-cyan text-black font-bold text-xs px-4 py-2 rounded-xl hover:bg-neon-cyan/80 transition-all whitespace-nowrap shadow-[0_0_15px_rgba(0,243,255,0.3)]"
                        >
                            I Understand
                        </button>
                        <button
                            onClick={accept}
                            className="text-gray-600 hover:text-gray-400 transition-colors p-1.5"
                            aria-label="Dismiss"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
