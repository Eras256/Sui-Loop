/**
 * SuiLoop Discord Service
 * 
 * Provides alert routing to Discord channels via Webhooks.
 * - Outbound notifications only (Fire & Forget)
 * - Rich Embed support for signals
 */

import axios from 'axios';

export class DiscordService {
    private webhookUrl: string | null = null;

    constructor() {
        this.webhookUrl = process.env.DISCORD_WEBHOOK_URL || null;
        if (!this.webhookUrl) {
            console.log('⚠️ DISCORD_WEBHOOK_URL not found. Discord service disabled.');
        } else {
            console.log('🎮 Discord Service initialized');
        }
    }

    /**
     * Send a standard message
     */
    async sendMessage(content: string) {
        if (!this.webhookUrl) return;
        try {
            await axios.post(this.webhookUrl, { content });
        } catch (error) {
            console.error('Failed to send Discord message:', error);
        }
    }

    /**
     * Send a rich embed alert (e.g. for Trades)
     */
    async sendAlert(title: string, description: string, color: number = 0x00ff00, fields: any[] = []) {
        if (!this.webhookUrl) return;
        try {
            await axios.post(this.webhookUrl, {
                embeds: [{
                    title,
                    description,
                    color,
                    fields,
                    footer: { text: "SuiLoop Autonomous Agent" },
                    timestamp: new Date().toISOString()
                }]
            });
        } catch (error) {
            console.error('Failed to send Discord alert:', error);
        }
    }
}

// Singleton Export
let discordService: DiscordService | null = null;

export function initializeDiscordService(): DiscordService {
    if (!discordService) {
        discordService = new DiscordService();
    }
    return discordService;
}

export function getDiscordService(): DiscordService | null {
    return discordService;
}
