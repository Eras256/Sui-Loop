/**
 * SuiLoop Session Manager
 * 
 * Manages conversational sessions (threads) for the agent.
 * - Create/List/Delete/Prune sessions
 * - Context isolation per session
 * - Integration with MemoryService
 */

import { v4 as uuidv4 } from 'uuid';
import { getMemoryService, UserMemory } from './memoryService';

export interface AgentSession {
    id: string;
    userId: string;
    title: string;
    createdAt: Date;
    lastActiveAt: Date;
    messagesCount: number;
    metadata: Record<string, any>;
    status: 'active' | 'archived';
}

export class SessionService {
    private sessions: Map<string, AgentSession> = new Map();

    // In-memory strictly for active session metadata.
    // Content is stored in MemoryService (refactor needed to split history by sessionID usually, 
    // but for now we link sessionID in metadata).

    constructor() {
        console.log('🧵 Session Service initialized');
    }

    /**
     * Create a new session
     */
    async createSession(userId: string, title?: string): Promise<AgentSession> {
        const id = uuidv4();
        const session: AgentSession = {
            id,
            userId,
            title: title || `Session ${new Date().toLocaleTimeString()}`,
            createdAt: new Date(),
            lastActiveAt: new Date(),
            messagesCount: 0,
            metadata: {},
            status: 'active'
        };

        this.sessions.set(id, session);

        // Update user memory context with current intent
        const memory = getMemoryService();
        await memory.updateContext(userId, {
            currentIntent: `Started session: ${session.title}`
        });

        return session;
    }

    /**
     * Get session by ID
     */
    getSession(sessionId: string): AgentSession | undefined {
        return this.sessions.get(sessionId);
    }

    /**
     * List user sessions
     */
    getUserSessions(userId: string): AgentSession[] {
        return Array.from(this.sessions.values())
            .filter(s => s.userId === userId)
            .sort((a, b) => b.lastActiveAt.getTime() - a.lastActiveAt.getTime());
    }

    /**
     * Update session activity
     */
    async touchSession(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActiveAt = new Date();
            session.messagesCount++;
            this.sessions.set(sessionId, session); // Trigger any reactive updates if needed
        }
    }

    /**
     * Archive old sessions (Pruning)
     */
    pruneSessions(userId: string, olderThanDays: number = 7): number {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - olderThanDays);

        let pruned = 0;
        for (const [id, session] of this.sessions) {
            if (session.userId === userId && session.lastActiveAt < cutoff) {
                // We don't delete data, just archive status
                session.status = 'archived';
                pruned++;
            }
        }
        return pruned;
    }
}

// Singleton
let sessionService: SessionService | null = null;

export function initializeSessionService(): SessionService {
    if (!sessionService) {
        sessionService = new SessionService();
    }
    return sessionService;
}

export function getSessionService(): SessionService | null {
    return sessionService;
}
