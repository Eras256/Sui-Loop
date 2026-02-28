/**
 * SuiLoop Gateway (Health & Doctor)
 * 
 * Provides deep observability and system diagnostics.
 * Acts as the immune system of the agent, preventing operations
 * when critical subsystems are degraded.
 */

import os from 'os';
import axios from 'axios';
import { SuiClient, getFullnodeUrl } from '@mysten/sui/client';
import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { fromB64 } from '@mysten/sui/utils';
import { getLLMService } from './llmService';

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'critical';
    uptime: number;
    timestamp: Date;
    version: string;
    components: {
        system: ResourceMetrics;
        network: SuiNetworkMetrics;
        llm: LLMConnectivity;
        wallet: WalletStatus;
    };
    meta: {
        hostname: string;
        platform: string;
        arch: string;
    }
}

export interface ResourceMetrics {
    cpuLoad: number;
    memoryUsage: number; // MB
    memoryFree: number; // MB
    diskSpace?: number; // Not easily available in node without exec, skipping for now
}

export interface SuiNetworkMetrics {
    status: 'connected' | 'disconnected' | 'latency_high';
    latencyMs: number;
    currentEpoch?: string;
    latestCheckpoint?: string;
}

export interface LLMConnectivity {
    provider: string;
    status: 'connected' | 'error';
    latencyMs: number;
}

export interface WalletStatus {
    address: string | null;
    balance: number; // MIST
    hasGas: boolean;
}

export class GatewayService {
    private lastCheck: SystemHealth | null = null;
    private checkInterval: NodeJS.Timeout | null = null;

    constructor() {
        // Start background health monitoring
        this.checkInterval = setInterval(() => this.performHealthCheck(), 60000); // Every 1 min
        console.log('🩺 Gateway Doctor Service initialized');
    }

    /**
     * Perform a comprehensive system diagnosis
     */
    async performHealthCheck(): Promise<SystemHealth> {
        const start = Date.now();

        // 1. System Resources
        const metrics = this.getResourceMetrics();

        // 2. Network Check (Sui Checkpoint)
        const network = await this.checkSuiNetwork();

        // 3. LLM Check
        const llm = await this.checkLLM();

        // 4. Wallet Check
        const wallet = await this.checkWallet();

        // Determine Overall Status
        let status: SystemHealth['status'] = 'healthy';

        if (network.status === 'disconnected') {
            status = 'critical';
        } else if (!wallet.hasGas) {
            status = 'critical'; // No gas is critical for operation
        } else if (network.status === 'latency_high' || metrics.memoryFree < 100 || llm.status === 'error') {
            status = 'degraded';
        }

        const health: SystemHealth = {
            status,
            uptime: process.uptime(),
            timestamp: new Date(),
            version: process.env.npm_package_version || '2.1.0',
            components: {
                system: metrics,
                network,
                llm,
                wallet
            },
            meta: {
                hostname: os.hostname(),
                platform: os.platform(),
                arch: os.arch()
            }
        };

        this.lastCheck = health;
        return health;
    }

    /**
     * Quick Heartbeat (Low overhead)
     */
    getHeartbeat() {
        return {
            status: this.lastCheck?.status || 'unknown',
            timestamp: new Date(),
            uptime: process.uptime()
        };
    }

    // ------------------------------------------------------------------------
    // INTERNAL DIAGNOSTICS
    // ------------------------------------------------------------------------

    private getResourceMetrics(): ResourceMetrics {
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const load = os.loadavg()[0]; // 1 min load avg

        return {
            cpuLoad: load,
            memoryUsage: Math.round((totalMem - freeMem) / 1024 / 1024),
            memoryFree: Math.round(freeMem / 1024 / 1024)
        };
    }

    private async checkSuiNetwork(): Promise<SuiNetworkMetrics> {
        const start = Date.now();
        try {
            const client = new SuiClient({ url: getFullnodeUrl('testnet') });

            // Fetch latest checkpoint to gauge latency and liveness
            const checkpoint = await client.getLatestCheckpointSequenceNumber();
            const latency = Date.now() - start;

            return {
                status: latency > 1000 ? 'latency_high' : 'connected',
                latencyMs: latency,
                latestCheckpoint: checkpoint
            };
        } catch (error) {
            return {
                status: 'disconnected',
                latencyMs: -1
            };
        }
    }

    private async checkLLM(): Promise<LLMConnectivity> {
        const start = Date.now();
        const llmService = getLLMService();
        if (!llmService) {
            return { provider: 'none', status: 'error', latencyMs: 0 };
        }

        const provider = (llmService as any).activeProvider || 'unknown';

        try {
            // REAL CHECK: Send a minimal token request to the actual provider
            await llmService.chat({
                messages: [{ role: 'user', content: 'ping' }],
                maxTokens: 1
            });

            return {
                provider,
                status: 'connected',
                latencyMs: Date.now() - start
            };
        } catch (error: any) {
            console.error('LLM Check Failed:', error.message);
            return {
                provider,
                status: 'error',
                latencyMs: Date.now() - start
            };
        }
    }

    private async checkWallet(): Promise<WalletStatus> {
        const privateKey = process.env.SUI_PRIVATE_KEY;
        if (!privateKey) {
            return { address: null, balance: 0, hasGas: false };
        }

        try {
            // REAL CHECK: Derive address and fetch actual balance from chain
            // Helper to handle both suiprivkey... and raw base64
            let keypair: Ed25519Keypair;
            if (privateKey.startsWith('suiprivkey')) {
                keypair = Ed25519Keypair.fromSecretKey(privateKey);
            } else {
                keypair = Ed25519Keypair.fromSecretKey(fromB64(privateKey));
            }

            const address = keypair.toSuiAddress();
            const client = new SuiClient({ url: getFullnodeUrl('testnet') });

            const balanceParams = { owner: address };
            const balance = await client.getBalance(balanceParams);

            const totalBalance = parseInt(balance.totalBalance);

            return {
                address,
                balance: totalBalance,
                hasGas: totalBalance > 10000000 // Min 0.01 SUI for safety
            };
        } catch (error) {
            console.error('Wallet Check Failed:', error);
            return {
                address: 'error-deriving',
                balance: 0,
                hasGas: false
            };
        }
    }
}

// Singleton
let gatewayService: GatewayService | null = null;

export function initializeGatewayService(): GatewayService {
    if (!gatewayService) {
        gatewayService = new GatewayService();
        gatewayService.performHealthCheck(); // Initial check
    }
    return gatewayService;
}

export function getGatewayService(): GatewayService | null {
    return gatewayService;
}
