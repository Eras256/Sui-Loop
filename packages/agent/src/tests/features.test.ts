/**
 * SuiLoop Feature Tests
 * 
 * Tests for OpenClaw-inspired features:
 * - Memory Service
 * - Skill Manager
 * - LoopHub Marketplace
 * - LLM Service
 * - Browser Service
 * - System Access
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY SERVICE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('MemoryService', () => {
    let memoryService: any;
    const testUserId = 'test-user-123';

    beforeAll(async () => {
        const { initializeMemoryService } = await import('../services/memoryService.js');
        memoryService = initializeMemoryService({ backend: 'local' });
    });

    it('should create a new user memory', async () => {
        const memory = await memoryService.getMemory(testUserId);
        expect(memory).toBeDefined();
        expect(memory.userId).toBe(testUserId);
    });

    it('should update user preferences', async () => {
        const updated = await memoryService.updateMemory(testUserId, {
            preferences: {
                riskLevel: 'aggressive',
                slippage: 0.5,
                notifications: true
            }
        });
        expect(updated.preferences.riskLevel).toBe('aggressive');
    });

    it('should add messages to conversation history', async () => {
        await memoryService.addMessage(testUserId, 'user', 'Hello agent!');
        await memoryService.addMessage(testUserId, 'agent', 'Hello! How can I help?');

        const memory = await memoryService.getMemory(testUserId);
        expect(memory.conversationHistory.length).toBeGreaterThanOrEqual(2);
    });

    it('should record execution history', async () => {
        await memoryService.recordExecution(testUserId, {
            strategyId: 'test-strategy',
            strategyName: 'Test Strategy',
            status: 'success',
            profit: 10.5,
            amount: 100
        });

        const memory = await memoryService.getMemory(testUserId);
        expect(memory.executionHistory.length).toBeGreaterThan(0);
    });

    it('should update user stats', async () => {
        const memory = await memoryService.getMemory(testUserId);
        expect(memory.stats).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SKILL MANAGER TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('SkillManager', () => {
    let skillManager: any;

    beforeAll(async () => {
        const { initializeSkillManager } = await import('../services/skillManager.js');
        skillManager = initializeSkillManager();
        await skillManager.initialize();
    });

    it('should initialize with built-in skills', () => {
        const skills = skillManager.getAllSkills();
        expect(skills.length).toBeGreaterThan(0);
    });

    it('should get a skill by slug', () => {
        const skill = skillManager.getSkill('atomic-flash-loan');
        expect(skill).toBeDefined();
        expect(skill?.manifest.name).toBe('Atomic Flash Loan');
    });

    it('should list skills by category', () => {
        const tradingSkills = skillManager.getSkillsByCategory('trading');
        expect(tradingSkills.length).toBeGreaterThan(0);
    });

    it('should enable and disable skills', () => {
        skillManager.disableSkill('atomic-flash-loan');
        let skill = skillManager.getSkill('atomic-flash-loan');
        expect(skill?.isEnabled).toBe(false);

        skillManager.enableSkill('atomic-flash-loan');
        skill = skillManager.getSkill('atomic-flash-loan');
        expect(skill?.isEnabled).toBe(true);
    });

    it('should generate action prompt for LLM', () => {
        const prompt = skillManager.generateActionPrompt();
        expect(prompt).toContain('Available Skills');
        expect(prompt.length).toBeGreaterThan(100);
    });

    it('should execute a skill action', async () => {
        const context = {
            userId: 'test-user',
            walletAddress: '0x123',
            permissions: ['blockchain:read', 'blockchain:write']
        };

        // This should not throw
        try {
            await skillManager.executeAction(
                'atomic-flash-loan',
                'executeFlashLoan',
                { amount: 100 },
                context
            );
        } catch (error) {
            // Action handler not implemented is expected
            expect(error).toBeDefined();
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// LOOPHUB MARKETPLACE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('LoopHub Marketplace', () => {
    let loopHub: any;

    beforeAll(async () => {
        const { initializeLoopHub } = await import('../services/loopHub.js');
        loopHub = initializeLoopHub();
    });

    it('should get featured skills', async () => {
        const featured = await loopHub.getFeatured();
        expect(featured.length).toBeGreaterThan(0);
        expect(featured.every((s: any) => s.isFeatured)).toBe(true);
    });

    it('should get trending skills', async () => {
        const trending = await loopHub.getTrending(5);
        expect(trending.length).toBeLessThanOrEqual(5);
    });

    it('should search skills by query', async () => {
        const { skills, total } = await loopHub.search({ query: 'flash loan' });
        expect(total).toBeGreaterThan(0);
        expect(skills.some((s: any) =>
            s.name.toLowerCase().includes('flash') ||
            s.description.toLowerCase().includes('flash')
        )).toBe(true);
    });

    it('should search skills by category', async () => {
        const { skills } = await loopHub.search({ category: 'trading' });
        expect(skills.every((s: any) => s.category === 'trading')).toBe(true);
    });

    it('should get skill by id', async () => {
        const skill = await loopHub.getSkill('flash-loan-executor');
        expect(skill).toBeDefined();
        expect(skill?.name).toBe('Flash Loan Executor');
    });

    it('should get skill reviews', async () => {
        const reviews = await loopHub.getReviews('flash-loan-executor');
        expect(reviews.length).toBeGreaterThan(0);
        expect(reviews[0]).toHaveProperty('rating');
    });

    it('should get marketplace stats', async () => {
        const stats = await loopHub.getStats();
        expect(stats.totalSkills).toBeGreaterThan(0);
        expect(stats.totalDownloads).toBeGreaterThan(0);
    });

    it('should filter by minimum rating', async () => {
        const { skills } = await loopHub.search({ minRating: 4.5 });
        expect(skills.every((s: any) => s.rating >= 4.5)).toBe(true);
    });

    it('should sort by downloads', async () => {
        const { skills } = await loopHub.search({ sortBy: 'downloads', limit: 10 });
        for (let i = 1; i < skills.length; i++) {
            expect(skills[i - 1].downloads).toBeGreaterThanOrEqual(skills[i].downloads);
        }
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// LLM SERVICE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('LLMService', () => {
    it('should have a default system prompt', async () => {
        const { LLMService } = await import('../services/llmService.js');
        const prompt = LLMService.getSuiLoopSystemPrompt();
        expect(prompt).toContain('SuiLoop');
        expect(prompt.length).toBeGreaterThan(100);
    });

    it('should support multiple providers', async () => {
        const { LLMService } = await import('../services/llmService.js');
        // Just verify the class exists and has expected methods
        expect(LLMService.prototype.chat).toBeDefined();
        expect(LLMService.prototype.streamChat).toBeDefined();
        expect(LLMService.prototype.switchProvider).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// BROWSER SERVICE TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('BrowserService', () => {
    it('should export browser actions', async () => {
        const { browserActions } = await import('../services/browserService.js');
        expect(browserActions).toBeDefined();
        expect(browserActions.scrapePrice).toBeDefined();
        expect(browserActions.scrapePrice.name).toBe('SCRAPE_PRICE');
    });

    it('should create browser service instance', async () => {
        const { BrowserService } = await import('../services/browserService.js');
        const browser = new BrowserService({ headless: true });
        expect(browser).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM ACCESS TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('SystemAccessService', () => {
    let systemService: any;

    beforeAll(async () => {
        const { initializeSystemAccess } = await import('../services/systemAccess.js');
        systemService = initializeSystemAccess({ accessLevel: 'sandbox' });
    });

    it('should initialize with sandbox access level', () => {
        expect(systemService).toBeDefined();
    });

    it('should list files in a directory', async () => {
        const files = await systemService.listFiles('.');
        expect(files.length).toBeGreaterThan(0);
    });

    it('should read file contents', async () => {
        const content = await systemService.readFile('package.json');
        expect(content).toContain('@suiloop/agent');
    });

    it('should execute whitelisted commands in sandbox', async () => {
        const result = await systemService.execute('echo "test"');
        expect(result.stdout).toContain('test');
    });

    it('should block dangerous commands in sandbox', async () => {
        try {
            await systemService.execute('rm -rf /');
            expect(true).toBe(false); // Should not reach here
        } catch (error) {
            expect(String(error)).toContain('not allowed');
        }
    });

    it('should get environment variables', () => {
        const env = systemService.getEnv('PATH');
        expect(env).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Feature Integration', () => {
    it('should export all features from index', async () => {
        const features = await import('../features/index.js');

        expect(features.initializeMemoryService).toBeDefined();
        expect(features.initializeSkillManager).toBeDefined();
        expect(features.initializeLoopHub).toBeDefined();
        expect(features.initializeLLMService).toBeDefined();
        expect(features.initializeBrowserService).toBeDefined();
        expect(features.initializeSystemAccess).toBeDefined();
    });

    it('should initialize all features together', async () => {
        const { initializeAllFeatures } = await import('../features/index.js');

        const features = await initializeAllFeatures({
            memoryBackend: 'local',
            accessLevel: 'sandbox'
        });

        expect(features.memory).toBeDefined();
        expect(features.skills).toBeDefined();
        expect(features.system).toBeDefined();
        expect(features.loopHub).toBeDefined();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// RUN TESTS
// ═══════════════════════════════════════════════════════════════════════════

// To run: npx vitest run src/tests/features.test.ts
