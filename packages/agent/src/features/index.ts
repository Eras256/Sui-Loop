/**
 * SuiLoop Agent - Feature Extensions Index
 * 
 * This module exports all the OpenClaw-inspired features:
 * 
 * 1. Persistent Memory - User context across sessions
 * 2. Multi-Chat Integration - Telegram, Discord bots
 * 3. Browser Control - Web automation with Puppeteer
 * 4. Skills & Plugins - Modular extensibility
 * 5. Local LLM Support - Multiple AI providers
 * 6. Full System Access - Shell & file operations
 * 7. Skill Marketplace - LoopHub community skills
 */

// ============================================================================
// SERVICES
// ============================================================================

// 1. Persistent Memory
export {
    MemoryService,
    initializeMemoryService,
    getMemoryService,
    type UserMemory,
    type UserPreferences,
    type ConversationContext,
    type ExecutionRecord,
    type ConversationMessage,
    type UserStats
} from '../services/memoryService.js';

// 2. Multi-Chat Integration
export {
    SuiLoopTelegramBot,
    initializeTelegramBot,
    getTelegramBot
} from '../integrations/telegramBot.js';

export {
    SuiLoopDiscordBot,
    initializeDiscordBot,
    getDiscordBot
} from '../integrations/discordBot.js';

// 3. Browser Control
export {
    BrowserService,
    initializeBrowserService,
    getBrowserService,
    browserActions
} from '../services/browserService.js';

// 4. Skills & Plugins System
export {
    SkillManager,
    initializeSkillManager,
    getSkillManager,
    skillTemplate,
    type SkillManifest,
    type SkillCategory,
    type SkillPermission,
    type SkillAction,
    type SkillTrigger,
    type SkillProvider,
    type SkillInstance,
    type SkillContext
} from '../services/skillManager.js';

// 5. Local LLM Support
export {
    LLMService,
    initializeLLMService,
    getLLMService,
    type LLMProvider,
    type LLMConfig,
    type Message,
    type ChatRequest,
    type ChatResponse,
    type LLMTool,
    type ToolCall,
    type StreamChunk
} from '../services/llmService.js';

// 6. Full System Access
export {
    SystemAccessService,
    initializeSystemAccess,
    getSystemService,
    type AccessLevel,
    type SystemConfig,
    type CommandResult,
    type FileInfo,
    type ProcessInfo
} from '../services/systemAccess.js';

// 7. Skill Marketplace (LoopHub)
export {
    LoopHubClient,
    initializeLoopHub,
    getLoopHubClient,
    createLoopHubRoutes,
    type MarketplaceSkill,
    type SkillReview,
    type PublishRequest,
    type SearchFilters,
    type ReviewSubmission
} from '../services/loopHub.js';

// ============================================================================
// UNIFIED INITIALIZATION
// ============================================================================

export interface InitializationOptions {
    // Memory
    memoryBackend?: 'local' | 'supabase';
    supabaseClient?: any;

    // Chat Integrations
    telegramToken?: string;
    discordToken?: string;
    discordClientId?: string;

    // LLM
    llmProvider?: 'openai' | 'anthropic' | 'ollama' | 'openrouter' | 'google';
    llmApiKey?: string;
    llmModel?: string;

    // System Access
    accessLevel?: 'sandbox' | 'restricted' | 'full';

    // Browser
    browserHeadless?: boolean;

    // LoopHub
    loophubApiKey?: string;
    userId?: string;
}

/**
 * Initialize all feature extensions at once
 */
export async function initializeAllFeatures(options: InitializationOptions = {}): Promise<{
    memory: import('../services/memoryService.js').MemoryService;
    skills: import('../services/skillManager.js').SkillManager;
    llm: import('../services/llmService.js').LLMService | null;
    system: import('../services/systemAccess.js').SystemAccessService;
    loopHub: import('../services/loopHub.js').LoopHubClient;
    telegram: import('../integrations/telegramBot.js').SuiLoopTelegramBot | null;
    discord: import('../integrations/discordBot.js').SuiLoopDiscordBot | null;
    browser: import('../services/browserService.js').BrowserService | null;
}> {
    console.log('🚀 Initializing SuiLoop Feature Extensions...\n');

    // 1. Memory Service
    const { initializeMemoryService } = await import('../services/memoryService.js');
    const memory = initializeMemoryService({
        backend: options.memoryBackend || 'local',
        supabaseClient: options.supabaseClient
    });

    // 2. Skill Manager
    const { initializeSkillManager } = await import('../services/skillManager.js');
    const skills = initializeSkillManager();
    await skills.initialize();

    // 3. LLM Service
    let llm = null;
    if (options.llmApiKey || options.llmProvider === 'ollama') {
        const { initializeLLMService } = await import('../services/llmService.js');
        llm = initializeLLMService({
            provider: options.llmProvider || 'openai',
            apiKey: options.llmApiKey,
            model: options.llmModel
        });
    }

    // 4. System Access
    const { initializeSystemAccess } = await import('../services/systemAccess.js');
    const system = initializeSystemAccess({
        accessLevel: options.accessLevel || 'restricted'
    });

    // 5. LoopHub Marketplace
    const { initializeLoopHub } = await import('../services/loopHub.js');
    const loopHub = initializeLoopHub({
        apiKey: options.loophubApiKey,
        userId: options.userId
    });

    // 6. Telegram Bot (optional)
    let telegram = null;
    if (options.telegramToken) {
        const { initializeTelegramBot } = await import('../integrations/telegramBot.js');
        telegram = initializeTelegramBot(options.telegramToken);
        await telegram.start();
    }

    // 7. Discord Bot (optional)
    let discord = null;
    if (options.discordToken && options.discordClientId) {
        const { initializeDiscordBot } = await import('../integrations/discordBot.js');
        discord = initializeDiscordBot({
            token: options.discordToken,
            clientId: options.discordClientId
        });
        await discord.start();
    }

    // 8. Browser Service (optional, lazy init)
    let browser = null;
    if (options.browserHeadless !== undefined) {
        const { initializeBrowserService } = await import('../services/browserService.js');
        browser = initializeBrowserService({ headless: options.browserHeadless });
    }

    console.log('\n✅ All features initialized successfully!');
    console.log('   - Memory Service: Ready');
    console.log(`   - Skill Manager: ${skills.getAllSkills().length} skills loaded`);
    console.log(`   - LLM Service: ${llm ? options.llmProvider : 'Not configured'}`);
    console.log(`   - System Access: ${options.accessLevel || 'restricted'} mode`);
    console.log('   - LoopHub: Connected');
    console.log(`   - Telegram: ${telegram ? 'Running' : 'Not configured'}`);
    console.log(`   - Discord: ${discord ? 'Running' : 'Not configured'}`);
    console.log(`   - Browser: ${browser ? 'Ready' : 'Lazy init'}`);

    return {
        memory,
        skills,
        llm,
        system,
        loopHub,
        telegram,
        discord,
        browser
    };
}

// ============================================================================
// FEATURE STATUS
// ============================================================================

export async function getFeatureStatus(): Promise<Record<string, boolean>> {
    const { getMemoryService } = await import('../services/memoryService.js');
    const { getSkillManager } = await import('../services/skillManager.js');
    const { getLLMService } = await import('../services/llmService.js');
    const { getSystemService } = await import('../services/systemAccess.js');
    const { getLoopHubClient } = await import('../services/loopHub.js');
    const { getTelegramBot } = await import('../integrations/telegramBot.js');
    const { getDiscordBot } = await import('../integrations/discordBot.js');
    const { getBrowserService } = await import('../services/browserService.js');

    return {
        memory: getMemoryService() !== null,
        skills: getSkillManager() !== null,
        llm: getLLMService() !== null,
        system: getSystemService() !== null,
        loopHub: getLoopHubClient() !== null,
        telegram: getTelegramBot() !== null,
        discord: getDiscordBot() !== null,
        browser: getBrowserService() !== null
    };
}
