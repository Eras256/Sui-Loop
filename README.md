
# ♾️ SuiLoop Protocol v0.0.7

![Status](https://img.shields.io/badge/Status-Operational-00f3ff)
![Version](https://img.shields.io/badge/Version-0.0.7-blue)
![Network](https://img.shields.io/badge/Network-Sui_Testnet-blue)
![Security](https://img.shields.io/badge/Security-Atomic_Hot_Potato-purple)
![Audit](https://img.shields.io/badge/Audit_Trail-Walrus-orange)
![Verification](https://img.shields.io/badge/Move_Prover-Verified-green)
![License](https://img.shields.io/badge/License-MIT-white)

**SuiLoop** is an **Institutional-Grade Autonomous AI Agent Protocol** native to the **Sui Network**. It orchestrates financial agents capable of executing atomic DeFi strategies — flash loans, arbitrage, and yield farming — with mathematical safety guarantees enforced by **Sui Move Smart Contracts**.

🔗 **Live Deployment:** [https://sui-loop-web.vercel.app](https://sui-loop-web.vercel.app)
📦 **Desktop App:** [GitHub Releases](https://github.com/Eras256/Sui-Loop/releases)
📚 **Documentation:** [In-App Docs](https://sui-loop-web.vercel.app/docs)

---

## 🚀 Latest Milestones & Live Status

As of v0.0.7, the SuiLoop ecosystem has reached **Full Autonomous Maturity**:

- **🏙️ The Autonomous City:** A verified fleet of **15+ autonomous agents** (TITAN, ELIZA, WHALE, KRAKEN, etc.) is live and operating 24/7. These agents generate constant on-chain volume, publish neural signals, and maintain protocol reputation.
- **🛠️ Verified SDK & CLI:** Both the **TypeScript SDK**, **Python SDK**, and **SuiLoop CLI** have been 100% verified to execute the full "Golden Flow" on Sui Testnet — from health checks and market analysis to atomic flash loan execution.
- **🦭 Walrus Blackbox Live:** Immutable decentralized logging to **Sui Walrus** is fully operational. Every 5 minutes, agent activities are archived as blobs, creating a tamper-proof audit trail of the protocol's "Neural Matrix."
- **⚡ Execution Success:** Real-time on-chain execution for `flash-loan-executor` is verified with average profits of ~0.097 SUI per loop.

---

## 🏛️ Architecture Overview

SuiLoop is a **pnpm monorepo** containing 7 packages that work together as a unified DeFi operating system:

```
Sui-Loop/
├── packages/
│   ├── contracts/      # Sui Move Smart Contracts (Atomic Engine)
│   ├── agent/          # Autonomous AI Backend (Node.js/TypeScript)
│   ├── web/            # Command Center Frontend (Next.js 15)
│   ├── sdk/            # TypeScript SDK (@suiloop/sdk)
│   ├── sdk-python/     # Python SDK (suiloop)
│   ├── cli/            # CLI Tool (@suiloop/cli)
│   └── desktop/        # Native Desktop App (Tauri 2 / Rust)
```

---

## ⚡ Core Components

### 1. The Atomic Engine — Smart Contracts (`packages/contracts`)
Built in **Sui Move**, the on-chain layer enforces trustless execution:

- **Non-Custodial Vaults** — Users deposit SUI or USDC into `Vault<Asset>` objects on-chain. The agent **cannot withdraw funds**; it can only execute whitelisted trading functions.
- **Dual Capability Model** — `OwnerCap` (cold wallet, full control) and `AgentCap` (hot wallet, execution-only). The owner can revoke agent access instantly via a Kill Switch.
- **Hot Potato Flash Loans** — The `LoopReceipt` struct has no `drop` ability, guaranteeing that borrowed capital **must** be repaid within the same Programmable Transaction Block (PTB) or the entire transaction reverts. Zero-collateral, zero-risk of debt.
- **DeFi Protocol Interfaces** — Modular interfaces for **Scallop** (Lending), **Cetus** (DEX), **Navi** (USDC Lending), and **DeepBook** (CLOB).
- **Multi-Asset Support** — Native SUI and USDC vaults with independent flash loan pools.
- **Formal Verification** — Move Prover `spec` rules validate solvency invariants.

#### On-Chain Deployment (Testnet)
| Contract | Address |
|---|---|
| Atomic Engine Package | `0x4cc674a7c3e5260fca6b4888de3dbae10d3bbde8f59876ba3553b2a41909e1e8` |
| Agent Registry | `0xbea03ada1b06571463f385ceb8cd97b356ea7161ca902093c50209724431d65e` |
| Strategy Marketplace | `0x4b0d27bebdfcf5a16de2ea0df7dad8bc86990367667adab3b488546de35a8a31` |
| MockPool (SUI/SUI) | `0xf3fb0169fa56f257b613c7efe66d982143cdfb0a4ca91d5a3e394be1d066c868` |

---

### 2. The Neural Matrix — Agent Backend (`packages/agent`)
A comprehensive **Node.js/TypeScript** runtime (41 source files) powering autonomous intelligence:

#### Core Services
| Service | Description |
|---|---|
| `autonomousLoop.ts` | Asynchronous market scanner (cron + interval). Pings Sui RPC for prices, gas, liquidity, and lending APYs. Emits signals when arbitrage/flash loan thresholds are met. |
| `subscriptionService.ts` | WebSocket server (`/ws/signals`) broadcasting real-time trading signals and system logs to all connected clients. |
| `webhookService.ts` | Webhook dispatch system with HMAC-SHA256 payload signing, exponential retry backoff, and auto-disable after 10 failures. |
| `skillManager.ts` | Full plugin architecture — loads 12+ built-in skills, supports remote installation from GitHub/LoopHub, sandboxed action execution. |
| `walrusService.ts` | Decentralized audit trail — uploads strategy execution logs to **Sui Walrus** (Testnet) as immutable blobs. Viewable on [walruscan.com](https://walruscan.com/testnet/home). |
| `llmService.ts` | AI decision engine with multi-provider support. |
| `knowledgeService.ts` | Knowledge graph for AI context building. |
| `memoryService.ts` | Agent session memory persistence. |
| `schedulerService.ts` | Cron-based task scheduler for timed executions. |
| `queueService.ts` | Async job queue for non-blocking operations. |
| `scallopService.ts` | Scallop Protocol integration (lending/borrowing). |
| `cetusService.ts` | Cetus Protocol integration (DEX swaps). |
| `notificationService.ts` | Multi-channel notification dispatch. |
| `telegramService.ts` | Telegram bot integration for alerts. |
| `discordService.ts` | Discord bot integration for alerts. |
| `twitterService.ts` | X/Twitter sentiment scraping. |

#### AI Providers (Multi-LLM)
The agent dynamically routes market data to the user's preferred AI:
- **OpenAI** — GPT-4o / o1
- **Ollama** — Local models (Llama 3, Mistral) for 100% privacy

Set via `ACTIVE_LLM_PROVIDER` in `.env.local`.

#### Authentication & Security
- **JWT + API Key** dual authentication system.
- **Token Bucket Rate Limiter** — Standard (30 req/min), Aggressive (5 req/min), Admin (100 req/min).
- **Admin vs User** permission levels per API key.

#### REST API Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/health` | No | System health + version + uptime |
| `GET` | `/api/info` | No | Available endpoints + docs link |
| `POST` | `/api/auth/token` | No | Exchange wallet signature for JWT |
| `POST` | `/api/auth/keys` | Admin | Generate API key |
| `GET` | `/api/auth/keys` | Yes | List user's API keys |
| `POST` | `/api/execute` | Yes | Execute strategy (Testnet/Mainnet) |
| `POST` | `/api/execute-demo` | No | Demo execution (rate-limited) |
| `GET` | `/api/market` | Yes | Current market data |
| `POST` | `/api/loop/start` | Yes | Start autonomous scanner |
| `POST` | `/api/loop/stop` | Yes | Stop scanner |
| `GET` | `/api/loop/status` | Yes | Scanner status + market state |
| `POST` | `/api/loop/scan` | Yes | Trigger manual scan |
| `POST` | `/api/webhooks` | Yes | Register webhook |
| `POST` | `/api/subscriptions` | Yes | Create signal subscription |
| `GET` | `/api/skills` | Yes | List loaded skills |
| `POST` | `/api/skills/install` | Admin | Install skill from remote |
| `POST` | `/api/skills/:slug/actions/:action` | Yes | Execute skill action |

---

### 3. The Command Center — Frontend (`packages/web`)
A hyper-advanced **Next.js 15** application with React 19, Tailwind CSS, Framer Motion, and Three.js.

#### Design Philosophy
- **Glass & Neon Cyberpunk** aesthetic — Obsidian backgrounds, neon cyan (`#00f0ff`) and purple (`#8a2be2`) accents.
- **Glassmorphism** — `backdrop-blur`, translucent panels, glowing borders.
- **Micro-animations** — Framer Motion staggered entries, heartbeat pulses, smooth page transitions.
- **3D Neural Orb** — Three.js `@react-three/fiber` animated orb on the landing page.

#### Pages (10+)
| Page | Route | Description |
|---|---|---|
| **Landing** | `/` | Hero + 3D Orb + Feature Grid + Live Terminal + SDK Quick Start + Download CTA |
| **Dashboard** | `/dashboard` | Mission-critical control panel — wallet balances, vault management, strategy deployment, real-time WebSocket terminal, loop controls, installed skills (2400+ lines) |
| **Strategies** | `/strategies` | Catalog of 10+ pre-built strategy templates with live APY display and deploy buttons |
| **Strategy Builder** | `/strategies/builder` | Visual drag-and-drop strategy builder using ReactFlow — 6 node categories, custom nodes, export as JSON, deploy on-chain |
| **Marketplace** | `/marketplace` | Skill marketplace — search, filter by category, install/uninstall skills via agent API |
| **Plugins** | `/plugins` | Core plugin manager with 12+ built-in plugins (Deep Research, Flash Loans, Whale Tracker, MEV Guard, etc.) |
| **Agents** | `/agents` | Fleet monitor — system status indicators, API key manager, Walrus blackbox status, live Supabase logs |
| **Analytics** | `/analytics` | Portfolio analytics — Recharts area charts, stat cards, time range selector (24H/7D/30D) |
| **Docs** | `/docs` | 8-tab documentation center (Mission Brief, Tactical Scenarios, Architecture, Contracts, Agent, Builder, API, Security) |
| **How to Use** | `/how-to-use` | Step-by-step onboarding guide |
| **Manifesto** | `/manifesto` | Protocol philosophy and vision |

#### Key Frontend Features
- **Wallet Integration** — `@mysten/dapp-kit` with Sui Wallet connect + network detection.
- **Dual Persistence** — Strategy data saved to **Supabase** (primary) with automatic **localStorage** fallback if offline.
- **Remote Logging** — `writeLog()` posts events to Supabase `logs` table for cross-device visibility.
- **WebSocket Terminal** — Live color-coded log feed (info=cyan, warn=yellow, error=red, success=green).
- **Responsive** — Fully mobile-optimized navbar with animated slide-in menu.

---

### 4. SDKs — TypeScript & Python (`packages/sdk`, `packages/sdk-python`)

Both SDKs provide **100% feature parity** for third-party developers building on SuiLoop:

#### TypeScript (`@suiloop/sdk` v0.0.7)
```typescript
import { Agent } from '@suiloop/sdk';

const agent = new Agent({ apiKey: 'sk_...', baseUrl: 'http://localhost:3001' });
await agent.startLoop();
agent.subscribe((signal) => console.log('Signal:', signal));
const result = await agent.execute('flash-loan-executor', 'SUI');
```

#### Python (`suiloop` v0.0.7)
```python
from suiloop import Agent

agent = Agent(api_key="sk_...", base_url="http://localhost:3001")
agent.start_loop()
result = agent.execute("flash-loan-executor", asset="SUI")
async for signal in agent.stream_signals():
    print(signal)
```

#### Available Methods (Both SDKs)
`ping()` · `health()` · `execute()` · `executeDemo()` · `getMarket()` · `getLoopStatus()` · `startLoop()` · `stopLoop()` · `triggerScan()` · `createSubscription()` · `subscribe()` · `disconnect()`

---

### 5. CLI Tool (`packages/cli`)
Scaffold new SuiLoop-powered bots in seconds:
```bash
npx @suiloop/cli create my-bot --template ts
# or
npx @suiloop/cli create my-bot --template py
```
Generates a ready-to-run project with SDK pre-configured, `.env.example`, and a working bot template.

---

### 6. Desktop Companion App (`packages/desktop`)
A native **Tauri 2 / Rust** application for macOS, Windows, and Linux:
- Silent background monitoring of agent status.
- System tray integration.
- Auto-built via GitHub Actions for all 3 platforms on each release.
- Download: [GitHub Releases](https://github.com/Eras256/Sui-Loop/releases)

---

## 🔐 Decentralized Audit Trail (Walrus)

Every 5 minutes, the agent archives its accumulated system logs to **Sui Walrus** — a decentralized blob storage network on the Sui ecosystem. This creates an immutable, tamper-proof "black box" recording of every market scan, AI decision, and execution signal.

Verify any archived log on the official explorer:
**[https://walruscan.com/testnet/home](https://walruscan.com/testnet/home)**

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Smart Contracts | Sui Move (Hot Potato Pattern, PTBs) |
| Agent Backend | Node.js, TypeScript, Express, WebSocket (`ws`) |
| Frontend | Next.js 15, React 19, Tailwind CSS, Framer Motion, Three.js, ReactFlow |
| Database | Supabase (PostgreSQL) + localStorage fallback |
| Audit Storage | Sui Walrus (Decentralized Blob Storage) |
| Desktop App | Tauri 2 (Rust + WebView) |
| AI Providers | OpenAI, Ollama (local) |
| Charts | Recharts |
| Icons | Lucide React |
| Toast/Notifications | Sonner |
| Package Manager | pnpm v10 (Monorepo Workspaces) |
| CI/CD | GitHub Actions (Lint, Build, Tauri Release) |
| Hosting | Vercel (Frontend), Self-hosted (Agent) |

---

## 🚀 Quick Start

### Option A: One-Liner (Linux/Mac)
```bash
./install.sh
```

### Option B: Docker
```bash
docker-compose up --build -d
```

### Option C: Manual
```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Start all services
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Agent API | `http://localhost:3001` |
| WebSocket Feed | `ws://localhost:3001/ws/signals` |

---

## 📋 Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
# Sui Network
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043
NEXT_PUBLIC_POOL_ID=0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Walrus (Decentralized Storage)
NEXT_PUBLIC_WALRUS_PUBLISHER_URL=https://publisher.walrus-testnet.walrus.space
NEXT_PUBLIC_WALRUS_AGGREGATOR_URL=https://aggregator.walrus-testnet.walrus.space
```

---

## 🔮 Roadmap

- [x] Atomic Flash Loan Engine (Hot Potato)
- [x] Multi-Asset Vaults (SUI + USDC)
- [x] Real-Time WebSocket Signal Streaming
- [x] Autonomous Market Scanner Loop
- [x] Skill/Plugin Marketplace + Manager
- [x] Decentralized Audit Trail (Walrus)
- [x] Multi-LLM Provider Architecture
- [x] Visual Strategy Builder (ReactFlow)
- [x] TypeScript & Python SDKs
- [x] CLI Scaffolding Tool
- [x] Tauri Desktop App (macOS/Win/Linux)
- [x] Supabase Persistence + localStorage Fallback
- [x] Webhook System (HMAC-SHA256)
- [x] Portfolio Analytics Dashboard
- [x] 8-Tab Documentation Center
- [ ] Mainnet Deployment
- [ ] AI Strategy Optimization (Reinforcement Learning)
- [ ] Telegram & Discord Bot Activation
- [ ] Mobile App (React Native)

---

## 📜 License

[MIT](LICENSE)

---

*Built with precision for the Sui Ecosystem.*
