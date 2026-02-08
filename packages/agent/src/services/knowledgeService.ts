/**
 * SuiLoop Knowledge Service
 * 
 * Provides external knowledge gathering capabilities via search APIs (Tavily/Google).
 * This service powers the "Knowledge Graph" plugin.
 */

import axios from 'axios';

export interface SearchResult {
    title: string;
    url: string;
    content: string;
    score: number;
}

export class KnowledgeService {
    private apiKey: string | undefined;
    private baseUrl = 'https://api.tavily.com/search';

    constructor() {
        this.apiKey = process.env.TAVILY_API_KEY;
        if (this.apiKey) {
            console.log('🧠 Knowledge Service initialized (Tavily)');
        } else {
            console.log('⚠️ Tavily API key missing. Knowledge Service running in mock mode.');
        }
    }

    /**
     * Perform a search query
     */
    async search(query: string, maxResults: number = 5): Promise<SearchResult[]> {
        if (!this.apiKey) {
            return this.mockSearch(query);
        }

        try {
            const response = await axios.post(this.baseUrl, {
                api_key: this.apiKey,
                query,
                search_depth: "basic",
                include_answer: true,
                max_results: maxResults,
                include_raw_content: false
            });

            return response.data.results.map((r: any) => ({
                title: r.title,
                url: r.url,
                content: r.content,
                score: r.score
            }));
        } catch (error) {
            console.error('Search failed:', error);
            return [];
        }
    }

    /**
     * Explain a market event
     */
    async explainMarketEvent(asset: string): Promise<string> {
        const query = `Why is ${asset} crypto price moving today? news reason`;
        const results = await this.search(query, 3);

        if (results.length === 0) return `No recent news found for ${asset}.`;

        const summary = results.map(r => `- ${r.title}: ${r.content.substring(0, 150)}...`).join('\n');
        return `Here is the latest context for ${asset}:\n${summary}`;
    }

    private mockSearch(query: string): SearchResult[] {
        return [
            {
                title: `Analysis of ${query}`,
                url: 'https://suiloop.com/market-analysis',
                content: `(Mock) Market analysis indicates strong buying pressure for topics related to "${query}" due to recent protocol upgrades.`,
                score: 0.95
            },
            {
                title: 'Sui Network Updates',
                url: 'https://sui.io/news',
                content: '(Mock) New partnership announcement driving volume in the ecosystem.',
                score: 0.88
            }
        ];
    }
}

// ============================================================================
// ACTIONS FOR SKILL MANAGER
// ============================================================================

export const knowledgeActions = {
    search: {
        name: 'SEARCH_KNOWLEDGE',
        description: 'Search the web for information',
        handler: async (service: KnowledgeService, params: { query: string }) => {
            return await service.search(params.query);
        }
    },
    explainEvent: {
        name: 'EXPLAIN_EVENT',
        description: 'Explain why an asset is moving',
        handler: async (service: KnowledgeService, params: { asset: string }) => {
            return await service.explainMarketEvent(params.asset);
        }
    }
};

// Singleton
let knowledgeService: KnowledgeService | null = null;

export function initializeKnowledgeService(): KnowledgeService {
    if (!knowledgeService) {
        knowledgeService = new KnowledgeService();
    }
    return knowledgeService;
}

export function getKnowledgeService(): KnowledgeService | null {
    return knowledgeService;
}

export default KnowledgeService;
