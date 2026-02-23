/**
 * Subscription System
 * Allows external agents to subscribe to trading signals and opportunities
 */

import { WebSocket, WebSocketServer } from 'ws';
import crypto from 'crypto';
import { triggerWebhooks, WebhookEvent } from './webhookService.js';

// Signal types
export type SignalType =
    | 'arbitrage_opportunity'
    | 'price_deviation'
    | 'liquidity_change'
    | 'gas_spike'
    | 'flash_loan_opportunity'
    | 'strategy_trigger';

export interface Signal {
    id: string;
    type: SignalType;
    pair: string;
    data: {
        expectedProfit?: number;
        profitPercentage?: number;
        urgency: 'low' | 'medium' | 'high' | 'critical';
        confidence: number; // 0-100
        timeToLive: number; // seconds
        details: Record<string, any>;
    };
    timestamp: Date;
    expiresAt: Date;
}

export interface Subscription {
    id: string;
    userId: string;
    signalTypes: SignalType[];
    minConfidence: number;
    minProfitPercentage?: number;
    pairs?: string[]; // Filter by trading pairs
    isActive: boolean;
    createdAt: Date;
    lastSignalAt: Date | null;
    signalCount: number;
    connection?: WebSocket;
    connectionType: 'websocket' | 'webhook' | 'both';
}

// Stores
const subscriptions: Map<string, Subscription> = new Map();
const recentSignals: Signal[] = [];
const systemLogs: any[] = []; // Buffer for system logs
const MAX_RECENT_SIGNALS = 100;
const MAX_RECENT_LOGS = 50;

// WebSocket server reference
let wss: WebSocketServer | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeSubscriptionServer(server: any): WebSocketServer {
    wss = new WebSocketServer({ server, path: '/ws/signals' });

    // Start Walrus Archiving Loop
    setInterval(() => {
        uploadLogsToWalrus().catch(err => console.error('Walrus background task failed:', err));
    }, LOG_UPLOAD_INTERVAL);

    wss.on('connection', (ws, req) => {
        console.log('🔌 New WebSocket connection');

        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            message: 'Connected to SuiLoop Signal Stream',
            timestamp: new Date().toISOString()
        }));

        // Send recent logs history immediately
        if (systemLogs.length > 0) {
            systemLogs.forEach(logEntry => {
                ws.send(JSON.stringify(logEntry));
            });
        }

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                handleWebSocketMessage(ws, message);
            } catch (error) {
                ws.send(JSON.stringify({ type: 'error', message: 'Invalid JSON' }));
            }
        });

        ws.on('close', () => {
            // Remove subscription connection
            subscriptions.forEach((sub) => {
                if (sub.connection === ws) {
                    sub.connection = undefined;
                    console.log(`🔌 Subscription ${sub.id} disconnected`);
                }
            });
        });

        ws.on('error', (error) => {
            console.error('WebSocket error:', error);
        });
    });

    console.log('📡 WebSocket server initialized on /ws/signals');
    return wss;
}

/**
 * Handle incoming WebSocket messages
 */
function handleWebSocketMessage(ws: WebSocket, message: any) {
    switch (message.type) {
        case 'subscribe':
            handleSubscribeMessage(ws, message);
            break;
        case 'unsubscribe':
            handleUnsubscribeMessage(ws, message);
            break;
        case 'ping':
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
            break;
        case 'get_recent':
            ws.send(JSON.stringify({
                type: 'recent_signals',
                signals: recentSignals.slice(-10)
            }));
            break;
        default:
            ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
    }
}

/**
 * Handle subscribe message via WebSocket
 */
function handleSubscribeMessage(ws: WebSocket, message: any) {
    const { subscriptionId, apiKey } = message;

    const subscription = subscriptions.get(subscriptionId);
    if (!subscription) {
        ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid subscription ID'
        }));
        return;
    }

    subscription.connection = ws;
    subscription.isActive = true;

    ws.send(JSON.stringify({
        type: 'subscribed',
        subscriptionId,
        signalTypes: subscription.signalTypes,
        message: 'Successfully subscribed to signals'
    }));

    console.log(`✅ Subscription ${subscriptionId} connected via WebSocket`);
}

/**
 * Handle unsubscribe message
 */
function handleUnsubscribeMessage(ws: WebSocket, message: any) {
    const { subscriptionId } = message;

    const subscription = subscriptions.get(subscriptionId);
    if (subscription && subscription.connection === ws) {
        subscription.connection = undefined;
        ws.send(JSON.stringify({
            type: 'unsubscribed',
            subscriptionId,
            message: 'Successfully unsubscribed'
        }));
    }
}

/**
 * Create a new subscription
 */
export function createSubscription(
    userId: string,
    options: {
        signalTypes: SignalType[];
        minConfidence?: number;
        minProfitPercentage?: number;
        pairs?: string[];
        connectionType?: 'websocket' | 'webhook' | 'both';
    }
): Subscription {
    const id = `sub_${crypto.randomBytes(16).toString('hex')}`;

    const subscription: Subscription = {
        id,
        userId,
        signalTypes: options.signalTypes,
        minConfidence: options.minConfidence || 50,
        minProfitPercentage: options.minProfitPercentage,
        pairs: options.pairs,
        isActive: true,
        createdAt: new Date(),
        lastSignalAt: null,
        signalCount: 0,
        connectionType: options.connectionType || 'websocket'
    };

    subscriptions.set(id, subscription);

    console.log(`📋 Subscription created: ${id} for ${options.signalTypes.join(', ')}`);

    return subscription;
}

/**
 * Delete a subscription
 */
export function deleteSubscription(id: string, userId: string): boolean {
    const subscription = subscriptions.get(id);

    if (subscription && subscription.userId === userId) {
        if (subscription.connection) {
            subscription.connection.close();
        }
        subscriptions.delete(id);
        console.log(`🗑️ Subscription deleted: ${id}`);
        return true;
    }

    return false;
}

/**
 * Get user's subscriptions
 */
export function getUserSubscriptions(userId: string): Omit<Subscription, 'connection'>[] {
    const userSubs: Omit<Subscription, 'connection'>[] = [];

    subscriptions.forEach((sub) => {
        if (sub.userId === userId) {
            const { connection, ...safeSub } = sub;
            userSubs.push(safeSub);
        }
    });

    return userSubs;
}

/**
 * Broadcast a signal to all matching subscribers
 */
export async function broadcastSignal(signal: Signal): Promise<{
    websocketDelivered: number;
    webhookTriggered: number;
}> {
    const results = {
        websocketDelivered: 0,
        webhookTriggered: 0
    };

    // Store in recent signals
    recentSignals.push(signal);
    if (recentSignals.length > MAX_RECENT_SIGNALS) {
        recentSignals.shift();
    }

    // Broadcast to matching subscribers
    subscriptions.forEach((subscription) => {
        if (!subscription.isActive) return;

        // Check signal type match
        if (!subscription.signalTypes.includes(signal.type)) return;

        // Check confidence threshold
        if (signal.data.confidence < subscription.minConfidence) return;

        // Check profit threshold
        if (
            subscription.minProfitPercentage &&
            signal.data.profitPercentage &&
            signal.data.profitPercentage < subscription.minProfitPercentage
        ) return;

        // Check pair filter
        if (subscription.pairs && subscription.pairs.length > 0) {
            if (!subscription.pairs.includes(signal.pair)) return;
        }

        // Deliver via WebSocket
        if (subscription.connection && subscription.connection.readyState === WebSocket.OPEN) {
            try {
                subscription.connection.send(JSON.stringify({
                    type: 'signal',
                    signal
                }));
                subscription.lastSignalAt = new Date();
                subscription.signalCount++;
                results.websocketDelivered++;
            } catch (error) {
                console.error(`Failed to send signal to ${subscription.id}:`, error);
            }
        }

        // Also trigger webhook if configured
        if (subscription.connectionType === 'webhook' || subscription.connectionType === 'both') {
            // This will be handled by webhook service
            results.webhookTriggered++;
        }
    });

    // Trigger webhooks for the event
    if (results.webhookTriggered > 0 || true) {
        await triggerWebhooks('opportunity.detected', {
            signal: {
                id: signal.id,
                type: signal.type,
                pair: signal.pair,
                confidence: signal.data.confidence,
                profitPercentage: signal.data.profitPercentage,
                urgency: signal.data.urgency
            }
        });
    }

    console.log(`📡 Signal broadcasted: ${signal.type} - WS: ${results.websocketDelivered}, Webhooks: ${results.webhookTriggered}`);

    return results;
}

/**
 * Create and broadcast a signal
 */
export function emitSignal(
    type: SignalType,
    pair: string,
    data: Omit<Signal['data'], 'urgency'> & { urgency?: Signal['data']['urgency'] }
): Signal {
    const now = new Date();
    const signal: Signal = {
        id: `sig_${crypto.randomBytes(8).toString('hex')}`,
        type,
        pair,
        data: {
            urgency: data.urgency || 'medium',
            ...data
        },
        timestamp: now,
        expiresAt: new Date(now.getTime() + (data.timeToLive || 60) * 1000)
    };

    // Broadcast asynchronously
    broadcastSignal(signal).catch(console.error);

    return signal;
}

/**
 * Get subscription statistics
 */
export function getSubscriptionStats(): {
    total: number;
    active: number;
    connected: number;
    byType: Record<SignalType, number>;
    totalSignalsSent: number;
} {
    const stats = {
        total: subscriptions.size,
        active: 0,
        connected: 0,
        byType: {} as Record<SignalType, number>,
        totalSignalsSent: 0
    };

    subscriptions.forEach((sub) => {
        if (sub.isActive) stats.active++;
        if (sub.connection && sub.connection.readyState === WebSocket.OPEN) stats.connected++;
        stats.totalSignalsSent += sub.signalCount;

        sub.signalTypes.forEach((type) => {
            stats.byType[type] = (stats.byType[type] || 0) + 1;
        });
    });

    return stats;
}

/**
 * Get recent signals
 */
export function getRecentSignals(limit = 10): Signal[] {
    return recentSignals.slice(-limit);
}

/**
 * Broadcast a system log to all connected clients
 */


// ----------------------------------------------------------------------------
// WALRUS DECENTRALIZED LOGGING
// ----------------------------------------------------------------------------

import axios from 'axios';

const WALRUS_PUBLISHER = 'https://publisher.walrus-testnet.walrus.space';
const LOG_UPLOAD_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Upload collected logs to Walrus (Decentralized Storage)
 */
async function uploadLogsToWalrus() {
    if (systemLogs.length === 0) return;

    // Create a snapshot of logs to upload
    const logsSnapshot = [...systemLogs];
    const payload = JSON.stringify({
        timestamp: new Date().toISOString(),
        count: logsSnapshot.length,
        logs: logsSnapshot
    }, null, 2);

    console.log(`🦭 Archiving ${logsSnapshot.length} logs to Walrus decentralized storage...`);

    try {
        // Current Walrus Testnet Publisher API (v1/blobs)
        const response = await axios.put(`${WALRUS_PUBLISHER}/v1/blobs?epochs=5`, payload, {
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.data && (response.data.newlyCreated || response.data.alreadyCertified)) {
            const blobId = response.data.newlyCreated?.blobObject?.blobId ||
                response.data.alreadyCertified?.blobId;

            console.log(`✅ Logs successfully archived to Walrus! Blob ID: ${blobId}`);

            // Broadcast this system event so the frontend knows logs are safe
            broadcastLog('success', `Logs archived to Walrus (Blob: ${blobId?.slice(0, 10)}...)`, {
                blobId,
                explorerUrl: `https://walruscan.com/testnet/blob/${blobId}`
            });
        }
    } catch (error: any) {
        console.warn(`⚠️ Failed to upload logs to Walrus: ${error.message}`);
        // We do not clear logs on failure, they remain in memory/disk fallback
    }
}


/**
 * Broadcast a system log to all connected clients
 */
export function broadcastLog(level: 'info' | 'warn' | 'error' | 'success', message: string, details?: any) {
    if (!wss) return;

    const logMessage = JSON.stringify({
        type: 'system_log',
        log: {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            level,
            message,
            details
        }
    });

    // Store in history
    systemLogs.push(JSON.parse(logMessage));
    if (systemLogs.length > MAX_RECENT_LOGS) {
        systemLogs.shift();
    }

    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(logMessage);
        }
    });
}
