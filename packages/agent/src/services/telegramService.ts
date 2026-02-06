/**
 * SuiLoop Telegram Service
 * 
 * Provides bi-directional ChatOps capabilities via Telegram.
 * - Broadcast alerts to admin chat
 * - Handle commands (/status, /balance, /stop)
 * - Interactive controls for the agent
 */

import { Telegraf, Context } from 'telegraf';
import { getLoopStatus, stopAutonomousLoop } from './autonomousLoop';
import { getSubscriptionStats } from './subscriptionService';

export class TelegramService {
    private bot: Telegraf | null = null;
    private adminChatId: string | null = null;

    constructor() {
        if (process.env.TELEGRAM_BOT_TOKEN) {
            this.bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
            this.adminChatId = process.env.TELEGRAM_CHAT_ID || null;
            this.initializeBot();
        } else {
            console.log('⚠️ TELEGRAM_BOT_TOKEN not found. Telegram service disabled.');
        }
    }

    private initializeBot() {
        if (!this.bot) return;

        // Command: /start
        this.bot.start((ctx) => {
            ctx.reply('🤖 SuiLoop Agent Online. Ready for commands.');
            if (this.adminChatId === null) {
                this.adminChatId = ctx.chat.id.toString();
                console.log(`Telegram Admin Chat ID set to: ${this.adminChatId}`);
                ctx.reply(`✅ Admin configured. Chat ID: ${this.adminChatId}`);
            }
        });

        // Command: /status
        this.bot.command('status', (ctx) => {
            const status = getLoopStatus();
            const stats = getSubscriptionStats();
            ctx.reply(
                `📊 *System Status*\n\n` +
                `Autonomous Loop: ${status.isRunning ? '🟢 RUNNING' : '🔴 STOPPED'}\n` +
                // `Strategy: ${status.config.strategy}\n` + // Removed as strategy prop might differ
                `Active Subs: ${stats.active}\n` +
                `Uptime: ${process.uptime().toFixed(0)}s`,
                { parse_mode: 'Markdown' }
            );
        });

        // Command: /stop
        this.bot.command('stop', (ctx) => {
            if (stopAutonomousLoop()) {
                ctx.reply('🛑 Emergency Stop Triggered. Loop has been halted.');
            } else {
                ctx.reply('⚠️ Loop was not running.');
            }
        });

        // Command: /help
        this.bot.help((ctx) => {
            ctx.reply(
                'Available Commands:\n' +
                '/status - Check agent health\n' +
                '/stop - Emergency halt\n' +
                '/balance - Check wallet balance (Mock)\n' +
                '/help - Show this list'
            );
        });

        // Error Handling
        this.bot.catch((err, ctx) => {
            console.error(`Telegram Error for ${ctx.updateType}:`, err);
        });

        // Launch
        this.bot.launch().then(() => {
            console.log('✈️ Telegram Bot launched');
            if (this.adminChatId) {
                this.sendMessage('🤖 System Rebooted. Neural Matrix Online.');
            }
        }).catch(err => console.error('Failed to launch Telegram bot', err));

        // Graceful Stop
        process.once('SIGINT', () => this.bot?.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot?.stop('SIGTERM'));
    }

    /**
     * Send a notification to the admin
     */
    async sendMessage(message: string) {
        if (!this.bot || !this.adminChatId) return;
        try {
            await this.bot.telegram.sendMessage(this.adminChatId, message);
        } catch (error) {
            console.error('Failed to send Telegram message:', error);
        }
    }
}

// Singleton Export
let telegramService: TelegramService | null = null;

export function initializeTelegramService(): TelegramService {
    if (!telegramService) {
        telegramService = new TelegramService();
    }
    return telegramService;
}

export function getTelegramService(): TelegramService | null {
    return telegramService;
}
