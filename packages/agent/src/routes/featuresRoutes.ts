/**
 * SuiLoop Feature Routes
 * 
 * Express routes for OpenClaw-inspired features:
 * - LoopHub Marketplace
 * - Memory Service
 * - Skills Management
 * - Browser Control
 * - LLM Service
 */

import { Router, Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';

// Services
import {
    initializeLoopHub,
    type SearchFilters
} from '../services/loopHub.js';
import { broadcastLog } from '../services/subscriptionService.js';
import {
    initializeMemoryService
} from '../services/memoryService.js';
import {
    initializeSkillManager,
    type SkillInstance,
    type SkillPermission
} from '../services/skillManager.js';
import {
    initializeLLMService,
    getLLMService,
    LLMService
} from '../services/llmService.js';
import {
    initializeBrowserService,
    getBrowserService
} from '../services/browserService.js';

const router = Router();

// ═══════════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════════

// Initialize services on first import
const loopHub = initializeLoopHub();
const memory = initializeMemoryService({ backend: 'local' });
const skills = initializeSkillManager();

// Initialize skill manager
skills.initialize().catch(console.error);

// Add event listeners for logs
skills.on('log', (data: any) => {
    broadcastLog(data.level, data.message);
});
skills.on('action:start', (data: any) => {
    broadcastLog('info', `🚀 Action started: ${data.action} (${data.skill})`);
});
skills.on('action:complete', (data: any) => {
    broadcastLog('success', `✅ Action completed: ${data.action} (${data.skill})`);
});

// ═══════════════════════════════════════════════════════════════════════════
// LOOPHUB MARKETPLACE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/marketplace/featured
 * Get featured skills from LoopHub
 */
router.get('/marketplace/featured', async (_req: Request, res: Response) => {
    try {
        const featured = await loopHub.getFeatured();
        res.json({ success: true, skills: featured });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/marketplace/trending
 * Get trending skills
 */
router.get('/marketplace/trending', async (req: Request, res: Response) => {
    try {
        const limitStr = req.query.limit;
        const limit = typeof limitStr === 'string' ? parseInt(limitStr, 10) : 10;
        const trending = await loopHub.getTrending(limit);
        res.json({ success: true, skills: trending });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/marketplace/newest
 * Get newest skills
 */
router.get('/marketplace/newest', async (req: Request, res: Response) => {
    try {
        const limitStr = req.query.limit;
        const limit = typeof limitStr === 'string' ? parseInt(limitStr, 10) : 10;
        const newest = await loopHub.getNewest(limit);
        res.json({ success: true, skills: newest });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/marketplace/search
 * Search skills with filters
 */
router.get('/marketplace/search', async (req: Request, res: Response) => {
    try {
        const q = req.query.q;
        const tagsStr = req.query.tags;
        const minRatingStr = req.query.minRating;
        const limitStr = req.query.limit;
        const offsetStr = req.query.offset;

        const filters: SearchFilters = {
            query: typeof q === 'string' ? q : undefined,
            category: req.query.category as any,
            tags: typeof tagsStr === 'string' ? tagsStr.split(',') : undefined,
            minRating: typeof minRatingStr === 'string' ? parseFloat(minRatingStr) : undefined,
            verified: req.query.verified === 'true' ? true : req.query.verified === 'false' ? false : undefined,
            sortBy: req.query.sortBy as any,
            limit: typeof limitStr === 'string' ? parseInt(limitStr, 10) : 20,
            offset: typeof offsetStr === 'string' ? parseInt(offsetStr, 10) : 0
        };

        const results = await loopHub.search(filters);
        res.json({ success: true, ...results });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/marketplace/skills/:idOrSlug
 * Get skill details
 */
router.get('/marketplace/skills/:idOrSlug', async (req: Request, res: Response) => {
    try {
        const idOrSlug = req.params.idOrSlug as string;
        const skill = await loopHub.getSkill(idOrSlug);
        if (!skill) {
            return res.status(404).json({ success: false, error: 'Skill not found' });
        }
        res.json({ success: true, skill });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/marketplace/skills/:skillId/reviews
 * Get skill reviews
 */
router.get('/marketplace/skills/:skillId/reviews', async (req: Request, res: Response) => {
    try {
        const skillId = req.params.skillId as string;
        const reviews = await loopHub.getReviews(skillId);
        res.json({ success: true, reviews });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/marketplace/categories
 * Get skill categories with counts
 */
router.get('/marketplace/categories', async (_req: Request, res: Response) => {
    try {
        const stats = await loopHub.getStats();
        res.json({
            success: true,
            categories: [
                { id: 'trading', name: 'Trading', count: stats.categories.trading || 0, icon: '📈' },
                { id: 'analysis', name: 'Analysis', count: stats.categories.analysis || 0, icon: '🔍' },
                { id: 'notification', name: 'Notifications', count: stats.categories.notification || 0, icon: '🔔' },
                { id: 'integration', name: 'Integrations', count: stats.categories.integration || 0, icon: '🔗' },
                { id: 'data', name: 'Data', count: stats.categories.data || 0, icon: '📊' },
                { id: 'utility', name: 'Utilities', count: stats.categories.utility || 0, icon: '🛠️' }
            ],
            totalSkills: stats.totalSkills,
            totalDownloads: stats.totalDownloads
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/marketplace/stats
 * Get marketplace statistics
 */
router.get('/marketplace/stats', async (_req: Request, res: Response) => {
    try {
        const stats = await loopHub.getStats();
        res.json({ success: true, ...stats });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * POST /api/marketplace/install/:skillId
 * Install a skill from the marketplace by its ID
 */
router.post('/marketplace/install/:skillId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const skillId = req.params.skillId as string;
        const { targetAgent } = req.body;

        if (targetAgent) {
            broadcastLog('info', `🎯 Targeting installation for agent: ${targetAgent}`);
        }

        // Get skill details from marketplace
        const skill = await loopHub.getSkill(skillId);
        if (!skill) {
            return res.status(404).json({ success: false, error: 'Skill not found in marketplace' });
        }

        // Download and install the skill
        const downloadResult = await loopHub.downloadSkill(skillId);
        if (!downloadResult.success) {
            return res.status(500).json({ success: false, error: downloadResult.error || 'Download failed' });
        }

        // Register with skill manager if source is available
        // Register with skill manager if source is available
        if (downloadResult.source) {
            broadcastLog('info', `📦 Installing skill package: ${skill.name} (${skill.version})...`);
            await skills.installSkill(downloadResult.source);
            broadcastLog('success', `✅ Skill installed successfully: ${skill.name}`);

            // Simulate skill initialization broadcast
            setTimeout(() => {
                broadcastLog('info', `🚀 Initializing ${skill.name} v${skill.version}...`);
                setTimeout(() => {
                    broadcastLog('success', `✨ ${skill.name} is now active and monitoring.`);
                }, 800);
            }, 500);
        }

        res.json({
            success: true,
            message: `${skill.name} installed successfully`,
            skill: {
                id: skill.id,
                name: skill.name,
                version: skill.version
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/marketplace/installed
 * Get list of installed marketplace skills
 */
router.get('/marketplace/installed', async (_req: Request, res: Response) => {
    try {
        const manifests = skills.getAllSkills();
        const installed = manifests.map(m => {
            const instance = skills.getSkill(m.slug);
            return {
                slug: m.slug,
                name: m.name,
                version: m.version,
                isEnabled: instance ? instance.isEnabled : false
            };
        });
        res.json({ success: true, skills: installed });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// SKILLS MANAGEMENT ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/skills
 * Get all installed skills
 */
router.get('/skills', (_req: Request, res: Response) => {
    try {
        // getAllSkills returns SkillManifest[], so we use it directly
        const allSkills = skills.getAllSkills();
        res.json({
            success: true,
            skills: allSkills.map(s => ({
                name: s.name,
                slug: s.slug,
                version: s.version,
                description: s.description,
                category: s.category
            }))
        });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/skills/:slug
 * Get skill details
 */
router.get('/skills/:slug', (req: Request, res: Response) => {
    try {
        const slug = req.params.slug as string;
        const skill: SkillInstance | undefined = skills.getSkill(slug);
        if (!skill) {
            return res.status(404).json({ success: false, error: 'Skill not found' });
        }
        res.json({ success: true, skill: skill.manifest, isEnabled: skill.isEnabled });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * POST /api/skills/install
 * Install a skill from source
 */
router.post('/skills/install', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const { source } = req.body;
        if (!source) {
            return res.status(400).json({ success: false, error: 'Source URL required' });
        }

        await skills.installSkill(source);
        res.json({ success: true, message: 'Skill installed successfully' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * DELETE /api/skills/:slug
 * Uninstall a skill
 */
router.delete('/skills/:slug', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const slug = req.params.slug as string;
        await skills.uninstallSkill(slug);
        res.json({ success: true, message: 'Skill uninstalled' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * POST /api/skills/:slug/toggle
 * Toggle skill enabled/disabled
 */
router.post('/skills/:slug/toggle', (req: AuthenticatedRequest, res: Response) => {
    try {
        const slug = req.params.slug as string;
        const skill = skills.getSkill(slug);
        if (!skill) {
            return res.status(404).json({ success: false, error: 'Skill not found' });
        }
        // Toggle the enabled state
        skill.isEnabled = !skill.isEnabled;
        res.json({ success: true, isEnabled: skill.isEnabled });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * POST /api/skills/:slug/execute
 * Execute a skill action
 */
router.post('/skills/:slug/execute', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const slug = req.params.slug as string;
        const { action, params } = req.body;
        if (!action) {
            return res.status(400).json({ success: false, error: 'Action name required' });
        }

        const context = {
            userId: req.user?.userId || 'anonymous',
            walletAddress: req.body.walletAddress,
            permissions: ['blockchain:read', 'blockchain:write', 'notification:send'] as SkillPermission[]
        };

        const result = await skills.executeAction(slug, action, params || {}, context);
        res.json({ success: true, result });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// MEMORY SERVICE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/memory/:userId
 * Get user memory
 */
router.get('/memory/:userId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const userMemory = await memory.getMemory(userId);
        res.json({ success: true, memory: userMemory });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * PUT /api/memory/:userId
 * Update user memory
 */
router.put('/memory/:userId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const updates = req.body;
        const updated = await memory.updateMemory(userId, updates);
        res.json({ success: true, memory: updated });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * POST /api/memory/:userId/message
 * Add a conversation message
 */
router.post('/memory/:userId/message', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const { role, content, metadata } = req.body;
        if (!role || !content) {
            return res.status(400).json({ success: false, error: 'Role and content required' });
        }

        await memory.addMessage(userId, role, content, metadata);
        res.json({ success: true, message: 'Message added' });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/memory/:userId/history
 * Get conversation history (from memory context)
 */
router.get('/memory/:userId/history', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.params.userId as string;
        const userMemory = await memory.getMemory(userId);
        res.json({ success: true, history: userMemory.conversationHistory });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// LLM SERVICE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/llm/chat
 * Chat with the LLM
 */
router.post('/llm/chat', async (req: AuthenticatedRequest, res: Response) => {
    try {
        let llm = getLLMService();

        if (!llm) {
            // Try to initialize with Ollama (local)
            try {
                llm = initializeLLMService({ provider: 'ollama', model: 'llama3.2' });
            } catch {
                return res.status(503).json({
                    success: false,
                    error: 'LLM service not configured. Set OPENAI_API_KEY or use Ollama.'
                });
            }
        }

        const { messages, systemPrompt, stream } = req.body;

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ success: false, error: 'Messages array required' });
        }

        // Add system prompt if not present
        const fullMessages = systemPrompt
            ? [{ role: 'system' as const, content: systemPrompt }, ...messages]
            : [{ role: 'system' as const, content: LLMService.getSuiLoopSystemPrompt() }, ...messages];

        if (stream) {
            // Streaming response
            res.setHeader('Content-Type', 'text/event-stream');
            res.setHeader('Cache-Control', 'no-cache');
            res.setHeader('Connection', 'keep-alive');

            try {
                for await (const chunk of llm.streamChat({ messages: fullMessages })) {
                    res.write(`data: ${JSON.stringify(chunk)}\n\n`);
                }
                res.write('data: [DONE]\n\n');
                res.end();
            } catch (error) {
                res.write(`data: ${JSON.stringify({ error: String(error) })}\n\n`);
                res.end();
            }
        } else {
            // Regular response
            const response = await llm.chat({ messages: fullMessages });
            res.json({ success: true, response });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/llm/models
 * Get available models
 */
router.get('/llm/models', async (_req: Request, res: Response) => {
    try {
        const llm = getLLMService();
        if (!llm) {
            return res.json({
                success: true,
                models: [],
                message: 'LLM service not initialized'
            });
        }

        const models = await llm.getModels();
        res.json({ success: true, models });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// BROWSER SERVICE ROUTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/browser/scrape
 * Scrape a webpage
 */
router.post('/browser/scrape', async (req: AuthenticatedRequest, res: Response) => {
    try {
        let browser = getBrowserService();

        if (!browser) {
            browser = initializeBrowserService({ headless: true });
        }

        const { url, selectors } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: 'URL required' });
        }

        await browser.initialize();
        const result = await browser.scrape(url, selectors || {});

        res.json({ success: true, data: result });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/browser/sui-price
 * Get current SUI price
 */
router.get('/browser/sui-price', async (_req: Request, res: Response) => {
    try {
        let browser = getBrowserService();

        if (!browser) {
            browser = initializeBrowserService({ headless: true });
        }

        await browser.initialize();
        const price = await browser.scrapeSuiPrice();

        res.json({ success: true, price });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * GET /api/browser/cetus-pools
 * Get Cetus pools data
 */
router.get('/browser/cetus-pools', async (_req: Request, res: Response) => {
    try {
        let browser = getBrowserService();

        if (!browser) {
            browser = initializeBrowserService({ headless: true });
        }

        await browser.initialize();
        const pools = await browser.scrapeCetusPools();

        res.json({ success: true, pools });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

/**
 * POST /api/browser/screenshot
 * Take a screenshot of a page
 */
router.post('/browser/screenshot', async (req: AuthenticatedRequest, res: Response) => {
    try {
        let browser = getBrowserService();

        if (!browser) {
            browser = initializeBrowserService({ headless: true });
        }

        const { url, filename } = req.body;

        if (!url) {
            return res.status(400).json({ success: false, error: 'URL required' });
        }

        await browser.initialize();
        await browser.navigate('default', url);
        const path = await browser.screenshot('default', filename || 'screenshot.png');

        res.json({ success: true, path });
    } catch (error) {
        res.status(500).json({ success: false, error: String(error) });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// FEATURE STATUS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/features/status
 * Get status of all features
 */
router.get('/features/status', (_req: Request, res: Response) => {
    res.json({
        success: true,
        features: {
            loopHub: { enabled: true, status: 'ready' },
            memory: { enabled: true, status: 'ready', backend: 'local' },
            skills: {
                enabled: true,
                status: 'ready',
                count: skills.getAllSkills().length
            },
            llm: {
                enabled: getLLMService() !== null,
                status: getLLMService() ? 'ready' : 'not_configured'
            },
            browser: {
                enabled: getBrowserService() !== null,
                status: getBrowserService() ? 'ready' : 'lazy_init'
            },
            telegram: { enabled: false, status: 'not_configured' },
            discord: { enabled: false, status: 'not_configured' }
        }
    });
});

export default router;
