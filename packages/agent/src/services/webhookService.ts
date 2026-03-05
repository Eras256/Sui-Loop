/**
 * Webhook System
 * Notifies clients when opportunities are detected or executions complete
 */

import axios from 'axios';
import crypto from 'crypto';

interface WebhookSubscription {
    id: string;
    userId: string;
    url: string;
    secret: string;
    events: WebhookEvent[];
    isActive: boolean;
    createdAt: Date;
    lastTriggered: Date | null;
    failCount: number;
    metadata?: Record<string, any>;
}

export type WebhookEvent =
    | 'opportunity.detected'
    | 'execution.started'
    | 'execution.completed'
    | 'execution.failed'
    | 'strategy.activated'
    | 'strategy.deactivated'
    | 'market.alert'
    | 'health.warning'
    | 'emergency.pause';

interface WebhookPayload {
    event: WebhookEvent;
    timestamp: string;
    data: Record<string, any>;
    webhookId: string;
}

// In-memory store (use database in production)
const webhookStore: Map<string, WebhookSubscription> = new Map();

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 5000, 30000]; // 1s, 5s, 30s
const MAX_FAIL_COUNT = 10; // Disable webhook after 10 failures

/**
 * Generate webhook signature for verification
 */
function generateSignature(payload: string, secret: string): string {
    return crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
}

/**
 * Register a new webhook
 */
export function registerWebhook(
    userId: string,
    url: string,
    events: WebhookEvent[],
    metadata?: Record<string, any>
): { id: string; secret: string } {
    const id = `wh_${crypto.randomBytes(16).toString('hex')}`;
    const secret = `whsec_${crypto.randomBytes(32).toString('hex')}`;

    const subscription: WebhookSubscription = {
        id,
        userId,
        url,
        secret,
        events,
        isActive: true,
        createdAt: new Date(),
        lastTriggered: null,
        failCount: 0,
        metadata
    };

    webhookStore.set(id, subscription);

    console.log(`📡 Webhook registered: ${id} for events: ${events.join(', ')}`);

    return { id, secret };
}

/**
 * Unregister a webhook
 */
export function unregisterWebhook(id: string, userId: string): boolean {
    const webhook = webhookStore.get(id);

    if (webhook && webhook.userId === userId) {
        webhookStore.delete(id);
        console.log(`🗑️ Webhook unregistered: ${id}`);
        return true;
    }

    return false;
}

/**
 * Get webhooks for a user
 */
export function getUserWebhooks(userId: string): Omit<WebhookSubscription, 'secret'>[] {
    const webhooks: Omit<WebhookSubscription, 'secret'>[] = [];

    webhookStore.forEach((webhook) => {
        if (webhook.userId === userId) {
            const { secret, ...safeWebhook } = webhook;
            webhooks.push(safeWebhook);
        }
    });

    return webhooks;
}

/**
 * Send webhook to a single subscriber
 */
async function sendWebhook(
    subscription: WebhookSubscription,
    payload: WebhookPayload,
    retryCount = 0
): Promise<boolean> {
    const payloadString = JSON.stringify(payload);
    const signature = generateSignature(payloadString, subscription.secret);

    try {
        const response = await axios.post(subscription.url, payload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Id': subscription.id,
                'X-Webhook-Event': payload.event,
                'X-Webhook-Timestamp': payload.timestamp,
                'User-Agent': 'SuiLoop-Agent/1.0'
            },
            timeout: 10000 // 10 second timeout
        });

        if (response.status >= 200 && response.status < 300) {
            subscription.lastTriggered = new Date();
            subscription.failCount = 0;
            console.log(`✅ Webhook sent: ${subscription.id} -> ${payload.event}`);
            return true;
        }

        throw new Error(`HTTP ${response.status}`);
    } catch (error: any) {
        console.error(`❌ Webhook failed: ${subscription.id} - ${error.message}`);

        subscription.failCount++;

        // Retry logic
        if (retryCount < MAX_RETRIES) {
            const delay = RETRY_DELAYS[retryCount];
            console.log(`🔄 Retrying webhook in ${delay}ms (attempt ${retryCount + 1}/${MAX_RETRIES})`);

            setTimeout(() => {
                sendWebhook(subscription, payload, retryCount + 1);
            }, delay);
        }

        // Disable if too many failures
        if (subscription.failCount >= MAX_FAIL_COUNT) {
            subscription.isActive = false;
            console.warn(`⚠️ Webhook disabled due to failures: ${subscription.id}`);
        }

        return false;
    }
}

/**
 * Trigger webhooks for an event
 */
export async function triggerWebhooks(
    event: WebhookEvent,
    data: Record<string, any>,
    userId?: string
): Promise<{ sent: number; failed: number }> {
    const results = { sent: 0, failed: 0 };
    const timestamp = new Date().toISOString();

    const promises: Promise<boolean>[] = [];

    webhookStore.forEach((subscription) => {
        // Filter by event type
        if (!subscription.events.includes(event)) return;

        // Filter by user if specified
        if (userId && subscription.userId !== userId) return;

        // Skip inactive webhooks
        if (!subscription.isActive) return;

        const payload: WebhookPayload = {
            event,
            timestamp,
            data,
            webhookId: subscription.id
        };

        promises.push(sendWebhook(subscription, payload));
    });

    const outcomes = await Promise.all(promises);

    outcomes.forEach((success) => {
        if (success) results.sent++;
        else results.failed++;
    });

    console.log(`📡 Webhooks triggered: ${event} - Sent: ${results.sent}, Failed: ${results.failed}`);

    return results;
}

/**
 * Re-enable a disabled webhook
 */
export function reactivateWebhook(id: string, userId: string): boolean {
    const webhook = webhookStore.get(id);

    if (webhook && webhook.userId === userId) {
        webhook.isActive = true;
        webhook.failCount = 0;
        console.log(`🔄 Webhook reactivated: ${id}`);
        return true;
    }

    return false;
}

/**
 * Test a webhook endpoint
 */
export async function testWebhook(id: string, userId: string): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    const webhook = webhookStore.get(id);

    if (!webhook || webhook.userId !== userId) {
        return { success: false, error: 'Webhook not found' };
    }

    const testPayload: WebhookPayload = {
        event: 'health.warning',
        timestamp: new Date().toISOString(),
        data: { test: true, message: 'This is a test webhook from SuiLoop' },
        webhookId: id
    };

    try {
        const payloadString = JSON.stringify(testPayload);
        const signature = generateSignature(payloadString, webhook.secret);

        const response = await axios.post(webhook.url, testPayload, {
            headers: {
                'Content-Type': 'application/json',
                'X-Webhook-Signature': signature,
                'X-Webhook-Id': id,
                'X-Webhook-Event': 'test',
                'User-Agent': 'SuiLoop-Agent/1.0'
            },
            timeout: 10000
        });

        return { success: true, statusCode: response.status };
    } catch (error: any) {
        return {
            success: false,
            error: error.message,
            statusCode: error.response?.status
        };
    }
}

/**
 * Get webhook statistics
 */
export function getWebhookStats(): {
    total: number;
    active: number;
    disabled: number;
    byEvent: Record<string, number>;
} {
    const stats = {
        total: webhookStore.size,
        active: 0,
        disabled: 0,
        byEvent: {} as Record<string, number>
    };

    webhookStore.forEach((webhook) => {
        if (webhook.isActive) stats.active++;
        else stats.disabled++;

        webhook.events.forEach((event) => {
            stats.byEvent[event] = (stats.byEvent[event] || 0) + 1;
        });
    });

    return stats;
}
