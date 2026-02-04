/**
 * Rate Limiting Middleware
 * Protects API from abuse with configurable limits per user/API key
 */

import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';

interface RateLimitRecord {
    count: number;
    resetTime: number;
    blocked: boolean;
    blockUntil?: number;
}

// In-memory store (use Redis in production)
const rateLimitStore: Map<string, RateLimitRecord> = new Map();

// Default limits
const DEFAULT_WINDOW_MS = 60 * 1000; // 1 minute
const DEFAULT_MAX_REQUESTS = 60; // 60 requests per minute
const BLOCK_DURATION_MS = 5 * 60 * 1000; // 5 minute block for abuse

interface RateLimitOptions {
    windowMs?: number;
    maxRequests?: number;
    keyGenerator?: (req: Request) => string;
    skipFailedRequests?: boolean;
    message?: string;
}

/**
 * Create rate limiter middleware
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
    const {
        windowMs = DEFAULT_WINDOW_MS,
        maxRequests = DEFAULT_MAX_REQUESTS,
        keyGenerator = defaultKeyGenerator,
        message = 'Too many requests, please try again later.'
    } = options;

    return (req: Request, res: Response, next: NextFunction) => {
        const key = keyGenerator(req);
        const now = Date.now();

        let record = rateLimitStore.get(key);

        // Check if currently blocked
        if (record?.blocked && record.blockUntil && now < record.blockUntil) {
            const retryAfter = Math.ceil((record.blockUntil - now) / 1000);
            res.set('Retry-After', String(retryAfter));
            res.set('X-RateLimit-Limit', String(maxRequests));
            res.set('X-RateLimit-Remaining', '0');
            res.set('X-RateLimit-Reset', String(Math.ceil(record.blockUntil / 1000)));

            return res.status(429).json({
                success: false,
                error: message,
                retryAfter,
                blocked: true
            });
        }

        // Reset if window expired
        if (!record || now > record.resetTime) {
            record = {
                count: 0,
                resetTime: now + windowMs,
                blocked: false
            };
        }

        record.count++;

        // Check if over limit
        if (record.count > maxRequests) {
            record.blocked = true;
            record.blockUntil = now + BLOCK_DURATION_MS;
            rateLimitStore.set(key, record);

            const retryAfter = Math.ceil(BLOCK_DURATION_MS / 1000);
            res.set('Retry-After', String(retryAfter));
            res.set('X-RateLimit-Limit', String(maxRequests));
            res.set('X-RateLimit-Remaining', '0');
            res.set('X-RateLimit-Reset', String(Math.ceil(record.blockUntil / 1000)));

            console.warn(`⚠️ Rate limit exceeded for: ${key}`);

            return res.status(429).json({
                success: false,
                error: message,
                retryAfter
            });
        }

        rateLimitStore.set(key, record);

        // Set rate limit headers
        res.set('X-RateLimit-Limit', String(maxRequests));
        res.set('X-RateLimit-Remaining', String(Math.max(0, maxRequests - record.count)));
        res.set('X-RateLimit-Reset', String(Math.ceil(record.resetTime / 1000)));

        next();
    };
}

/**
 * Default key generator - uses IP or user ID
 */
function defaultKeyGenerator(req: Request): string {
    const authReq = req as AuthenticatedRequest;

    if (authReq.user?.userId) {
        return `user:${authReq.user.userId}`;
    }

    // Fallback to IP
    const ip = req.ip ||
        req.headers['x-forwarded-for'] ||
        req.socket.remoteAddress ||
        'unknown';

    return `ip:${ip}`;
}

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimiter = createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10, // Only 10 requests per minute
    message: 'Rate limit exceeded for sensitive operation.'
});

/**
 * Standard rate limiter for general API
 */
export const standardRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60,
    message: 'Too many requests. Please slow down.'
});

/**
 * Lenient rate limiter for public endpoints
 */
export const lenientRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 200,
    message: 'Rate limit exceeded.'
});

/**
 * Get rate limit status for a key
 */
export function getRateLimitStatus(key: string): RateLimitRecord | null {
    return rateLimitStore.get(key) || null;
}

/**
 * Reset rate limit for a key (admin function)
 */
export function resetRateLimit(key: string): boolean {
    return rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (admin function)
 */
export function clearAllRateLimits(): void {
    rateLimitStore.clear();
    console.log('🔄 All rate limits cleared');
}

/**
 * Get rate limit statistics
 */
export function getRateLimitStats(): {
    totalKeys: number;
    blockedKeys: number;
    topUsers: { key: string; count: number }[];
} {
    const stats = {
        totalKeys: rateLimitStore.size,
        blockedKeys: 0,
        topUsers: [] as { key: string; count: number }[]
    };

    const users: { key: string; count: number }[] = [];

    rateLimitStore.forEach((record, key) => {
        if (record.blocked) stats.blockedKeys++;
        users.push({ key, count: record.count });
    });

    stats.topUsers = users
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

    return stats;
}
