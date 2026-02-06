/**
 * LoopHub - SuiLoop Skill Marketplace
 * 
 * A public registry for community-built skills and strategies:
 * - Browse and search skills by category
 * - Install/uninstall skills with one click
 * - Rate and review skills
 * - Publish your own skills
 * - Featured and trending skills
 * 
 * Inspired by OpenClaw's ClawHub marketplace.
 */

import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { EventEmitter } from 'events';
import { SkillManifest, SkillCategory } from './skillManager.js';

// ============================================================================
// TYPES
// ============================================================================

export interface MarketplaceSkill extends SkillManifest {
    id: string;
    downloads: number;
    rating: number;
    reviewCount: number;
    isVerified: boolean;
    isFeatured: boolean;
    publishedAt: Date;
    updatedAt: Date;
    sourceUrl?: string;
    demoUrl?: string;
    screenshots?: string[];
}

export interface SkillReview {
    id: string;
    skillId: string;
    userId: string;
    username: string;
    rating: number;
    title: string;
    content: string;
    createdAt: Date;
    helpful: number;
}

export interface PublishRequest {
    manifest: SkillManifest;
    sourceUrl: string;
    screenshots?: string[];
    demoUrl?: string;
}

export interface SearchFilters {
    query?: string;
    category?: SkillCategory;
    tags?: string[];
    minRating?: number;
    verified?: boolean;
    sortBy?: 'downloads' | 'rating' | 'newest' | 'updated';
    limit?: number;
    offset?: number;
}

export interface ReviewSubmission {
    skillId: string;
    rating: number;
    title: string;
    content: string;
}

// ============================================================================
// LOOPHUB CLIENT
// ============================================================================

export class LoopHubClient extends EventEmitter {
    private client: AxiosInstance;
    private apiKey?: string;
    private userId?: string;

    // In-memory cache for offline/demo mode
    private localSkills: Map<string, MarketplaceSkill> = new Map();
    private localReviews: Map<string, SkillReview[]> = new Map();

    constructor(options: {
        baseUrl?: string;
        apiKey?: string;
        userId?: string;
    } = {}) {
        super();

        this.apiKey = options.apiKey;
        this.userId = options.userId;

        this.client = axios.create({
            baseURL: options.baseUrl || 'https://api.loophub.io',
            timeout: 15000,
            headers: {
                'Content-Type': 'application/json',
                ...(this.apiKey ? { 'Authorization': `Bearer ${this.apiKey}` } : {})
            }
        });

        // Initialize with built-in skills
        this.initializeBuiltInSkills();
    }

    /**
     * Initialize built-in skills for demo mode
     */
    private initializeBuiltInSkills(): void {
        const builtInSkills: MarketplaceSkill[] = [
            {
                id: 'flash-loan-executor',
                name: 'Flash Loan Executor',
                slug: 'flash-loan-executor',
                version: '2.1.0',
                description: 'Execute atomic flash loans using the Hot Potato pattern. Supports DeepBook, Cetus, and custom pools.',
                author: 'SuiLoop Team',
                category: 'trading',
                tags: ['flash-loan', 'defi', 'atomic', 'leverage'],
                permissions: ['blockchain:read', 'blockchain:write'],
                actions: [
                    {
                        name: 'executeFlashLoan',
                        description: 'Execute an atomic flash loan',
                        handler: 'flashLoan',
                        parameters: {
                            amount: { type: 'number', description: 'Amount in SUI', required: true }
                        }
                    }
                ],
                downloads: 12453,
                rating: 4.8,
                reviewCount: 234,
                isVerified: true,
                isFeatured: true,
                publishedAt: new Date('2025-06-15'),
                updatedAt: new Date('2026-01-20'),
                sourceUrl: 'github:suiloop/skills-flash-loan'
            },
            {
                id: 'price-oracle',
                name: 'Multi-Source Price Oracle',
                slug: 'price-oracle',
                version: '1.5.0',
                description: 'Aggregate prices from multiple sources: CoinGecko, DeFiLlama, Pyth, Switchboard. Weighted average with outlier detection.',
                author: 'DeFi Labs',
                category: 'data',
                tags: ['oracle', 'price', 'aggregator', 'data'],
                permissions: ['network:fetch'],
                providers: [
                    {
                        name: 'getPrices',
                        description: 'Get aggregated token prices',
                        provides: 'price:aggregate',
                        handler: 'fetchPrices'
                    }
                ],
                downloads: 8932,
                rating: 4.6,
                reviewCount: 156,
                isVerified: true,
                isFeatured: true,
                publishedAt: new Date('2025-08-10'),
                updatedAt: new Date('2026-01-15'),
                sourceUrl: 'github:defilabs/sui-price-oracle'
            },
            {
                id: 'telegram-alerts-pro',
                name: 'Telegram Alerts Pro',
                slug: 'telegram-alerts-pro',
                version: '3.0.0',
                description: 'Advanced Telegram notifications with rich formatting, buttons, charts, and group management.',
                author: 'NotifyBot',
                category: 'notification',
                tags: ['telegram', 'alerts', 'notifications', 'bot'],
                permissions: ['notification:send', 'network:fetch'],
                configSchema: {
                    type: 'object',
                    properties: {
                        botToken: { type: 'string' },
                        chatId: { type: 'string' },
                        chartEnabled: { type: 'boolean', default: true }
                    }
                },
                downloads: 15678,
                rating: 4.9,
                reviewCount: 412,
                isVerified: true,
                isFeatured: true,
                publishedAt: new Date('2025-05-20'),
                updatedAt: new Date('2026-02-01'),
                sourceUrl: 'github:notifybot/telegram-pro'
            },
            {
                id: 'whale-tracker',
                name: 'Whale Tracker',
                slug: 'whale-tracker',
                version: '1.2.0',
                description: 'Track large wallet movements on Sui. Get alerts when whales move funds, with sentiment analysis.',
                author: 'OnChainInsights',
                category: 'analysis',
                tags: ['whale', 'tracking', 'analysis', 'alerts'],
                permissions: ['blockchain:read', 'notification:send'],
                triggers: [
                    {
                        name: 'monitorWhales',
                        type: 'interval',
                        config: { interval: 30000 },
                        handler: 'checkWhaleActivity'
                    }
                ],
                downloads: 6234,
                rating: 4.5,
                reviewCount: 89,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-10-05'),
                updatedAt: new Date('2026-01-10'),
                sourceUrl: 'github:onchaininsights/whale-tracker'
            },
            {
                id: 'lst-arbitrage',
                name: 'LST Arbitrage Bot',
                slug: 'lst-arbitrage',
                version: '2.0.0',
                description: 'Automated arbitrage between liquid staking tokens (afSUI, haSUI, vSUI). Detects depeg opportunities.',
                author: 'ArbitrageDAO',
                category: 'trading',
                tags: ['lst', 'arbitrage', 'staking', 'automation'],
                permissions: ['blockchain:read', 'blockchain:write', 'notification:send'],
                actions: [
                    {
                        name: 'scanLSTOpportunities',
                        description: 'Scan for LST arbitrage opportunities',
                        handler: 'scanLST'
                    },
                    {
                        name: 'executeLSTArbitrage',
                        description: 'Execute LST arbitrage trade',
                        handler: 'executeLST',
                        parameters: {
                            fromToken: { type: 'string', description: 'Source token symbol', required: true },
                            toToken: { type: 'string', description: 'Target token symbol', required: true },
                            amount: { type: 'number', description: 'Amount to trade', required: true }
                        }
                    }
                ],
                downloads: 4521,
                rating: 4.4,
                reviewCount: 67,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-11-15'),
                updatedAt: new Date('2026-01-25'),
                sourceUrl: 'github:arbitragedao/lst-arb'
            },
            {
                id: 'scallop-optimizer',
                name: 'Scallop Yield Optimizer',
                slug: 'scallop-optimizer',
                version: '1.8.0',
                description: 'Automatically optimize your Scallop lending positions. Rebalance for best APY.',
                author: 'YieldFarm',
                category: 'trading',
                tags: ['scallop', 'lending', 'yield', 'optimization'],
                permissions: ['blockchain:read', 'blockchain:write'],
                downloads: 7845,
                rating: 4.7,
                reviewCount: 134,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-09-01'),
                updatedAt: new Date('2026-01-18'),
                sourceUrl: 'github:yieldfarm/scallop-optimize'
            },
            {
                id: 'discord-integration',
                name: 'Discord Bot Integration',
                slug: 'discord-integration',
                version: '2.5.0',
                description: 'Full Discord integration with slash commands, embeds, and interactive buttons.',
                author: 'DiscordDevs',
                category: 'integration',
                tags: ['discord', 'bot', 'integration', 'commands'],
                permissions: ['notification:send', 'network:fetch'],
                downloads: 9123,
                rating: 4.6,
                reviewCount: 178,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-07-20'),
                updatedAt: new Date('2026-01-30'),
                sourceUrl: 'github:discorddevs/suiloop-discord'
            },
            {
                id: 'portfolio-tracker',
                name: 'Portfolio Tracker',
                slug: 'portfolio-tracker',
                version: '1.3.0',
                description: 'Track your DeFi portfolio across Sui protocols. Historical P&L, gas spent, and performance analytics.',
                author: 'PortfolioLabs',
                category: 'analysis',
                tags: ['portfolio', 'tracking', 'analytics', 'pnl'],
                permissions: ['blockchain:read', 'memory:write'],
                downloads: 5678,
                rating: 4.3,
                reviewCount: 92,
                isVerified: false,
                isFeatured: false,
                publishedAt: new Date('2025-12-01'),
                updatedAt: new Date('2026-01-05'),
                sourceUrl: 'github:portfoliolabs/sui-tracker'
            },
            {
                id: 'gas-optimizer',
                name: 'Gas Optimizer',
                slug: 'gas-optimizer',
                version: '1.0.0',
                description: 'Optimize transaction gas costs. Batches transactions and finds optimal execution times.',
                author: 'GasDAO',
                category: 'utility',
                tags: ['gas', 'optimization', 'transactions', 'cost'],
                permissions: ['blockchain:read'],
                downloads: 3421,
                rating: 4.2,
                reviewCount: 45,
                isVerified: false,
                isFeatured: false,
                publishedAt: new Date('2026-01-10'),
                updatedAt: new Date('2026-01-10'),
                sourceUrl: 'github:gasdao/gas-optimizer'
            },
            {
                id: 'cetus-lp-manager',
                name: 'Cetus LP Manager',
                slug: 'cetus-lp-manager',
                version: '2.0.0',
                description: 'Manage Cetus CLMM positions. Auto-rebalance, impermanent loss tracking, and optimal range finding.',
                author: 'LPMasters',
                category: 'trading',
                tags: ['cetus', 'lp', 'clmm', 'liquidity'],
                permissions: ['blockchain:read', 'blockchain:write'],
                downloads: 6789,
                rating: 4.5,
                reviewCount: 112,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-08-25'),
                updatedAt: new Date('2026-01-22'),
                sourceUrl: 'github:lpmasters/cetus-manager'
            },
            // ========== NEW SKILLS ==========
            {
                id: 'navi-yield-optimizer',
                name: 'Navi Protocol Optimizer',
                slug: 'navi-yield-optimizer',
                version: '1.4.0',
                description: 'Automatically rebalance Navi lending positions for maximum yield. Supports recursive borrowing strategies.',
                author: 'NaviWhales',
                category: 'trading',
                tags: ['navi', 'lending', 'yield', 'defi'],
                permissions: ['blockchain:read', 'blockchain:write'],
                downloads: 5432,
                rating: 4.4,
                reviewCount: 87,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-09-15'),
                updatedAt: new Date('2026-01-28'),
                sourceUrl: 'github:naviwhales/yield-optimizer'
            },
            {
                id: 'turbos-sniper',
                name: 'Turbos MEV Sniper',
                slug: 'turbos-sniper',
                version: '2.3.0',
                description: 'High-speed mempool monitoring and front-running protection. Snipe new token launches on Turbos DEX.',
                author: 'MEVLabs',
                category: 'trading',
                tags: ['mev', 'sniper', 'turbos', 'mempool'],
                permissions: ['blockchain:read', 'blockchain:write', 'notification:send'],
                downloads: 3456,
                rating: 4.2,
                reviewCount: 56,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-11-01'),
                updatedAt: new Date('2026-01-30'),
                sourceUrl: 'github:mevlabs/turbos-sniper'
            },
            {
                id: 'deepbook-market-maker',
                name: 'DeepBook Market Maker',
                slug: 'deepbook-market-maker',
                version: '1.0.0',
                description: 'Automated market making on DeepBook orderbook. Spread optimization and inventory management.',
                author: 'MMGuild',
                category: 'trading',
                tags: ['deepbook', 'market-maker', 'orderbook', 'liquidity'],
                permissions: ['blockchain:read', 'blockchain:write'],
                downloads: 2345,
                rating: 4.3,
                reviewCount: 34,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2026-01-05'),
                updatedAt: new Date('2026-02-01'),
                sourceUrl: 'github:mmguild/deepbook-mm'
            },
            {
                id: 'twitter-sentiment',
                name: 'Twitter/X Sentiment Analyzer',
                slug: 'twitter-sentiment',
                version: '2.0.0',
                description: 'Real-time sentiment analysis of crypto Twitter. Tracks influencers, hashtags, and token mentions.',
                author: 'SocialFi',
                category: 'analysis',
                tags: ['twitter', 'sentiment', 'social', 'ai'],
                permissions: ['network:fetch', 'notification:send'],
                downloads: 8765,
                rating: 4.6,
                reviewCount: 145,
                isVerified: true,
                isFeatured: true,
                publishedAt: new Date('2025-07-10'),
                updatedAt: new Date('2026-01-25'),
                sourceUrl: 'github:socialfi/twitter-sentiment'
            },
            {
                id: 'sui-name-service',
                name: 'SuiNS Integration',
                slug: 'sui-name-service',
                version: '1.2.0',
                description: 'Integrate Sui Name Service into your agent. Resolve .sui names, look up registration data.',
                author: 'SuiNS Team',
                category: 'utility',
                tags: ['suins', 'names', 'identity', 'lookup'],
                permissions: ['blockchain:read'],
                downloads: 4567,
                rating: 4.7,
                reviewCount: 78,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-06-20'),
                updatedAt: new Date('2026-01-15'),
                sourceUrl: 'github:suins/agent-plugin'
            },
            {
                id: 'kriya-farming',
                name: 'Kriya DEX Farming',
                slug: 'kriya-farming',
                version: '1.1.0',
                description: 'Automated yield farming on Kriya DEX. Compound rewards, manage LP positions.',
                author: 'KriyaDAO',
                category: 'trading',
                tags: ['kriya', 'farming', 'yield', 'dex'],
                permissions: ['blockchain:read', 'blockchain:write'],
                downloads: 2890,
                rating: 4.1,
                reviewCount: 45,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-10-20'),
                updatedAt: new Date('2026-01-20'),
                sourceUrl: 'github:kriyadao/farming-bot'
            },
            {
                id: 'bluemove-nft',
                name: 'BlueMove NFT Tracker',
                slug: 'bluemove-nft',
                version: '1.5.0',
                description: 'Track NFT floor prices, rarity sniper, and automated bidding on BlueMove marketplace.',
                author: 'NFTSnipers',
                category: 'analysis',
                tags: ['nft', 'bluemove', 'tracking', 'sniper'],
                permissions: ['blockchain:read', 'blockchain:write', 'notification:send'],
                downloads: 3678,
                rating: 4.3,
                reviewCount: 56,
                isVerified: false,
                isFeatured: false,
                publishedAt: new Date('2025-11-10'),
                updatedAt: new Date('2026-01-18'),
                sourceUrl: 'github:nftsnipers/bluemove-tracker'
            },
            {
                id: 'pyth-oracle',
                name: 'Pyth Network Oracle',
                slug: 'pyth-oracle',
                version: '2.1.0',
                description: 'Integrate Pyth Network high-fidelity price feeds. Real-time price data for 200+ assets.',
                author: 'Pyth Contributors',
                category: 'data',
                tags: ['pyth', 'oracle', 'price', 'data'],
                permissions: ['network:fetch'],
                downloads: 9876,
                rating: 4.9,
                reviewCount: 234,
                isVerified: true,
                isFeatured: true,
                publishedAt: new Date('2025-04-15'),
                updatedAt: new Date('2026-02-01'),
                sourceUrl: 'github:pyth-network/sui-plugin'
            },
            {
                id: 'email-alerts',
                name: 'Email Alert System',
                slug: 'email-alerts',
                version: '1.0.0',
                description: 'Send email notifications for strategy events. Supports Gmail, Outlook, and custom SMTP.',
                author: 'NotifyPro',
                category: 'notification',
                tags: ['email', 'alerts', 'notifications', 'smtp'],
                permissions: ['notification:send', 'network:fetch'],
                configSchema: {
                    type: 'object',
                    properties: {
                        smtpHost: { type: 'string' },
                        smtpPort: { type: 'number' },
                        email: { type: 'string' },
                        password: { type: 'string' }
                    }
                },
                downloads: 4321,
                rating: 4.0,
                reviewCount: 67,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-12-01'),
                updatedAt: new Date('2026-01-10'),
                sourceUrl: 'github:notifypro/email-alerts'
            },
            {
                id: 'slack-integration',
                name: 'Slack Workspace Bot',
                slug: 'slack-integration',
                version: '1.3.0',
                description: 'Connect SuiLoop to your Slack workspace. Receive alerts in channels and execute commands.',
                author: 'SlackDev',
                category: 'integration',
                tags: ['slack', 'bot', 'integration', 'workspace'],
                permissions: ['notification:send', 'network:fetch'],
                downloads: 5678,
                rating: 4.4,
                reviewCount: 89,
                isVerified: true,
                isFeatured: false,
                publishedAt: new Date('2025-08-05'),
                updatedAt: new Date('2026-01-22'),
                sourceUrl: 'github:slackdev/suiloop-slack'
            }
        ];

        for (const skill of builtInSkills) {
            this.localSkills.set(skill.id, skill);
        }
    }

    // ========================================================================
    // BROWSE & SEARCH
    // ========================================================================

    /**
     * Get featured skills
     */
    async getFeatured(): Promise<MarketplaceSkill[]> {
        try {
            const response = await this.client.get('/skills/featured');
            return response.data.skills;
        } catch {
            // Fallback to local
            return Array.from(this.localSkills.values()).filter(s => s.isFeatured);
        }
    }

    /**
     * Get trending skills
     */
    async getTrending(limit: number = 10): Promise<MarketplaceSkill[]> {
        try {
            const response = await this.client.get('/skills/trending', {
                params: { limit }
            });
            return response.data.skills;
        } catch {
            // Fallback to local sorted by downloads
            return Array.from(this.localSkills.values())
                .sort((a, b) => b.downloads - a.downloads)
                .slice(0, limit);
        }
    }

    /**
     * Get newest skills
     */
    async getNewest(limit: number = 10): Promise<MarketplaceSkill[]> {
        try {
            const response = await this.client.get('/skills/newest', {
                params: { limit }
            });
            return response.data.skills;
        } catch {
            return Array.from(this.localSkills.values())
                .sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime())
                .slice(0, limit);
        }
    }

    /**
     * Search skills
     */
    async search(filters: SearchFilters = {}): Promise<{
        skills: MarketplaceSkill[];
        total: number;
        hasMore: boolean;
    }> {
        try {
            const response = await this.client.get('/skills/search', {
                params: filters
            });
            return response.data;
        } catch {
            // Local search
            let results = Array.from(this.localSkills.values());

            // Filter by query
            if (filters.query) {
                const query = filters.query.toLowerCase();
                results = results.filter(s =>
                    s.name.toLowerCase().includes(query) ||
                    s.description.toLowerCase().includes(query) ||
                    s.tags.some(t => t.toLowerCase().includes(query))
                );
            }

            // Filter by category
            if (filters.category) {
                results = results.filter(s => s.category === filters.category);
            }

            // Filter by tags
            if (filters.tags?.length) {
                results = results.filter(s =>
                    filters.tags!.some(t => s.tags.includes(t))
                );
            }

            // Filter by rating
            if (filters.minRating) {
                results = results.filter(s => s.rating >= filters.minRating!);
            }

            // Filter by verified
            if (filters.verified !== undefined) {
                results = results.filter(s => s.isVerified === filters.verified);
            }

            // Sort
            switch (filters.sortBy) {
                case 'downloads':
                    results.sort((a, b) => b.downloads - a.downloads);
                    break;
                case 'rating':
                    results.sort((a, b) => b.rating - a.rating);
                    break;
                case 'newest':
                    results.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
                    break;
                case 'updated':
                    results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
                    break;
            }

            // Pagination
            const offset = filters.offset || 0;
            const limit = filters.limit || 20;
            const total = results.length;
            results = results.slice(offset, offset + limit);

            return {
                skills: results,
                total,
                hasMore: offset + limit < total
            };
        }
    }

    /**
     * Get skills by category
     */
    async getByCategory(category: SkillCategory): Promise<MarketplaceSkill[]> {
        const { skills } = await this.search({ category, limit: 50 });
        return skills;
    }

    /**
     * Get skill details
     */
    async getSkill(idOrSlug: string): Promise<MarketplaceSkill | null> {
        try {
            const response = await this.client.get(`/skills/${idOrSlug}`);
            return response.data;
        } catch {
            // Local lookup
            return this.localSkills.get(idOrSlug) ||
                Array.from(this.localSkills.values()).find(s => s.slug === idOrSlug) ||
                null;
        }
    }

    // ========================================================================
    // REVIEWS
    // ========================================================================

    /**
     * Get skill reviews
     */
    async getReviews(skillId: string): Promise<SkillReview[]> {
        try {
            const response = await this.client.get(`/skills/${skillId}/reviews`);
            return response.data.reviews;
        } catch {
            // Return mock reviews
            return this.localReviews.get(skillId) || this.generateMockReviews(skillId);
        }
    }

    /**
     * Submit a review
     */
    async submitReview(review: ReviewSubmission): Promise<SkillReview> {
        if (!this.userId) {
            throw new Error('Must be authenticated to submit reviews');
        }

        try {
            const response = await this.client.post(`/skills/${review.skillId}/reviews`, {
                ...review,
                userId: this.userId
            });
            return response.data;
        } catch {
            // Local mock
            const newReview: SkillReview = {
                id: crypto.randomUUID(),
                skillId: review.skillId,
                userId: this.userId,
                username: 'You',
                rating: review.rating,
                title: review.title,
                content: review.content,
                createdAt: new Date(),
                helpful: 0
            };

            const reviews = this.localReviews.get(review.skillId) || [];
            reviews.unshift(newReview);
            this.localReviews.set(review.skillId, reviews);

            return newReview;
        }
    }

    /**
     * Generate mock reviews for demo
     */
    private generateMockReviews(skillId: string): SkillReview[] {
        const reviews: SkillReview[] = [
            {
                id: crypto.randomUUID(),
                skillId,
                userId: 'user1',
                username: 'DeFiWizard',
                rating: 5,
                title: 'Exactly what I needed!',
                content: 'This skill saved me hours of manual work. Highly recommended for anyone looking to automate their DeFi strategies.',
                createdAt: new Date('2026-01-15'),
                helpful: 24
            },
            {
                id: crypto.randomUUID(),
                skillId,
                userId: 'user2',
                username: 'CryptoTrader99',
                rating: 4,
                title: 'Great but could use more docs',
                content: 'Works as advertised. Would love to see more documentation on the advanced features.',
                createdAt: new Date('2026-01-10'),
                helpful: 12
            },
            {
                id: crypto.randomUUID(),
                skillId,
                userId: 'user3',
                username: 'SuiMaximalist',
                rating: 5,
                title: 'Best skill in its category',
                content: 'Ive tried several alternatives and this is by far the best. The author is also very responsive to issues.',
                createdAt: new Date('2026-01-05'),
                helpful: 18
            }
        ];

        this.localReviews.set(skillId, reviews);
        return reviews;
    }

    // ========================================================================
    // INSTALL / DOWNLOAD
    // ========================================================================

    /**
     * Get install URL for a skill
     */
    async getInstallUrl(skillId: string): Promise<string> {
        const skill = await this.getSkill(skillId);
        if (!skill) {
            throw new Error(`Skill ${skillId} not found`);
        }

        // Increment download count (fire and forget)
        this.client.post(`/skills/${skillId}/download`).catch(() => { });

        return skill.sourceUrl || `loophub:${skill.slug}`;
    }

    /**
     * Track installation
     */
    async trackInstall(skillId: string): Promise<void> {
        try {
            await this.client.post(`/skills/${skillId}/install`, {
                userId: this.userId
            });
        } catch {
            // Local increment
            const skill = this.localSkills.get(skillId);
            if (skill) {
                skill.downloads++;
            }
        }

        this.emit('skill:installed', { skillId });
    }

    // ========================================================================
    // PUBLISH
    // ========================================================================

    /**
     * Publish a new skill
     */
    async publish(request: PublishRequest): Promise<MarketplaceSkill> {
        if (!this.userId || !this.apiKey) {
            throw new Error('Must be authenticated to publish skills');
        }

        try {
            const response = await this.client.post('/skills', request);
            return response.data;
        } catch {
            // Local mock
            const newSkill: MarketplaceSkill = {
                id: crypto.randomUUID(),
                ...request.manifest,
                downloads: 0,
                rating: 0,
                reviewCount: 0,
                isVerified: false,
                isFeatured: false,
                publishedAt: new Date(),
                updatedAt: new Date(),
                sourceUrl: request.sourceUrl,
                demoUrl: request.demoUrl,
                screenshots: request.screenshots
            };

            this.localSkills.set(newSkill.id, newSkill);
            this.emit('skill:published', { skill: newSkill });

            return newSkill;
        }
    }

    /**
     * Update an existing skill
     */
    async update(skillId: string, updates: Partial<PublishRequest>): Promise<MarketplaceSkill> {
        try {
            const response = await this.client.patch(`/skills/${skillId}`, updates);
            return response.data;
        } catch {
            const skill = this.localSkills.get(skillId);
            if (!skill) throw new Error('Skill not found');

            Object.assign(skill, updates.manifest, {
                updatedAt: new Date(),
                sourceUrl: updates.sourceUrl || skill.sourceUrl
            });

            return skill;
        }
    }

    // ========================================================================
    // USER SKILLS
    // ========================================================================

    /**
     * Get skills published by a user
     */
    async getUserSkills(userId?: string): Promise<MarketplaceSkill[]> {
        const targetUserId = userId || this.userId;
        if (!targetUserId) return [];

        try {
            const response = await this.client.get(`/users/${targetUserId}/skills`);
            return response.data.skills;
        } catch {
            return Array.from(this.localSkills.values())
                .filter(s => s.author === targetUserId);
        }
    }

    /**
     * Get user's installed skills (from local storage)
     */
    getInstalledSkills(): string[] {
        // This would typically come from local storage or database
        return ['flash-loan-executor', 'price-oracle'];
    }

    // ========================================================================
    // STATS
    // ========================================================================

    /**
     * Get marketplace statistics
     */
    async getStats(): Promise<{
        totalSkills: number;
        totalDownloads: number;
        totalAuthors: number;
        categories: Record<SkillCategory, number>;
    }> {
        try {
            const response = await this.client.get('/stats');
            return response.data;
        } catch {
            const skills = Array.from(this.localSkills.values());
            const categories = skills.reduce((acc, s) => {
                acc[s.category] = (acc[s.category] || 0) + 1;
                return acc;
            }, {} as Record<SkillCategory, number>);

            return {
                totalSkills: skills.length,
                totalDownloads: skills.reduce((sum, s) => sum + s.downloads, 0),
                totalAuthors: new Set(skills.map(s => s.author)).size,
                categories
            };
        }
    }

    /**
     * Download a skill package
     * In a real implementation, this would download a zip/tarball from the API
     * For now, it returns the source URL for the SkillManager to handle
     */
    async downloadSkill(skillId: string): Promise<{ success: boolean; source?: string; error?: string }> {
        try {
            const skill = await this.getSkill(skillId);

            if (!skill) {
                return { success: false, error: 'Skill not found' };
            }

            // In production: await this.client.get(`/skills/${skillId}/download`, { responseType: 'blob' });
            // For now, return a virtual source that SkillManager understands

            if (skill.sourceUrl && skill.sourceUrl.startsWith('github:')) {
                return { success: true, source: skill.sourceUrl };
            }

            return { success: true, source: `loophub:${skill.slug}` };
        } catch (error) {
            return { success: false, error: String(error) };
        }
    }
}

// ============================================================================
// LOOPHUB API ROUTES (for integration with server.ts)
// ============================================================================

export function createLoopHubRoutes(client: LoopHubClient) {
    return {
        // GET /api/loophub/featured
        getFeatured: async () => {
            return await client.getFeatured();
        },

        // GET /api/loophub/trending
        getTrending: async (limit?: number) => {
            return await client.getTrending(limit);
        },

        // GET /api/loophub/search
        search: async (filters: SearchFilters) => {
            return await client.search(filters);
        },

        // GET /api/loophub/skills/:id
        getSkill: async (id: string) => {
            return await client.getSkill(id);
        },

        // GET /api/loophub/skills/:id/reviews
        getReviews: async (skillId: string) => {
            return await client.getReviews(skillId);
        },

        // POST /api/loophub/skills/:id/reviews
        submitReview: async (review: ReviewSubmission) => {
            return await client.submitReview(review);
        },

        // GET /api/loophub/skills/:id/install
        getInstallUrl: async (skillId: string) => {
            return await client.getInstallUrl(skillId);
        },

        // GET /api/loophub/stats
        getStats: async () => {
            return await client.getStats();
        },

        // POST /api/loophub/skills
        publish: async (request: PublishRequest) => {
            return await client.publish(request);
        }
    };
}

// ============================================================================
// SINGLETON & EXPORTS
// ============================================================================

let loopHubClient: LoopHubClient | null = null;

export function initializeLoopHub(options?: {
    baseUrl?: string;
    apiKey?: string;
    userId?: string;
}): LoopHubClient {
    if (!loopHubClient) {
        loopHubClient = new LoopHubClient(options);
        console.log('🏪 LoopHub Marketplace initialized');
    }
    return loopHubClient;
}

export function getLoopHubClient(): LoopHubClient | null {
    return loopHubClient;
}

export default LoopHubClient;
