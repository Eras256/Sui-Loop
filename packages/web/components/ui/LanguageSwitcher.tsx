'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage, LOCALE_LABELS, Locale } from '@/lib/i18n/LanguageContext';
import { ChevronDown, Globe } from 'lucide-react';

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const current = LOCALE_LABELS[locale];

    return (
        <div ref={ref} className="relative">
            <button
                id="language-switcher"
                onClick={() => setOpen(o => !o)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all text-xs font-mono text-gray-300 hover:text-white group"
                aria-label="Select language"
            >
                <Globe size={12} className="text-neon-cyan group-hover:rotate-12 transition-transform" />
                <span className="hidden sm:inline">{current.flag} {current.native}</span>
                <span className="sm:hidden">{current.flag}</span>
                <ChevronDown
                    size={10}
                    className={`text-gray-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {open && (
                <div className="absolute right-0 top-full mt-2 z-50 w-40 bg-[#0a0a1f]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.6)] overflow-hidden">
                    {/* Header */}
                    <div className="px-3 py-2 border-b border-white/5">
                        <p className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">Language</p>
                    </div>

                    {(Object.entries(LOCALE_LABELS) as [Locale, typeof LOCALE_LABELS[Locale]][]).map(([code, info]) => (
                        <button
                            key={code}
                            id={`lang-${code}`}
                            onClick={() => {
                                setLocale(code);
                                setOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-white/5 transition-colors ${locale === code
                                    ? 'text-neon-cyan bg-neon-cyan/5'
                                    : 'text-gray-400'
                                }`}
                        >
                            <span className="text-base">{info.flag}</span>
                            <div className="flex flex-col">
                                <span className="font-medium text-xs leading-none">{info.native}</span>
                                <span className="text-[10px] text-gray-600 leading-none mt-0.5">{info.label}</span>
                            </div>
                            {locale === code && (
                                <span className="ml-auto text-neon-cyan text-xs">✓</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
