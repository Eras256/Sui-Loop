/**
 * SuiLoop Agent API Server v2.0
 * Complete Autonomous Agent with:
 * - API Key / JWT Authentication
 * - Rate Limiting
 * - Webhooks
 * - Subscription System (WebSocket)
 * - Autonomous Market Loop
 */

import express, { Request, Response } from 'express';
import cors from 'cors';
import http from 'http';
import * as dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Core Actions
import { executeAtomicLeverage } from './actions/executeAtomicLeverage.js';
import { executeBuilderStrategy } from './actions/executeBuilderStrategy.js';

// Middleware
import {
    authMiddleware,
    AuthenticatedRequest,
    generateApiKey,
    generateJWT,
    getUserApiKeys,
    revokeApiKey,
    initializeDefaultKeys,
    requirePermission
} from './middleware/auth.js';
import {
    standardRateLimiter,
    strictRateLimiter,
    lenientRateLimiter,
    getRateLimitStats,
    clearAllRateLimits
} from './middleware/rateLimit.js';

// Services
import {
    registerWebhook,
    unregisterWebhook,
    getUserWebhooks,
    testWebhook,
    getWebhookStats,
    triggerWebhooks,
    WebhookEvent
} from './services/webhookService.js';
import {
    initializeSubscriptionServer,
    createSubscription,
    deleteSubscription,
    getUserSubscriptions,
    getSubscriptionStats,
    getRecentSignals,
    SignalType
} from './services/subscriptionService.js';
import {
    startAutonomousLoop,
    stopAutonomousLoop,
    getLoopStatus,
    updateConfig,
    triggerManualScan,
    getMarketState
} from './services/autonomousLoop.js';

import { Database } from './types/database.types';

dotenv.config();

// Initialize Supabase Client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = (supabaseUrl && supabaseKey)
    ? createClient<Database>(supabaseUrl, supabaseKey)
    : null;

// Express app
const app = express();
const port = process.env.PORT || 3001;

// Create HTTP server for WebSocket support
const server = http.createServer(app);

// Middleware
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json());

// Initialize systems
initializeDefaultKeys();

// Mock runtime
const mockRuntime = {
    getSetting: (key: string): string | undefined => {
        return process.env[key];
    },
    composeState: async () => ({}),
};

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC ENDPOINTS (No Auth Required)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Health Check
 */
app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        agent: 'SuiLoop Agent v2.0',
        timestamp: new Date().toISOString(),
        autonomous: getLoopStatus().isRunning
    });
});

/**
 * Server Info
 */
app.get('/api/info', lenientRateLimiter, (req: Request, res: Response) => {
    res.json({
        name: 'SuiLoop Autonomous Agent',
        version: '2.0.0',
        features: [
            'api_authentication',
            'rate_limiting',
            'webhooks',
            'websocket_subscriptions',
            'autonomous_loop'
        ],
        endpoints: {
            public: ['/health', '/api/info'],
            authenticated: ['/api/execute', '/api/webhooks', '/api/subscriptions', '/api/loop']
        },
        documentation: 'https://github.com/Eras256/Sui-Loop'
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTHENTICATION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Generate API Key (requires existing auth or signup)
 */
app.post('/api/auth/keys', authMiddleware, strictRateLimiter, (req: AuthenticatedRequest, res: Response) => {
    const { name, permissions } = req.body;

    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { key, record } = generateApiKey(
        req.user.userId,
        name || 'Unnamed Key',
        permissions || ['execute', 'subscribe']
    );

    res.json({
        success: true,
        apiKey: key, // Only shown once!
        keyInfo: {
            name: record.name,
            permissions: record.permissions,
            createdAt: record.createdAt
        },
        warning: 'Save this API key - it won\'t be shown again!'
    });
});

/**
 * List API Keys
 */
app.get('/api/auth/keys', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const keys = getUserApiKeys(req.user.userId);
    res.json({ success: true, keys });
});

/**
 * Revoke API Key
 */
app.delete('/api/auth/keys/:keyPartial', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const revoked = revokeApiKey(req.params.keyPartial as string, req.user.userId);
    res.json({ success: revoked });
});

/**
 * Generate JWT Token
 */
app.post('/api/auth/token', strictRateLimiter, (req: Request, res: Response) => {
    const { walletAddress, signature } = req.body;

    // In production, verify signature with wallet
    if (!walletAddress) {
        return res.status(400).json({ success: false, error: 'Wallet address required' });
    }

    const token = generateJWT(walletAddress, ['execute', 'subscribe']);

    res.json({
        success: true,
        token,
        expiresIn: '24h'
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// EXECUTION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Execute Strategy
 */
app.post('/api/execute', authMiddleware, standardRateLimiter, requirePermission('execute'), async (req: AuthenticatedRequest, res: Response) => {
    const { strategy, params } = req.body;

    console.log(`\n🚀 [${req.user?.userId}] Execution request: ${strategy}`);

    // Log to Supabase
    if (supabase) {
        await supabase.from('agent_logs').insert({
            level: 'info',
            message: `Execution started: ${strategy}`,
            details: { userId: req.user?.userId, params }
        } as any);
    }

    // Trigger webhook
    await triggerWebhooks('execution.started', {
        strategy,
        userId: req.user?.userId,
        params
    }, req.user?.userId);

    const mockMessage = {
        content: { text: `Execute ${strategy}` },
        userId: req.user?.userId || 'api-user',
        agentId: 'suiloop-agent',
        roomId: 'api-room',
    };

    try {
        const isValid = await executeAtomicLeverage.validate(mockRuntime as any, mockMessage as any);
        if (!isValid) {
            return res.status(400).json({ success: false, error: 'Validation failed' });
        }

        const isCustomBuilder = params?.config?.nodes?.length > 0;
        const handlerToUse = isCustomBuilder ? executeBuilderStrategy : executeAtomicLeverage;

        if (isCustomBuilder) {
            (mockMessage.content as any).nodes = params.config.nodes;
            (mockMessage.content as any).strategyName = params.config.displayName || strategy;
        }

        const logs: string[] = [];
        const callback = async (response: { text: string }) => {
            logs.push(response.text);
            return [];
        };

        const result = await handlerToUse.handler(
            mockRuntime as any,
            mockMessage as any,
            undefined,
            {},
            callback as any
        );

        // Trigger success webhook
        await triggerWebhooks('execution.completed', {
            strategy,
            result,
            logs
        }, req.user?.userId);

        res.json({ success: true, result, logs });

    } catch (error) {
        // Trigger failure webhook
        await triggerWebhooks('execution.failed', {
            strategy,
            error: String(error)
        }, req.user?.userId);

        res.status(500).json({ success: false, error: String(error) });
    }
});

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOK ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Register Webhook
 */
app.post('/api/webhooks', authMiddleware, standardRateLimiter, requirePermission('subscribe'), (req: AuthenticatedRequest, res: Response) => {
    const { url, events } = req.body;

    if (!url || !events || !Array.isArray(events)) {
        return res.status(400).json({ success: false, error: 'URL and events array required' });
    }

    const validEvents: WebhookEvent[] = [
        'opportunity.detected', 'execution.started', 'execution.completed',
        'execution.failed', 'strategy.activated', 'strategy.deactivated',
        'market.alert', 'health.warning'
    ];

    const invalidEvents = events.filter((e: string) => !validEvents.includes(e as WebhookEvent));
    if (invalidEvents.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Invalid events: ${invalidEvents.join(', ')}`,
            validEvents
        });
    }

    const { id, secret } = registerWebhook(req.user!.userId, url, events);

    res.json({
        success: true,
        webhookId: id,
        secret,
        warning: 'Save the secret - it won\'t be shown again!'
    });
});

/**
 * List Webhooks
 */
app.get('/api/webhooks', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const webhooks = getUserWebhooks(req.user!.userId);
    res.json({ success: true, webhooks });
});

/**
 * Delete Webhook
 */
app.delete('/api/webhooks/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const deleted = unregisterWebhook(req.params.id as string, req.user!.userId);
    res.json({ success: deleted });
});

/**
 * Test Webhook
 */
app.post('/api/webhooks/:id/test', authMiddleware, strictRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
    const result = await testWebhook(req.params.id as string, req.user!.userId);
    res.json(result);
});

// ═══════════════════════════════════════════════════════════════════════════
// SUBSCRIPTION ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create Subscription
 */
app.post('/api/subscriptions', authMiddleware, standardRateLimiter, requirePermission('subscribe'), (req: AuthenticatedRequest, res: Response) => {
    const { signalTypes, minConfidence, minProfitPercentage, pairs, connectionType } = req.body;

    if (!signalTypes || !Array.isArray(signalTypes)) {
        return res.status(400).json({ success: false, error: 'signalTypes array required' });
    }

    const validTypes: SignalType[] = [
        'arbitrage_opportunity', 'price_deviation', 'liquidity_change',
        'gas_spike', 'flash_loan_opportunity', 'strategy_trigger'
    ];

    const invalidTypes = signalTypes.filter((t: string) => !validTypes.includes(t as SignalType));
    if (invalidTypes.length > 0) {
        return res.status(400).json({
            success: false,
            error: `Invalid signal types: ${invalidTypes.join(', ')}`,
            validTypes
        });
    }

    const subscription = createSubscription(req.user!.userId, {
        signalTypes,
        minConfidence,
        minProfitPercentage,
        pairs,
        connectionType
    });

    res.json({
        success: true,
        subscription: {
            id: subscription.id,
            signalTypes: subscription.signalTypes,
            connectionType: subscription.connectionType
        },
        websocketUrl: `/ws/signals`,
        message: 'Connect via WebSocket and send: { "type": "subscribe", "subscriptionId": "' + subscription.id + '" }'
    });
});

/**
 * List Subscriptions
 */
app.get('/api/subscriptions', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const subscriptions = getUserSubscriptions(req.user!.userId);
    res.json({ success: true, subscriptions });
});

/**
 * Delete Subscription
 */
app.delete('/api/subscriptions/:id', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const deleted = deleteSubscription(req.params.id as string, req.user!.userId);
    res.json({ success: deleted });
});

/**
 * Get Recent Signals
 */
app.get('/api/signals/recent', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string) || 10;
    const signals = getRecentSignals(Math.min(limit, 50));
    res.json({ success: true, signals });
});

// ═══════════════════════════════════════════════════════════════════════════
// AUTONOMOUS LOOP ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Loop Status
 */
app.get('/api/loop/status', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, ...getLoopStatus() });
});

/**
 * Start Autonomous Loop
 */
app.post('/api/loop/start', authMiddleware, strictRateLimiter, requirePermission('execute'), (req: AuthenticatedRequest, res: Response) => {
    const { config } = req.body;
    const started = startAutonomousLoop(config);

    res.json({
        success: started,
        message: started ? 'Autonomous loop started' : 'Loop already running'
    });
});

/**
 * Stop Autonomous Loop
 */
app.post('/api/loop/stop', authMiddleware, requirePermission('execute'), (req: AuthenticatedRequest, res: Response) => {
    const stopped = stopAutonomousLoop();

    res.json({
        success: stopped,
        message: stopped ? 'Autonomous loop stopped' : 'Loop not running'
    });
});

/**
 * Update Loop Config
 */
app.put('/api/loop/config', authMiddleware, requirePermission('execute'), (req: AuthenticatedRequest, res: Response) => {
    const { config } = req.body;
    updateConfig(config);
    res.json({ success: true, newConfig: getLoopStatus().config });
});

/**
 * Trigger Manual Scan
 */
app.post('/api/loop/scan', authMiddleware, standardRateLimiter, requirePermission('execute'), async (req: AuthenticatedRequest, res: Response) => {
    const result = await triggerManualScan();
    res.json({ ...result });
});

/**
 * Get Market State
 */
app.get('/api/market', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
    res.json({ success: true, market: getMarketState() });
});

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get Stats (Admin)
 */
app.get('/api/admin/stats', authMiddleware, requirePermission('admin'), (req: AuthenticatedRequest, res: Response) => {
    res.json({
        success: true,
        rateLimits: getRateLimitStats(),
        webhooks: getWebhookStats(),
        subscriptions: getSubscriptionStats(),
        loop: getLoopStatus()
    });
});

/**
 * Clear Rate Limits (Admin)
 */
app.post('/api/admin/rate-limits/clear', authMiddleware, requirePermission('admin'), (req: AuthenticatedRequest, res: Response) => {
    clearAllRateLimits();
    res.json({ success: true, message: 'Rate limits cleared' });
});

// ═══════════════════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════════════════

// Initialize WebSocket server
initializeSubscriptionServer(server);

server.listen(port, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════════════════╗
║                                                                              ║
║     ███████╗██╗   ██╗██╗██╗      ██████╗  ██████╗ ██████╗                    ║
║     ██╔════╝██║   ██║██║██║     ██╔═══██╗██╔═══██╗██╔══██╗                   ║
║     ███████╗██║   ██║██║██║     ██║   ██║██║   ██║██████╔╝                   ║
║     ╚════██║██║   ██║██║██║     ██║   ██║██║   ██║██╔═══╝                    ║
║     ███████║╚██████╔╝██║███████╗╚██████╔╝╚██████╔╝██║                        ║
║     ╚══════╝ ╚═════╝ ╚═╝╚══════╝ ╚═════╝  ╚═════╝ ╚═╝                        ║
║                                                                              ║
║                    🤖 AUTONOMOUS AGENT API v2.0                              ║
║                                                                              ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  🌐 HTTP API:      http://localhost:${port}                                    ║
║  🔌 WebSocket:     ws://localhost:${port}/ws/signals                           ║
║                                                                              ║
║  📡 Features:                                                                ║
║     • API Key & JWT Authentication                                           ║
║     • Rate Limiting (60 req/min standard)                                    ║
║     • Webhook Notifications                                                  ║
║     • Real-time Signal Subscriptions                                         ║
║     • Autonomous Market Scanner                                              ║
║                                                                              ║
║  📚 Endpoints:                                                               ║
║     GET  /health              - Health check                                 ║
║     POST /api/auth/keys       - Generate API key                             ║
║     POST /api/execute         - Execute strategy                             ║
║     POST /api/webhooks        - Register webhook                             ║
║     POST /api/subscriptions   - Subscribe to signals                         ║
║     POST /api/loop/start      - Start autonomous loop                        ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
    `);
});

export { app, server };
