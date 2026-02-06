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

        const provider = (llmService as any).getActiveProvider?.() || 'unknown';

        try {
            // Check connectivity depending on provider type
            // Simplest check: Access the base URL or perform a dummy version check
            // For now, we assume if we can reach Google (internet check) we are likely okay,
            // but ideally we ping the provider API status page.
            await axios.get('https://www.google.com', { timeout: 2000 }); // Basic internet check proxy

            return {
                provider,
                status: 'connected',
                latencyMs: Date.now() - start
            };
        } catch {
            return {
                provider,
                status: 'error',
                latencyMs: Date.now() - start
            };
        }
    }

    private async checkWallet(): Promise<WalletStatus> {
        // Mock wallet check for now as we don't want to expose private key ops here unless needed
        // Ideally reads from a WalletManager
        const hasKey = !!process.env.SUI_PRIVATE_KEY;
        return {
            address: hasKey ? 'configured' : null,
            balance: 0, // Placeholder, would need to query chain
            hasGas: hasKey
        };
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
