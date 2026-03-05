'use client';

import Link from "next/link";
import { Shield, AlertTriangle, FileText, Globe, Lock, Code } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const ICON_MAP: Record<string, any> = {
    Code,
    Lock,
    AlertTriangle,
    Globe,
    FileText,
    Shield
};

interface TermSection {
    id: string;
    icon: string;
    title: string;
    content: string;
}

export function TranslatedTerms() {
    const { t, tRaw } = useLanguage();
    const sections: TermSection[] = tRaw('terms.sections') || [];

    return (
        <>
            {/* Hero */}
            <div className="relative pt-28 pb-12 px-4">
                <div className="absolute inset-0 z-0 bg-gradient-radial from-indigo-900/10 to-transparent" />
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-4 py-2 mb-6">
                        <Shield className="w-4 h-4 text-neon-cyan" />
                        <span className="text-xs font-mono text-gray-300 uppercase tracking-wider">Legal Framework</span>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">
                        {t('terms.title')}
                    </h1>
                    <p className="text-gray-400 text-sm">
                        {t('terms.lastUpdated')}
                    </p>
                    <div className="mt-6 flex flex-wrap justify-center gap-3">
                        {["Non-Custodial Software", "Not an ITF", "MIT License", "Open Source"].map(tag => (
                            <span key={tag} className="text-[10px] font-mono bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 px-3 py-1 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Critical Warning Banner */}
            <div className="max-w-4xl mx-auto px-4 mb-8">
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 flex gap-4">
                    <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-amber-300 font-bold text-sm mb-1">{t('terms.warning.title')}</p>
                        <p className="text-amber-200/70 text-xs leading-relaxed">
                            {t('terms.warning.body')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Sections */}
            <div className="max-w-4xl mx-auto px-4 pb-24 space-y-6">
                {sections.map((section) => {
                    const Icon = ICON_MAP[section.icon] || FileText;
                    return (
                        <div
                            key={section.id}
                            id={section.id}
                            className="bg-white/3 border border-white/8 rounded-2xl p-6 md:p-8 hover:border-white/15 transition-colors"
                        >
                            <div className="flex items-start gap-4 mb-5">
                                <div className="w-10 h-10 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center shrink-0">
                                    <Icon className="w-5 h-5 text-neon-cyan" />
                                </div>
                                <h2 className="text-lg font-bold text-white leading-tight pt-1.5">{section.title}</h2>
                            </div>
                            <div className="text-gray-400 text-sm leading-relaxed whitespace-pre-line font-mono">
                                {section.content}
                            </div>
                        </div>
                    );
                })}

                {/* Contact */}
                <div className="bg-neon-cyan/5 border border-neon-cyan/20 rounded-2xl p-6 text-center">
                    <p className="text-gray-400 text-sm mb-2">Questions about these terms?</p>
                    <a
                        href="https://t.me/Vaiosx"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-neon-cyan font-mono text-sm hover:underline"
                    >
                        Contact via Telegram: @Vaiosx
                    </a>
                </div>

                {/* Navigation */}
                <div className="flex flex-wrap gap-3 justify-center pt-4">
                    <Link href="/risk-disclosure" className="text-xs font-mono text-gray-400 hover:text-neon-cyan transition-colors border border-white/10 px-4 py-2 rounded-lg hover:border-neon-cyan/30">
                        → {t('footer.links.risk')}
                    </Link>
                    <Link href="/docs" className="text-xs font-mono text-gray-400 hover:text-neon-cyan transition-colors border border-white/10 px-4 py-2 rounded-lg hover:border-neon-cyan/30">
                        → {t('footer.links.docs')}
                    </Link>
                    <Link href="/dashboard" className="text-xs font-mono text-gray-400 hover:text-neon-cyan transition-colors border border-white/10 px-4 py-2 rounded-lg hover:border-neon-cyan/30">
                        → {t('footer.links.dashboard')}
                    </Link>
                </div>
            </div>
        </>
    );
}
