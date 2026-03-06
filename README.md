# ♾️ SuiLoop Protocol — Autonomous DeFi Intelligence on Sui

<div align="center">

![Status](https://img.shields.io/badge/Status-Operational-00f3ff?style=for-the-badge)
![Version](https://img.shields.io/badge/Version-1.0.0-blueviolet?style=for-the-badge)
![Network](https://img.shields.io/badge/Network-Sui_Testnet-4DA2FF?style=for-the-badge&logo=sui)
![Security](https://img.shields.io/badge/Hot_Potato_Pattern-Verified-00ff88?style=for-the-badge)
![Agents](https://img.shields.io/badge/Neural_Swarm-20_Agents-ff6b6b?style=for-the-badge)
![Walrus](https://img.shields.io/badge/Audit-Walrus_Sealed-orange?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-white?style=for-the-badge)

**The first institutional-grade Autonomous AI Agent Protocol natively built on Sui.**

[🌐 Live App](https://sui-loop-ejkkotcb-vaiosxs-projects.vercel.app) · [📦 Contract](https://suiscan.xyz/testnet/object/0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0) · [📚 Docs](https://sui-loop-ejkkotcb-vaiosxs-projects.vercel.app/docs) · [🏆 Leaderboard](https://sui-loop-ejkkotcb-vaiosxs-projects.vercel.app/leaderboard)

</div>

---

## 🧠 The Story

> *"The problem with DeFi is that humans are the bottleneck."*

In traditional finance, institutions have armies of quants, traders, and risk managers working 24/7. In DeFi, the individual is left alone — staring at charts, missing millisecond arbitrage windows, and manually approving every transaction.

**SuiLoop changes this.**

We built an autonomous financial intelligence layer — a **Neural Swarm** of 20 named AI agents that operate non-stop on the Sui blockchain. Each agent has a name, a role, a specialty, and a survival instinct. They scan markets, detect flash loan opportunities, publish on-chain signals, and execute atomic strategies — all without human intervention.

But we didn't stop at automation. We made it **safe**. Every flash loan is enforced at the bytecode level by Sui Move's **Hot Potato pattern** — borrowed capital _must_ be repaid in the same Programmable Transaction Block or the entire transaction reverts. No collateral at risk. No bad debt. Mathematical certainty.

And every decision, every signal, every execution — **sealed immutably on Sui Walrus** as a tamper-proof forensic audit trail. We call this **Proof of Action**: every on-chain signal now includes a Walrus Blob ID containing the LLM's "why" behind the trade.

This is not a chatbot that talks about DeFi. This is a protocol that _does_ DeFi.

---

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         SuiLoop Protocol — Full Stack                       │
└─────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────────────────────┐     ┌──────────────────────────────────────┐
  │   LAYER 0: SUI BLOCKCHAIN    │     │   LAYER 1: NEURAL SWARM DAEMON       │
  │  ────────────────────────    │     │  ─────────────────────────────────   │
  │                              │     │                                      │
  │  ┌─────────────────────┐     │     │  │  ┌──────────┐ ┌─────────────┐ │  │
  │  │   atomic_engine.move│     │     │  │  │Flash Loan│ │Signal Pub.  │ │  │
  │  │  ─────────────────  │     │     │  │  │ Executor │ │(on-chain)   │ │  │
  │  │  • borrow_flash_loan│◄────┼─────┼──│  └──────────┘ └─────────────┘ │  │
  │  │  • repay_flash_loan │     │     │  └────────────────────────────────┘  │
  │  │  • execute_loop     │     │     │                                      │
  │  │  • LoopReceipt (HP) │     │     │  ┌────────────────────────────────┐  │
  │  └─────────────────────┘     │     │  │  autonomousLoop.ts             │  │
  │                              │     │  │  ──────────────────────────    │  │
  │  ┌─────────────────────┐     │     │  │  • Pyth Oracle (SUI/USD)       │  │
  │  │ agent_registry.move │     │     │  │  • Scallop APY Monitor         │  │
  │  │  ─────────────────  │◄────┼─────┤  │  • Navi USDC Feed              │  │
  │  │  • register_agent   │     │     │  │  • DeepBook Liquidity          │  │
  │  │  • publish_signal   │     │     │  │  • Circuit Breaker (GAP-4)     │  │
  │  │    (Walrus Sealed)  │     │     │  └────────────────────────────────┘  │
  │  └─────────────────────┘     │     │                                      │
  │                              │     │  ┌────────────────────────────────┐  │
  │  ┌─────────────────────┐     │     │  │  server.ts (Express API)       │  │
  │  │  mock_pool.move      │     │     │  │  ──────────────────────────    │  │
  │  │  (SUI/SUI testnet)  │     │     │  │  • JWT + API Key Auth          │  │
  │  └─────────────────────┘     │     │  │  • WebSocket /ws/signals       │  │
  │                              │     │  │  • Webhook (HMAC-SHA256)       │  │
  │  ┌─────────────────────┐     │     │  │  • /api/loop/start|stop|resume │  │
  │  │  agent_vault.move   │     │     │  └────────────────────────────────┘  │
  │  │  (Non-custodial)    │     │                                            │
  │  └─────────────────────┘     │     ┌──────────────────────────────────────┐
  └──────────────────────────────┘     │   LAYER 2: COMMAND CENTER (Web)      │
                                       │  ─────────────────────────────────   │
  ┌──────────────────────────────┐     │                                      │
  │   LAYER 3: PERSISTENCE       │     │  Next.js 15 + React 19               │
  │  ────────────────────────    │─────┼──► Dashboard, Leaderboard, Builder   │
  │                              │     │  • Agent Roster (Human vs Agent)     │
  │  ┌─────────────────────┐     │     │  • Real-time Supabase feed           │
  │  │   Supabase          │◄────┼─────┤  • WebSocket Neural Feed             │
  │  │   suiloop_agents    │     │     │  • i18n (EN/ES/ZH) + Legal Signing   │
  │  │   agent_logs        │     │     │  └────────────────────────────────┘  │
  │  │   strategies        │     │                                            │
  │  └─────────────────────┘     │     ┌──────────────────────────────────────┐
  │                              │     │  skillManager.ts                     │
  │  ┌─────────────────────┐     │     │  ─────────────────────────────       │
  │  │   Walrus Storage    │     │     │  • 10 Live Skills (One-click Install)│
  │  │   (Proof of Action) │◄────┼─────┤  • flash-loan-executor v2.1          │
  │  │   Immutable blobs   │     │     │  • price-oracle v1.5                 │
  │  └─────────────────────┘     │     └──────────────────────────────────────┘
  └──────────────────────────────┘
                                       ┌──────────────────────────────────────┐
  ┌──────────────────────────────┐     │   EXTERNAL ORACLES                   │
  │   ORACLE NETWORK             │     │  ─────────────────────────────────   │
  │  ────────────────────────    │     │                                      │
  │  • Pyth Network (SUI/USD)    │     │  • Scallop Indexer API               │
  │  • Sui RPC (gas, state)      │─────┼──► • DeepBook CLOB V3                │
  └──────────────────────────────┘     └──────────────────────────────────────┘
```

---

## ⚡ Core Components

### 1. 🔐 Atomic Engine — Smart Contracts (`packages/contracts`)

Built in **Sui Move**, the on-chain layer provides mathematical safety guarantees:

#### `atomic_engine.move` — Flash Loan Core
```move
// Hot Potato Pattern — No `drop` ability = must repay or revert
public struct LoopReceipt {
    pool_id: ID,
    amount_borrowed: u64,
    fee_due: u64,
}

public fun borrow_flash_loan<Base, Quote>(pool, amount, ctx) -> (Coin<Base>, LoopReceipt)
public fun repay_flash_loan<Base, Quote>(pool, coin, receipt)  // destroys receipt
```

- **Zero collateral risk** — The `LoopReceipt` hot potato cannot be dropped. If repayment doesn't happen in the same PTB, the entire transaction reverts atomically.
- **30 bps protocol fee** — Automatically enforced on every flash loan.
- **Programmable Transaction Blocks** — Full composability with DeepBook, Scallop, Cetus, Navi in a single atomic bundle.

#### `agent_registry.move` — On-Chain Agent Identity
```move
public fun register_agent(registry, wallet, metadata, ctx) -> AgentCap
public fun publish_signal(registry, agent_cap, signal_data, ctx)  // emits SignalPublished event
```

- Agents publish signals **on-chain** — verifiable, timestamped, immutable.
- **Proof of Action:** Every signal includes a `walrus_blob_id` link to the decision metadata stored on Walrus.
- `SignalPublished` events are indexable by any client in real-time.

#### `agent_vault.move` — Non-Custodial Vaults
```move
// Agent CANNOT withdraw. Only execute whitelisted functions.
public struct Vault<phantom Asset> has key { balance: Balance<Asset> }
```

#### On-Chain Deployment (Testnet)
| Contract | Address |
|---|---|
| **Atomic Engine Package** | [`0x9451...dcb0`](https://suiscan.xyz/testnet/object/0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0) |
| **Agent Registry Object** | [`0xcbb6...e30`](https://suiscan.xyz/testnet/object/0xcbb6d114644b9573c76c1eee3f94ad4b8874273e7691f5c46d24add925b47e30) |
| **MockPool (SUI/SUI)** | [`0x888e...5bf`](https://suiscan.xyz/testnet/object/0x888e1a08836d1a3749fa7b0e9c6a44517d2d95548aae2a42d713b73e1f9255bf) |

---

### 2. 🤖 Neural Swarm — 20 Named Agents

The Swarm Orchestrator (`scripts/suiloop_neural_swarm.ts`) manages a fleet of 20 autonomous agents, each with a unique identity, role, and specialization:

| Agent | Role | Specialty | Traffic Type |
|---|---|---|---|
| **Nexus** | Swarm Commander | Flash Loan Execution | Dual |
| **Phantom** | Market Scanner | Price Arbitrage | Signal |
| **Cipher** | Signal Publisher | On-chain Telemetry | Signal |
| **Apex** | Arbitrage Hunter | Cross-pool Spreads | Flash Loan |
| **Vault** | Liquidity Guardian | Capital Preservation | Flash Loan |
| **Nova** | Opportunity Explorer | New Pool Discovery | Dual |
| **Specter** | Shadow Executor | MEV Protection | Flash Loan |
| **Chronos** | Temporal Strategist | Gas Timing Optimization | Signal |
| **Atlas** | Capital Coordinator | Multi-vault Management | Dual |
| **Matrix** | Data Analyst | Market State Analysis | Signal |
| **Titan** | Heavy Executor | Large Volume Loans | Flash Loan |
| **Oracle** | Price Feed Monitor | Pyth Network Signals | Signal |
| **Forge** | PTB Architect | Transaction Construction | Flash Loan |
| **Helios** | Yield Hunter | APY Optimization | Dual |
| **Vortex** | Liquidity Rotator | Pool Rotation Strategy | Flash Loan |
| **Zenith** | Risk Validator | LLM-assisted Validation | Signal |
| **Flux** | Adaptive Executor | Dynamic Strategy Switch | Dual |
| **Pulse** | Health Monitor | Protocol Health Checks | Signal |
| **Shadow** | Stealth Operator | Low-latency Execution | Flash Loan |
| **Aegis** | Security Validator | Hot Potato Integrity | Dual |

**Swarm Stats (Live):**
- ~110 TX/min across the fleet
- 8s tick cadence
- Dual traffic: Flash Loans (on-chain) + Signals (agent_registry)
- ELO-based leaderboard updated in real-time via Supabase

---

### 3. 🛡️ Circuit Breaker — Industrial Safety (`autonomousLoop.ts`)

A critical safety mechanism protecting capital during blockchain failures:

```typescript
// Triggers after ERROR_THRESHOLD (5) consecutive scan failures
function triggerCircuitBreaker() {
    isPaused = true;
    // Fires emergency.pause webhook to all subscribers
    // Emits strategy_trigger EMERGENCY_STOP signal on-chain
    // Logs critical alert to Walrus for forensic audit
}

// Manual controls via REST API
POST /api/loop/pause   // Emergency stop
POST /api/loop/resume  // Resume after intervention
GET  /api/loop/status  // { isRunning, isPaused, consecutiveErrors }
```

---

### 4. 🧬 Agent Backend (`packages/agent`)

A comprehensive **Node.js/TypeScript** runtime — 24 services, 10 live skills:

#### Core Services
| Service | Description |
|---|---|
| `autonomousLoop.ts` | Market scanner: Pyth, Scallop, Navi, DeepBook |
| `loopHub.ts` | Central strategy orchestrator (LoopHub Marketplace) |
| `llmService.ts` | Multi-LLM: OpenAI GPT-4o-mini + Ollama local |
| `skillManager.ts` | Sandboxed skill execution engine |
| `subscriptionService.ts` | WebSocket signal broadcaster + Walrus archiver |
| `webhookService.ts` | HMAC-SHA256 signed webhook delivery |
| `memoryService.ts` | Persistent agent memory and context |
| `schedulerService.ts` | Cron-based deep market analysis |
| `agentRegistryService.ts` | On-chain signal publishing via agent_registry |
| `walrusService.ts` | Decentralized log archival (every 5 min) |

#### Live Skills (Plugins)
| Skill | Version | Capability |
|---|---|---|
| Flash Loan Executor | v2.1.0 | Atomic PTB flash loan construction |
| Multi-Source Price Oracle | v1.5.0 | Pyth + Scallop + Navi price feeds |
| Whale Tracker | v1.2.0 | Large transaction monitoring |
| Knowledge Graph | v1.0.0 | Contextual DeFi protocol knowledge |
| Social Sentiment | v1.0.0 | Market sentiment analysis |
| Telegram Alerts Pro | v3.0.0 | Real-time alert dispatch |
| Web Scouter | v1.0.0 | Protocol health & analytics scouting |

#### API Endpoints
```
GET  /health                    Heartbeat + uptime
POST /api/auth/keys             Generate API key (JWT)
POST /api/execute               Execute strategy (auth required)
POST /api/execute-demo          Public demo (no auth)
POST /api/loop/start            Start autonomous market scanner
POST /api/loop/stop             Stop scanner
POST /api/loop/pause            Emergency pause (Circuit Breaker)
POST /api/loop/resume           Resume after pause
GET  /api/loop/status           { isRunning, isPaused, consecutiveErrors }
GET  /api/market                Live market state (price, gas, APY)
POST /api/webhooks              Register webhook (HMAC-SHA256)
POST /api/subscriptions         Subscribe to signal feed
WS   /ws/signals                Real-time signal stream
```

---

### 5. 🖥️ Command Center — Frontend (`packages/web`)

**Next.js 15** + React 19 + Framer Motion + Three.js — Institutional cyberpunk aesthetic.

#### Pages & Features
| Page | Description |
|---|---|
| `/` | Landing — Protocol pitch + live stats |
| `/dashboard` | Real-time agent control center + wallet integration |
| `/leaderboard` | Live ELO leaderboard — Human vs Agent competition |
| `/strategies/builder` | ReactFlow visual strategy builder |
| `/marketplace` | Neural skill marketplace (one-click install) |
| `/agents` | Agent fleet monitor |
| `/plugins` | Skill/plugin discovery + install |
| `/docs` | Full protocol documentation |

**Key Technical Details:**
- **i18n:** English, Spanish, Chinese (Simplified)
- **Wallet:** `@mysten/dapp-kit` with full error handling (CN:-4005 cancelations)
- **Realtime:** Supabase postgres_changes subscriptions
- **Auth:** Guest mode + wallet-connected mode

---

### 6. 🦭 Walrus Decentralized Audit Trail

Every 5 minutes, the agent uploads accumulated execution logs to **Sui Walrus** — a decentralized blob storage network. This creates an immutable, tamper-proof forensic record of every:
- Market scan result
- LLM decision
- Flash loan execution
- Signal publication

**Verify live archives:** [walruscan.com/testnet/home](https://walruscan.com/testnet/home)

---

### 7. 📦 SDKs & Tooling

#### TypeScript SDK (`@suiloop/sdk`)
```typescript
import { Agent } from '@suiloop/sdk';

const agent = new Agent({ apiKey: 'sk_live_...', baseUrl: 'http://localhost:3001' });
await agent.startLoop();
const result = await agent.execute('flash-loan-executor', 'SUI');
```

#### Python SDK (`suiloop`)
```python
from suiloop import Agent

agent = Agent(api_key="sk_live_...", base_url="http://localhost:3001")
agent.start_loop()
result = agent.execute("flash-loan-executor", asset="SUI")
```

#### CLI
```bash
npx @suiloop/cli create my-bot --template ts
npx @suiloop/cli agent deploy --network testnet
npx @suiloop/cli loop start
```

#### MCP Server (`packages/mcp`)
Model Context Protocol server enabling AI assistants (Claude, etc.) to interact with SuiLoop directly.

#### Desktop App (`packages/desktop`)
Native Tauri 2.0 / Rust application with system tray integration, background monitoring, and direct kernel control for Linux, macOS, and Windows.

---

## 💰 Business Model

| Revenue Stream | Mechanism |
|---|---|
| **Agent Deployment** | 0.1 SUI activation fee per deployed agent |
| **Marketplace Signals** | 1% protocol fee on P2P alpha signal sales |
| **Pro Subscriptions** | Premium LLM compute + higher rate limits |
| **Enterprise API** | Institutional SLA + vault monitoring |

---

## 🛠️ Full Tech Stack

| Layer | Technology |
|---|---|
| **Smart Contracts** | Sui Move (Hot Potato, PTBs, Move Prover) |
| **Agent Runtime** | Node.js 20, TypeScript, Express 5 |
| **AI/LLM** | OpenAI GPT-4o-mini, Ollama (local) |
| **Blockchain SDK** | `@mysten/sui` v1.x |
| **Frontend** | Next.js 15, React 19, Tailwind CSS, Framer Motion, Three.js, ReactFlow |
| **Database** | Supabase (PostgreSQL) + Realtime subscriptions |
| **Decentralized Storage** | Sui Walrus (blob archival) |
| **External Oracles** | Pyth Network, Scallop Indexer, Sui RPC |
| **Desktop** | Tauri 2.0 (Rust) |
| **Monorepo** | pnpm v10 workspaces |
| **Deploy** | Vercel (web) + GitHub Actions |

---

## 🚀 Quick Start

```bash
# Clone and install
git clone https://github.com/Eras256/Sui-Loop.git
cd Sui-Loop
pnpm install

# Configure environment
cp packages/agent/.env.example packages/agent/.env
# Add: SUI_PRIVATE_KEY, OPENAI_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

# Start all services
pnpm dev
```

| Service | URL |
|---|---|
| Frontend | `http://localhost:3000` |
| Agent API | `http://localhost:3001` |
| WebSocket | `ws://localhost:3001/ws/signals` |

### Run the Neural Swarm
```bash
# Fund agents (needs 0.05 SUI per agent from main wallet)
cd packages/agent && npx tsx scripts/fund_swarm.ts

# Launch 20-agent swarm
npx tsx scripts/suiloop_neural_swarm.ts
```

---

## ✅ Roadmap

- [x] Atomic Flash Loan Engine (Hot Potato pattern)
- [x] Multi-Asset Non-Custodial Vaults (SUI + USDC)
- [x] On-Chain Agent Registry + Signal Publication
- [x] 20-Agent Neural Swarm Orchestrator
- [x] LLM-Validated Trade Signals (GPT-4o-mini)
- [x] Circuit Breaker — Industrial safety mechanism
- [x] Walrus Decentralized Audit Trail
- [x] Live ELO Leaderboard (Supabase + realtime)
- [x] LoopHub Signal Marketplace
- [x] TypeScript + Python SDKs
- [x] MCP Server (AI assistant integration)
- [x] Desktop App (Tauri 2)
- [x] i18n (EN/ES/ZH)
- [ ] Mainnet Deployment
- [ ] Reinforcement Learning Strategy Optimizer
- [ ] Telegram + Discord bot full activation
- [ ] zkLogin integration (social login)

---

## 📜 License

[MIT](LICENSE)

---

<div align="center">

**SuiLoop — Where capital never sleeps.**

*Built with precision for the Sui Ecosystem Hackathon.*

[suiscan.xyz/testnet/object/0x9451...dcb0](https://suiscan.xyz/testnet/object/0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0/tx-blocks)

</div>
