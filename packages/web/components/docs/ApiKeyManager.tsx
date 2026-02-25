"use client";

import { useState } from 'react';
import { useCurrentAccount, useSignPersonalMessage } from '@mysten/dapp-kit';
import { Key, Lock, Copy, CheckCircle, RefreshCw, AlertTriangle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { API_URL } from '@/lib/constants';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface ApiKeyData {
    apiKey: string;
    keyInfo: {
        name: string;
        permissions: string[];
        createdAt: string;
    };
}

export default function ApiKeyManager() {
    const account = useCurrentAccount();
    const { mutateAsync: signPersonalMessage } = useSignPersonalMessage();

    const [isLoading, setIsLoading] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<ApiKeyData | null>(null);
    const [hasCopied, setHasCopied] = useState(false);

    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const { t } = useLanguage();

    const handleGenerateKey = async () => {
        setErrorMsg(null);
        console.log("Generating key initiated...");

        if (!account) {
            const msg = t('agents.apiKeyManager.toasts.connectFirst');
            toast.error(msg);
            setErrorMsg(msg);
            return;
        }

        setIsLoading(true);
        try {
            console.log("1. Requesting signature...");
            // 1. Sign Message to Authenticate
            const message = new TextEncoder().encode(`Login to SuiLoop Agent API\nTimestamp: ${Date.now()}`);
            const { signature } = await signPersonalMessage({
                message,
            });
            console.log("Signature obtained:", signature);

            // 2. Get JWT Token
            console.log(`2. Fetching JWT token from ${API_URL}/api/auth/token...`);
            const tokenRes = await fetch(`${API_URL}/api/auth/token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    walletAddress: account.address,
                    signature: signature
                })
            }).catch(err => {
                throw new Error(`Connection to Agent API failed: ${err.message}. Is the server running at ${API_URL}?`);
            });

            if (!tokenRes.ok) {
                const text = await tokenRes.text();
                throw new Error(`API Error (${tokenRes.status}): ${text}`);
            }

            const tokenData = await tokenRes.json();
            if (!tokenData.success) throw new Error(tokenData.error || 'Failed to authenticate');

            const jwt = tokenData.token;
            console.log("JWT obtained.");

            // 3. Generate API Key
            console.log("3. Requesting API Key...");
            const keyRes = await fetch(`${API_URL}/api/auth/keys`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jwt}`
                },
                body: JSON.stringify({
                    name: `${t('agents.apiKeyManager.defaultKeyName')} - ${new Date().toLocaleDateString()}`,
                    permissions: ['execute', 'subscribe']
                })
            });

            const keyData = await keyRes.json();
            if (!keyData.success) throw new Error(keyData.error || 'Failed to generate key');

            setGeneratedKey(keyData);
            toast.success(t('agents.apiKeyManager.toasts.success'));

        } catch (error: any) {
            console.error("Key Generation Error:", error);
            const msg = error.message || t('agents.apiKeyManager.toasts.failed');
            setErrorMsg(msg);
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };


    const copyToClipboard = () => {
        if (generatedKey) {
            navigator.clipboard.writeText(generatedKey.apiKey);
            setHasCopied(true);
            toast.success(t('agents.apiKeyManager.toasts.copied'));
            setTimeout(() => setHasCopied(false), 2000);
        }
    };

    return (
        <div className="bg-[#0A0A0A] border border-white/10 rounded-xl p-6 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="bg-neon-purple/20 p-2 rounded-lg">
                    <Key className="w-6 h-6 text-neon-purple" />
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white">{t('agents.apiKeyManager.title')}</h3>
                    <p className="text-sm text-gray-400">{t('agents.apiKeyManager.subtitle')}</p>
                </div>
            </div>

            {!account ? (
                <div className="flex flex-col items-center justify-center py-8 bg-white/5 rounded-lg border border-dashed border-white/20">
                    <Lock className="w-8 h-8 text-gray-500 mb-3" />
                    <p className="text-gray-300 font-medium">{t('agents.apiKeyManager.walletNotConnected')}</p>
                    <p className="text-sm text-gray-500 mb-4">{t('agents.apiKeyManager.connectToGenerate')}</p>
                    {/* Note: The user should use the main Navbar connect button */}
                    <div className="text-xs text-neon-cyan bg-neon-cyan/10 px-3 py-1 rounded-full">
                        {t('agents.apiKeyManager.useNavbarConnect')}
                    </div>
                </div>
            ) : !generatedKey ? (
                <div className="space-y-4">
                    <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
                        <Shield className="w-5 h-5 text-blue-400 mt-0.5" />
                        <div className="text-sm text-blue-200">
                            <strong>{t('agents.apiKeyManager.securityNote')}:</strong> {t('agents.apiKeyManager.securityDesc')}
                        </div>
                    </div>

                    {errorMsg && (
                        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <div className="text-sm text-red-200">
                                <strong>{t('agents.apiKeyManager.errorLabel')}:</strong> {errorMsg}
                            </div>
                        </div>
                    )}

                    <button
                        onClick={handleGenerateKey}
                        disabled={isLoading}
                        className="w-full py-3 bg-gradient-to-r from-neon-purple to-neon-cyan text-black font-bold rounded-lg hover:opacity-90 transition-all flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <RefreshCw className="w-5 h-5 animate-spin" />
                                {t('agents.apiKeyManager.btnGenerating')}
                            </>
                        ) : (
                            <>
                                <Key className="w-5 h-5" />
                                {t('agents.apiKeyManager.btnGenerate')}
                            </>
                        )}
                    </button>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 text-green-400">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-bold">{t('agents.apiKeyManager.successLabel')}</span>
                    </div>

                    <div className="relative">
                        <div className="text-xs text-gray-500 mb-1 ml-1 uppercase font-bold tracking-wider">{t('agents.apiKeyManager.secretKeyLabel')}</div>
                        <div className="flex items-center gap-2 bg-black border border-neon-cyan/50 rounded-lg p-1 pr-2">
                            <div className="flex-1 bg-transparent font-mono text-neon-cyan px-3 py-2 text-lg truncate">
                                {generatedKey.apiKey}
                            </div>
                            <button
                                onClick={copyToClipboard}
                                className="p-2 hover:bg-white/10 rounded-md transition-colors text-gray-400 hover:text-white"
                                title="Copy to clipboard"
                            >
                                {hasCopied ? <CheckCircle className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
                            </button>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-amber-500">
                            <AlertTriangle className="w-3 h-3" />
                            <strong>{t('agents.apiKeyManager.warningLabel')}:</strong> {t('agents.apiKeyManager.warningDesc')}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="bg-white/5 p-3 rounded-lg">
                            <span className="text-gray-500 block text-xs">{t('agents.apiKeyManager.scopeLabel')}</span>
                            <span className="text-white font-mono">execute, subscribe</span>
                        </div>
                        <div className="bg-white/5 p-3 rounded-lg">
                            <span className="text-gray-500 block text-xs">{t('agents.apiKeyManager.limitLabel')}</span>
                            <span className="text-white font-mono">60 req/min</span>
                        </div>
                    </div>

                    <button
                        onClick={() => setGeneratedKey(null)}
                        className="text-sm text-gray-500 hover:text-white underline w-full text-center"
                    >
                        {t('agents.apiKeyManager.btnClose')}
                    </button>
                </div>
            )}
        </div>
    );
}
