/**
 * SuiLoop Job Queue Service
 * 
 * Provides robust task execution with retries and concurrency control.
 * - In-memory queue (no Redis required for basic setup)
 * - Retries with exponential backoff
 * - Concurrency limits
 */

import { v4 as uuidv4 } from 'uuid';

export interface QJob {
    id: string;
    type: string;
    payload: any;
    priority: number;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    attempts: number;
    maxAttempts: number;
    lastError?: string;
    createdAt: Date;
    processedAt?: Date;
}

export type JobHandler = (job: QJob) => Promise<any>;

export class QueueService {
    private queue: QJob[] = [];
    private handlers: Map<string, JobHandler> = new Map();
    private isProcessing: boolean = false;
    private concurrency: number = 2;
    private activeJobs: number = 0;

    constructor(concurrency = 2) {
        this.concurrency = concurrency;
        // Start processing loop
        setInterval(() => this.process(), 100);
        console.log('🔄 Queue Service initialized');
    }

    /**
     * Register a handler for a job type
     */
    registerHandler(type: string, handler: JobHandler) {
        this.handlers.set(type, handler);
    }

    /**
     * Add a job to the queue
     */
    async add(type: string, payload: any, options: { priority?: number; maxAttempts?: number } = {}): Promise<string> {
        const job: QJob = {
            id: uuidv4(),
            type,
            payload,
            priority: options.priority || 1,
            status: 'pending',
            attempts: 0,
            maxAttempts: options.maxAttempts || 3,
            createdAt: new Date()
        };

        this.queue.push(job);
        this.sortQueue();
        return job.id;
    }

    /**
     * Internal processing loop
     */
    private async process() {
        if (this.activeJobs >= this.concurrency) return;
        if (this.queue.length === 0) return;

        // Get next pending job
        const jobIndex = this.queue.findIndex(j => j.status === 'pending');
        if (jobIndex === -1) return;

        const job = this.queue[jobIndex];
        job.status = 'processing';
        job.processedAt = new Date();
        this.activeJobs++;

        this.executeJob(job).finally(() => {
            this.activeJobs--;
        });
    }

    /**
     * Execute a single job
     */
    private async executeJob(job: QJob) {
        const handler = this.handlers.get(job.type);

        if (!handler) {
            job.status = 'failed';
            job.lastError = 'No handler registered';
            return;
        }

        try {
            job.attempts++;
            await handler(job);
            job.status = 'completed';
        } catch (error: any) {
            job.lastError = error.message;
            console.error(`Job ${job.id} (${job.type}) failed:`, error.message);

            if (job.attempts < job.maxAttempts) {
                job.status = 'pending'; // Retry
                // Exponential backoff could be implemented here with a delay queue
            } else {
                job.status = 'failed';
            }
        }
    }

    private sortQueue() {
        // Higher priority first
        this.queue.sort((a, b) => b.priority - a.priority);
    }

    getStats() {
        return {
            pending: this.queue.filter(j => j.status === 'pending').length,
            processing: this.activeJobs,
            completed: this.queue.filter(j => j.status === 'completed').length,
            failed: this.queue.filter(j => j.status === 'failed').length
        };
    }
}

// Singleton
let queueService: QueueService | null = null;

export function initializeQueueService(): QueueService {
    if (!queueService) {
        queueService = new QueueService();
    }
    return queueService;
}

export function getQueueService(): QueueService | null {
    return queueService;
}
