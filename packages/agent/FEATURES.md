# SuiLoop Agent - Feature Extensions

This package implements OpenClaw-inspired features for the SuiLoop autonomous DeFi agent.

## Features Overview

### 1. 🧠 Persistent Memory (`memoryService.ts`)

User context that persists across sessions:

```typescript
import { initializeMemoryService, getMemoryService } from '@suiloop/agent/features';

// Initialize with local storage
const memory = initializeMemoryService({ backend: 'local' });

// Get user memory
const userMemory = await memory.getMemory('user_123');

// Update preferences
await memory.updateMemory('user_123', {
  preferences: {
    riskLevel: 'aggressive',
    slippage: 0.5,
    notifications: true
  }
});

// Record a conversation message
await memory.addMessage('user_123', 'user', 'What yield strategies are available?');

// Record strategy execution
await memory.recordExecution('user_123', {
  strategyId: 'sui-usdc-loop',
  strategyName: 'SUI-USDC Kinetic Vector',
  status: 'success',
  profit: 23.45
});
```

**Storage Options:**
- **Local (Markdown)**: Stores in `.suiloop/memory/` directory (OpenClaw style)
- **Supabase**: Cloud persistence with `user_memory` table

---

### 2. 💬 Multi-Chat Integration

#### Telegram Bot (`telegramBot.ts`)

```typescript
import { initializeTelegramBot } from '@suiloop/agent/features';

const bot = initializeTelegramBot(process.env.TELEGRAM_BOT_TOKEN);
await bot.start();

// Send an alert
await bot.sendAlert(userId, '🚨 Opportunity detected: 2.3% arbitrage on SUI-USDC!');
```

**Commands:**
- `/start` - Welcome message
- `/connect <wallet>` - Link Sui wallet
- `/balance` - Check portfolio
- `/strategies` - Browse strategies
- `/deploy <strategy>` - Deploy a strategy
- `/fleet` - View active strategies
- `/stop <id>` - Stop a strategy
- `/settings` - User preferences

#### Discord Bot (`discordBot.ts`)

```typescript
import { initializeDiscordBot } from '@suiloop/agent/features';

const bot = initializeDiscordBot({
  token: process.env.DISCORD_BOT_TOKEN,
  clientId: process.env.DISCORD_CLIENT_ID,
  guildId: process.env.DISCORD_GUILD_ID // Optional for dev
});

await bot.start();

// Send channel alert
await bot.sendOpportunityAlert(channelId, {
  type: 'Arbitrage',
  pair: 'SUI/USDC',
  profit: 2.3,
  confidence: 85
});
```

**Slash Commands:**
- `/suiloop info` - About SuiLoop
- `/suiloop connect <wallet>` - Link wallet
- `/suiloop balance` - Portfolio balance
- `/suiloop strategies` - Browse strategies
- `/suiloop deploy <strategy> [amount]` - Deploy
- `/suiloop fleet` - Active strategies
- `/loop <amount>` - Quick loop
- `/ask <question>` - Ask the AI

---

### 3. 🌐 Browser Control (`browserService.ts`)

Web automation with Puppeteer:

```typescript
import { initializeBrowserService } from '@suiloop/agent/features';

const browser = initializeBrowserService({ headless: true });
await browser.initialize();

// Scrape SUI price from CoinGecko
const price = await browser.scrapeSuiPrice();
console.log(`SUI: $${price?.price}`);

// Scrape Cetus pools
const pools = await browser.scrapeCetusPools();

// Take a screenshot
const screenshot = await browser.screenshot('default', 'market-snapshot.png');

// Generic scraper
const result = await browser.scrape('https://app.scallop.io', {
  supplyApy: '.supply-apy',
  borrowApy: '.borrow-apy'
});

await browser.close();
```

---

### 4. 🔌 Skills & Plugins System (`skillManager.ts`)

Modular plugin architecture:

```typescript
import { initializeSkillManager, skillTemplate } from '@suiloop/agent/features';

const skills = initializeSkillManager();
await skills.initialize();

// List all skills
const allSkills = skills.getAllSkills();

// Install from GitHub
await skills.installSkill('github:username/my-skill');

// Install from LoopHub
await skills.installSkill('loophub:whale-tracker');

// Execute a skill action
const result = await skills.executeAction(
  'flash-loan-executor',
  'executeFlashLoan',
  { amount: 100, minProfit: 0.01 },
  { userId: 'user_123', walletAddress: '0x...' }
);

// Get available actions for LLM
const actionPrompt = skills.generateActionPrompt();
```

**SKILL.md Format:**
```yaml
---
name: My Custom Skill
slug: my-custom-skill
version: 1.0.0
description: Does amazing things
author: Your Name
category: trading
tags:
  - defi
  - automation
permissions:
  - blockchain:read
  - blockchain:write
---

# My Custom Skill

Description and usage instructions...
```

---

### 5. 🧠 Local LLM Support (`llmService.ts`)

Multi-provider AI support:

```typescript
import { initializeLLMService, LLMService } from '@suiloop/agent/features';

// OpenAI
const llm = initializeLLMService({
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4o'
});

// Anthropic
const llm = initializeLLMService({
  provider: 'anthropic',
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-3-5-sonnet-20241022'
});

// Ollama (Local)
const llm = initializeLLMService({
  provider: 'ollama',
  model: 'llama3.2'
});

// Chat
const response = await llm.chat({
  messages: [
    { role: 'system', content: LLMService.getSuiLoopSystemPrompt() },
    { role: 'user', content: 'What yield strategies are available?' }
  ]
});

// Stream response
for await (const chunk of llm.streamChat({ messages })) {
  process.stdout.write(chunk.content);
}
```

**Supported Providers:**
- OpenAI (GPT-4, GPT-4o)
- Anthropic (Claude 3.5)
- Google (Gemini)
- Ollama (Local models)
- OpenRouter (Multi-model gateway)

---

### 6. 💻 Full System Access (`systemAccess.ts`)

Shell commands and file operations:

```typescript
import { initializeSystemAccess } from '@suiloop/agent/features';

const system = initializeSystemAccess({
  accessLevel: 'restricted', // 'sandbox', 'restricted', 'full'
  workingDir: '/path/to/project'
});

// Execute a command
const result = await system.execute('ls -la');
console.log(result.stdout);

// Read a file
const content = await system.readFile('config.json');

// Write a file
await system.writeFile('output.json', JSON.stringify(data, null, 2));

// Search files
const matches = await system.grepFiles('TODO', '.', '*.ts');

// Execute a script
const scriptResult = await system.executeScript('scripts/deploy.sh', ['--testnet']);

// Background process
const processId = await system.executeBackground('node', ['server.js']);
await system.killProcess(processId);
```

**Access Levels:**
- `sandbox`: Only whitelisted commands, read-only files
- `restricted`: Blocked patterns, write to allowed paths
- `full`: Complete system access (use with caution!)

---

### 7. 🏪 Skill Marketplace - LoopHub (`loopHub.ts`)

Community skill marketplace:

```typescript
import { initializeLoopHub } from '@suiloop/agent/features';

const hub = initializeLoopHub({
  apiKey: process.env.LOOPHUB_API_KEY,
  userId: 'user_123'
});

// Browse featured skills
const featured = await hub.getFeatured();

// Search skills
const { skills, total } = await hub.search({
  query: 'flash loan',
  category: 'trading',
  minRating: 4,
  sortBy: 'downloads'
});

// Get skill details
const skill = await hub.getSkill('flash-loan-executor');

// Get reviews
const reviews = await hub.getReviews(skillId);

// Submit a review
await hub.submitReview({
  skillId: 'flash-loan-executor',
  rating: 5,
  title: 'Amazing skill!',
  content: 'Works perfectly for atomic arbitrage.'
});

// Get install URL
const installUrl = await hub.getInstallUrl(skillId);

// Publish your own skill
await hub.publish({
  manifest: mySkillManifest,
  sourceUrl: 'github:myusername/my-skill'
});
```

---

## Unified Initialization

Initialize all features at once:

```typescript
import { initializeAllFeatures } from '@suiloop/agent/features';

const features = await initializeAllFeatures({
  // Memory
  memoryBackend: 'local',
  
  // LLM
  llmProvider: 'openai',
  llmApiKey: process.env.OPENAI_API_KEY,
  
  // Chat Bots
  telegramToken: process.env.TELEGRAM_BOT_TOKEN,
  discordToken: process.env.DISCORD_BOT_TOKEN,
  discordClientId: process.env.DISCORD_CLIENT_ID,
  
  // System Access
  accessLevel: 'restricted',
  
  // LoopHub
  loophubApiKey: process.env.LOOPHUB_API_KEY,
  userId: 'user_123'
});

// Use features
const memory = features.memory;
const skills = features.skills;
const llm = features.llm;
```

---

## Environment Variables

```bash
# LLM Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=...
OPENROUTER_API_KEY=...

# Chat Integrations
TELEGRAM_BOT_TOKEN=123456:ABC-DEF...
DISCORD_BOT_TOKEN=...
DISCORD_CLIENT_ID=...
DISCORD_GUILD_ID=...  # Optional, for dev

# LoopHub Marketplace
LOOPHUB_API_KEY=...

# Supabase (optional)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
```

---

## Dependencies

All dependencies are included in `package.json`:

```json
{
  "dependencies": {
    "fs-extra": "^11.2.0",
    "uuid": "^13.0.0",
    "telegraf": "^4.16.3",
    "discord.js": "^14.14.1",
    "puppeteer": "^22.4.0",
    "axios": "^1.13.4",
    "@supabase/supabase-js": "^2.94.0"
  },
  "devDependencies": {
    "@types/fs-extra": "^11.0.4",
    "@types/uuid": "^11.0.0"
  }
}
```

Install with: `pnpm install`

---

## Credits

Features inspired by the [OpenClaw](https://github.com/anthropics/openclaw) project.

Built for **SuiLoop** - The Atomic Intelligence Protocol for Sui Network.
