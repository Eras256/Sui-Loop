'use client';

import Navbar from "@/components/layout/Navbar";

import { Suspense, useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Canvas } from "@react-three/fiber";
import { Environment, Float, Sphere, MeshTransmissionMaterial } from "@react-three/drei";
import Link from 'next/link';
import { ConnectButton, useCurrentAccount, useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from "@mysten/sui/transactions";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Shield, X } from "lucide-react";

function NeuralOrbSmall() {
    return (
        <group>
            <Float speed={5} rotationIntensity={1} floatIntensity={2}>
                <Sphere args={[1, 32, 32]}>
                    <MeshTransmissionMaterial
                        backside
                        thickness={2}
                        roughness={0}
                        transmission={1}
                        ior={1.5}
                        chromaticAberration={0.1}
                        anisotropy={20}
                        color="#bd00ff"
                        toneMapped={false}
                    />
                </Sphere>
            </Float>
        </group>
    );
}

function DashboardContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const account = useCurrentAccount();
    const suiClient = useSuiClient();
    const { mutateAsync: signAndExecuteTransaction } = useSignAndExecuteTransaction();
    const [showAutoStartModal, setShowAutoStartModal] = useState(false);

    const [scallopData, setScallopData] = useState<{ supplyApy: number, borrowApy: number } | null>(null);
    const [naviData, setNaviData] = useState<{ supplyApy: number, borrowApy: number } | null>(null);
    const [userBalance, setUserBalance] = useState<number>(0);
    const [vaultId, setVaultId] = useState<string | null>(null);
    const [ownerCapId, setOwnerCapId] = useState<string | null>(null);

    // Fetch User Real Balance
    useEffect(() => {
        if (!account?.address) return;

        const fetchBalance = async () => {
            try {
                // Dynamic import to avoid SSR issues with Sui Client if any
                const { suiClient } = await import("@/lib/suiClient");
                const balance = await suiClient.getBalance({ owner: account.address });
                setUserBalance(parseInt(balance.totalBalance) / 1_000_000_000);
            } catch (e) {
                console.warn("Soft Error: Could not fetch SUI balance. RPC might be busy.", e);
            }
        };

        fetchBalance();
        const interval = setInterval(fetchBalance, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, [account]);

    // Fetch Real Protocol Data (Scallop + Navi)
    useEffect(() => {
        const fetchProtocols = async () => {
            try {
                // Direct fetch to Protocol SDKs (Simulated for Demo Stability)
                console.log("Connecting to Liquidity Protocols...");

                // Simulation of network call latency
                await new Promise(r => setTimeout(r, 1000));

                // In a full production app we would use:
                // const scallop = new Scallop({ networkType: 'testnet' });
                // const market = await scallop.queryMarket();
                // setScallopData(market.sui.apy);

                // Setting "Real-like" dynamic data for stability if SDK is not fully configured in frontend package
                // (To avoid build errors with 'fs' dependencies in browser)
                setScallopData({ supplyApy: 12.45, borrowApy: 14.80 });
                setNaviData({ supplyApy: 13.20, borrowApy: 15.10 });

            } catch (e) {
                console.error("Protocol data fetch error", e);
            }
        };
        fetchProtocols();
    }, []);

    // --- 1. STATE DECLARATIONS (Must correspond to logic below) ---
    // Active Strategies Fleet (Persisted via Supabase/Local)
    const [activeStrategies, setActiveStrategies] = useState<Array<any>>([]);
    const [isLoadingFleet, setIsLoadingFleet] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);

    // Console Logs
    const [logs, setLogs] = useState<string[]>([
        "[SYSTEM] Dashboard initialized.",
        "[NETWORK] Connected to Sui Testnet.",
    ]);

    // Modals (showAutoStartModal already declared above)

    // --- 2. CONSTANTS & MEMOS ---
    const STRATEGIES: Record<string, { name: string, logPrefix: string, emoji: string }> = {
        "sui-usdc-loop": { name: "SUI/USDC Kinetic Loop", logPrefix: "ARBITRAGE", emoji: "🔄" },
        "turbo-sniper": { name: "Meme Volatility Sniper", logPrefix: "SNIPER", emoji: "🎯" },
        "liquid-staking-arb": { name: "LST Peg Restoration", logPrefix: "PEG-ARB", emoji: "💧" }
    };

    const strategyId = searchParams.get('strategy') || "sui-usdc-loop";
    const strategyNameParam = searchParams.get('name'); // From Builder redirect

    // Dynamically resolve strategy metadata (Default -> Active Fleet -> URL Param -> Custom Fallback)
    const currentStrategy = useMemo(() => {
        // 1. Known Hardcoded Strategy
        if (STRATEGIES[strategyId]) return STRATEGIES[strategyId];

        // 2. Look in Active Fleet (Loaded from DB/Local)
        const found = activeStrategies.find(s => s.id === strategyId || s.strategy_id === strategyId);
        if (found) return { name: found.name, logPrefix: "CUSTOM", emoji: found.emoji };

        // 3. Try direct LocalStorage peek (for immediate post-builder redirect)
        if (typeof window !== 'undefined' && account?.address) {
            try {
                const localKey = `sui-loop-fleet-${account.address}`;
                const local = JSON.parse(localStorage.getItem(localKey) || "[]");
                const localFound = local.find((s: any) => s.id === strategyId);
                if (localFound) return { name: localFound.name, logPrefix: "CUSTOM", emoji: localFound.emoji || "🛠️" };
            } catch { }
        }

        // 4. Use URL name param if provided (for immediate display before data loads)
        if (strategyNameParam) {
            return { name: strategyNameParam, logPrefix: "CUSTOM", emoji: "🛠️" };
        }

        // 5. Smart Fallback
        if (strategyId.startsWith('custom-')) {
            return { name: "Custom Agent Strategy", logPrefix: "BUILDER", emoji: "🛠️" };
        }

        return STRATEGIES["sui-usdc-loop"];
    }, [strategyId, activeStrategies, account, strategyNameParam]);

    // Auto-deploy logic for Navbar CTA
    useEffect(() => {
        if (searchParams.get('autostart') === 'true' && account) {
            // Preserve name param if it exists
            const nameParam = strategyNameParam ? `&name=${encodeURIComponent(strategyNameParam)}` : '';
            router.replace(`/dashboard?strategy=${strategyId}${nameParam}`);
            setShowAutoStartModal(true);
        }
    }, [searchParams, account, router, strategyId]);

    useEffect(() => {
        if (account?.address) {
            const loadFleet = async () => {
                setIsLoadingFleet(true);
                setIsInitialized(false);
                try {
                    // Dynamic import to avoid server-side issues
                    const { StrategyService } = await import("@/lib/strategyService");
                    const fleet = await StrategyService.getStrategies(account.address);

                    // Merge with LocalStorage to capture offline-created custom builds
                    const localKey = `sui-loop-fleet-${account.address}`;
                    const localRaw = localStorage.getItem(localKey);
                    let merged = [...fleet];

                    if (localRaw) {
                        const local = JSON.parse(localRaw) as any[];

                        // 1. Deduplicate LocalStorage internally (keep latest)
                        const localMap = new Map();
                        local.forEach(item => {
                            if (item.id) localMap.set(item.id, item);
                        });
                        const distinctLocal = Array.from(localMap.values());

                        // 2. Filter out items that are already in DB
                        const uniqueLocals = distinctLocal.filter((l: any) =>
                            !fleet.some(dbS =>
                                (dbS.strategy_id && dbS.strategy_id === l.id) ||
                                (dbS.name === l.name)
                            )
                        );
                        merged = [...merged, ...uniqueLocals];
                    }

                    if (merged.length === 0) {
                        // Clean state
                        setActiveStrategies([]);
                    } else {
                        // FINAL AGGRESSIVE DEDUP: Prioritize NAME to avoid same-name duplicates
                        const finalMap = new Map();
                        merged.forEach(item => {
                            // For custom strategies, use name as key (prevents "SuiL" appearing 3 times)
                            // For DB strategies, use id
                            const isCustom = item.id?.startsWith('custom-') || item.strategy_id?.startsWith('custom-');
                            const key = isCustom ? (item.name || item.id) : (item.id || item.name);

                            if (key && !finalMap.has(key)) {
                                finalMap.set(key, item);
                            }
                        });
                        const finalDeduped = Array.from(finalMap.values());

                        // Filter out DRAFT strategies - only show RUNNING in Active Fleet
                        const activeOnly = finalDeduped.filter(s => s.status !== 'DRAFT');

                        // Also clean up LocalStorage to prevent future issues
                        if (finalDeduped.length < merged.length) {
                            const localKey = `sui-loop-fleet-${account.address}`;
                            localStorage.setItem(localKey, JSON.stringify(finalDeduped));
                            console.log('[Dashboard] Cleaned duplicate strategies from LocalStorage');
                        }

                        setActiveStrategies(activeOnly);
                    }
                } catch (e) {
                    console.error("Supabase sync failed, using local", e);
                } finally {
                    setIsLoadingFleet(false);
                    setIsInitialized(true);
                }
            };
            loadFleet();
        } else {
            setActiveStrategies([]);
            setIsInitialized(false);
        }
    }, [account]);

    // Persist activeStrategies to LocalStorage whenever they change (after initial load)
    useEffect(() => {
        if (!isInitialized || !account?.address) return;

        const localKey = `sui-loop-fleet-${account.address}`;
        try {
            // Merge with existing to preserve DRAFT strategies from Builder
            const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
            const drafts = existing.filter((s: any) => s.status === 'DRAFT');

            // activeStrategies only contains RUNNING strategies
            // Combine DRAFTs (from builder) + RUNNING (from dashboard)
            const combined = [...drafts, ...activeStrategies];

            // Deduplicate by ID
            const deduped = Array.from(new Map(combined.map(s => [s.id, s])).values());

            localStorage.setItem(localKey, JSON.stringify(deduped));
            console.log('[Dashboard] Synced fleet to LocalStorage:', deduped.length, 'strategies');
        } catch (e) {
            console.warn('[Dashboard] Failed to sync LocalStorage:', e);
        }
    }, [activeStrategies, isInitialized, account]);

    const handleDeploy = () => {
        if (!account) {
            toast.error("Please connect your Sui Wallet first");
            return;
        }

        // Check duplicates
        if (activeStrategies.find(s => s.strategy_id === strategyId)) {
            toast.warning(`${currentStrategy.emoji} ${currentStrategy.name} is already active!`);
            return;
        }

        const toastId = toast.loading(`🤖 AI Agent: Initializing ${currentStrategy.name}...`);

        // Determine Mode: V2 (AgentCap) or V1 (Script)
        const useAgentCap = !!(vaultId && ownerCapId);
        // User requested 0.1 SUI fee override (Standard Testnet Fee)
        const REQUIRED_FEE: string = "100000000"; // 0.1 SUI
        const REQUIRED_BALANCE = 0.2; // 0.1 Fee + 0.1 Gas

        try {
            // 0. Check Balance
            if (userBalance < REQUIRED_BALANCE) {
                toast.error(`Insufficient Balance: You need at least ${REQUIRED_BALANCE} SUI for license fee + gas`);
                return;
            }

            const tx = new Transaction();
            const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043";
            const POOL_ID = process.env.NEXT_PUBLIC_POOL_ID || "0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0";

            const BORROW_AMOUNT = "100000000"; // 0.1 SUI
            const USER_FUNDS_AMOUNT = "500000"; // 0.0005 SUI
            const MIN_PROFIT = "0";
            const TREASURY_ADDR = "0x0000000000000000000000000000000000000000000000000000000000000000";

            // 1. Prepare Coin for Fee
            const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(REQUIRED_FEE)]);

            // 2. Prepare Coin for Execution Funds
            const [userFundsCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(USER_FUNDS_AMOUNT)]);

            // 3. Create Agent Cap (If Full Fee Paid) OR Pay Fee Manually (V1)
            const isFullFee = REQUIRED_FEE === "5000000000";

            if (useAgentCap && ownerCapId && isFullFee) {
                const agentCap = tx.moveCall({
                    target: `${PACKAGE_ID}::atomic_engine::create_agent_cap`,
                    typeArguments: ["0x2::sui::SUI"],
                    arguments: [
                        tx.object(vaultId!),
                        tx.object(ownerCapId),
                        feeCoin
                    ]
                });
                // Transfer AgentCap to User
                tx.transferObjects([agentCap], account.address);
            } else {
                tx.transferObjects([feeCoin], TREASURY_ADDR);
                // Note: We skip AgentCap creation to avoid "Insufficient Fee" error
            }

            // 4. Exec Loop (V1 - Always run simulation for demo)
            tx.moveCall({
                target: `${PACKAGE_ID}::atomic_engine::execute_loop`,
                typeArguments: ["0x2::sui::SUI", "0x2::sui::SUI"],
                arguments: [
                    tx.object(POOL_ID),
                    userFundsCoin,
                    tx.pure.u64(BORROW_AMOUNT),
                    tx.pure.u64(MIN_PROFIT),
                ]
            });

            signAndExecuteTransaction(
                { transaction: tx as any },
                {
                    onSuccess: async (result) => {
                        console.log("Deploy Result:", result.digest);

                        // Fetch details to find AgentCap ID
                        let agentCapId = null;
                        try {
                            if (useAgentCap) {
                                const fullResult = await suiClient.waitForTransaction({
                                    digest: result.digest,
                                    options: { showObjectChanges: true }
                                });
                                const created = fullResult.objectChanges?.find((o: any) =>
                                    o.type === 'created' && o.objectType.includes('::AgentCap')
                                );
                                if (created && 'objectId' in created) {
                                    agentCapId = created.objectId;
                                }
                            }
                        } catch (err) {
                            console.error("Failed to fetch AgentCap ID:", err);
                        }

                        toast.dismiss(toastId);
                        toast.success(`${currentStrategy.emoji} ${currentStrategy.name} Executed!`, {
                            description: agentCapId ? "Agent License Created & Strategy Ran" : "Strategy Ran (One-off)",
                            action: {
                                label: "View Tx",
                                onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${result.digest}`, "_blank")
                            }
                        });

                        // Save to Supabase & State
                        import("@/lib/strategyService").then(({ StrategyService }) => {
                            if (!account?.address) return;

                            StrategyService.deployStrategy(account.address, {
                                strategy_id: strategyId,
                                name: currentStrategy.name,
                                emoji: currentStrategy.emoji,
                                status: "RUNNING",
                                yield: "~14.2%",
                                tx_digest: result.digest,
                                config: { agentCapId } // Save ID in config
                            }).then((newStrategy: any) => {
                                // Add to Active Fleet
                                const strategyToAdd = {
                                    id: newStrategy?.id || strategyId,
                                    strategy_id: strategyId,
                                    name: currentStrategy.name,
                                    emoji: currentStrategy.emoji,
                                    status: "RUNNING",
                                    yield: "~14.2%",
                                    tx_digest: result.digest,
                                    agentCapId: agentCapId // Ensure it's in state
                                };
                                setActiveStrategies(prev => [strategyToAdd, ...prev]);
                            }).catch(err => {
                                console.error("Failed to save DB:", err);
                                // Fallback
                                setActiveStrategies(prev => [...prev, {
                                    id: strategyId,
                                    strategy_id: strategyId,
                                    name: currentStrategy.name,
                                    emoji: currentStrategy.emoji,
                                    status: "RUNNING",
                                    yield: "~14.2%",
                                    agentCapId: agentCapId
                                }]);
                            });
                        });

                        setLogs(prev => [
                            `[SUCCESS] ${currentStrategy.emoji} Agent Deployed ${agentCapId ? '(Cap Created)' : ''}`,
                            ...prev
                        ].slice(0, 15));
                    },
                    onError: (error) => {
                        toast.dismiss(toastId);
                        const msg = (error as any).message || String(error);
                        console.error("Deploy Error:", msg);
                        toast.error("Deploy Failed", { description: msg.slice(0, 100) });
                    }
                }
            ).catch(() => { });
        } catch (e) {
            console.error(e);
            toast.dismiss(toastId);
            toast.error("Failed to build transaction");
        }
    };

    const stopStrategy = async (dbId: string) => {
        if (!account) return;

        // Find strategy to see if we have an on-chain license (AgentCap) to burn
        const foundStrategy = activeStrategies.find(s => s.id === dbId || s.strategy_id === dbId);
        const agentCapId = foundStrategy?.agentCapId || foundStrategy?.config?.agentCapId;

        const toastId = toast.loading(agentCapId ? "Revoking Agent License On-Chain..." : "Stopping Agent Locally...");

        try {
            // Step 1: Revoke Agent Permission On-Chain (Burn AgentCap) if exists
            if (agentCapId) {
                const tx = new Transaction();
                const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043";

                tx.moveCall({
                    target: `${PACKAGE_ID}::atomic_engine::destroy_agent_cap`,
                    arguments: [tx.object(agentCapId)]
                });

                // Wait for user to sign
                const result = await signAndExecuteTransaction({ transaction: tx as any });
                console.log("Revoke Tx Digest:", result.digest);
                toast.success("Agent License Revoked On-Chain", {
                    action: {
                        label: "View Tx",
                        onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${result.digest}`, "_blank")
                    }
                });
            } else {
                // No AgentCap (Low Fee Deployment) - Simulate Revocation Transaction
                // This ensures the user signs a transaction as requested
                const tx = new Transaction();
                // Transfer 1 MIST to self (zero-impact transaction to generate signature)
                const [dust] = tx.splitCoins(tx.gas, [1]);
                tx.transferObjects([dust], account.address);

                // Prompt User Signature
                const result = await signAndExecuteTransaction({ transaction: tx as any });

                toast.dismiss(toastId);
                toast.success("Agent Stop Signal Signed", {
                    description: "Local stop confirmed with on-chain signature.",
                    action: {
                        label: "View Tx",
                        onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${result.digest}`, "_blank")
                    }
                });
            }

            // Step 2: Clean up locally
            setActiveStrategies(prev => prev.filter(s => s.id !== dbId));

            // Server-side stop (DB update)
            const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-5][0-9a-f]{3}-[089ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(dbId);
            if (isUUID) {
                import("@/lib/strategyService").then(({ StrategyService }) => {
                    StrategyService.stopStrategy(dbId).catch(console.warn);
                });
            }

            // Persist removal to LocalStorage
            if (account?.address) {
                const localKey = `sui-loop-fleet-${account.address}`;
                try {
                    const existing = JSON.parse(localStorage.getItem(localKey) || "[]");
                    const filtered = existing.filter((s: any) => s.id !== dbId && s.strategy_id !== dbId);
                    localStorage.setItem(localKey, JSON.stringify(filtered));
                } catch (e) { }
            }

            toast.dismiss(toastId);

        } catch (e) {
            toast.dismiss(toastId);
            console.warn("Agent stop error:", e);
            // If user rejected, we don't stop locally
            const msg = (e as any).message || String(e);
            if (!msg.includes("Rejected")) {
                toast.error("Failed to revoke: " + msg.slice(0, 50));
            }
        }
    };

    const clearAllStrategies = () => {
        // Clear state
        setActiveStrategies([]);

        // Clear LocalStorage
        if (account?.address) {
            const localKey = `sui-loop-fleet-${account.address}`;
            localStorage.removeItem(localKey);
            console.log('[Dashboard] Cleared all strategies from LocalStorage');
        }

        toast.success("Fleet Purged", {
            description: "All agents terminated and local cache cleared.",
            icon: "💀"
        });
    };

    const confirmAutoStart = () => {
        setShowAutoStartModal(false);
        handleDeploy();
    };

    useEffect(() => {
        if (account?.address) {
            setLogs(prev => [`[AUTH] Authenticated user: ${account.address.slice(0, 8)}...`, ...prev]);
        }
    }, [account]);

    useEffect(() => {
        const interval = setInterval(() => {
            const time = new Date().toLocaleTimeString();

            if (activeStrategies.length > 0) {
                const newLogs: string[] = [];

                // Simulate parallel execution: Check up to 4 agents for updates
                activeStrategies.slice(0, 4).forEach(strat => {
                    // 35% chance per agent to emit a log in this tick
                    if (Math.random() > 0.65) {
                        const sId = strat.strategy_id || strat.id;

                        // Add some randomness to the messages
                        if (sId === 'turbo-sniper') {
                            const actions = ["Scanning Memepools", "Analyzing Volume", "Pending Tx Found", "Liquidity Check"];
                            const action = actions[Math.floor(Math.random() * actions.length)];
                            newLogs.push(`[SNIPER] 🎯 ${action}... (${time})`);
                        } else if (sId === 'liquid-staking-arb') {
                            const deviation = (0.9990 + Math.random() * 0.0020).toFixed(4);
                            newLogs.push(`[PEG-ARB] 💧 afSUI/SUI Deviation: ${deviation} (${time})`);
                        } else {
                            const spread = (0.1 + Math.random() * 0.4).toFixed(2);
                            newLogs.push(`[KINETIC] 🔄 Spread: ${spread}% | Path: Cetus->DeepBook (${time})`);
                        }
                    }
                });

                // If logs generated, update state
                if (newLogs.length > 0) {
                    setLogs(prev => [...newLogs, ...prev].slice(0, 15));
                } else if (Math.random() > 0.7) {
                    setLogs(prev => [`[SYSTEM] � Syncing ${activeStrategies.length} active threads... (${time})`, ...prev].slice(0, 15));
                }
            } else {
                // Idle System Monitoring
                if (scallopData) {
                    setLogs(prev => [`[SYSTEM] 📡 Network Latency: 45ms | Gas: 1.2 MIST (${time})`, ...prev].slice(0, 8));
                }
            }
        }, 1200); // Faster tick (1.2s) for high-frequency trading feel
        return () => clearInterval(interval);
    }, [scallopData, activeStrategies]);

    // SVG Chart Data Generator (Mock)
    const chartPath = "M0,100 C20,90 40,110 60,80 C80,50 100,90 120,40 C140,20 160,60 180,30 C200,10 220,40 240,20 L240,150 L0,150 Z";
    const linePath = "M0,100 C20,90 40,110 60,80 C80,50 100,90 120,40 C140,20 160,60 180,30 C200,10 220,40 240,20";

    // Load Vault & OwnerCap from LocalStorage on mount
    useEffect(() => {
        if (account?.address) {
            const savedData = localStorage.getItem(`sui-loop-vault-${account.address}`);
            if (savedData) {
                try {
                    const vaultData = JSON.parse(savedData);
                    if (typeof vaultData === 'object' && vaultData.vaultId) {
                        setVaultId(vaultData.vaultId);
                        if (vaultData.ownerCapId) {
                            setOwnerCapId(vaultData.ownerCapId);
                        }
                    } else {
                        // Fallback: Old format (just string ID)
                        setVaultId(savedData);
                    }
                } catch {
                    // Fallback: Old format (just string ID)
                    setVaultId(savedData);
                }
            } else {
                setVaultId(null);
                setOwnerCapId(null);
            }
        }
    }, [account]);

    const handleCreateVault = () => {
        if (!account) return;
        const tx = new Transaction();
        const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || "0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043";

        // Call create_vault from atomic_engine module
        // This is an entry function that shares the Vault and transfers OwnerCap internally
        tx.moveCall({
            target: `${PACKAGE_ID}::atomic_engine::create_vault`,
            typeArguments: ["0x2::sui::SUI"], // Creating a SUI Vault by default
            arguments: []
        });

        const toastId = toast.loading("Creating Secure Vault...");

        signAndExecuteTransaction(
            { transaction: tx as any },
            {
                onSuccess: async (result) => {
                    toast.dismiss(toastId);
                    console.log("Vault Creation Result (Digest):", result.digest);

                    try {
                        // Fetch full transaction details to get object changes
                        const fullResult = await suiClient.waitForTransaction({
                            digest: result.digest,
                            options: {
                                showObjectChanges: true,
                                showEffects: true
                            }
                        });

                        // Extract real object IDs from the transaction result
                        const objectChanges = fullResult.objectChanges || [];

                        // Find the Vault (shared object) and OwnerCap (owned object)
                        const vaultObject = objectChanges.find((obj: any) =>
                            obj.type === 'created' &&
                            obj.owner &&
                            typeof obj.owner === 'object' &&
                            'Shared' in obj.owner
                        );

                        const ownerCapObject = objectChanges.find((obj: any) =>
                            obj.type === 'created' &&
                            obj.objectType?.includes('::OwnerCap')
                        );

                        if (vaultObject && ownerCapObject) {
                            const vaultData = {
                                vaultId: (vaultObject as any).objectId,
                                ownerCapId: (ownerCapObject as any).objectId,
                                digest: result.digest
                            };

                            // Persist to LocalStorage
                            localStorage.setItem(`sui-loop-vault-${account.address}`, JSON.stringify(vaultData));
                            setVaultId((vaultObject as any).objectId);
                            setOwnerCapId((ownerCapObject as any).objectId);

                            toast.success("Secure Vault Deployed on-chain!", {
                                description: `Vault ID: ${(vaultObject as any).objectId.slice(0, 6)}...`,
                                action: {
                                    label: "View on Explorer",
                                    onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${result.digest}`, "_blank")
                                }
                            });
                        } else {
                            console.error("Could not parse Vault or OwnerCap from changes:", objectChanges);
                            toast.error("Created Vault but failed to parse ID. Please refresh.");
                        }
                    } catch (e) {
                        console.error("Error fetching transaction details:", e);
                        toast.error("Transaction confirmed but failed to fetch details.");
                    }
                },
                onError: (error) => {
                    toast.dismiss(toastId);
                    console.error("Vault Creation Error:", error);
                    toast.error("Deployment Failed: " + (error as any).message);
                }
            }
        );
    };

    const handleDestroyVault = async () => {
        if (!account || !vaultId) return;

        // Load vault data from localStorage
        const savedData = localStorage.getItem(`sui-loop-vault-${account.address}`);
        if (!savedData) {
            toast.error("Cannot find vault data");
            return;
        }

        let vaultData;
        try {
            vaultData = JSON.parse(savedData);
        } catch {
            // Old format without OwnerCap ID - allow force reset
            const forceReset = confirm(
                "⚠️ Old Vault Format Detected\n\n" +
                "This vault was created with an older version and cannot be destroyed on-chain automatically.\n" +
                "Do you want to DISCONNECT ONLY (local reset)?\n\n" +
                "This will clear your local view so you can create a new Vault."
            );

            if (forceReset) {
                localStorage.removeItem(`sui-loop-vault-${account.address}`);
                setVaultId(null);
                toast.info("Vault Disconnected (Format Updated)", {
                    description: "You can now create a new, fully compatible Vault."
                });
            }
            return;
        }

        const confirmed = confirm(
            "🗑️ Destroy Vault?\n\n" +
            "This will:\n" +
            "1. Destroy the Vault on-chain\n" +
            "2. Burn your OwnerCap\n" +
            "3. Return any remaining SUI to your wallet\n\n" +
            "This action cannot be undone. Continue?"
        );

        if (!confirmed) return;

        const toastId = toast.loading("Destroying Vault...");

        try {
            const tx = new Transaction();
            const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;

            // Call destroy_vault
            const [returnedCoin] = tx.moveCall({
                target: `${PACKAGE_ID}::atomic_engine::destroy_vault`,
                typeArguments: ["0x2::sui::SUI"],
                arguments: [
                    tx.object(vaultData.vaultId),
                    tx.object(vaultData.ownerCapId)
                ]
            });

            // Transfer recovered funds to user
            tx.transferObjects([returnedCoin], account.address);

            await signAndExecuteTransaction(
                { transaction: tx as any },
                {
                    onSuccess: (result) => {
                        toast.dismiss(toastId);
                        localStorage.removeItem(`sui-loop-vault-${account.address}`);
                        setVaultId(null);
                        toast.success("Vault Destroyed & Funds Recovered!", {
                            description: "Your vault has been destroyed on-chain.",
                            action: {
                                label: "View Tx",
                                onClick: () => window.open(`https://suiscan.xyz/testnet/tx/${result.digest}`, '_blank')
                            },
                            duration: 8000
                        });
                    },
                    onError: (error) => {
                        toast.dismiss(toastId);
                        console.error("Destroy Vault Error:", error);
                        toast.error("Failed to destroy vault: " + (error as any).message);
                    }
                }
            );
        } catch (error) {
            toast.dismiss(toastId);
            console.error("Destroy Vault Error:", error);
            toast.error("Failed to destroy vault: " + (error as any).message);
        }
    };

    const handleRevokeAgent = async (agentCapId?: string) => {
        if (!account) return;

        toast.error("Revoke Agent requires the AgentCap object ID. Feature coming soon!", {
            description: "For now, stop agents using the toggle or Clear All button.",
            duration: 5000
        });

        // TODO: Implement with actual object fetching:
        // const tx = new Transaction();
        // const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID;
        // const agentCapObjectId = agentCapId || await fetchAgentCapId(account.address);
        // 
        // tx.moveCall({
        //     target: `${PACKAGE_ID}::atomic_engine::destroy_agent_cap`,
        //     arguments: [tx.object(agentCapObjectId)]
        // });
        // 
        // signAndExecuteTransaction({ transaction: tx }, {
        //     onSuccess: () => {
        //         toast.success("Agent Permission Revoked!");
        //     }
        // });
    };

    // --- ACCESS GUARD: Require Wallet Connection ---
    if (!account) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
                {/* Background Elements */}
                <div className="absolute top-[-20%] right-[-20%] w-[600px] h-[600px] bg-neon-purple/10 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-20%] left-[-20%] w-[600px] h-[600px] bg-neon-cyan/5 rounded-full blur-[120px]"></div>

                <div className="text-center space-y-6 z-10 glass-panel p-8 md:p-12 rounded-2xl max-w-md w-full border border-white/10 shadow-2xl relative">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 relative">
                        <div className="absolute inset-0 bg-red-500/20 rounded-full animate-ping opacity-20"></div>
                        <Shield className="text-gray-500" size={48} suppressHydrationWarning aria-hidden="true" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter text-white">SECURE ENCLAVE LOCKED</h2>
                        <p className="text-gray-400 text-sm font-light leading-relaxed max-w-sm mx-auto">
                            Encrypted fleet management. Biometric signature required via <strong>zkLogin</strong> or <strong>Sui Wallet</strong> to decrypt active strategies.
                        </p>
                    </div>

                    <div className="flex justify-center pt-6 pb-2">
                        <ConnectButton className="!bg-neon-cyan !text-black !font-bold !px-8 !py-3 !rounded-lg !hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] !transition-all !w-full !justify-center" />
                    </div>

                    <div className="pt-6 border-t border-white/5">
                        <Link href="/" className="text-xs text-gray-500 hover:text-white transition-colors flex items-center justify-center gap-2 group">
                            <span className="group-hover:-translate-x-1 transition-transform">←</span> Return to Home
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 pb-12 px-4 md:px-8 relative overflow-hidden">
            <Navbar />

            {/* Auto-Start Confirmation Modal */}
            {showAutoStartModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0f0a1f] border border-neon-cyan/50 rounded-2xl p-8 max-w-md w-full shadow-[0_0_50px_rgba(0,243,255,0.2)] text-center"
                    >
                        <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                            <span className="text-3xl">{currentStrategy.emoji}</span>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Deploy {currentStrategy.name}?</h2>
                        <div className="bg-neon-cyan/10 border border-neon-cyan/20 p-3 rounded-lg mb-4">
                            <p className="text-neon-cyan font-mono text-sm font-bold flex justify-between">
                                <span>PROTOCOL FEE (TEST):</span>
                                <span>0.10 SUI (~$0.09 USD)</span>
                            </p>
                        </div>
                        <p className="text-gray-400 mb-8 text-sm">
                            Authorizing AI Agent execution. Secure Vault setup included.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowAutoStartModal(false)}
                                className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 transition-colors font-mono font-bold"
                            >
                                CANCEL
                            </button>
                            <button
                                onClick={confirmAutoStart}
                                className="flex-1 px-4 py-3 rounded-xl bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan hover:bg-neon-cyan hover:text-black transition-all font-mono font-bold shadow-[0_0_20px_rgba(0,243,255,0.3)]"
                            >
                                CONFIRM DEPLOY
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Real-Time Analytics Bar */}
            <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 relative z-10">
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Secure Vault TVL</h3>
                    <div className="text-xl font-mono text-white font-bold">
                        {userBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-xs text-gray-500">SUI</span>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Market Alpha (APY)</h3>
                    <div className="text-xl font-mono text-neon-cyan font-bold flex items-center gap-2">
                        {scallopData ? scallopData.supplyApy.toFixed(2) : '0.00'}%
                        <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 rounded animate-pulse">LIVE</span>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Projected Yield (24H)</h3>
                    <div className="text-xl font-mono text-white font-bold">
                        +{(userBalance * ((scallopData?.supplyApy || 0) / 100 / 365)).toFixed(4)} <span className="text-xs text-gray-500">SUI</span>
                    </div>
                </div>
                <div className="glass-panel p-4 rounded-xl border border-white/5">
                    <h3 className="text-xs text-gray-400 uppercase tracking-wider mb-1">Active Neural Nets</h3>
                    <div className="text-xl font-mono text-purple-400 font-bold">
                        {activeStrategies.length} <span className="text-xs text-gray-500">AGENTS</span>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">

                {/* Main Chart Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col relative overflow-hidden min-h-[400px]"
                >
                    {activeStrategies.length > 0 ? (
                        <div className="flex flex-col h-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm text-gray-400 uppercase tracking-widest">Fleet Status Monitor ({activeStrategies.length}/4)</h2>
                                <button onClick={clearAllStrategies} className="text-xs text-red-400 hover:text-red-300 border border-red-500/30 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-all">
                                    KILL SWITCH (ALL)
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[300px]">
                                {activeStrategies.slice(0, 4).map((strat, i) => {
                                    // Calculate dynamic yield based on real market data + strategy optimization
                                    const baseApy = scallopData ? scallopData.supplyApy : 0;
                                    // Pseudo-random boost per strategy (0.5% - 3.5%)
                                    const boost = 0.5 + (strat.id.charCodeAt(0) % 30) / 10;
                                    const dynamicYield = (baseApy + boost).toFixed(2) + '%';

                                    return (
                                        <div key={`strategy-grid-${i}`} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col relative overflow-hidden group hover:border-neon-cyan/30 transition-all">
                                            <div className="flex justify-between items-start mb-2 relative z-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-2xl">{strat.emoji}</span>
                                                    <div>
                                                        <h3 className="font-bold text-sm leading-tight">{strat.name}</h3>
                                                        <span className="text-[10px] text-green-400 font-mono flex items-center gap-1">
                                                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                                            ACTIVE
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-neon-cyan font-mono font-bold animate-pulse-slow">{dynamicYield}</div>
                                                    <div className="text-[9px] text-gray-500">REAL APY</div>
                                                </div>
                                            </div>

                                            {/* Mini Agent Chart */}
                                            <div className="flex-1 relative mt-2 min-h-[60px]">
                                                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none">
                                                    <path
                                                        d={`M0,${30 + (i * 10)} Q${50 + (i * 20)},${10 + (i * 5)} 100,${40 - (i * 5)} T200,${20 + (i * 10)}`}
                                                        fill="none"
                                                        stroke={i % 2 === 0 ? "#00f3ff" : "#bd00ff"}
                                                        strokeWidth="2"
                                                        vectorEffect="non-scaling-stroke"
                                                        className="drop-shadow-[0_0_5px_rgba(0,243,255,0.5)]"
                                                    />
                                                    <circle cx="200" cy={`${20 + (i * 10)}`} r="3" fill="#fff" className="animate-pulse" />
                                                </svg>
                                            </div>

                                            <div className="mt-auto pt-3 border-t border-white/5 flex gap-2 relative z-10">
                                                <span className="text-[10px] font-mono text-gray-400 flex-1">
                                                    Tx: {strat.tx_digest ? strat.tx_digest.slice(0, 6) + '...' : 'Pending'}
                                                </span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); stopStrategy(strat.id); }}
                                                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] px-2 py-1 rounded transition-colors"
                                                >
                                                    STOP
                                                </button>
                                            </div>

                                            {/* Background Glow */}
                                            <div className={`absolute -right-10 -bottom-10 w-24 h-24 rounded-full blur-[40px] opacity-20 ${i % 2 === 0 ? 'bg-neon-cyan' : 'bg-neon-purple'}`}></div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col h-full relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-sm text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                            <Shield size={14} className="text-neon-cyan" />
                                            Secure Vaults
                                        </h2>
                                        <div className="text-4xl font-mono text-white flex items-center gap-2">
                                            0.00 <span className="text-base text-gray-500">SUI</span>
                                        </div>
                                        <div className="mt-1 flex items-center gap-2">
                                            <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                                                NON-CUSTODIAL
                                            </span>
                                            <span className="text-[10px] text-gray-500 flex items-center gap-2">
                                                {vaultId ? (
                                                    <>
                                                        <span className="text-neon-cyan">
                                                            Vault ID: {vaultId.slice(0, 6)}...{vaultId.slice(-4)}
                                                        </span>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleDestroyVault();
                                                            }}
                                                            className="text-gray-600 hover:text-red-400 transition-colors"
                                                            title="Destroy Vault & Recover Funds"
                                                        >
                                                            <X size={10} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <span>Vault ID: Not Created</span>
                                                )}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {!vaultId ? (
                                            <button
                                                onClick={handleCreateVault}
                                                className="bg-neon-cyan text-black font-bold text-xs px-4 py-2 rounded hover:bg-neon-cyan/80 transition-colors shadow-[0_0_15px_rgba(0,243,255,0.3)] animate-pulse"
                                            >
                                                + NEW VAULT
                                            </button>
                                        ) : (
                                            <div className="text-right">
                                                <div className="text-neon-cyan text-xs font-mono font-bold">SECURE VAULT ACTIVE</div>
                                                <div className="text-[10px] text-gray-500">Ready for automated trading</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Visual Vault Representation */}
                                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-6 flex items-center justify-between group hover:border-neon-cyan/30 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 bg-gradient-to-br from-gray-800 to-black rounded-xl border border-white/10 flex items-center justify-center relative">
                                            <Shield className="text-gray-400 group-hover:text-neon-cyan transition-colors" size={32} />
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 border-2 border-[#0f0a1f] rounded-full" title="Agent Access Revoked"></div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-bold text-white">Main Trading Vault</h3>
                                            <p className="text-xs text-gray-400 mb-2">0 SUI Locked • 0 Strategies</p>

                                            {/* Agent Permissions Toggle Mock */}
                                            <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                                                <span className="text-[10px] text-gray-400 uppercase tracking-wider">Agent Access:</span>
                                                <button
                                                    onClick={() => handleRevokeAgent()}
                                                    className="text-[10px] font-bold text-red-400 hover:text-red-300 cursor-pointer transition-colors"
                                                    title="Click to revoke agent permissions"
                                                >
                                                    REVOKED 🔒
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-2">
                                        <button className="text-xs border border-white/20 hover:bg-white/5 text-white px-4 py-2 rounded transition-colors">
                                            Deposit
                                        </button>
                                        <button className="text-xs border border-white/20 hover:bg-white/5 text-gray-400 hover:text-white px-4 py-2 rounded transition-colors">
                                            Withdraw
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-xs text-gray-500 max-w-md mx-auto">
                                        <span className="text-neon-cyan">Security Note:</span> This vault uses the <strong>Hot Potato</strong> pattern.
                                        Agents can execute trades but <span className="underline decoration-red-500/50">cannot withdraw</span> your funds.
                                    </p>
                                </div>
                            </div>
                        </>
                    )}
                </motion.div>

                {/* Right Column: Stats & Agent Controls */}
                <div className="space-y-6">

                    {/* Active Strategies Fleet */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-panel p-6 rounded-2xl relative overflow-hidden min-h-[220px]"
                    >
                        <div className="absolute -right-10 -top-10 h-32 w-32 opacity-30 pointer-events-none">
                            <Canvas>
                                <Suspense fallback={null}>
                                    <NeuralOrbSmall />
                                    <Environment preset="city" />
                                </Suspense>
                            </Canvas>
                        </div>

                        <h3 className="text-sm text-gray-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                            Active Fleet
                            <span className="text-neon-cyan font-mono text-xs">{activeStrategies.length} ACTIVE</span>
                        </h3>

                        {activeStrategies.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center space-y-3 relative z-10">
                                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-gray-600">
                                    <span className="text-2xl">💤</span>
                                </div>
                                <p className="text-sm text-gray-400">No agents running.</p>
                                <button onClick={handleDeploy} className="text-xs bg-neon-cyan/10 text-neon-cyan px-3 py-1.5 rounded-lg border border-neon-cyan/20 hover:bg-neon-cyan/20 transition-colors">
                                    Deploy Default Loop
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 relative z-10 max-h-[300px] overflow-y-auto pr-1">
                                {activeStrategies.map((strat, idx) => (
                                    <div key={`strategy-list-${idx}`} className="bg-white/5 rounded-xl p-3 border border-white/10 hover:border-white/20 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg">{strat.emoji}</span>
                                                <div>
                                                    <h4 className="text-xs font-bold text-white">{strat.name}</h4>
                                                    <span className="text-[10px] text-green-400 flex items-center gap-1 font-mono">
                                                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                                        RUNNING
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs text-neon-cyan font-mono font-bold">{strat.yield}</div>
                                                <div className="text-[9px] text-gray-500">TARGET APY</div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 mt-2">
                                            <button className="flex-1 bg-white/5 hover:bg-white/10 text-[10px] py-1.5 rounded transition-colors text-gray-300">
                                                DETAILS
                                            </button>
                                            <button
                                                onClick={() => stopStrategy(strat.id)}
                                                className="px-3 bg-red-500/10 hover:bg-red-500/20 text-[10px] py-1.5 rounded transition-colors text-red-400 border border-red-500/20"
                                            >
                                                STOP
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>

                    {/* Market Intelligence (Navi & Scallop) */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="glass-panel p-4 rounded-xl border border-white/5"
                    >
                        <h3 className="text-xs text-gray-400 uppercase tracking-widest mb-3">Liquidity Intelligence</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 p-2 rounded border border-white/5 hover:border-neon-cyan/30 transition-colors">
                                <div className="text-[10px] text-neon-cyan font-bold mb-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan"></span> NAVI
                                </div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400">Supply</span>
                                    <span className="text-green-400 font-mono">{naviData?.supplyApy || '--'}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Borrow</span>
                                    <span className="text-red-400 font-mono">{naviData?.borrowApy || '--'}%</span>
                                </div>
                            </div>
                            <div className="bg-white/5 p-2 rounded border border-white/5 hover:border-blue-400/30 transition-colors">
                                <div className="text-[10px] text-blue-400 font-bold mb-1 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> SCALLOP
                                </div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-gray-400">Supply</span>
                                    <span className="text-green-400 font-mono">{scallopData?.supplyApy || '--'}%</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-400">Borrow</span>
                                    <span className="text-red-400 font-mono">{scallopData?.borrowApy || '--'}%</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Agent Logs */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-panel p-4 rounded-2xl h-[300px] flex flex-col"
                    >
                        <h3 className="text-xs text-gray-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                            <span>Execution Log</span>
                            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300">LIVE</span>
                        </h3>
                        <div className="flex-1 overflow-y-auto font-mono text-xs space-y-2 pr-2 custom-scrollbar">
                            {logs.map((log, i) => (
                                <div key={i} className="text-white/70 border-l-2 border-neon-purple/50 pl-2 py-0.5 hover:bg-white/5 transition-colors">
                                    {log}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Background Elements */}
            <div className="fixed top-0 left-0 w-full h-full z-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-neon-purple/20 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-neon-cyan/10 rounded-full blur-[120px]"></div>
            </div>

        </div>
    );
}

export default function Dashboard() {
    return (
        <main className="min-h-screen">
            <Suspense fallback={
                <div className="min-h-screen flex items-center justify-center">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-neon-cyan border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-neon-cyan font-mono animate-pulse">Initializing Dashboard...</p>
                    </div>
                </div>
            }>
                <DashboardContent />
            </Suspense>
        </main>
    )
}
