/**
 * SuiLoop Discord Bot Integration
 * 
 * Connects your SuiLoop agent to Discord, allowing users to:
 * - Execute strategies via slash commands
 * - Receive real-time opportunity alerts in channels
 * - Check portfolio and balances
 * - Interactive embeds and buttons
 * 
 * Inspired by OpenClaw's multi-platform messaging integration.
 */

import {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ChannelType,
    Message,
    ChatInputCommandInteraction,
    ButtonInteraction,
    TextChannel,
    Colors
} from 'discord.js';
import { getMemoryService } from '../services/memoryService.js';
import crypto from 'crypto';

// ============================================================================
// TYPES
// ============================================================================

interface DiscordUser {
    id: string;
    discordId: string;
    username: string;
    walletAddress?: string;
    apiKey?: string;
    isVerified: boolean;
    alertChannelId?: string;
    createdAt: Date;
}

interface BotConfig {
    token: string;
    clientId: string;
    guildId?: string; // For guild-specific commands during development
    alertChannelId?: string;
}

// ============================================================================
// SLASH COMMANDS DEFINITION
// ============================================================================

const commands = [
    new SlashCommandBuilder()
        .setName('suiloop')
        .setDescription('SuiLoop main command')
        .addSubcommand(sub =>
            sub.setName('info')
                .setDescription('Get information about SuiLoop')
        )
        .addSubcommand(sub =>
            sub.setName('connect')
                .setDescription('Connect your Sui wallet')
                .addStringOption(opt =>
                    opt.setName('wallet')
                        .setDescription('Your Sui wallet address (0x...)')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('balance')
                .setDescription('Check your portfolio balance')
        )
        .addSubcommand(sub =>
            sub.setName('strategies')
                .setDescription('View available strategies')
        )
        .addSubcommand(sub =>
            sub.setName('deploy')
                .setDescription('Deploy a strategy')
                .addStringOption(opt =>
                    opt.setName('strategy')
                        .setDescription('Strategy ID to deploy')
                        .setRequired(true)
                        .addChoices(
                            { name: 'SUI-USDC Kinetic Vector', value: 'sui-usdc-loop' },
                            { name: 'Memetic Volatility Hunter', value: 'turbo-sniper' },
                            { name: 'LST Peg Restoration', value: 'liquid-staking-arb' },
                            { name: 'Navi-Scallop Recursive', value: 'lending-loop-max' }
                        )
                )
                .addStringOption(opt =>
                    opt.setName('amount')
                        .setDescription('Amount in SUI')
                        .setRequired(false)
                )
        )
        .addSubcommand(sub =>
            sub.setName('fleet')
                .setDescription('View your active strategies')
        )
        .addSubcommand(sub =>
            sub.setName('stop')
                .setDescription('Stop a running strategy')
                .addStringOption(opt =>
                    opt.setName('id')
                        .setDescription('Strategy ID to stop')
                        .setRequired(true)
                )
        )
        .addSubcommand(sub =>
            sub.setName('settings')
                .setDescription('View and edit your preferences')
        ),

    new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Quick loop command')
        .addStringOption(opt =>
            opt.setName('amount')
                .setDescription('Amount in SUI to loop')
                .setRequired(true)
        ),

    new SlashCommandBuilder()
        .setName('ask')
        .setDescription('Ask the SuiLoop AI agent a question')
        .addStringOption(opt =>
            opt.setName('question')
                .setDescription('Your question')
                .setRequired(true)
        )
].map(cmd => cmd.toJSON());

// ============================================================================
// BOT CLASS
// ============================================================================

class SuiLoopDiscordBot {
    private client: Client;
    private rest: REST;
    private users: Map<string, DiscordUser> = new Map();
    private config: BotConfig;
    private isRunning = false;

    constructor(config: BotConfig) {
        this.config = config;

        this.client = new Client({
            intents: [
                GatewayIntentBits.Guilds,
                GatewayIntentBits.GuildMessages,
                GatewayIntentBits.MessageContent,
                GatewayIntentBits.DirectMessages
            ]
        });

        this.rest = new REST({ version: '10' }).setToken(config.token);

        this.setupHandlers();
    }

    /**
     * Register slash commands with Discord
     */
    async registerCommands(): Promise<void> {
        try {
            console.log('🔄 Registering Discord slash commands...');

            if (this.config.guildId) {
                // Guild-specific (faster for development)
                await this.rest.put(
                    Routes.applicationGuildCommands(this.config.clientId, this.config.guildId),
                    { body: commands }
                );
            } else {
                // Global commands (takes up to 1 hour to propagate)
                await this.rest.put(
                    Routes.applicationCommands(this.config.clientId),
                    { body: commands }
                );
            }

            console.log('✅ Discord slash commands registered');
        } catch (error) {
            console.error('Failed to register commands:', error);
        }
    }

    /**
     * Setup all event handlers
     */
    private setupHandlers(): void {
        // Ready event
        this.client.once('ready', async () => {
            console.log(`✅ Discord bot logged in as ${this.client.user?.tag}`);
            this.client.user?.setActivity('SuiLoop DeFi', { type: 0 }); // "Playing"
        });

        // Slash command handler
        this.client.on('interactionCreate', async (interaction) => {
            if (interaction.isChatInputCommand()) {
                await this.handleSlashCommand(interaction);
            } else if (interaction.isButton()) {
                await this.handleButton(interaction);
            }
        });

        // Message handler (for @mentions and DMs)
        this.client.on('messageCreate', async (message) => {
            if (message.author.bot) return;

            // Check if bot was mentioned or if it's a DM
            const isMentioned = message.mentions.has(this.client.user!.id);
            const isDM = message.channel.type === ChannelType.DM;

            if (isMentioned || isDM) {
                await this.handleMessage(message);
            }
        });
    }

    /**
     * Handle slash commands
     */
    private async handleSlashCommand(interaction: ChatInputCommandInteraction): Promise<void> {
        const user = await this.getOrCreateUser(interaction.user.id, interaction.user.username);

        try {
            if (interaction.commandName === 'suiloop') {
                const subcommand = interaction.options.getSubcommand();

                switch (subcommand) {
                    case 'info':
                        await this.handleInfo(interaction);
                        break;
                    case 'connect':
                        await this.handleConnect(interaction, user);
                        break;
                    case 'balance':
                        await this.handleBalance(interaction, user);
                        break;
                    case 'strategies':
                        await this.handleStrategies(interaction);
                        break;
                    case 'deploy':
                        await this.handleDeploy(interaction, user);
                        break;
                    case 'fleet':
                        await this.handleFleet(interaction, user);
                        break;
                    case 'stop':
                        await this.handleStop(interaction, user);
                        break;
                    case 'settings':
                        await this.handleSettings(interaction, user);
                        break;
                }
            } else if (interaction.commandName === 'loop') {
                await this.handleQuickLoop(interaction, user);
            } else if (interaction.commandName === 'ask') {
                await this.handleAsk(interaction, user);
            }
        } catch (error) {
            console.error('Command error:', error);
            await interaction.reply({
                content: '❌ An error occurred while processing your command.',
                ephemeral: true
            });
        }
    }

    // ========================================================================
    // COMMAND HANDLERS
    // ========================================================================

    private async handleInfo(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setColor(Colors.Aqua)
            .setTitle('🔮 SuiLoop - Atomic Intelligence Protocol')
            .setDescription(
                'Your autonomous DeFi companion on Sui Network.\n\n' +
                'SuiLoop uses Hot Potato flash loans and AI agents to execute ' +
                'institutional-grade trading strategies atomically.'
            )
            .addFields(
                { name: '🔗 Network', value: 'Sui Testnet', inline: true },
                { name: '📊 Strategies', value: '9 Available', inline: true },
                { name: '🔒 Security', value: 'Hot Potato', inline: true }
            )
            .addFields(
                {
                    name: 'Quick Start', value:
                        '1️⃣ `/suiloop connect <wallet>` - Link your wallet\n' +
                        '2️⃣ `/suiloop strategies` - Browse strategies\n' +
                        '3️⃣ `/suiloop deploy` - Deploy a strategy'
                }
            )
            .setFooter({ text: 'Powered by SuiLoop' })
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('Dashboard')
                    .setStyle(ButtonStyle.Link)
                    .setURL('http://localhost:3000/dashboard'),
                new ButtonBuilder()
                    .setLabel('Documentation')
                    .setStyle(ButtonStyle.Link)
                    .setURL('http://localhost:3000/docs'),
                new ButtonBuilder()
                    .setCustomId('quick_deploy')
                    .setLabel('Quick Deploy')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🚀')
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }

    private async handleConnect(interaction: ChatInputCommandInteraction, user: DiscordUser): Promise<void> {
        const wallet = interaction.options.getString('wallet', true);

        if (!wallet.startsWith('0x') || wallet.length < 40) {
            await interaction.reply({
                content: '❌ Invalid wallet address. Please provide a valid Sui address (0x...)',
                ephemeral: true
            });
            return;
        }

        user.walletAddress = wallet;
        this.users.set(user.discordId, user);

        const verificationCode = crypto.randomBytes(3).toString('hex').toUpperCase();

        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('🔗 Wallet Connected')
            .setDescription(`Wallet: \`${wallet.slice(0, 10)}...${wallet.slice(-6)}\``)
            .addFields(
                {
                    name: 'Verification', value:
                        'To verify ownership, sign this message on the web dashboard:\n' +
                        `\`SUILOOP_VERIFY_${verificationCode}\``
                }
            );

        await interaction.reply({ embeds: [embed], ephemeral: true });
    }

    private async handleBalance(interaction: ChatInputCommandInteraction, user: DiscordUser): Promise<void> {
        if (!user.walletAddress) {
            await interaction.reply({
                content: '❌ Please connect your wallet first with `/suiloop connect`',
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        // TODO: Fetch real balance
        const balance = {
            sui: 125.45,
            usdc: 1250.00,
            total: 3750.00,
            change24h: 3.2
        };

        const embed = new EmbedBuilder()
            .setColor(Colors.Gold)
            .setTitle('💰 Portfolio Balance')
            .setDescription(`Wallet: \`${user.walletAddress.slice(0, 10)}...${user.walletAddress.slice(-6)}\``)
            .addFields(
                { name: 'SUI', value: `${balance.sui.toFixed(2)} SUI`, inline: true },
                { name: 'USDC', value: `${balance.usdc.toFixed(2)} USDC`, inline: true },
                { name: '\u200b', value: '\u200b', inline: true },
                { name: 'Total Value', value: `$${balance.total.toFixed(2)}`, inline: true },
                { name: '24h Change', value: `${balance.change24h > 0 ? '📈' : '📉'} ${balance.change24h > 0 ? '+' : ''}${balance.change24h}%`, inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }

    private async handleStrategies(interaction: ChatInputCommandInteraction): Promise<void> {
        const strategies = [
            { id: 'sui-usdc-loop', name: 'SUI-USDC Kinetic Vector', apy: '14.2%', risk: '🟢 Low', desc: 'Triangular arbitrage between DEXs' },
            { id: 'turbo-sniper', name: 'Memetic Volatility Hunter', apy: '420%', risk: '🔴 High', desc: 'Memecoin momentum trading' },
            { id: 'liquid-staking-arb', name: 'LST Peg Restoration', apy: '8.5%', risk: '🟢 Very Low', desc: 'Liquid staking arbitrage' },
            { id: 'lending-loop-max', name: 'Navi-Scallop Recursive', apy: '22.4%', risk: '🟡 Medium', desc: 'Recursive lending yield' }
        ];

        const embed = new EmbedBuilder()
            .setColor(Colors.Purple)
            .setTitle('🚀 Strategy Arsenal')
            .setDescription('Deploy institutional-grade strategies with one command.');

        strategies.forEach(s => {
            embed.addFields({
                name: `${s.name}`,
                value: `${s.desc}\n**APY:** ${s.apy} | **Risk:** ${s.risk}\n\`/suiloop deploy strategy:${s.id}\``,
                inline: false
            });
        });

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('deploy_sui_usdc')
                    .setLabel('Deploy SUI-USDC')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('🟢'),
                new ButtonBuilder()
                    .setCustomId('deploy_lst')
                    .setLabel('Deploy LST')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🔵'),
                new ButtonBuilder()
                    .setLabel('View All')
                    .setStyle(ButtonStyle.Link)
                    .setURL('http://localhost:3000/strategies')
            );

        await interaction.reply({ embeds: [embed], components: [row] });
    }

    private async handleDeploy(interaction: ChatInputCommandInteraction, user: DiscordUser): Promise<void> {
        if (!user.walletAddress) {
            await interaction.reply({
                content: '❌ Please connect your wallet first with `/suiloop connect`',
                ephemeral: true
            });
            return;
        }

        const strategyId = interaction.options.getString('strategy', true);
        const amount = interaction.options.getString('amount') || '1';

        await interaction.deferReply();

        const strategyNames: Record<string, string> = {
            'sui-usdc-loop': 'SUI-USDC Kinetic Vector',
            'turbo-sniper': 'Memetic Volatility Hunter',
            'liquid-staking-arb': 'LST Peg Restoration',
            'lending-loop-max': 'Navi-Scallop Recursive'
        };

        const embed = new EmbedBuilder()
            .setColor(Colors.Yellow)
            .setTitle('🚀 Deploying Strategy...')
            .setDescription(`Strategy: **${strategyNames[strategyId]}**\nAmount: **${amount} SUI**`)
            .addFields(
                { name: 'Wallet', value: `\`${user.walletAddress.slice(0, 10)}...${user.walletAddress.slice(-6)}\``, inline: true },
                { name: 'Status', value: '⏳ Building transaction...', inline: true }
            );

        await interaction.editReply({ embeds: [embed] });

        // Simulate deployment
        await new Promise(r => setTimeout(r, 2000));

        const txDigest = '5X6TDFkYvjvCb2LSE37DC7qNFs7UDgNy9izTs7amNanG';

        const successEmbed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('✅ Strategy Deployed!')
            .setDescription(`Strategy: **${strategyNames[strategyId]}**`)
            .addFields(
                { name: 'Amount', value: `${amount} SUI`, inline: true },
                { name: 'TX Digest', value: `[\`${txDigest.slice(0, 10)}...\`](https://suiscan.xyz/testnet/tx/${txDigest})`, inline: true },
                { name: 'Status', value: '🟢 Running', inline: true }
            )
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setLabel('View Transaction')
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://suiscan.xyz/testnet/tx/${txDigest}`),
                new ButtonBuilder()
                    .setCustomId('view_fleet')
                    .setLabel('View Fleet')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🤖')
            );

        await interaction.editReply({ embeds: [successEmbed], components: [row] });
    }

    private async handleFleet(interaction: ChatInputCommandInteraction, user: DiscordUser): Promise<void> {
        const fleet = [
            { id: '1', name: 'SUI-USDC Kinetic Vector', status: '🟢 Running', pnl: '+2.45%', uptime: '4h 23m' },
            { id: '2', name: 'LST Peg Restoration', status: '🟢 Running', pnl: '+0.82%', uptime: '2h 15m' }
        ];

        if (fleet.length === 0) {
            await interaction.reply({
                content: '🤖 No active strategies. Use `/suiloop strategies` to browse available strategies.',
                ephemeral: true
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(Colors.Blue)
            .setTitle('🤖 Active Fleet')
            .setDescription(`${fleet.length} strategies running`);

        fleet.forEach(s => {
            embed.addFields({
                name: `${s.status} ${s.name}`,
                value: `**PnL:** ${s.pnl} | **Uptime:** ${s.uptime}\n\`/suiloop stop id:${s.id}\``,
                inline: false
            });
        });

        await interaction.reply({ embeds: [embed] });
    }

    private async handleStop(interaction: ChatInputCommandInteraction, user: DiscordUser): Promise<void> {
        const strategyId = interaction.options.getString('id', true);

        await interaction.deferReply();

        // Simulate stop
        await new Promise(r => setTimeout(r, 1000));

        const embed = new EmbedBuilder()
            .setColor(Colors.Orange)
            .setTitle('⏹️ Strategy Stopped')
            .setDescription(`Strategy ID \`${strategyId}\` has been stopped.`)
            .addFields(
                { name: 'Final PnL', value: '+2.45%', inline: true },
                { name: 'Total Uptime', value: '4h 23m', inline: true }
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }

    private async handleSettings(interaction: ChatInputCommandInteraction, user: DiscordUser): Promise<void> {
        const embed = new EmbedBuilder()
            .setColor(Colors.Grey)
            .setTitle('⚙️ Your Settings')
            .addFields(
                { name: 'Wallet', value: user.walletAddress ? `\`${user.walletAddress.slice(0, 10)}...\`` : '❌ Not connected', inline: true },
                { name: 'Verified', value: user.isVerified ? '✅ Yes' : '❌ No', inline: true },
                { name: 'Alerts', value: '✅ Enabled', inline: true },
                { name: 'Risk Level', value: '🟡 Medium', inline: true },
                { name: 'Slippage', value: '0.5%', inline: true },
                { name: 'Max Gas', value: '3000 MIST', inline: true }
            );

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('toggle_alerts')
                    .setLabel('Toggle Alerts')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🔔'),
                new ButtonBuilder()
                    .setCustomId('change_risk')
                    .setLabel('Change Risk')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🎚️')
            );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
    }

    private async handleQuickLoop(interaction: ChatInputCommandInteraction, user: DiscordUser): Promise<void> {
        if (!user.walletAddress) {
            await interaction.reply({
                content: '❌ Please connect your wallet first with `/suiloop connect`',
                ephemeral: true
            });
            return;
        }

        const amount = interaction.options.getString('amount', true);

        await interaction.reply({
            content: `🔄 Looping **${amount} SUI** with default strategy (SUI-USDC Kinetic Vector)...\n\n⏳ Building transaction...`
        });

        // This would trigger actual execution
    }

    private async handleAsk(interaction: ChatInputCommandInteraction, user: DiscordUser): Promise<void> {
        const question = interaction.options.getString('question', true);

        await interaction.deferReply();

        // Store in memory
        const memoryService = getMemoryService();
        await memoryService.addMessage(user.id, 'user', question, {
            platform: 'discord',
            guildId: interaction.guildId
        });

        // Simple response (would be replaced with actual LLM)
        const response = await this.generateResponse(question, user);

        await memoryService.addMessage(user.id, 'agent', response);

        const embed = new EmbedBuilder()
            .setColor(Colors.Blurple)
            .setTitle('🤖 SuiLoop AI')
            .addFields(
                { name: 'Question', value: question },
                { name: 'Answer', value: response }
            )
            .setFooter({ text: 'Powered by ElizaOS' });

        await interaction.editReply({ embeds: [embed] });
    }

    // ========================================================================
    // BUTTON HANDLERS
    // ========================================================================

    private async handleButton(interaction: ButtonInteraction): Promise<void> {
        const user = await this.getOrCreateUser(interaction.user.id, interaction.user.username);

        switch (interaction.customId) {
            case 'quick_deploy':
                await interaction.reply({
                    content: 'Use `/suiloop deploy` to deploy a strategy, or click the quick buttons below.',
                    ephemeral: true
                });
                break;
            case 'deploy_sui_usdc':
                await interaction.reply({
                    content: '🚀 Deploying SUI-USDC Kinetic Vector...\nUse `/suiloop deploy strategy:sui-usdc-loop` to customize.',
                    ephemeral: true
                });
                break;
            case 'view_fleet':
                await interaction.reply({
                    content: 'Use `/suiloop fleet` to view your active strategies.',
                    ephemeral: true
                });
                break;
            case 'toggle_alerts':
                await interaction.reply({ content: '🔔 Alerts toggled!', ephemeral: true });
                break;
            default:
                await interaction.reply({ content: 'Button not implemented yet.', ephemeral: true });
        }
    }

    // ========================================================================
    // MESSAGE HANDLER (for mentions)
    // ========================================================================

    private async handleMessage(message: Message): Promise<void> {
        const user = await this.getOrCreateUser(message.author.id, message.author.username);
        const content = message.content.replace(/<@!?\d+>/g, '').trim();

        if (!content) {
            await message.reply('👋 Hi! Use `/suiloop info` to get started, or ask me anything!');
            return;
        }

        // Store in memory
        const memoryService = getMemoryService();
        await memoryService.addMessage(user.id, 'user', content, {
            platform: 'discord',
            channelId: message.channel.id
        });

        const response = await this.generateResponse(content, user);
        await memoryService.addMessage(user.id, 'agent', response);

        await message.reply(response);
    }

    // ========================================================================
    // UTILITIES
    // ========================================================================

    private async generateResponse(text: string, user: DiscordUser): Promise<string> {
        const lowerText = text.toLowerCase();

        if (lowerText.includes('price') || lowerText.includes('sui')) {
            return '📊 Current SUI price: $2.45 (+3.2% 24h)\n\nBest opportunities:\n• SUI-USDC spread: 0.8%\n• LST depeg: 1.2%';
        }

        if (lowerText.includes('loop') || lowerText.includes('strategy')) {
            return '🔄 To loop SUI, use `/suiloop deploy` or `/loop <amount>`.\n\nRecommended for your profile: **LST Peg Restoration** (Low Risk, 8.5% APY)';
        }

        if (lowerText.includes('help')) {
            return '❓ **Quick Help**\n\n• `/suiloop info` - About SuiLoop\n• `/suiloop connect` - Link wallet\n• `/suiloop strategies` - View strategies\n• `/suiloop deploy` - Deploy strategy\n• `/ask` - Ask me anything!';
        }

        return `🤖 I understand: "${text}"\n\nI'm learning! Try asking about prices, strategies, or use the slash commands.`;
    }

    private async getOrCreateUser(discordId: string, username: string): Promise<DiscordUser> {
        let user = this.users.get(discordId);

        if (!user) {
            user = {
                id: `discord_${discordId}`,
                discordId,
                username,
                isVerified: false,
                createdAt: new Date()
            };
            this.users.set(discordId, user);
        }

        return user;
    }

    /**
     * Send alert to a channel
     */
    async sendChannelAlert(channelId: string, embed: EmbedBuilder): Promise<void> {
        try {
            const channel = await this.client.channels.fetch(channelId);
            if (channel && channel.isTextBased()) {
                await (channel as TextChannel).send({ embeds: [embed] });
            }
        } catch (error) {
            console.error('Failed to send channel alert:', error);
        }
    }

    /**
     * Send opportunity alert
     */
    async sendOpportunityAlert(channelId: string, opportunity: {
        type: string;
        pair: string;
        profit: number;
        confidence: number;
    }): Promise<void> {
        const embed = new EmbedBuilder()
            .setColor(Colors.Green)
            .setTitle('🚨 Opportunity Detected!')
            .addFields(
                { name: 'Type', value: opportunity.type, inline: true },
                { name: 'Pair', value: opportunity.pair, inline: true },
                { name: 'Est. Profit', value: `${opportunity.profit.toFixed(2)}%`, inline: true },
                { name: 'Confidence', value: `${opportunity.confidence}%`, inline: true }
            )
            .setTimestamp();

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('execute_opportunity')
                    .setLabel('Execute Now')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('⚡')
            );

        await this.sendChannelAlert(channelId, embed);
    }

    /**
     * Start the bot
     */
    async start(): Promise<void> {
        if (this.isRunning) return;

        console.log('🤖 Starting Discord bot...');

        await this.registerCommands();
        await this.client.login(this.config.token);

        this.isRunning = true;
    }

    /**
     * Stop the bot
     */
    async stop(): Promise<void> {
        if (!this.isRunning) return;

        console.log('🛑 Stopping Discord bot...');
        await this.client.destroy();
        this.isRunning = false;
    }

    getClient(): Client {
        return this.client;
    }
}

// ============================================================================
// SINGLETON & EXPORTS
// ============================================================================

let discordBot: SuiLoopDiscordBot | null = null;

export function initializeDiscordBot(config: BotConfig): SuiLoopDiscordBot {
    if (!discordBot) {
        discordBot = new SuiLoopDiscordBot(config);
        console.log('🎮 Discord integration initialized');
    }
    return discordBot;
}

export function getDiscordBot(): SuiLoopDiscordBot | null {
    return discordBot;
}

export { SuiLoopDiscordBot };
export default SuiLoopDiscordBot;
