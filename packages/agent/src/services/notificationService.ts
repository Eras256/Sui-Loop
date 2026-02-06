/**
 * SuiLoop Notification Manager
 * 
 * Centralized hub for multi-channel broadcasting.
 * Routes messages to:
 * - internal WebSocket (Always)
 * - Telegram (If configured)
 * - Discord (If configured)
 * - Twitter (If critical & public)
 */

import { broadcastLog } from './subscriptionService';
import { getTelegramService } from './telegramService';
import { getDiscordService } from './discordService';
import { getTwitterService } from './twitterService';

export type NotificationLevel = 'info' | 'success' | 'warning' | 'error' | 'critical';

export class NotificationService {

    /**
     * Broadcast a message to all active channels
     */
    async notify(level: NotificationLevel, message: string, data?: any) {
        // 1. WebSocket (Internal)
        const logMap: Record<NotificationLevel, 'info' | 'success' | 'warn' | 'error'> = {
            'info': 'info',
            'success': 'success',
            'warning': 'warn',
            'error': 'error',
            'critical': 'error'
        };
        broadcastLog(logMap[level], message);

        // 2. Telegram
        const telegram = getTelegramService();
        if (telegram) {
            const icon = this.getIcon(level);
            await telegram.sendMessage(`${icon} *${level.toUpperCase()}*: ${message}`);
        }

        // 3. Discord
        const discord = getDiscordService();
        if (discord) {
            if (level === 'success' || level === 'critical') {
                await discord.sendAlert(
                    level.toUpperCase(),
                    message,
                    level === 'success' ? 0x00ff00 : 0xff0000,
                    data ? [{ name: 'Details', value: JSON.stringify(data).slice(0, 1000) }] : []
                );
            } else {
                await discord.sendMessage(`[${level.toUpperCase()}] ${message}`);
            }
        }

        // 4. Twitter (Only Critical or Big Wins)
        if (level === 'critical' || (level === 'success' && message.includes('Profit'))) {
            const twitter = getTwitterService();
            if (twitter) {
                await twitter.tweet(`🤖 SuiLoop Update:\n${message}\n#SUI #DeFi`);
            }
        }
    }

    private getIcon(level: NotificationLevel): string {
        switch (level) {
            case 'success': return '✅';
            case 'warning': return '⚠️';
            case 'error': return '❌';
            case 'critical': return '🚨';
            default: return 'ℹ️';
        }
    }
}

// Singleton
const notificationService = new NotificationService();
export const notifier = notificationService;
