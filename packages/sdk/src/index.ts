import axios, { AxiosInstance } from 'axios';
import WebSocket from 'isomorphic-ws';

export interface AgentConfig {
    apiKey: string;
    baseUrl?: string;
    wsUrl?: string;
}

export interface StrategyParams {
    tokenIn?: string;
    amountIn?: number;
    slippage?: number;
    [key: string]: any;
}

export type SignalCallback = (data: any) => void;

export class Agent {
    private client: AxiosInstance;
    private ws: WebSocket | null = null;
    private apiKey: string;
    private baseUrl: string;
    private wsUrl: string;

    constructor(config: AgentConfig) {
        this.apiKey = config.apiKey;
        this.baseUrl = config.baseUrl || 'http://localhost:3001';
        this.wsUrl = config.wsUrl || this.baseUrl.replace('http', 'ws') + '/ws/signals';

        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'x-api-key': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Check if the API is reachable
     */
    async ping(): Promise<boolean> {
        try {
            await this.client.get('/health');
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Get detailed health status of the agent
     */
    async health(): Promise<any> {
        const response = await this.client.get('/health');
        return response.data;
    }

    /**
     * Execute a strategy autonomously
     * @param strategy The name of the strategy to execute
     * @param asset Vault asset — 'SUI' (default) or 'USDC'
     * @param params Parameters for the execution
     */
    async execute(strategy: string, asset: "SUI" | "USDC" = "SUI", params: StrategyParams = {}): Promise<any> {
        try {
            const response = await this.client.post('/api/execute', {
                strategy,
                asset,
                params
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Execution failed: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Public demo execution (no API key required).
     * Simulates the flash loan flow without real on-chain execution.
     * @param strategy Strategy to simulate
     * @param asset 'SUI' or 'USDC'
     */
    async executeDemo(strategy: string = "atomic-flash-loan", asset: "SUI" | "USDC" = "SUI"): Promise<any> {
        const response = await this.client.post('/api/execute-demo', { strategy, asset });
        return response.data;
    }

    /**
     * Get live market state
     */
    async getMarket(): Promise<any> {
        const response = await this.client.get('/api/market');
        return response.data;
    }

    /**
     * Get recent market signals
     */
    async getSignals(limit: number = 10): Promise<any> {
        const response = await this.client.get('/api/signals/recent', { params: { limit } });
        return response.data;
    }

    /**
     * Get the current autonomous market scanner status
     */
    async getLoopStatus(): Promise<any> {
        const response = await this.client.get('/api/loop/status');
        return response.data;
    }

    /**
     * Start the autonomous market scanner
     */
    async startLoop(config?: any): Promise<any> {
        const response = await this.client.post('/api/loop/start', { config: config || {} });
        return response.data;
    }

    /**
     * Stop the autonomous market scanner
     */
    async stopLoop(): Promise<any> {
        const response = await this.client.post('/api/loop/stop');
        return response.data;
    }

    /**
     * Manually trigger a single market scan cycle
     */
    async triggerScan(): Promise<any> {
        const response = await this.client.post('/api/loop/scan');
        return response.data;
    }

    /**
     * Create a filtered signal subscription
     */
    async createSubscription(options: {
        signalTypes?: string[];
        minConfidence?: number;
        minProfitPercentage?: number;
        pairs?: string[];
    } = {}): Promise<any> {
        const response = await this.client.post('/api/subscriptions', {
            signalTypes: options.signalTypes || ["arbitrage_opportunity", "flash_loan_opportunity"],
            minConfidence: options.minConfidence ?? 60,
            minProfitPercentage: options.minProfitPercentage ?? 0.1,
            pairs: options.pairs || ["SUI/USDC"],
            connectionType: "websocket"
        });
        return response.data;
    }

    /**
     * Subscribe to real-time agent signals via WebSocket
     * @param callback Function to call when a signal is received
     * @param subscriptionId Optional subscription ID to filter events
     */
    subscribe(callback: SignalCallback, subscriptionId?: string): void {
        if (this.ws) {
            this.ws.close();
        }

        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
            console.log('🔌 Connected to Agent Signal Stream');
            // Authenticate immediately upon connection
            this.ws?.send(JSON.stringify({
                type: 'auth',
                apiKey: this.apiKey
            }));

            if (subscriptionId) {
                this.ws?.send(JSON.stringify({
                    type: 'subscribe',
                    subscriptionId: subscriptionId
                }));
            }
        };

        this.ws.onmessage = (event: { data: any }) => {
            try {
                const data = JSON.parse(event.data as string);
                callback(data);
            } catch (e) {
                console.warn('Received non-JSON message:', event.data);
            }
        };

        this.ws.onerror = (error: any) => {
            console.error('WebSocket Error:', error);
        };
    }

    /**
     * Close all connections
     */
    disconnect(): void {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
