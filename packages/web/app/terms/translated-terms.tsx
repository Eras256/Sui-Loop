'use client';

import Link from "next/link";
import { Shield, AlertTriangle, FileText, Globe, Lock, Code } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const sections = [
    {
        id: "nature",
        icon: Code,
        title: "1. Nature of the Service — Software Tool Only",
        content: `SuiLoop ("the Protocol," "the Software," "the Platform") is an open-source software infrastructure project. It provides users with tools to interact autonomously with public blockchain networks (specifically the Sui Network).

SuiLoop is NOT and does NOT operate as:
• A financial institution, bank, broker-dealer, or investment adviser.
• An Institution of Financial Technology (ITF) under Mexico's Ley para Regular las Instituciones de Tecnología Financiera (LRITF, 2018, as amended through November 14, 2025).
• An Institution of Collective Financing (IFC / crowdfunding platform).
• An Institution of Electronic Payment Funds (IFPE / digital wallet).
• An exchange, custodian, or intermediary of virtual assets under any applicable law.
• A regulated financial product or service provider in any jurisdiction.

The Protocol provides software interfaces that allow users to create and manage their own on-chain Vault objects on the Sui blockchain. No funds are held, managed, or controlled by SuiLoop or its operators at any time.`
    },
    {
        id: "non-custodial",
        icon: Lock,
        title: "2. Non-Custodial Architecture — No Custody of Funds or Keys",
        content: `SuiLoop is architecturally non-custodial by design:

• Private Keys: SuiLoop does not request, store, transmit, or have access to users' private keys or seed phrases at any point.
• Funds: User funds are held exclusively in smart contract Vault objects on the Sui blockchain. These Vaults are owned and controlled solely by the user's wallet address (OwnerCap). SuiLoop operators cannot access, withdraw, freeze, or otherwise control these funds.
• Agent Capabilities (AgentCap): Delegation of trading execution via AgentCap is limited exclusively to executing pre-defined, whitelisted smart contract functions. No AgentCap grants withdrawal rights, transfer rights, or custodial access to user funds. This is enforced at the smart contract level by immutable Move bytecode.
• Hot Potato Pattern: All flash loan operations are atomic. If a strategy does not complete profitably within a single Programmable Transaction Block (PTB), the entire transaction reverts automatically. No debt is created, no funds are lost.

Users remain sole custodians of their assets at all times.`
    },
    {
        id: "risk",
        icon: AlertTriangle,
        title: "3. Risk Disclosure — High Risk DeFi Activity",
        content: `IMPORTANT: Interacting with decentralized finance (DeFi) protocols involves significant financial risks. By using SuiLoop, you acknowledge and accept the following risks:

• Smart Contract Risk: Despite formal verification via the Move Prover, smart contracts may contain unforeseen bugs or vulnerabilities. Code audits do not guarantee the absence of all risks.
• Market Risk: Flash loan strategies depend on market conditions (price spreads, liquidity depth). Unprofitable market conditions will cause strategy transactions to revert. Gas fees are consumed regardless.
• Gas Fee Risk: Every on-chain transaction consumes gas fees in SUI. Failed transactions may still consume gas.
• Oracle Risk: Price data from Pyth Network and other oracles may be stale, manipulated, or incorrect.
• Protocol Risk: Third-party DeFi protocols (Scallop, Cetus, Navi, DeepBook) used by SuiLoop strategies may be paused, exploited, or may change their interfaces without notice.
• Regulatory Risk: The regulatory landscape for DeFi is evolving globally. Users are solely responsible for ensuring their use of the Protocol complies with applicable laws in their jurisdiction.
• No Guarantees: SuiLoop makes no guarantee of profitability, availability, or fitness for a particular purpose.

PAST PERFORMANCE OF SIMULATED OR HISTORICAL STRATEGIES IS NOT INDICATIVE OF FUTURE RESULTS.`
    },
    {
        id: "legal",
        icon: Globe,
        title: "4. Regulatory Compliance & Jurisdictional Restrictions",
        content: `Mexico (Specific Disclosure): SuiLoop operates as a software tool provider. It does not perform activities regulated under the Ley Fintech (LRITF), Ley del Mercado de Valores, or Ley de Instituciones de Crédito. Users are responsible for independently assessing their obligations under the Ley Federal para la Prevención e Identificación de Operaciones con Recursos de Procedencia Ilícita (LFPIORPI), including any reporting obligations to the SAT or UIF if their use of the Protocol constitutes an "actividad vulnerable" under Article 17, Section XVI.

Restricted Persons: The Protocol is not available to persons or entities subject to sanctions by OFAC, the UN Security Council, or other applicable sanctions authorities. Users residing in jurisdictions where use of DeFi software is prohibited are not permitted to use the Protocol.

No Financial Advice: Nothing contained in the SuiLoop Protocol, its documentation, or communications from its operators constitutes financial, investment, tax, or legal advice. Users should consult qualified professionals before making financial decisions.

KYC/AML: SuiLoop does not perform Know Your Customer (KYC) or Anti-Money Laundering (AML) checks, as it operates as a non-custodial software layer that does not hold or transmit user funds. Users are responsible for their own compliance with applicable AML/KYC obligations.`
    },
    {
        id: "ip",
        icon: FileText,
        title: "5. Intellectual Property & Open Source License",
        content: `The SuiLoop Protocol software is released under the MIT License. The source code is publicly available at https://github.com/Eras256/Sui-Loop.

Under the MIT License, you are free to:
• Use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software.
• The above rights are granted provided the MIT License copyright notice is included in all copies or substantial portions of the software.

THE SOFTWARE IS PROVIDED "AS IS," WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.`
    },
    {
        id: "liability",
        icon: Shield,
        title: "6. Limitation of Liability",
        content: `To the maximum extent permitted by applicable law, SuiLoop, its operators, contributors, and affiliates shall not be liable for:

• Any loss of funds resulting from smart contract exploits, market conditions, user error, or third-party protocol failures.
• Any indirect, incidental, special, consequential, or punitive damages.
• Loss of profits, revenue, data, goodwill, or other intangible losses.
• Any damage resulting from unauthorized access to or alteration of your transactions or data.

SuiLoop's total cumulative liability to any user for any claims arising from use of the Protocol shall not exceed the deployment fees paid by that user in the thirty (30) days immediately preceding the event giving rise to such liability.

Users agree to indemnify, defend, and hold harmless SuiLoop and its operators from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from their use of the Protocol, violation of these Terms, or violation of any rights of another party.`
    }
];

export function TranslatedTerms() {
    const { t } = useLanguage();

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
                    const Icon = section.icon;
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
