/**
 * API Authentication Middleware
 * Supports both API Key and JWT authentication
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'suiloop-agent-secret-key-change-in-production';
const API_KEYS_DB: Map<string, ApiKeyRecord> = new Map();

interface ApiKeyRecord {
    key: string;
    hashedKey: string;
    userId: string;
    name: string;
    permissions: string[];
    createdAt: Date;
    lastUsed: Date | null;
    rateLimit: number; // requests per minute
    isActive: boolean;
}

export interface AuthenticatedRequest extends Request {
    user?: {
        userId: string;
        apiKeyId?: string;
        permissions: string[];
    };
}

/**
 * Hash an API key for secure storage
 */
function hashApiKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Generate a new API key
 */
export function generateApiKey(userId: string, name: string, permissions: string[] = ['execute', 'subscribe']): { key: string; record: ApiKeyRecord } {
    const key = `sk_live_${crypto.randomBytes(32).toString('hex')}`;
    const hashedKey = hashApiKey(key);

    const record: ApiKeyRecord = {
        key: key.slice(0, 12) + '...' + key.slice(-4), // Show only partial key
        hashedKey,
        userId,
        name,
        permissions,
        createdAt: new Date(),
        lastUsed: null,
        rateLimit: 60, // 60 requests per minute
        isActive: true
    };

    API_KEYS_DB.set(hashedKey, record);

    return { key, record };
}

/**
 * Validate an API key
 */
export function validateApiKey(key: string): ApiKeyRecord | null {
    const hashedKey = hashApiKey(key);
    const record = API_KEYS_DB.get(hashedKey);

    if (record && record.isActive) {
        record.lastUsed = new Date();
        return record;
    }

    return null;
}

/**
 * Generate a JWT token
 */
export function generateJWT(userId: string, permissions: string[] = ['execute']): string {
    return jwt.sign(
        { userId, permissions },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}

/**
 * Verify a JWT token
 */
export function verifyJWT(token: string): { userId: string; permissions: string[] } | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; permissions: string[] };
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Authentication Middleware
 * Supports:
 * - API Key: Authorization: Bearer sk_live_xxx
 * - JWT: Authorization: Bearer eyJhbGc...
 * - X-API-Key header
 */
export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    // Skip auth for health check
    if (req.path === '/health') {
        return next();
    }

    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string;

    let token: string | undefined;

    if (authHeader?.startsWith('Bearer ')) {
        token = authHeader.slice(7);
    } else if (apiKeyHeader) {
        token = apiKeyHeader;
    }

    if (!token) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
            hint: 'Provide API key via Authorization: Bearer <key> or X-API-Key header'
        });
    }

    // Check if it's an API key (starts with sk_live_)
    if (token.startsWith('sk_live_')) {
        const record = validateApiKey(token);
        if (record) {
            req.user = {
                userId: record.userId,
                apiKeyId: record.hashedKey,
                permissions: record.permissions
            };
            return next();
        }
    }

    // Try JWT
    const jwtPayload = verifyJWT(token);
    if (jwtPayload) {
        req.user = {
            userId: jwtPayload.userId,
            permissions: jwtPayload.permissions
        };
        return next();
    }

    return res.status(401).json({
        success: false,
        error: 'Invalid or expired authentication token'
    });
}

/**
 * Permission check middleware
 */
export function requirePermission(permission: string) {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        if (!req.user.permissions.includes(permission) && !req.user.permissions.includes('admin')) {
            return res.status(403).json({
                success: false,
                error: `Permission '${permission}' required`
            });
        }

        next();
    };
}

/**
 * Get all API keys for a user
 */
export function getUserApiKeys(userId: string): Omit<ApiKeyRecord, 'hashedKey'>[] {
    const keys: Omit<ApiKeyRecord, 'hashedKey'>[] = [];

    API_KEYS_DB.forEach((record) => {
        if (record.userId === userId) {
            const { hashedKey, ...safeRecord } = record;
            keys.push(safeRecord);
        }
    });

    return keys;
}

/**
 * Revoke an API key
 */
export function revokeApiKey(keyPartial: string, userId: string): boolean {
    for (const [hash, record] of API_KEYS_DB.entries()) {
        if (record.userId === userId && record.key.includes(keyPartial)) {
            record.isActive = false;
            return true;
        }
    }
    return false;
}

// Export for testing - create a default admin key on startup
export function initializeDefaultKeys() {
    const adminKey = process.env.ADMIN_API_KEY || process.env.SUILOOP_API_KEY;
    if (adminKey) {
        const hashedKey = hashApiKey(adminKey);
        API_KEYS_DB.set(hashedKey, {
            key: 'admin-key',
            hashedKey,
            userId: 'admin',
            name: 'Admin / Root Key',
            permissions: ['admin', 'execute', 'subscribe', 'manage'],
            createdAt: new Date(),
            lastUsed: null,
            rateLimit: 1000,
            isActive: true
        });
        console.log('✅ Root API key initialized');
    }
}
