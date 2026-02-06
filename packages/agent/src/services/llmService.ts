/**
 * SuiLoop LLM Provider System
 * 
 * Multi-provider LLM support inspired by OpenClaw:
 * - OpenAI (GPT-4, GPT-4o, etc.)
 * - Anthropic (Claude)
 * - Google (Gemini)
 * - Ollama (local models)
 * - OpenRouter (multi-model gateway)
 * - Custom API endpoints
 * 
 * Allows users to choose their preferred AI provider while maintaining
 * consistent interfaces across the application.
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export type LLMProvider =
    | 'openai'
    | 'anthropic'
    | 'google'
    | 'ollama'
    | 'openrouter'
    | 'custom';

export interface LLMConfig {
    provider: LLMProvider;
    apiKey?: string;
    baseUrl?: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    timeout?: number;
}

export interface Message {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface ChatRequest {
    messages: Message[];
    model?: string;
    maxTokens?: number;
    temperature?: number;
    stream?: boolean;
    tools?: LLMTool[];
}

export interface ChatResponse {
    content: string;
    model: string;
    usage: {
        promptTokens: number;
        completionTokens: number;
        totalTokens: number;
    };
    finishReason?: string;
    toolCalls?: ToolCall[];
}

export interface LLMTool {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, any>;
    };
}

export interface ToolCall {
    id: string;
    type: 'function';
    function: {
        name: string;
        arguments: string;
    };
}

export interface StreamChunk {
    content: string;
    done: boolean;
}

// ============================================================================
// BASE PROVIDER
// ============================================================================

abstract class BaseLLMProvider {
    protected config: LLMConfig;
    protected client: AxiosInstance;

    constructor(config: LLMConfig) {
        this.config = config;
        this.client = axios.create({
            timeout: config.timeout || 60000,
            headers: this.getHeaders()
        });
    }

    protected abstract getHeaders(): Record<string, string>;
    abstract chat(request: ChatRequest): Promise<ChatResponse>;
    abstract streamChat(request: ChatRequest): AsyncGenerator<StreamChunk>;
    abstract getModels(): Promise<string[]>;
}

// ============================================================================
// OPENAI PROVIDER
// ============================================================================

class OpenAIProvider extends BaseLLMProvider {
    protected getHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    async chat(request: ChatRequest): Promise<ChatResponse> {
        const response = await this.client.post(
            `${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
            {
                model: request.model || this.config.model || 'gpt-4o',
                messages: request.messages,
                max_tokens: request.maxTokens || this.config.maxTokens || 4096,
                temperature: request.temperature ?? this.config.temperature ?? 0.7,
                tools: request.tools
            }
        );

        const data = response.data;
        const choice = data.choices[0];

        return {
            content: choice.message?.content || '',
            model: data.model,
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0
            },
            finishReason: choice.finish_reason,
            toolCalls: choice.message?.tool_calls
        };
    }

    async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
        const response = await this.client.post(
            `${this.config.baseUrl || 'https://api.openai.com/v1'}/chat/completions`,
            {
                model: request.model || this.config.model || 'gpt-4o',
                messages: request.messages,
                max_tokens: request.maxTokens || this.config.maxTokens || 4096,
                temperature: request.temperature ?? this.config.temperature ?? 0.7,
                stream: true
            },
            { responseType: 'stream' }
        );

        for await (const chunk of response.data) {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        yield { content: '', done: true };
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        yield { content, done: false };
                    } catch { }
                }
            }
        }
    }

    async getModels(): Promise<string[]> {
        const response = await this.client.get(
            `${this.config.baseUrl || 'https://api.openai.com/v1'}/models`
        );

        return response.data.data
            .filter((m: any) => m.id.startsWith('gpt'))
            .map((m: any) => m.id);
    }
}

// ============================================================================
// ANTHROPIC PROVIDER
// ============================================================================

class AnthropicProvider extends BaseLLMProvider {
    protected getHeaders(): Record<string, string> {
        return {
            'x-api-key': this.config.apiKey || '',
            'anthropic-version': '2024-01-01',
            'Content-Type': 'application/json'
        };
    }

    async chat(request: ChatRequest): Promise<ChatResponse> {
        // Separate system message from conversation
        const systemMessage = request.messages.find(m => m.role === 'system');
        const conversationMessages = request.messages.filter(m => m.role !== 'system');

        const response = await this.client.post(
            `${this.config.baseUrl || 'https://api.anthropic.com/v1'}/messages`,
            {
                model: request.model || this.config.model || 'claude-3-5-sonnet-20241022',
                max_tokens: request.maxTokens || this.config.maxTokens || 4096,
                system: systemMessage?.content,
                messages: conversationMessages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                }))
            }
        );

        const data = response.data;

        return {
            content: data.content?.[0]?.text || '',
            model: data.model,
            usage: {
                promptTokens: data.usage?.input_tokens || 0,
                completionTokens: data.usage?.output_tokens || 0,
                totalTokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
            },
            finishReason: data.stop_reason
        };
    }

    async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
        const systemMessage = request.messages.find(m => m.role === 'system');
        const conversationMessages = request.messages.filter(m => m.role !== 'system');

        const response = await this.client.post(
            `${this.config.baseUrl || 'https://api.anthropic.com/v1'}/messages`,
            {
                model: request.model || this.config.model || 'claude-3-5-sonnet-20241022',
                max_tokens: request.maxTokens || this.config.maxTokens || 4096,
                system: systemMessage?.content,
                messages: conversationMessages.map(m => ({
                    role: m.role === 'assistant' ? 'assistant' : 'user',
                    content: m.content
                })),
                stream: true
            },
            { responseType: 'stream' }
        );

        for await (const chunk of response.data) {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    try {
                        const parsed = JSON.parse(line.slice(6));
                        if (parsed.type === 'content_block_delta') {
                            yield { content: parsed.delta?.text || '', done: false };
                        } else if (parsed.type === 'message_stop') {
                            yield { content: '', done: true };
                            return;
                        }
                    } catch { }
                }
            }
        }
    }

    async getModels(): Promise<string[]> {
        // Anthropic doesn't have a models endpoint, return known models
        return [
            'claude-3-5-sonnet-20241022',
            'claude-3-opus-20240229',
            'claude-3-sonnet-20240229',
            'claude-3-haiku-20240307'
        ];
    }
}

// ============================================================================
// OLLAMA PROVIDER (Local LLMs)
// ============================================================================

class OllamaProvider extends BaseLLMProvider {
    protected getHeaders(): Record<string, string> {
        return { 'Content-Type': 'application/json' };
    }

    async chat(request: ChatRequest): Promise<ChatResponse> {
        const response = await this.client.post(
            `${this.config.baseUrl || 'http://localhost:11434'}/api/chat`,
            {
                model: request.model || this.config.model || 'llama3.2',
                messages: request.messages,
                stream: false,
                options: {
                    temperature: request.temperature ?? this.config.temperature ?? 0.7,
                    num_predict: request.maxTokens || this.config.maxTokens || 4096
                }
            }
        );

        const data = response.data;

        return {
            content: data.message?.content || '',
            model: data.model,
            usage: {
                promptTokens: data.prompt_eval_count || 0,
                completionTokens: data.eval_count || 0,
                totalTokens: (data.prompt_eval_count || 0) + (data.eval_count || 0)
            }
        };
    }

    async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
        const response = await this.client.post(
            `${this.config.baseUrl || 'http://localhost:11434'}/api/chat`,
            {
                model: request.model || this.config.model || 'llama3.2',
                messages: request.messages,
                stream: true,
                options: {
                    temperature: request.temperature ?? this.config.temperature ?? 0.7,
                    num_predict: request.maxTokens || this.config.maxTokens || 4096
                }
            },
            { responseType: 'stream' }
        );

        for await (const chunk of response.data) {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const parsed = JSON.parse(line);
                        yield {
                            content: parsed.message?.content || '',
                            done: parsed.done || false
                        };
                        if (parsed.done) return;
                    } catch { }
                }
            }
        }
    }

    async getModels(): Promise<string[]> {
        try {
            const response = await this.client.get(
                `${this.config.baseUrl || 'http://localhost:11434'}/api/tags`
            );
            return response.data.models?.map((m: any) => m.name) || [];
        } catch {
            return ['llama3.2', 'mistral', 'codellama', 'phi'];
        }
    }

    /**
     * Pull a model from Ollama library
     */
    async pullModel(modelName: string): Promise<boolean> {
        try {
            await this.client.post(
                `${this.config.baseUrl || 'http://localhost:11434'}/api/pull`,
                { name: modelName }
            );
            return true;
        } catch {
            return false;
        }
    }
}

// ============================================================================
// OPENROUTER PROVIDER (Multi-model gateway)
// ============================================================================

class OpenRouterProvider extends BaseLLMProvider {
    protected getHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.config.apiKey}`,
            'HTTP-Referer': 'https://suiloop.io',
            'X-Title': 'SuiLoop Agent',
            'Content-Type': 'application/json'
        };
    }

    async chat(request: ChatRequest): Promise<ChatResponse> {
        const response = await this.client.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: request.model || this.config.model || 'anthropic/claude-3.5-sonnet',
                messages: request.messages,
                max_tokens: request.maxTokens || this.config.maxTokens || 4096,
                temperature: request.temperature ?? this.config.temperature ?? 0.7
            }
        );

        const data = response.data;
        const choice = data.choices[0];

        return {
            content: choice.message?.content || '',
            model: data.model,
            usage: {
                promptTokens: data.usage?.prompt_tokens || 0,
                completionTokens: data.usage?.completion_tokens || 0,
                totalTokens: data.usage?.total_tokens || 0
            },
            finishReason: choice.finish_reason
        };
    }

    async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
        const response = await this.client.post(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                model: request.model || this.config.model || 'anthropic/claude-3.5-sonnet',
                messages: request.messages,
                max_tokens: request.maxTokens || this.config.maxTokens || 4096,
                temperature: request.temperature ?? this.config.temperature ?? 0.7,
                stream: true
            },
            { responseType: 'stream' }
        );

        for await (const chunk of response.data) {
            const lines = chunk.toString().split('\n');
            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const data = line.slice(6);
                    if (data === '[DONE]') {
                        yield { content: '', done: true };
                        return;
                    }
                    try {
                        const parsed = JSON.parse(data);
                        const content = parsed.choices?.[0]?.delta?.content || '';
                        yield { content, done: false };
                    } catch { }
                }
            }
        }
    }

    async getModels(): Promise<string[]> {
        const response = await this.client.get('https://openrouter.ai/api/v1/models');
        return response.data.data?.map((m: any) => m.id) || [];
    }
}

// ============================================================================
// GOOGLE GEMINI PROVIDER
// ============================================================================

class GoogleProvider extends BaseLLMProvider {
    protected getHeaders(): Record<string, string> {
        return { 'Content-Type': 'application/json' };
    }

    async chat(request: ChatRequest): Promise<ChatResponse> {
        const model = request.model || this.config.model || 'gemini-1.5-pro';

        // Convert messages to Gemini format
        const contents = request.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        const systemInstruction = request.messages.find(m => m.role === 'system');

        const response = await this.client.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.config.apiKey}`,
            {
                contents,
                systemInstruction: systemInstruction
                    ? { parts: [{ text: systemInstruction.content }] }
                    : undefined,
                generationConfig: {
                    temperature: request.temperature ?? this.config.temperature ?? 0.7,
                    maxOutputTokens: request.maxTokens || this.config.maxTokens || 4096
                }
            }
        );

        const data = response.data;
        const candidate = data.candidates?.[0];

        return {
            content: candidate?.content?.parts?.[0]?.text || '',
            model,
            usage: {
                promptTokens: data.usageMetadata?.promptTokenCount || 0,
                completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
                totalTokens: data.usageMetadata?.totalTokenCount || 0
            },
            finishReason: candidate?.finishReason
        };
    }

    async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
        const model = request.model || this.config.model || 'gemini-1.5-pro';

        const contents = request.messages
            .filter(m => m.role !== 'system')
            .map(m => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }]
            }));

        const response = await this.client.post(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.config.apiKey}`,
            { contents },
            { responseType: 'stream' }
        );

        for await (const chunk of response.data) {
            try {
                const parsed = JSON.parse(chunk.toString());
                const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                yield { content: text, done: false };
            } catch { }
        }

        yield { content: '', done: true };
    }

    async getModels(): Promise<string[]> {
        return [
            'gemini-1.5-pro',
            'gemini-1.5-flash',
            'gemini-1.0-pro',
            'gemini-2.0-flash-exp'
        ];
    }
}

// ============================================================================
// LLM SERVICE (Main API)
// ============================================================================

export class LLMService extends EventEmitter {
    private providers: Map<LLMProvider, BaseLLMProvider> = new Map();
    private activeProvider: LLMProvider;
    private config: LLMConfig;

    constructor(config: LLMConfig) {
        super();
        this.config = config;
        this.activeProvider = config.provider;
        this.initializeProvider(config);
    }

    /**
     * Initialize a provider
     */
    private initializeProvider(config: LLMConfig): void {
        let provider: BaseLLMProvider;

        switch (config.provider) {
            case 'openai':
                provider = new OpenAIProvider(config);
                break;
            case 'anthropic':
                provider = new AnthropicProvider(config);
                break;
            case 'ollama':
                provider = new OllamaProvider(config);
                break;
            case 'openrouter':
                provider = new OpenRouterProvider(config);
                break;
            case 'google':
                provider = new GoogleProvider(config);
                break;
            default:
                provider = new OpenAIProvider(config);
        }

        this.providers.set(config.provider, provider);
    }

    /**
     * Switch to a different provider
     */
    switchProvider(config: LLMConfig): void {
        this.initializeProvider(config);
        this.activeProvider = config.provider;
        this.emit('provider:switched', config.provider);
    }

    /**
     * Get current provider
     */
    getActiveProvider(): LLMProvider {
        return this.activeProvider;
    }

    /**
     * Send a chat request
     */
    async chat(request: ChatRequest): Promise<ChatResponse> {
        const provider = this.providers.get(this.activeProvider);
        if (!provider) {
            throw new Error(`Provider ${this.activeProvider} not initialized`);
        }

        this.emit('chat:start', { provider: this.activeProvider, messages: request.messages.length });

        try {
            const response = await provider.chat(request);
            this.emit('chat:complete', { provider: this.activeProvider, tokens: response.usage.totalTokens });
            return response;
        } catch (error: any) {
            this.emit('chat:error', { provider: this.activeProvider, error: error.message });
            throw error;
        }
    }

    /**
     * Stream a chat response
     */
    async *streamChat(request: ChatRequest): AsyncGenerator<StreamChunk> {
        const provider = this.providers.get(this.activeProvider);
        if (!provider) {
            throw new Error(`Provider ${this.activeProvider} not initialized`);
        }

        this.emit('stream:start', { provider: this.activeProvider });

        for await (const chunk of provider.streamChat(request)) {
            yield chunk;
            if (chunk.done) {
                this.emit('stream:complete', { provider: this.activeProvider });
            }
        }
    }

    /**
     * Simple completion (single message)
     */
    async complete(prompt: string, systemPrompt?: string): Promise<string> {
        const messages: Message[] = [];

        if (systemPrompt) {
            messages.push({ role: 'system', content: systemPrompt });
        }
        messages.push({ role: 'user', content: prompt });

        const response = await this.chat({ messages });
        return response.content;
    }

    /**
     * Get available models for current provider
     */
    async getModels(): Promise<string[]> {
        const provider = this.providers.get(this.activeProvider);
        if (!provider) return [];
        return provider.getModels();
    }

    /**
     * Check if Ollama is running locally
     */
    async checkOllamaStatus(): Promise<boolean> {
        try {
            const response = await axios.get('http://localhost:11434/api/version', {
                timeout: 2000
            });
            return response.status === 200;
        } catch {
            return false;
        }
    }

    /**
     * Generate system prompt for SuiLoop agent
     */
    static getSuiLoopSystemPrompt(): string {
        return `You are SuiLoop AI, an intelligent DeFi assistant specialized in the Sui blockchain ecosystem.

Your capabilities include:
- Executing atomic flash loan strategies using the Hot Potato pattern
- Monitoring market conditions and detecting arbitrage opportunities
- Managing user portfolios and active strategies
- Providing insights on DeFi protocols (Scallop, Cetus, DeepBook, Navi)

Key facts:
- Network: Sui (Testnet for now, Mainnet coming soon)
- Security: Hot Potato pattern ensures atomic execution
- Supported strategies: SUI-USDC loops, LST arbitrage, lending optimization

When users ask to execute actions:
1. Confirm the action and parameters
2. Explain the risks involved
3. Provide expected outcomes
4. Execute only with user confirmation

Be helpful, concise, and security-conscious. Always prioritize user funds safety.`;
    }
}

// ============================================================================
// SINGLETON & EXPORTS
// ============================================================================

let llmService: LLMService | null = null;

export function initializeLLMService(config: LLMConfig): LLMService {
    if (!llmService) {
        llmService = new LLMService(config);
        console.log(`🧠 LLM Service initialized with ${config.provider}`);
    }
    return llmService;
}

export function getLLMService(): LLMService | null {
    return llmService;
}

export default LLMService;
