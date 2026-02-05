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
     * Execute a strategy autonomously
     * @param strategy The name of the strategy to execute
     * @param params Parameters for the execution
     */
    async execute(strategy: string, params: StrategyParams = {}): Promise<any> {
        try {
            const response = await this.client.post('/api/execute', {
                strategy,
                params
            });
            return response.data;
        } catch (error: any) {
            throw new Error(`Execution failed: ${error.response?.data?.error || error.message}`);
        }
    }

    /**
     * Get current market analysis from the Agent's perspective
     */
    async getMarketState(): Promise<any> {
        // This endpoint would exist in a full implementation
        return {
            status: 'active',
            sentiment: 'neutral',
            opportunities: []
        };
    }

    /**
     * Subscribe to real-time agent signals via WebSocket
     * @param callback Function to call when a signal is received
     */
    subscribe(callback: SignalCallback): void {
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
