/**
 * SuiLoop Twitter Service
 * 
 * Provides SocialOps capabilities via X (Twitter) API v2.
 * - Post automated updates
 * - Reply to mentions (future scope)
 */

import { TwitterApi } from 'twitter-api-v2';

export class TwitterService {
    private client: TwitterApi | null = null;

    constructor() {
        if (
            process.env.TWITTER_APP_KEY &&
            process.env.TWITTER_APP_SECRET &&
            process.env.TWITTER_ACCESS_TOKEN &&
            process.env.TWITTER_ACCESS_SECRET
        ) {
            this.client = new TwitterApi({
                appKey: process.env.TWITTER_APP_KEY,
                appSecret: process.env.TWITTER_APP_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_SECRET,
            });
            console.log('🐦 Twitter Service initialized');
        } else {
            console.log('⚠️ Twitter credentials missing. Service disabled.');
        }
    }

    /**
     * Post a Tweet
     */
    async tweet(text: string) {
        if (!this.client) return;
        try {
            await this.client.v2.tweet(text);
            console.log('🐦 Tweet sent:', text);
        } catch (error) {
            console.error('Failed to send Tweet:', error);
        }
    }
}

// Singleton Export
let twitterService: TwitterService | null = null;

export function initializeTwitterService(): TwitterService {
    if (!twitterService) {
        twitterService = new TwitterService();
    }
    return twitterService;
}

export function getTwitterService(): TwitterService | null {
    return twitterService;
}
