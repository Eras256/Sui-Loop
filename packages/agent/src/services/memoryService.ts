/**
 * SuiLoop Persistent Memory Service
 * 
 * Inspired by OpenClaw's memory system, this service provides:
 * - User context persistence across sessions
 * - Preference storage
 * - Conversation history
 * - Strategy execution history
 * - Wallet activity tracking
 * 
 * Storage backends:
 * - Supabase (cloud, for web users)
 * - Local Markdown files (for CLI/Desktop users)
 * - In-memory cache (for performance)
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

export interface UserMemory {
    userId: string;
    walletAddress?: string;
    createdAt: Date;
    lastActiveAt: Date;

    // Preferences
    preferences: UserPreferences;

    // Context
    context: ConversationContext;

    // History
    executionHistory: ExecutionRecord[];
    conversationHistory: ConversationMessage[];

    // Stats
    stats: UserStats;
}

export interface UserPreferences {
    // Trading preferences
    defaultSlippage: number;
    maxGasPrice: number;
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
    preferredStrategies: string[];

    // Notification preferences
    notifyOnOpportunity: boolean;
    notifyOnExecution: boolean;
    minProfitThreshold: number;

    // UI preferences
    theme: 'dark' | 'light' | 'neural';
    language: string;
    timezone: string;
}

export interface ConversationContext {
    // Current session context
    currentIntent?: string;
    pendingAction?: string;
    lastMentionedToken?: string;
    lastMentionedAmount?: number;

    // Long-term context
    frequentlyUsedStrategies: Record<string, number>;
    favoriteTokenPairs: string[];
    typicalTradeSize: number;

    // Personality adaptation
    communicationStyle: 'technical' | 'casual' | 'minimal';
    experienceLevel: 'beginner' | 'intermediate' | 'expert';
}

export interface ExecutionRecord {
    id: string;
    timestamp: Date;
    strategyId: string;
    strategyName: string;
    txDigest?: string;
    amount: number;
    profit?: number;
    status: 'success' | 'failed' | 'pending';
    gasUsed?: number;
    notes?: string;
}

export interface ConversationMessage {
    id: string;
    timestamp: Date;
    role: 'user' | 'agent' | 'system';
    content: string;
    metadata?: Record<string, any>;
}

export interface UserStats {
    totalExecutions: number;
    successfulExecutions: number;
    totalProfit: number;
    totalGasSpent: number;
    favoriteStrategy: string;
    firstActiveDate: Date;
    longestStreak: number;
    currentStreak: number;
}

// ============================================================================
// MEMORY STORE INTERFACE
// ============================================================================

interface MemoryStore {
    get(userId: string): Promise<UserMemory | null>;
    set(userId: string, memory: UserMemory): Promise<void>;
    delete(userId: string): Promise<void>;
    search(query: string, userId: string): Promise<ConversationMessage[]>;
}

// ============================================================================
// IN-MEMORY CACHE
// ============================================================================

class InMemoryCache implements MemoryStore {
    private cache: Map<string, UserMemory> = new Map();
    private maxSize: number;

    constructor(maxSize = 1000) {
        this.maxSize = maxSize;
    }

    async get(userId: string): Promise<UserMemory | null> {
        return this.cache.get(userId) || null;
    }

    async set(userId: string, memory: UserMemory): Promise<void> {
        // LRU eviction if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) this.cache.delete(firstKey);
        }
        this.cache.set(userId, memory);
    }

    async delete(userId: string): Promise<void> {
        this.cache.delete(userId);
    }

    async search(query: string, userId: string): Promise<ConversationMessage[]> {
        const memory = this.cache.get(userId);
        if (!memory) return [];

        const queryLower = query.toLowerCase();
        return memory.conversationHistory.filter(msg =>
            msg.content.toLowerCase().includes(queryLower)
        );
    }
}

// ============================================================================
// LOCAL FILE STORE (Markdown-based like OpenClaw)
// ============================================================================

class LocalFileStore implements MemoryStore {
    private baseDir: string;

    constructor(baseDir?: string) {
        this.baseDir = baseDir || path.join(process.cwd(), '.suiloop', 'memory');
    }

    private getUserDir(userId: string): string {
        const hash = crypto.createHash('sha256').update(userId).digest('hex').slice(0, 16);
        return path.join(this.baseDir, hash);
    }

    private getMemoryPath(userId: string): string {
        return path.join(this.getUserDir(userId), 'memory.json');
    }

    private getContextPath(userId: string): string {
        return path.join(this.getUserDir(userId), 'context.md');
    }

    private getHistoryPath(userId: string): string {
        return path.join(this.getUserDir(userId), 'history.md');
    }

    async get(userId: string): Promise<UserMemory | null> {
        try {
            const memoryPath = this.getMemoryPath(userId);
            if (await fs.pathExists(memoryPath)) {
                const data = await fs.readJson(memoryPath);
                return {
                    ...data,
                    createdAt: new Date(data.createdAt),
                    lastActiveAt: new Date(data.lastActiveAt),
                    executionHistory: data.executionHistory?.map((e: any) => ({
                        ...e,
                        timestamp: new Date(e.timestamp)
                    })) || [],
                    conversationHistory: data.conversationHistory?.map((m: any) => ({
                        ...m,
                        timestamp: new Date(m.timestamp)
                    })) || []
                };
            }
            return null;
        } catch (error) {
            console.error('Error reading memory:', error);
            return null;
        }
    }

    async set(userId: string, memory: UserMemory): Promise<void> {
        try {
            const userDir = this.getUserDir(userId);
            await fs.ensureDir(userDir);

            // Save JSON memory
            await fs.writeJson(this.getMemoryPath(userId), memory, { spaces: 2 });

            // Save human-readable context markdown (OpenClaw style)
            const contextMd = this.generateContextMarkdown(memory);
            await fs.writeFile(this.getContextPath(userId), contextMd);

            // Save history markdown
            const historyMd = this.generateHistoryMarkdown(memory);
            await fs.writeFile(this.getHistoryPath(userId), historyMd);

        } catch (error) {
            console.error('Error saving memory:', error);
            throw error;
        }
    }

    async delete(userId: string): Promise<void> {
        try {
            const userDir = this.getUserDir(userId);
            if (await fs.pathExists(userDir)) {
                await fs.remove(userDir);
            }
        } catch (error) {
            console.error('Error deleting memory:', error);
        }
    }

    async search(query: string, userId: string): Promise<ConversationMessage[]> {
        const memory = await this.get(userId);
        if (!memory) return [];

        const queryLower = query.toLowerCase();
        return memory.conversationHistory.filter(msg =>
            msg.content.toLowerCase().includes(queryLower)
        );
    }

    private generateContextMarkdown(memory: UserMemory): string {
        return `# SuiLoop User Context
> Last updated: ${memory.lastActiveAt.toISOString()}

## User Profile
- **Wallet**: \`${memory.walletAddress || 'Not connected'}\`
- **First Active**: ${memory.stats.firstActiveDate?.toISOString() || 'Unknown'}
- **Experience Level**: ${memory.context.experienceLevel}
- **Communication Style**: ${memory.context.communicationStyle}

## Preferences
- **Risk Tolerance**: ${memory.preferences.riskTolerance}
- **Default Slippage**: ${memory.preferences.defaultSlippage}%
- **Max Gas Price**: ${memory.preferences.maxGasPrice} MIST
- **Preferred Strategies**: ${memory.preferences.preferredStrategies.join(', ') || 'None set'}

## Current Context
- **Current Intent**: ${memory.context.currentIntent || 'None'}
- **Pending Action**: ${memory.context.pendingAction || 'None'}
- **Last Mentioned Token**: ${memory.context.lastMentionedToken || 'None'}
- **Typical Trade Size**: ${memory.context.typicalTradeSize} SUI

## Frequently Used Strategies
${Object.entries(memory.context.frequentlyUsedStrategies || {})
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([strategy, count]) => `- ${strategy}: ${count} times`)
                .join('\n') || '- No strategies used yet'}

## Statistics
- **Total Executions**: ${memory.stats.totalExecutions}
- **Success Rate**: ${memory.stats.totalExecutions > 0
                ? ((memory.stats.successfulExecutions / memory.stats.totalExecutions) * 100).toFixed(1)
                : 0}%
- **Total Profit**: ${memory.stats.totalProfit.toFixed(4)} SUI
- **Total Gas Spent**: ${memory.stats.totalGasSpent.toFixed(6)} SUI
- **Current Streak**: ${memory.stats.currentStreak} days
`;
    }

    private generateHistoryMarkdown(memory: UserMemory): string {
        const recentExecutions = memory.executionHistory.slice(-20);
        const recentMessages = memory.conversationHistory.slice(-50);

        return `# SuiLoop Execution History
> User: ${memory.userId}

## Recent Executions
${recentExecutions.map(exec => `
### ${exec.timestamp.toISOString()} - ${exec.strategyName}
- **Status**: ${exec.status === 'success' ? '✅' : exec.status === 'failed' ? '❌' : '⏳'} ${exec.status}
- **Amount**: ${exec.amount} SUI
- **Profit**: ${exec.profit?.toFixed(4) || 'N/A'} SUI
- **TX**: ${exec.txDigest ? `[View](https://suiscan.xyz/testnet/tx/${exec.txDigest})` : 'N/A'}
${exec.notes ? `- **Notes**: ${exec.notes}` : ''}
`).join('\n') || 'No executions yet.'}

---

## Recent Conversations
${recentMessages.map(msg => `
**[${msg.timestamp.toISOString()}] ${msg.role.toUpperCase()}**: ${msg.content}
`).join('\n') || 'No messages yet.'}
`;
    }
}

// ============================================================================
// SUPABASE STORE (Cloud persistence)
// ============================================================================

class SupabaseStore implements MemoryStore {
    private supabase: any;

    constructor(supabaseClient: any) {
        this.supabase = supabaseClient;
    }

    async get(userId: string): Promise<UserMemory | null> {
        if (!this.supabase) return null;

        try {
            const { data, error } = await this.supabase
                .from('user_memory')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error || !data) return null;

            return {
                userId: data.user_id,
                walletAddress: data.wallet_address,
                createdAt: new Date(data.created_at),
                lastActiveAt: new Date(data.last_active_at),
                preferences: data.preferences || this.getDefaultPreferences(),
                context: data.context || this.getDefaultContext(),
                executionHistory: data.execution_history || [],
                conversationHistory: data.conversation_history || [],
                stats: data.stats || this.getDefaultStats()
            };
        } catch (error) {
            console.error('Supabase get error:', error);
            return null;
        }
    }

    async set(userId: string, memory: UserMemory): Promise<void> {
        if (!this.supabase) return;

        try {
            const { error } = await this.supabase
                .from('user_memory')
                .upsert({
                    user_id: userId,
                    wallet_address: memory.walletAddress,
                    created_at: memory.createdAt.toISOString(),
                    last_active_at: memory.lastActiveAt.toISOString(),
                    preferences: memory.preferences,
                    context: memory.context,
                    execution_history: memory.executionHistory.slice(-100), // Keep last 100
                    conversation_history: memory.conversationHistory.slice(-500), // Keep last 500
                    stats: memory.stats
                }, { onConflict: 'user_id' });

            if (error) throw error;
        } catch (error) {
            console.error('Supabase set error:', error);
            throw error;
        }
    }

    async delete(userId: string): Promise<void> {
        if (!this.supabase) return;

        try {
            await this.supabase
                .from('user_memory')
                .delete()
                .eq('user_id', userId);
        } catch (error) {
            console.error('Supabase delete error:', error);
        }
    }

    async search(query: string, userId: string): Promise<ConversationMessage[]> {
        // For now, fallback to client-side search
        const memory = await this.get(userId);
        if (!memory) return [];

        const queryLower = query.toLowerCase();
        return memory.conversationHistory.filter(msg =>
            msg.content.toLowerCase().includes(queryLower)
        );
    }

    private getDefaultPreferences(): UserPreferences {
        return {
            defaultSlippage: 0.5,
            maxGasPrice: 3000,
            riskTolerance: 'moderate',
            preferredStrategies: [],
            notifyOnOpportunity: true,
            notifyOnExecution: true,
            minProfitThreshold: 0.1,
            theme: 'neural',
            language: 'en',
            timezone: 'UTC'
        };
    }

    private getDefaultContext(): ConversationContext {
        return {
            frequentlyUsedStrategies: {},
            favoriteTokenPairs: ['SUI/USDC'],
            typicalTradeSize: 1,
            communicationStyle: 'technical',
            experienceLevel: 'intermediate'
        };
    }

    private getDefaultStats(): UserStats {
        return {
            totalExecutions: 0,
            successfulExecutions: 0,
            totalProfit: 0,
            totalGasSpent: 0,
            favoriteStrategy: '',
            firstActiveDate: new Date(),
            longestStreak: 0,
            currentStreak: 0
        };
    }
}

// ============================================================================
// MEMORY SERVICE (Main API)
// ============================================================================

export class MemoryService {
    private cache: InMemoryCache;
    private persistentStore: MemoryStore;
    private autoSaveInterval: NodeJS.Timeout | null = null;
    private dirtyUsers: Set<string> = new Set();

    constructor(options: {
        backend: 'local' | 'supabase';
        supabaseClient?: any;
        localPath?: string;
        autoSaveMs?: number;
    }) {
        this.cache = new InMemoryCache(500);

        if (options.backend === 'supabase' && options.supabaseClient) {
            this.persistentStore = new SupabaseStore(options.supabaseClient);
        } else {
            this.persistentStore = new LocalFileStore(options.localPath);
        }

        // Auto-save dirty users every 30 seconds by default
        if (options.autoSaveMs !== 0) {
            this.startAutoSave(options.autoSaveMs || 30000);
        }
    }

    /**
     * Get user memory (from cache or persistent store)
     */
    async getMemory(userId: string): Promise<UserMemory> {
        // Try cache first
        let memory = await this.cache.get(userId);

        if (!memory) {
            // Try persistent store
            memory = await this.persistentStore.get(userId);

            if (!memory) {
                // Create new user memory
                memory = this.createDefaultMemory(userId);
            }

            // Populate cache
            await this.cache.set(userId, memory);
        }

        return memory;
    }

    /**
     * Update user memory
     */
    async updateMemory(userId: string, updates: Partial<UserMemory>): Promise<UserMemory> {
        const memory = await this.getMemory(userId);

        const updatedMemory: UserMemory = {
            ...memory,
            ...updates,
            lastActiveAt: new Date()
        };

        await this.cache.set(userId, updatedMemory);
        this.dirtyUsers.add(userId);

        return updatedMemory;
    }

    /**
     * Add a message to conversation history
     */
    async addMessage(
        userId: string,
        role: 'user' | 'agent' | 'system',
        content: string,
        metadata?: Record<string, any>
    ): Promise<void> {
        const memory = await this.getMemory(userId);

        const message: ConversationMessage = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            role,
            content,
            metadata
        };

        memory.conversationHistory.push(message);

        // Keep only last 1000 messages in memory
        if (memory.conversationHistory.length > 1000) {
            memory.conversationHistory = memory.conversationHistory.slice(-1000);
        }

        await this.cache.set(userId, memory);
        this.dirtyUsers.add(userId);
    }

    /**
     * Record a strategy execution
     */
    async recordExecution(
        userId: string,
        execution: Omit<ExecutionRecord, 'id' | 'timestamp'>
    ): Promise<void> {
        const memory = await this.getMemory(userId);

        const record: ExecutionRecord = {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            ...execution
        };

        memory.executionHistory.push(record);

        // Update stats
        memory.stats.totalExecutions++;
        if (execution.status === 'success') {
            memory.stats.successfulExecutions++;
        }
        if (execution.profit) {
            memory.stats.totalProfit += execution.profit;
        }
        if (execution.gasUsed) {
            memory.stats.totalGasSpent += execution.gasUsed;
        }

        // Update frequently used strategies
        const strategyCount = memory.context.frequentlyUsedStrategies[execution.strategyId] || 0;
        memory.context.frequentlyUsedStrategies[execution.strategyId] = strategyCount + 1;

        // Update favorite strategy
        const sorted = Object.entries(memory.context.frequentlyUsedStrategies)
            .sort((a, b) => b[1] - a[1]);
        if (sorted.length > 0) {
            memory.stats.favoriteStrategy = sorted[0][0];
        }

        await this.cache.set(userId, memory);
        this.dirtyUsers.add(userId);
    }

    /**
     * Update user preferences
     */
    async updatePreferences(
        userId: string,
        preferences: Partial<UserPreferences>
    ): Promise<void> {
        const memory = await this.getMemory(userId);

        memory.preferences = {
            ...memory.preferences,
            ...preferences
        };

        await this.cache.set(userId, memory);
        this.dirtyUsers.add(userId);
    }

    /**
     * Update conversation context
     */
    async updateContext(
        userId: string,
        context: Partial<ConversationContext>
    ): Promise<void> {
        const memory = await this.getMemory(userId);

        memory.context = {
            ...memory.context,
            ...context
        };

        await this.cache.set(userId, memory);
        this.dirtyUsers.add(userId);
    }

    /**
     * Search conversation history
     */
    async searchHistory(userId: string, query: string): Promise<ConversationMessage[]> {
        return this.persistentStore.search(query, userId);
    }

    /**
     * Get conversation context summary for LLM
     */
    async getContextForLLM(userId: string): Promise<string> {
        const memory = await this.getMemory(userId);

        const recentMessages = memory.conversationHistory.slice(-10)
            .map(m => `${m.role}: ${m.content}`)
            .join('\n');

        return `
## User Profile
- Experience: ${memory.context.experienceLevel}
- Risk Tolerance: ${memory.preferences.riskTolerance}
- Typical Trade Size: ${memory.context.typicalTradeSize} SUI
- Favorite Strategy: ${memory.stats.favoriteStrategy || 'None yet'}

## Recent Context
- Current Intent: ${memory.context.currentIntent || 'None'}
- Last Token Mentioned: ${memory.context.lastMentionedToken || 'None'}
- Pending Action: ${memory.context.pendingAction || 'None'}

## Recent Conversation
${recentMessages}

## Stats
- Total Executions: ${memory.stats.totalExecutions}
- Success Rate: ${memory.stats.totalExecutions > 0
                ? ((memory.stats.successfulExecutions / memory.stats.totalExecutions) * 100).toFixed(0)
                : 0}%
- Total Profit: ${memory.stats.totalProfit.toFixed(4)} SUI
`;
    }

    /**
     * Flush all dirty users to persistent store
     */
    async flush(): Promise<void> {
        const promises: Promise<void>[] = [];

        for (const userId of this.dirtyUsers) {
            const memory = await this.cache.get(userId);
            if (memory) {
                promises.push(this.persistentStore.set(userId, memory));
            }
        }

        await Promise.all(promises);
        this.dirtyUsers.clear();

        console.log(`💾 Flushed ${promises.length} user memories to persistent store`);
    }

    /**
     * Delete user memory completely
     */
    async deleteMemory(userId: string): Promise<void> {
        await this.cache.delete(userId);
        await this.persistentStore.delete(userId);
        this.dirtyUsers.delete(userId);
    }

    /**
     * Start auto-save interval
     */
    private startAutoSave(intervalMs: number): void {
        this.autoSaveInterval = setInterval(async () => {
            if (this.dirtyUsers.size > 0) {
                await this.flush();
            }
        }, intervalMs);
    }

    /**
     * Stop auto-save and flush pending changes
     */
    async shutdown(): Promise<void> {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
        }
        await this.flush();
    }

    /**
     * Create default memory for new user
     */
    private createDefaultMemory(userId: string): UserMemory {
        return {
            userId,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            preferences: {
                defaultSlippage: 0.5,
                maxGasPrice: 3000,
                riskTolerance: 'moderate',
                preferredStrategies: [],
                notifyOnOpportunity: true,
                notifyOnExecution: true,
                minProfitThreshold: 0.1,
                theme: 'neural',
                language: 'en',
                timezone: 'UTC'
            },
            context: {
                frequentlyUsedStrategies: {},
                favoriteTokenPairs: ['SUI/USDC'],
                typicalTradeSize: 1,
                communicationStyle: 'technical',
                experienceLevel: 'intermediate'
            },
            executionHistory: [],
            conversationHistory: [],
            stats: {
                totalExecutions: 0,
                successfulExecutions: 0,
                totalProfit: 0,
                totalGasSpent: 0,
                favoriteStrategy: '',
                firstActiveDate: new Date(),
                longestStreak: 0,
                currentStreak: 0
            }
        };
    }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

let memoryServiceInstance: MemoryService | null = null;

export function initializeMemoryService(options: {
    backend: 'local' | 'supabase';
    supabaseClient?: any;
    localPath?: string;
}): MemoryService {
    if (!memoryServiceInstance) {
        memoryServiceInstance = new MemoryService(options);
        console.log('🧠 Memory Service initialized');
    }
    return memoryServiceInstance;
}

export function getMemoryService(): MemoryService {
    if (!memoryServiceInstance) {
        // Default to local storage
        memoryServiceInstance = new MemoryService({ backend: 'local' });
    }
    return memoryServiceInstance;
}

export default MemoryService;
