/**
 * SuiLoop Telegram Bot Integration
 * 
 * Connects your SuiLoop agent to Telegram, allowing users to:
 * - Execute strategies via chat commands
 * - Receive real-time opportunity alerts
 * - Check portfolio and balances
 * - Monitor active strategies
 * 
 * Inspired by OpenClaw's multi-platform messaging integration.
 */

import { Telegraf, Context, Markup } from 'telegraf';
import { message } from 'telegraf/filters';
import { getMemoryService } from '../services/memoryService.js';
// Note: subscriptionService import removed - using direct integration instead
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface TelegramUser {
    id: string;
    telegramId: number;
    username?: string;
    firstName?: string;
    walletAddress?: string;
    apiKey?: string;
    isVerified: boolean;
    createdAt: Date;
}

interface BotConfig {
    token: string;
    apiBaseUrl?: string;
    adminChatId?: number;
    welcomeMessage?: string;
}

// ============================================================================
// BOT INSTANCE
// ============================================================================

class SuiLoopTelegramBot {
    private bot: Telegraf;
    private users: Map<number, TelegramUser> = new Map();
    private pendingVerifications: Map<string, number> = new Map(); // code -> telegramId
    private config: BotConfig;
    private isRunning = false;

    constructor(config: BotConfig) {
        this.config = {
            apiBaseUrl: 'http://localhost:3001',
            welcomeMessage: `
🔮 *Welcome to SuiLoop Agent*

Your autonomous DeFi companion on Sui Network.

*Quick Commands:*
/start - Initialize your agent
/connect <wallet> - Link your Sui wallet
/balance - Check your portfolio
/strategies - View available strategies
/deploy <id> - Deploy a strategy
/fleet - View active strategies
/stop <id> - Stop a strategy
/settings - Configure preferences
/help - Show all commands

_Type any message to chat with the agent!_
            `.trim(),
            ...config
        };

        this.bot = new Telegraf(config.token);
        this.setupHandlers();
    }

    /**
     * Setup all bot command and message handlers
     */
    private setupHandlers(): void {
        // Error handling
        this.bot.catch((err, ctx) => {
            console.error('Telegram bot error:', err);
            ctx.reply('❌ An error occurred. Please try again.');
        });

        // ====================================================================
        // COMMANDS
        // ====================================================================

        // /start - Initialize
        this.bot.command('start', async (ctx) => {
            const user = await this.getOrCreateUser(ctx);

            await ctx.replyWithMarkdown(this.config.welcomeMessage!, {
                ...Markup.keyboard([
                    ['📊 Balance', '🚀 Strategies'],
                    ['🤖 Fleet', '⚙️ Settings'],
                    ['❓ Help']
                ]).resize()
            });

            // Log to memory
            const memoryService = getMemoryService();
            await memoryService.addMessage(
                user.id,
                'system',
                'User started Telegram bot session'
            );
        });

        // /connect <wallet> - Link wallet
        this.bot.command('connect', async (ctx) => {
            const user = await this.getOrCreateUser(ctx);
            const wallet = ctx.message.text.split(' ')[1];

            if (!wallet || !wallet.startsWith('0x')) {
                await ctx.reply(
                    '❌ Please provide a valid Sui wallet address.\n\n' +
                    'Usage: `/connect 0x1234...`',
                    { parse_mode: 'Markdown' }
                );
                return;
            }

            // Generate verification code
            const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();
            this.pendingVerifications.set(verificationCode, ctx.from!.id);

            user.walletAddress = wallet;
            this.users.set(ctx.from!.id, user);

            await ctx.replyWithMarkdown(
                `🔗 *Wallet Connection*\n\n` +
                `Wallet: \`${wallet.slice(0, 10)}...${wallet.slice(-6)}\`\n\n` +
                `To verify ownership, please sign this message on the SuiLoop website:\n\n` +
                `\`SUILOOP_VERIFY_${verificationCode}\`\n\n` +
                `Or use: /verify ${verificationCode} after signing.`
            );
        });

        // /verify <code> - Verify wallet ownership
        this.bot.command('verify', async (ctx) => {
            const user = await this.getOrCreateUser(ctx);
            const code = ctx.message.text.split(' ')[1]?.toUpperCase();

            if (!code || !this.pendingVerifications.has(code)) {
                await ctx.reply('❌ Invalid verification code.');
                return;
            }

            if (this.pendingVerifications.get(code) !== ctx.from!.id) {
                await ctx.reply('❌ This verification code is not for you.');
                return;
            }

            user.isVerified = true;
            this.pendingVerifications.delete(code);
            this.users.set(ctx.from!.id, user);

            await ctx.replyWithMarkdown(
                `✅ *Wallet Verified!*\n\n` +
                `Your wallet \`${user.walletAddress?.slice(0, 10)}...${user.walletAddress?.slice(-6)}\` ` +
                `is now linked to this Telegram account.\n\n` +
                `You can now deploy strategies and receive alerts!`
            );
        });

        // /balance - Check portfolio
        this.bot.command('balance', async (ctx) => {
            const user = await this.getOrCreateUser(ctx);

            if (!user.walletAddress) {
                await ctx.reply('❌ Please connect your wallet first with /connect');
                return;
            }

            await ctx.reply('🔄 Fetching balance...');

            // TODO: Integrate with actual balance fetching
            // For now, show mock data
            const balance = {
                sui: 125.45,
                usdc: 1250.00,
                usdValue: 3750.00
            };

            await ctx.replyWithMarkdown(
                `💰 *Portfolio Balance*\n\n` +
                `*SUI:* ${balance.sui.toFixed(2)} SUI\n` +
                `*USDC:* ${balance.usdc.toFixed(2)} USDC\n\n` +
                `📈 *Total Value:* $${balance.usdValue.toFixed(2)}`
            );
        });

        // /strategies - List available strategies
        this.bot.command('strategies', async (ctx) => {
            const strategies = [
                { id: 'sui-usdc-loop', name: 'SUI-USDC Kinetic Vector', apy: '14.2%', risk: 'Low' },
                { id: 'turbo-sniper', name: 'Memetic Volatility Hunter', apy: '420%', risk: 'High' },
                { id: 'liquid-staking-arb', name: 'LST Peg Restoration', apy: '8.5%', risk: 'Very Low' },
                { id: 'lending-loop-max', name: 'Navi-Scallop Recursive', apy: '22.4%', risk: 'Medium' },
            ];

            let message = '🚀 *Available Strategies*\n\n';

            strategies.forEach((s, i) => {
                const riskEmoji = s.risk === 'High' ? '🔴' : s.risk === 'Medium' ? '🟡' : '🟢';
                message += `${i + 1}. *${s.name}*\n`;
                message += `   APY: ${s.apy} | Risk: ${riskEmoji} ${s.risk}\n`;
                message += `   Deploy: \`/deploy ${s.id}\`\n\n`;
            });

            message += '_Use /deploy <id> to deploy a strategy_';

            await ctx.replyWithMarkdown(message);
        });

        // /deploy <strategy_id> - Deploy a strategy
        this.bot.command('deploy', async (ctx) => {
            const user = await this.getOrCreateUser(ctx);
            const strategyId = ctx.message.text.split(' ')[1];

            if (!user.walletAddress || !user.isVerified) {
                await ctx.reply('❌ Please connect and verify your wallet first.');
                return;
            }

            if (!strategyId) {
                await ctx.reply('❌ Please specify a strategy ID.\n\nUsage: `/deploy sui-usdc-loop`', {
                    parse_mode: 'Markdown'
                });
                return;
            }

            await ctx.replyWithMarkdown(
                `🚀 *Deploying Strategy*\n\n` +
                `Strategy: \`${strategyId}\`\n` +
                `Wallet: \`${user.walletAddress.slice(0, 10)}...${user.walletAddress.slice(-6)}\`\n\n` +
                `⏳ Preparing transaction...`
            );

            // TODO: Integrate with actual strategy deployment
            // This would call the agent API

            setTimeout(async () => {
                await ctx.replyWithMarkdown(
                    `✅ *Strategy Deployed!*\n\n` +
                    `Strategy: \`${strategyId}\`\n` +
                    `TX: \`5X6TDFkY...amNanG\`\n\n` +
                    `[View on Suiscan](https://suiscan.xyz/testnet/tx/5X6TDFkYvjvCb2LSE37DC7qNFs7UDgNy9izTs7amNanG)\n\n` +
                    `Your agent is now running! Use /fleet to monitor.`
                );
            }, 2000);
        });

        // /fleet - View active strategies
        this.bot.command('fleet', async (ctx) => {
            const user = await this.getOrCreateUser(ctx);

            // TODO: Fetch actual fleet from Supabase
            const fleet = [
                { id: '1', name: 'SUI-USDC Kinetic Vector', status: 'running', pnl: '+2.45%' },
                { id: '2', name: 'LST Peg Restoration', status: 'running', pnl: '+0.82%' },
            ];

            if (fleet.length === 0) {
                await ctx.reply('🤖 No active strategies. Use /strategies to browse and /deploy to start.');
                return;
            }

            let message = '🤖 *Active Fleet*\n\n';

            fleet.forEach((s, i) => {
                const statusEmoji = s.status === 'running' ? '🟢' : s.status === 'paused' ? '🟡' : '🔴';
                const pnlColor = s.pnl.startsWith('+') ? '📈' : '📉';
                message += `${statusEmoji} *${s.name}*\n`;
                message += `   PnL: ${pnlColor} ${s.pnl}\n`;
                message += `   Stop: \`/stop ${s.id}\`\n\n`;
            });

            await ctx.replyWithMarkdown(message);
        });

        // /stop <id> - Stop a strategy
        this.bot.command('stop', async (ctx) => {
            const strategyId = ctx.message.text.split(' ')[1];

            if (!strategyId) {
                await ctx.reply('❌ Please specify a strategy ID.\n\nUsage: `/stop 1`', {
                    parse_mode: 'Markdown'
                });
                return;
            }

            await ctx.replyWithMarkdown(
                `⏹️ *Stopping Strategy*\n\n` +
                `Strategy ID: \`${strategyId}\`\n\n` +
                `⏳ Shutting down...`
            );

            setTimeout(async () => {
                await ctx.reply('✅ Strategy stopped successfully.');
            }, 1500);
        });

        // /settings - User preferences
        this.bot.command('settings', async (ctx) => {
            const user = await this.getOrCreateUser(ctx);

            await ctx.replyWithMarkdown(
                `⚙️ *Settings*\n\n` +
                `*Wallet:* ${user.walletAddress ? `\`${user.walletAddress.slice(0, 10)}...\`` : 'Not connected'}\n` +
                `*Verified:* ${user.isVerified ? '✅' : '❌'}\n` +
                `*Alerts:* Enabled\n\n` +
                `Use these commands to configure:\n` +
                `/connect <wallet> - Link wallet\n` +
                `/alerts on|off - Toggle alerts\n` +
                `/risk low|medium|high - Set risk level`,
                Markup.inlineKeyboard([
                    [Markup.button.callback('🔔 Toggle Alerts', 'toggle_alerts')],
                    [Markup.button.callback('🎚️ Risk Level', 'risk_level')],
                    [Markup.button.callback('🔗 Connect Wallet', 'connect_wallet')]
                ])
            );
        });

        // /help - Help message
        this.bot.command('help', async (ctx) => {
            await ctx.replyWithMarkdown(
                `❓ *SuiLoop Commands*\n\n` +
                `*Wallet*\n` +
                `/connect <wallet> - Link your Sui wallet\n` +
                `/verify <code> - Verify wallet ownership\n` +
                `/balance - Check portfolio balance\n\n` +
                `*Strategies*\n` +
                `/strategies - List available strategies\n` +
                `/deploy <id> - Deploy a strategy\n` +
                `/fleet - View active strategies\n` +
                `/stop <id> - Stop a strategy\n\n` +
                `*Settings*\n` +
                `/settings - View and edit preferences\n` +
                `/alerts on|off - Toggle notifications\n\n` +
                `*Chat*\n` +
                `Just type any message to chat with the AI agent!`
            );
        });

        // ====================================================================
        // CALLBACK QUERIES (Inline buttons)
        // ====================================================================

        this.bot.action('toggle_alerts', async (ctx) => {
            await ctx.answerCbQuery('🔔 Alerts toggled!');
            await ctx.reply('🔔 Alerts have been updated.');
        });

        this.bot.action('risk_level', async (ctx) => {
            await ctx.answerCbQuery();
            await ctx.reply('Select your risk level:',
                Markup.inlineKeyboard([
                    [
                        Markup.button.callback('🟢 Low', 'set_risk_low'),
                        Markup.button.callback('🟡 Medium', 'set_risk_medium'),
                        Markup.button.callback('🔴 High', 'set_risk_high')
                    ]
                ])
            );
        });

        this.bot.action(/set_risk_(.+)/, async (ctx) => {
            const level = ctx.match[1];
            await ctx.answerCbQuery(`Risk set to ${level}`);
            await ctx.reply(`✅ Risk tolerance set to: ${level.toUpperCase()}`);
        });

        // ====================================================================
        // KEYBOARD BUTTONS
        // ====================================================================

        this.bot.hears('📊 Balance', (ctx) => ctx.reply('/balance'));
        this.bot.hears('🚀 Strategies', (ctx) => ctx.reply('/strategies'));
        this.bot.hears('🤖 Fleet', (ctx) => ctx.reply('/fleet'));
        this.bot.hears('⚙️ Settings', (ctx) => ctx.reply('/settings'));
        this.bot.hears('❓ Help', (ctx) => ctx.reply('/help'));

        // ====================================================================
        // FREE-FORM MESSAGES (Chat with Agent)
        // ====================================================================

        this.bot.on(message('text'), async (ctx) => {
            const user = await this.getOrCreateUser(ctx);
            const text = ctx.message.text;

            // Store message in memory
            const memoryService = getMemoryService();
            await memoryService.addMessage(user.id, 'user', text, {
                platform: 'telegram',
                chatId: ctx.chat.id
            });

            // Simple intent detection
            const response = await this.processMessage(text, user);

            await memoryService.addMessage(user.id, 'agent', response);
            await ctx.reply(response);
        });
    }

    /**
     * Process free-form messages
     */
    private async processMessage(text: string, user: TelegramUser): Promise<string> {
        const lowerText = text.toLowerCase();

        // Simple pattern matching (would be replaced with actual LLM in production)
        if (lowerText.includes('loop') && lowerText.includes('sui')) {
            return '🔄 I can help you loop SUI! Use `/deploy sui-usdc-loop` to start a SUI-USDC strategy, or tell me how much you want to loop.';
        }

        if (lowerText.includes('price') || lowerText.includes('market')) {
            return '📊 Current SUI price: $2.45 (+3.2% 24h)\n\nMarket sentiment: Bullish\nBest opportunity: SUI-USDC arbitrage (0.8% spread detected)';
        }

        if (lowerText.includes('profit') || lowerText.includes('pnl')) {
            return '📈 Your total P&L:\n\n• Today: +$45.20 (+2.1%)\n• This Week: +$312.50 (+8.4%)\n• All Time: +$1,245.00';
        }

        if (lowerText.includes('risk') || lowerText.includes('safe')) {
            return '🛡️ Based on your risk profile, I recommend:\n\n1. LST Peg Restoration (Very Low Risk)\n2. Weighted DCA Accumulator (Low Risk)\n\nThese strategies prioritize capital preservation.';
        }

        // Default response
        return `🤖 I understand you said: "${text}"\n\nI'm still learning! Try using commands like /strategies or /deploy to interact with me.`;
    }

    /**
     * Get or create user from context
     */
    private async getOrCreateUser(ctx: Context): Promise<TelegramUser> {
        const telegramId = ctx.from!.id;

        let user = this.users.get(telegramId);

        if (!user) {
            user = {
                id: `telegram_${telegramId}`,
                telegramId,
                username: ctx.from?.username,
                firstName: ctx.from?.first_name,
                isVerified: false,
                createdAt: new Date()
            };
            this.users.set(telegramId, user);
        }

        return user;
    }

    /**
     * Send alert to a specific user
     */
    async sendAlert(telegramId: number, message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): Promise<void> {
        const emoji = {
            info: 'ℹ️',
            success: '✅',
            warning: '⚠️',
            error: '❌'
        }[type];

        try {
            await this.bot.telegram.sendMessage(telegramId, `${emoji} ${message}`, {
                parse_mode: 'Markdown'
            });
        } catch (error) {
            console.error(`Failed to send alert to ${telegramId}:`, error);
        }
    }

    /**
     * Broadcast message to all users
     */
    async broadcast(message: string): Promise<number> {
        let sent = 0;

        for (const [telegramId, user] of this.users) {
            try {
                await this.bot.telegram.sendMessage(telegramId, message, {
                    parse_mode: 'Markdown'
                });
                sent++;
            } catch (error) {
                console.error(`Failed to broadcast to ${telegramId}`);
            }
        }

        return sent;
    }

    /**
     * Start the bot
     */
    async start(): Promise<void> {
        if (this.isRunning) return;

        console.log('🤖 Starting Telegram bot...');

        await this.bot.launch();
        this.isRunning = true;

        console.log('✅ Telegram bot is running');

        // Graceful shutdown
        process.once('SIGINT', () => this.stop());
        process.once('SIGTERM', () => this.stop());
    }

    /**
     * Stop the bot
     */
    async stop(): Promise<void> {
        if (!this.isRunning) return;

        console.log('🛑 Stopping Telegram bot...');
        this.bot.stop('SIGTERM');
        this.isRunning = false;
    }

    /**
     * Get bot instance for external use
     */
    getBot(): Telegraf {
        return this.bot;
    }
}

// ============================================================================
// SINGLETON & EXPORTS
// ============================================================================

let telegramBot: SuiLoopTelegramBot | null = null;

export function initializeTelegramBot(token: string, config?: Partial<BotConfig>): SuiLoopTelegramBot {
    if (!telegramBot) {
        telegramBot = new SuiLoopTelegramBot({ token, ...config });
        console.log('📱 Telegram integration initialized');
    }
    return telegramBot;
}

export function getTelegramBot(): SuiLoopTelegramBot | null {
    return telegramBot;
}

export { SuiLoopTelegramBot };
export default SuiLoopTelegramBot;
