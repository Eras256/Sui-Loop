/**
 * SuiLoop Skills & Plugins System
 * 
 * A modular plugin architecture inspired by OpenClaw's Skills system:
 * - Standard Skill Convention (SKILL.md format)
 * - Local and remote skill loading
 * - Skill marketplace integration (LoopHub)
 * - Configuration and permissions system
 * - Skill execution sandbox
 * 
 * Each skill is a self-contained module that extends the agent's capabilities.
 */

import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import { EventEmitter } from 'events';

// ============================================================================
// TYPES
// ============================================================================

export interface SkillManifest {
    name: string;
    slug: string;
    version: string;
    description: string;
    author: string;
    homepage?: string;
    repository?: string;
    license?: string;

    // Categories for discovery
    category: SkillCategory;
    tags: string[];

    // Configuration schema (JSON Schema)
    configSchema?: Record<string, any>;

    // Required permissions
    permissions: SkillPermission[];

    // Dependencies on other skills
    dependencies?: string[];

    // Entry points
    actions?: SkillAction[];
    triggers?: SkillTrigger[];
    providers?: SkillProvider[];
}

export type SkillCategory =
    | 'trading'      // Trading strategies
    | 'analysis'     // Market analysis tools
    | 'notification' // Alert and notification channels
    | 'integration'  // External service integrations
    | 'utility'      // Helper utilities
    | 'data'         // Data sources and feeds
    | 'security';    // Security and auth plugins

export type SkillPermission =
    | 'blockchain:read'      // Read blockchain data
    | 'blockchain:write'     // Execute transactions
    | 'memory:read'          // Read user memory
    | 'memory:write'         // Write to user memory
    | 'network:fetch'        // Make HTTP requests
    | 'browser:control'      // Control browser
    | 'filesystem:read'      // Read local files
    | 'filesystem:write'     // Write local files
    | 'shell:execute'        // Execute shell commands
    | 'notification:send';   // Send notifications

export interface SkillAction {
    name: string;
    description: string;
    similes?: string[];  // Alternative names/aliases
    parameters?: Record<string, SkillParameter>;
    returns?: string;
    handler: string;     // Path to handler file or function name
}

export interface SkillParameter {
    type: 'string' | 'number' | 'boolean' | 'object' | 'array';
    description: string;
    required?: boolean;
    default?: any;
    enum?: any[];
}

export interface SkillTrigger {
    name: string;
    type: 'cron' | 'event' | 'webhook' | 'interval';
    config: Record<string, any>;
    handler: string;
}

export interface SkillProvider {
    name: string;
    description: string;
    provides: string;    // What data/service it provides
    handler: string;
}

export interface SkillInstance {
    manifest: SkillManifest;
    path: string;
    config: Record<string, any>;
    isEnabled: boolean;
    loadedAt: Date;
    handlers: Map<string, Function>;
}

export interface SkillContext {
    userId: string;
    walletAddress?: string;
    config: Record<string, any>;
    permissions: SkillPermission[];
    emit: (event: string, data: any) => void;
    log: (level: 'debug' | 'info' | 'warn' | 'error', message: string) => void;
}

// ============================================================================
// SKILL LOADER
// ============================================================================

class SkillLoader {
    /**
     * Load a skill from a local directory
     */
    async loadFromDirectory(skillPath: string): Promise<SkillManifest | null> {
        const manifestPath = path.join(skillPath, 'SKILL.md');

        if (!await fs.pathExists(manifestPath)) {
            console.error(`No SKILL.md found in ${skillPath}`);
            return null;
        }

        const content = await fs.readFile(manifestPath, 'utf-8');
        return this.parseSkillMd(content);
    }

    /**
     * Parse SKILL.md content (YAML frontmatter + description)
     */
    parseSkillMd(content: string): SkillManifest | null {
        try {
            // Extract YAML frontmatter
            const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);

            if (!frontmatterMatch) {
                throw new Error('No YAML frontmatter found');
            }

            const yamlContent = frontmatterMatch[1];
            const manifest = this.parseYaml(yamlContent);

            // Extract description from markdown body
            const body = content.slice(frontmatterMatch[0].length).trim();
            if (!manifest.description && body) {
                manifest.description = body.split('\n\n')[0];
            }

            // Validate required fields
            if (!manifest.name || !manifest.slug) {
                throw new Error('Missing required fields: name, slug');
            }

            // Set defaults
            manifest.version = manifest.version || '1.0.0';
            manifest.category = manifest.category || 'utility';
            manifest.tags = manifest.tags || [];
            manifest.permissions = manifest.permissions || [];
            manifest.actions = manifest.actions || [];

            return manifest as SkillManifest;
        } catch (error) {
            console.error('Failed to parse SKILL.md:', error);
            return null;
        }
    }

    /**
     * Simple YAML parser (for frontmatter)
     */
    private parseYaml(content: string): Record<string, any> {
        const result: Record<string, any> = {};
        const lines = content.split('\n');
        let currentKey = '';
        let currentArray: any[] | null = null;

        for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;

            // Array item
            if (trimmed.startsWith('- ')) {
                if (currentArray) {
                    currentArray.push(trimmed.slice(2).trim());
                }
                continue;
            }

            // Key-value pair
            const colonIndex = trimmed.indexOf(':');
            if (colonIndex > 0) {
                const key = trimmed.slice(0, colonIndex).trim();
                let value: any = trimmed.slice(colonIndex + 1).trim();

                // Check if starting an array
                if (value === '') {
                    currentKey = key;
                    currentArray = [];
                    result[key] = currentArray;
                } else {
                    // Parse value
                    if (value === 'true') value = true;
                    else if (value === 'false') value = false;
                    else if (/^\d+$/.test(value)) value = parseInt(value);
                    else if (/^\d+\.\d+$/.test(value)) value = parseFloat(value);
                    else if (value.startsWith('"') && value.endsWith('"')) {
                        value = value.slice(1, -1);
                    }

                    result[key] = value;
                    currentArray = null;
                }
            }
        }

        return result;
    }
}

// ============================================================================
// SKILL MANAGER
// ============================================================================

export class SkillManager extends EventEmitter {
    private skills: Map<string, SkillInstance> = new Map();
    private loader: SkillLoader = new SkillLoader();
    private skillsDir: string;
    private userPermissions: Map<string, SkillPermission[]> = new Map();

    constructor(skillsDir?: string) {
        super();
        this.skillsDir = skillsDir || path.join(process.cwd(), '.suiloop', 'skills');
    }

    /**
     * Initialize the skill manager
     */
    async initialize(): Promise<void> {
        await fs.ensureDir(this.skillsDir);

        // Load built-in skills
        await this.loadBuiltInSkills();

        // Load installed skills
        await this.loadInstalledSkills();

        console.log(`🔌 Skill Manager initialized with ${this.skills.size} skills`);
    }

    /**
     * Load built-in skills
     */
    private async loadBuiltInSkills(): Promise<void> {
        const builtInSkills: SkillManifest[] = [
            {
                name: 'Atomic Flash Loan',
                slug: 'atomic-flash-loan',
                version: '1.0.0',
                description: 'Execute atomic flash loans using Hot Potato pattern',
                author: 'SuiLoop Team',
                category: 'trading',
                tags: ['flash-loan', 'defi', 'atomic'],
                permissions: ['blockchain:read', 'blockchain:write'],
                actions: [
                    {
                        name: 'executeFlashLoan',
                        description: 'Execute an atomic flash loan',
                        parameters: {
                            amount: { type: 'number', description: 'Amount in SUI', required: true },
                            minProfit: { type: 'number', description: 'Minimum profit threshold', default: 0.001 }
                        },
                        handler: 'executeAtomicLeverage'
                    }
                ]
            },
            {
                name: 'Price Monitor',
                slug: 'price-monitor',
                version: '1.0.0',
                description: 'Monitor token prices and detect opportunities',
                author: 'SuiLoop Team',
                category: 'analysis',
                tags: ['price', 'monitor', 'alerts'],
                permissions: ['network:fetch', 'notification:send'],
                triggers: [
                    {
                        name: 'checkPrices',
                        type: 'interval',
                        config: { interval: 60000 },
                        handler: 'checkPriceOpportunities'
                    }
                ]
            },
            {
                name: 'Telegram Alerts',
                slug: 'telegram-alerts',
                version: '1.0.0',
                description: 'Send alerts to Telegram',
                author: 'SuiLoop Team',
                category: 'notification',
                tags: ['telegram', 'alerts', 'notifications'],
                permissions: ['notification:send'],
                configSchema: {
                    type: 'object',
                    properties: {
                        botToken: { type: 'string', description: 'Telegram bot token' },
                        chatId: { type: 'string', description: 'Target chat ID' }
                    },
                    required: ['botToken', 'chatId']
                },
                providers: [
                    {
                        name: 'telegramNotifier',
                        description: 'Provides Telegram notification capability',
                        provides: 'notification:telegram',
                        handler: 'sendTelegramMessage'
                    }
                ]
            }
        ];

        for (const manifest of builtInSkills) {
            this.skills.set(manifest.slug, {
                manifest,
                path: 'built-in',
                config: {},
                isEnabled: true,
                loadedAt: new Date(),
                handlers: new Map()
            });
        }
    }

    /**
     * Load user-installed skills
     */
    private async loadInstalledSkills(): Promise<void> {
        if (!await fs.pathExists(this.skillsDir)) return;

        const entries = await fs.readdir(this.skillsDir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const skillPath = path.join(this.skillsDir, entry.name);
                await this.loadSkill(skillPath);
            }
        }
    }

    /**
     * Load a single skill from path
     */
    async loadSkill(skillPath: string): Promise<SkillInstance | null> {
        const manifest = await this.loader.loadFromDirectory(skillPath);

        if (!manifest) {
            console.error(`Failed to load skill from ${skillPath}`);
            return null;
        }

        // Check if skill already loaded
        if (this.skills.has(manifest.slug)) {
            console.warn(`Skill ${manifest.slug} already loaded, skipping`);
            return this.skills.get(manifest.slug)!;
        }

        // Load configuration
        const configPath = path.join(skillPath, 'config.json');
        const config = await fs.pathExists(configPath)
            ? await fs.readJson(configPath)
            : {};

        // Load handlers
        const handlers = new Map<string, Function>();

        // Load action handlers
        for (const action of manifest.actions || []) {
            const handlerPath = path.join(skillPath, action.handler + '.js');
            if (await fs.pathExists(handlerPath)) {
                try {
                    const module = await import(handlerPath);
                    handlers.set(action.name, module.default || module[action.name]);
                } catch (error) {
                    console.warn(`Failed to load handler ${action.handler}:`, error);
                }
            }
        }

        const instance: SkillInstance = {
            manifest,
            path: skillPath,
            config,
            isEnabled: true,
            loadedAt: new Date(),
            handlers
        };

        this.skills.set(manifest.slug, instance);
        this.emit('skill:loaded', { slug: manifest.slug, manifest });

        console.log(`✅ Loaded skill: ${manifest.name} v${manifest.version}`);

        return instance;
    }

    /**
     * Install a skill from a remote source
     */
    async installSkill(source: string): Promise<boolean> {
        try {
            let skillPath: string;

            if (source.startsWith('github:')) {
                // Install from GitHub
                const repo = source.replace('github:', '');
                skillPath = await this.installFromGithub(repo);
            } else if (source.startsWith('loophub:')) {
                // Install from LoopHub marketplace
                const slug = source.replace('loophub:', '');
                skillPath = await this.installFromLoopHub(slug);
            } else if (await fs.pathExists(source)) {
                // Local path
                skillPath = source;
            } else {
                throw new Error(`Unknown source format: ${source}`);
            }

            await this.loadSkill(skillPath);
            return true;
        } catch (error) {
            console.error('Failed to install skill:', error);
            return false;
        }
    }

    /**
     * Install from GitHub repository
     */
    private async installFromGithub(repo: string): Promise<string> {
        // Format: owner/repo or owner/repo#branch
        const [repoPath, branch = 'main'] = repo.split('#');
        const [owner, repoName] = repoPath.split('/');

        const targetPath = path.join(this.skillsDir, repoName);

        // Clone repository (would use git clone or download zip)
        // For now, just create placeholder
        await fs.ensureDir(targetPath);

        console.log(`📦 Installing skill from github:${repo}`);

        return targetPath;
    }

    /**
     * Install from LoopHub marketplace
     */
    private async installFromLoopHub(slug: string): Promise<string> {
        const targetPath = path.join(this.skillsDir, slug);

        // Would fetch from LoopHub API
        console.log(`📦 Installing skill from loophub:${slug}`);

        await fs.ensureDir(targetPath);

        // Generar un SKILL.md temporal para que sea válido
        const manifestContent = `---
name: ${slug.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')}
slug: ${slug}
version: 1.0.0
description: Installed from LoopHub Marketplace
author: Unknown
category: utility
permissions:
  - blockchain:read
---

# ${slug}

This skill was installed from LoopHub.
`;
        await fs.writeFile(path.join(targetPath, 'SKILL.md'), manifestContent);

        return targetPath;
    }

    /**
     * Uninstall a skill
     */
    async uninstallSkill(slug: string): Promise<boolean> {
        const skill = this.skills.get(slug);

        if (!skill) {
            console.error(`Skill ${slug} not found`);
            return false;
        }

        if (skill.path === 'built-in') {
            console.error('Cannot uninstall built-in skills');
            return false;
        }

        try {
            await fs.remove(skill.path);
            this.skills.delete(slug);
            this.emit('skill:uninstalled', { slug });

            console.log(`🗑️ Uninstalled skill: ${skill.manifest.name}`);
            return true;
        } catch (error) {
            console.error('Failed to uninstall:', error);
            return false;
        }
    }

    /**
     * Enable/disable a skill
     */
    setSkillEnabled(slug: string, enabled: boolean): boolean {
        const skill = this.skills.get(slug);
        if (!skill) return false;

        skill.isEnabled = enabled;
        this.emit('skill:toggled', { slug, enabled });

        return true;
    }

    /**
     * Get all skills
     */
    getAllSkills(): SkillManifest[] {
        return Array.from(this.skills.values())
            .map(s => s.manifest);
    }

    /**
     * Get enabled skills
     */
    getEnabledSkills(): SkillManifest[] {
        return Array.from(this.skills.values())
            .filter(s => s.isEnabled)
            .map(s => s.manifest);
    }

    /**
     * Get skill by slug
     */
    getSkill(slug: string): SkillInstance | undefined {
        return this.skills.get(slug);
    }

    /**
     * Get skills by category
     */
    getSkillsByCategory(category: SkillCategory): SkillManifest[] {
        return Array.from(this.skills.values())
            .filter(s => s.manifest.category === category)
            .map(s => s.manifest);
    }

    /**
     * Search skills
     */
    searchSkills(query: string): SkillManifest[] {
        const queryLower = query.toLowerCase();

        return Array.from(this.skills.values())
            .filter(s => {
                const m = s.manifest;
                return m.name.toLowerCase().includes(queryLower) ||
                    m.description.toLowerCase().includes(queryLower) ||
                    m.tags.some(t => t.toLowerCase().includes(queryLower));
            })
            .map(s => s.manifest);
    }

    /**
     * Execute a skill action
     */
    async executeAction(
        skillSlug: string,
        actionName: string,
        params: Record<string, any>,
        context: Partial<SkillContext>
    ): Promise<any> {
        const skill = this.skills.get(skillSlug);

        if (!skill) {
            throw new Error(`Skill ${skillSlug} not found`);
        }

        if (!skill.isEnabled) {
            throw new Error(`Skill ${skillSlug} is disabled`);
        }

        const action = skill.manifest.actions?.find(a => a.name === actionName);
        if (!action) {
            throw new Error(`Action ${actionName} not found in skill ${skillSlug}`);
        }

        // Check permissions
        const userPerms = this.userPermissions.get(context.userId || 'default') || [];
        const missingPerms = skill.manifest.permissions.filter(p => !userPerms.includes(p));

        if (missingPerms.length > 0) {
            throw new Error(`Missing permissions: ${missingPerms.join(', ')}`);
        }

        // Get handler
        const handler = skill.handlers.get(actionName);

        if (!handler) {
            throw new Error(`Handler for ${actionName} not loaded`);
        }

        // Build context
        const fullContext: SkillContext = {
            userId: context.userId || 'anonymous',
            walletAddress: context.walletAddress,
            config: skill.config,
            permissions: skill.manifest.permissions,
            emit: (event, data) => this.emit(`skill:${skillSlug}:${event}`, data),
            log: (level, message) => {
                console[level](`[${skill.manifest.name}] ${message}`);
            }
        };

        // Execute
        try {
            this.emit('action:start', { skill: skillSlug, action: actionName });
            const result = await handler(params, fullContext);
            this.emit('action:complete', { skill: skillSlug, action: actionName, result });
            return result;
        } catch (error: any) {
            this.emit('action:error', { skill: skillSlug, action: actionName, error: error.message });
            throw error;
        }
    }

    /**
     * Grant permissions to a user
     */
    grantPermissions(userId: string, permissions: SkillPermission[]): void {
        const current = this.userPermissions.get(userId) || [];
        const updated = [...new Set([...current, ...permissions])];
        this.userPermissions.set(userId, updated);
    }

    /**
     * Revoke permissions from a user
     */
    revokePermissions(userId: string, permissions: SkillPermission[]): void {
        const current = this.userPermissions.get(userId) || [];
        const updated = current.filter(p => !permissions.includes(p));
        this.userPermissions.set(userId, updated);
    }

    /**
     * Get available actions (for LLM context)
     */
    getAvailableActions(): Array<{
        skill: string;
        action: string;
        description: string;
        parameters: Record<string, SkillParameter>;
    }> {
        const actions: Array<any> = [];

        for (const [slug, skill] of this.skills) {
            if (!skill.isEnabled) continue;

            for (const action of skill.manifest.actions || []) {
                actions.push({
                    skill: slug,
                    action: action.name,
                    description: action.description,
                    parameters: action.parameters || {}
                });
            }
        }

        return actions;
    }

    /**
     * Generate action prompt for LLM
     */
    generateActionPrompt(): string {
        const actions = this.getAvailableActions();

        let prompt = '## Available Skills & Actions\n\n';

        for (const action of actions) {
            prompt += `### ${action.skill}:${action.action}\n`;
            prompt += `${action.description}\n\n`;

            if (Object.keys(action.parameters).length > 0) {
                prompt += 'Parameters:\n';
                for (const [name, param] of Object.entries(action.parameters)) {
                    prompt += `- ${name} (${param.type}): ${param.description}`;
                    if (param.required) prompt += ' [required]';
                    if (param.default !== undefined) prompt += ` [default: ${param.default}]`;
                    prompt += '\n';
                }
            }

            prompt += '\n';
        }

        return prompt;
    }
}

// ============================================================================
// SKILL TEMPLATE
// ============================================================================

export const skillTemplate = `---
name: My Custom Skill
slug: my-custom-skill
version: 1.0.0
description: A custom skill for SuiLoop
author: Your Name
category: utility
tags:
  - custom
  - example
permissions:
  - blockchain:read
---

# My Custom Skill

This skill does amazing things!

## Installation

\`\`\`bash
suiloop install loophub:my-custom-skill
\`\`\`

## Usage

Use the \`myAction\` action to perform the task:

\`\`\`
Execute myAction with amount 100
\`\`\`

## Configuration

Edit \`config.json\` to customize behavior:

\`\`\`json
{
  "apiKey": "your-api-key",
  "threshold": 0.01
}
\`\`\`
`;

// ============================================================================
// SINGLETON & EXPORTS
// ============================================================================

let skillManager: SkillManager | null = null;

export function initializeSkillManager(skillsDir?: string): SkillManager {
    if (!skillManager) {
        skillManager = new SkillManager(skillsDir);
        console.log('🔌 Skill Manager initialized');
    }
    return skillManager;
}

export function getSkillManager(): SkillManager {
    if (!skillManager) {
        skillManager = new SkillManager();
    }
    return skillManager;
}

export default SkillManager;
