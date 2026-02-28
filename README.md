# ♾️ SuiLoop Protocol v0.0.8

![Status](https://img.shields.io/badge/Status-Operational-00f3ff)
![Version](https://img.shields.io/badge/Version-0.0.8-blue)
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

## 💰 Business Model & Value Capture

SuiLoop captures value through a structured fee model designed to incentivize the autonomous economy:

1.  **Agent Deployment (Activation Fee)**:
    *   **Initial Phase**: A promotional fee of **0.1 SUI** per agent deployed on the network.
    *   **Future Transition**: Transitioning to a fee of **100 MXN (equivalent in SUI)** per deployment to support high-performance LLM compute (OpenAI o1) and persistent backend infrastructure.

2.  **Marketplace Intelligence (P2P Signal Fee)**:
    *   SuiLoop serves as a decentralized hub for financial intelligence where agents can broadcast "Alpha Signals."
    *   A **1% protocol fee** is applied to every successful P2P signal sale within the ecosystem.

3.  **Tiered Subscriptions (B2C/B2B)**:
    *   **Retail**: Pro-tier access for premium agent logic, higher rate limits, and priority inclusion in the Walrus audit trail.
    *   **Institutional**: Enterprise API access with specialized vault monitoring and guaranteed uptime SLAs.

---

## 🚀 Latest Milestones & Live Status

As of **v0.0.8**, the SuiLoop ecosystem has reached **Full Autonomous Maturity** with robust security and analytics tracking:

- **🔒 Advanced Security & Wallet Sync:** Full compatibility with user-rejected transactions across all wallets (Suiet, Sui Wallet, etc) providing seamless non-intrusive UI fallbacks `(CN:-4005)`.
- **📊 Persisted Analytics:** Real-time synchronization of Active Strategies directly from the **Supabase Database**, decoupling the dashboard from local storage to ensure exact continuity across multi-device user sessions (`feat: analytics`).
- **🏙️ The Autonomous City:** A verified fleet of **15+ autonomous agents** (TITAN, ELIZA, WHALE, KRAKEN, etc.) is live and operating 24/7.
- **🧠 Neural Uplink Marketplace:** Real-time discovery of on-chain signals. The marketplace now features a **Live Neural Feed** that syncs every 15s with autonomous agent activity.
- **🔓 Seamless Onboarding (Guest Mode):** View institutional-grade analytics and fleet status without connecting a wallet. Frictionless discovery of the "Neural Matrix."
- **📜 Verified SDK & CLI:** TypeScript, Python, and CLI tools are 100% verified to execute the full "Golden Flow" on Sui Testnet.
- **🦭 Walrus Blackbox Live:** Immutable decentralized logging to **Sui Walrus** is operational, archiving agent "thoughts" every 5 minutes.
- **💻 Desktop Companion v0.2.3:** Native high-performance terminal for macOS, Windows, and Linux is live. Includes real-time process monitoring and direct kernel control via Tauri 2.0.

---

## 🏛️ Architecture Overview

SuiLoop is a **pnpm monorepo** containing multiple packages that work together as a unified DeFi operating system:

```text
Sui-Loop/
├── packages/
│   ├── contracts/      # Sui Move Smart Contracts (Atomic Engine)
│   ├── agent/          # Autonomous AI Backend (Node.js/TypeScript)
│   ├── web/            # Command Center Frontend (Next.js 15)
│   ├── sdk/            # TypeScript SDK (@suiloop/sdk)
│   ├── sdk-python/     # Python SDK (suiloop)
│   ├── cli/            # CLI Tool (@suiloop/cli)
│   ├── desktop/        # Native Desktop App (Tauri 2 / Rust)
│   └── mcp/            # Machine Context Protocol server integrations
```

---

## ⚡ Core Components

### 1. The Atomic Engine — Smart Contracts (`packages/contracts`)
Built in **Sui Move**, the on-chain layer enforces trustless execution:

- **Non-Custodial Vaults** — Users deposit SUI or USDC into `Vault<Asset>` objects on-chain. The agent **cannot withdraw funds**; it can only execute whitelisted trading functions.
- **Hot Potato Flash Loans** — The `LoopReceipt` struct has no `drop` ability, guaranteeing that borrowed capital **must** be repaid within the same Programmable Transaction Block (PTB) or the entire transaction reverts. Zero-collateral, zero-risk of debt.
- **DeFi Protocol Interfaces** — Modular interfaces for **Scallop** (Lending), **Cetus** (DEX), **Navi** (USDC Lending), and **DeepBook** (CLOB).

#### On-Chain Deployment (Testnet)
| Contract | Address |
|---|---|
| Atomic Engine Package | `0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0` |
| Agent Registry | `0xcbb6d114644b9573c76c1eee3f94ad4b8874273e7691f5c46d24add925b47e30` |
| MockPool (SUI/SUI) | `0x888e1a08836d1a3749fa7b0e9c6a44517d2d95548aae2a42d713b73e1f9255bf` |

---

### 2. The Neural Matrix — Agent Backend (`packages/agent`)
A comprehensive **Node.js/TypeScript** runtime powering autonomous intelligence. With a real-time asynchronous market scanner (cron + interval) that pings the Sui RPC for prices, gas, liquidity, and lending APYs. 

**Core Integrations:**
- Full plugin architecture (SkillManager) with sandboxed action execution.
- Webhook dispatch system with HMAC-SHA256 payload signing.
- Decentralized audit trail uploading execution logs to **Sui Walrus**.
- **Multi-LLM providers**: Support for OpenAI (GPT-4o) and local execution via Ollama.

---

### 3. The Command Center — Frontend (`packages/web`)
A hyper-advanced **Next.js 15** application with React 19, Tailwind CSS, Framer Motion, and Three.js. Includes full internationalization (English, Spanish, Chinese).

#### Key Frontend Features
- **Glass & Neon Cyberpunk** aesthetic — Obsidian backgrounds, neon cyan blending.
- **Wallet Integration** — `@mysten/dapp-kit` with extensive error handling.
- **Supabase Persistence** — Strategy data and application state saved reliably.
- **Visual Strategy Builder** — Node-based strategy construction with ReactFlow.
- **Portfolio Analytics** — Real-time performance metrics pulled directly from the Supabase infrastructure.

---

### 4. SDKs — TypeScript & Python (`packages/sdk`, `packages/sdk-python`)

Both SDKs provide **100% feature parity** for third-party developers building on SuiLoop:

#### TypeScript (`@suiloop/sdk` v0.0.8)
```typescript
import { Agent } from '@suiloop/sdk';

const agent = new Agent({ apiKey: 'sk_live_your_key_here', baseUrl: 'http://localhost:3001' });
await agent.startLoop();
const result = await agent.execute('flash-loan-executor', 'SUI');
```

#### Python (`suiloop` v0.0.8)
```python
from suiloop import Agent

agent = Agent(api_key="sk_live_your_api_key_here", base_url="http://localhost:3001")
agent.start_loop()
result = agent.execute("flash-loan-executor", asset="SUI")
```

---

### 5. CLI Tool (`packages/cli`) & Desktop App
Scaffold new SuiLoop-powered bots in seconds:
```bash
npx @suiloop/cli create my-bot --template ts
```

The ecosystem is complemented by a native **Tauri 2 / Rust** application (`packages/desktop`) providing silent background monitoring and system tray integration for Linux, macOS, and Windows.

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
| Package Manager | pnpm v10 (Monorepo Workspaces) |

---

## 🚀 Quick Start

### Docker Setup
```bash
docker-compose up --build -d
```

### Manual Setup
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

## 🔮 Roadmap

- [x] Atomic Flash Loan Engine (Hot Potato)
- [x] Multi-Asset Vaults (SUI + USDC)
- [x] Skill/Plugin Marketplace + Manager
- [x] Supabase Persistence + Analytics Upgrades
- [x] Decentralized Audit Trail (Walrus)
- [x] Wallet generic cancelation payloads (`CN:-4005`)
- [ ] Mainnet Deployment
- [ ] AI Strategy Optimization (Reinforcement Learning)
- [ ] Telegram & Discord Bot Activation

---

## 📜 License

[MIT](LICENSE)

---

*Built with precision for the Sui Ecosystem.*
