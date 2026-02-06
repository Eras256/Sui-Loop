/**
 * SuiLoop Scheduler Service (Cron Automation)
 * 
 * Provides "Always-On" capabilities for autonomous agents via cron jobs.
 * - Schedule recurring tasks (e.g., "Run Arbitrage every 5 mins")
 * - Persist jobs to disk (survives restarts)
 * - Manage task lifecycle (start, stop, list)
 * 
 * Inspired by OpenClaw's automation features.
 */

import cron from 'node-cron';
import fs from 'fs-extra';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { broadcastLog } from './subscriptionService';
import { getSkillManager } from './skillManager';

// ============================================================================
// TYPES
// ============================================================================

export interface JobConfig {
    id: string;
    name: string;
    cronExpression: string; // e.g. "0/5 * * * *" (every 5 mins)
    taskType: 'skill_execution' | 'system_maintenance' | 'script';
    payload: any; // e.g. { skillId: "flash-loan-executor" }
    enabled: boolean;
    lastRun?: string;
    createdAt: string;
}

export interface JobExecutionResult {
    success: boolean;
    output?: any;
    error?: string;
    timestamp: Date;
}

// ============================================================================
// SCHEDULER SERVICE
// ============================================================================

export class SchedulerService {
    private jobs: Map<string, any> = new Map();
    private configs: Map<string, JobConfig> = new Map();
    private persistencePath: string;

    constructor() {
        this.persistencePath = path.join(process.cwd(), '.suiloop', 'data', 'jobs.json');
        this.initialize();
    }

    /**
     * Initialize scheduler and load persisted jobs
     */
    private async initialize() {
        await fs.ensureDir(path.dirname(this.persistencePath));
        await this.loadJobs();
        console.log('⏰ Scheduler Service initialized');
    }

    /**
     * Load jobs from disk
     */
    private async loadJobs() {
        if (await fs.pathExists(this.persistencePath)) {
            try {
                const data = await fs.readJSON(this.persistencePath);
                for (const config of data) {
                    this.configs.set(config.id, config);
                    if (config.enabled) {
                        this.startCron(config);
                    }
                }
                console.log(`⏰ Loaded ${this.configs.size} jobs from persistence`);
            } catch (error) {
                console.error('Failed to load jobs:', error);
            }
        }
    }

    /**
     * Save jobs to disk
     */
    private async saveJobs() {
        const data = Array.from(this.configs.values());
        await fs.writeJSON(this.persistencePath, data, { spaces: 2 });
    }

    /**
     * Create a new job
     */
    async createJob(
        name: string,
        cronExpression: string,
        taskType: JobConfig['taskType'],
        payload: any
    ): Promise<JobConfig> {
        if (!cron.validate(cronExpression)) {
            throw new Error(`Invalid cron expression: ${cronExpression}`);
        }

        const id = uuidv4();
        const config: JobConfig = {
            id,
            name,
            cronExpression,
            taskType,
            payload,
            enabled: true,
            createdAt: new Date().toISOString()
        };

        this.configs.set(id, config);
        this.startCron(config);
        await this.saveJobs();

        broadcastLog('info', `📅 New job scheduled: ${name} (${cronExpression})`);
        return config;
    }

    /**
     * Internal: Start the actual node-cron task
     */
    private startCron(config: JobConfig) {
        if (this.jobs.has(config.id)) {
            this.jobs.get(config.id)?.stop();
        }

        const task = cron.schedule(config.cronExpression, async () => {
            console.log(`⏰ Executing job: ${config.name}`);
            broadcastLog('info', `⏰ Taking action: ${config.name}`);

            try {
                await this.executeTask(config);
                // Update last run
                const updatedConfig = this.configs.get(config.id);
                if (updatedConfig) {
                    updatedConfig.lastRun = new Date().toISOString();
                    this.saveJobs(); // Async save
                }
            } catch (error: any) {
                console.error(`Job execution failed (${config.id}):`, error);
                broadcastLog('error', `❌ Job failed: ${config.name} - ${error.message}`);
            }
        });

        this.jobs.set(config.id, task);
    }

    /**
     * Execute the task logic
     */
    private async executeTask(config: JobConfig) {
        switch (config.taskType) {
            case 'skill_execution':
                await this.runSkill(config.payload.skillId, config.payload.params);
                break;
            case 'system_maintenance':
                // Clean logs, rotate files, etc.
                break;
            default:
                console.warn('Unknown task type:', config.taskType);
        }
    }

    /**
     * Execute a Skill
     */
    private async runSkill(skillId: string, params: any) {
        const skillManager = getSkillManager();
        if (!skillManager) throw new Error('Skill Manager not ready');

        // Verify skill exists
        // FIX: Replaced getLoadedSkills with getAllSkills
        // FIX: Cast manifest to 'any' to access 'id' or compare against 'slug'
        const skills = skillManager.getAllSkills();

        // Assuming 'slug' serves as the ID
        if (!skills.find(s => s.slug === skillId)) {
            throw new Error(`Skill ${skillId} is not installed`);
        }

        // For now, we simulate execution or call an endpoint
        broadcastLog('success', `⚡ Auto-Executing Skill: ${skillId}`);
    }

    /**
     * Delete a job
     */
    async deleteJob(id: string) {
        if (this.jobs.has(id)) {
            this.jobs.get(id)?.stop();
            this.jobs.delete(id);
        }
        this.configs.delete(id);
        await this.saveJobs();
        broadcastLog('info', `🗑️ Job deleted: ${id}`);
    }

    /**
     * List all jobs
     */
    getAllJobs(): JobConfig[] {
        return Array.from(this.configs.values());
    }
}

// Singleton Export
let schedulerService: SchedulerService | null = null;

export function initializeSchedulerService(): SchedulerService {
    if (!schedulerService) {
        schedulerService = new SchedulerService();
    }
    return schedulerService;
}

export function getSchedulerService(): SchedulerService | null {
    return schedulerService;
}
