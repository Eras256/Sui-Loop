
# ♾️ SuiLoop Protocol

![SuiLoop Banner](https://img.shields.io/badge/Status-Operational-00f3ff) ![Network](https://img.shields.io/badge/Network-Sui_Testnet-blue) ![Security](https://img.shields.io/badge/Security-Atomic_Hot_Potato-purple) ![License](https://img.shields.io/badge/License-MIT-white)

**SuiLoop** is the first **Institutional-Grade Autonomous Agent Protocol** native to the **Sui Network**. It functions as a decentralized "Neural Matrix" that orchestrates financial agents ("Warheads") capable of executing atomic DeFi strategies with mathematical safety guarantees.

Unlike traditional bots, SuiLoop utilizes **Sui Move's "Hot Potato" pattern** to enforce atomic arbitrage loops—transactions that borrow millions in flash liquidity and are mathematically incapable of failing with debt; they either profit or revert entirely.

---

## 🏛️ Architecture & Capabilities

### 1. The Neural Matrix (Orchestrator)
The system core (`@suiloop/agent`) is a high-frequency Node.js runtime that manages:
- **Dynamic Skill Injection**: Load new strategies (arbitrage, liquidations, market making) without restarting the kernel.
- **Bi-Directional Telemetry**: A real-time WebSocket pipeline broadcasting execution states to the operator.
- **24/7 Autonomous Scheduler**: Built-in Cron engine enables the agent to wake up, execute strategies, and sleep based on precise time intervals, removing the need for human triggering.
- **Multimodal Interface (Voice)**: Integrated STT/TTS modules allow operators to issue verbal commands and receive audio status reports, enabling hands-free mission control.

### 2. The Atomic Engine (Execution Layer)
Our smart contracts implement the **Flash Loan pattern** using a `LoopReceipt` struct without the `drop` ability.
- **Invariant Safety**: The receipt cannot be discarded. It MUST be returned to the `repay_flash_loan` function within the same Programmable Transaction Block (PTB).
- **Zero-Collateral Execution**: Agents can borrow infinite liquidity (bounded only by pool depth) provided they return the principal + fee in the same atomic execution.

### 3. Forensic Black Box (Audit Module)
Designed for compliance and post-mortem analysis:
- **Cryptographic Logging**: Every decision, signal, and transaction is signed and stored in an immutable log.
- **Audit Export**: Operators can extract a `sui-audit.json` file containing the full execution trace and on-chain Transaction Hashes (Digests) for independent verification.

### 4. The Ops Unit (Command Center)
A futuristic "Glass & Neon" interface built on **Next.js 15**:
- **Live Neural Feed**: Watch the agent "think" in real-time logs.
- **Marketplace Nexus**: One-click deployment of new agent capabilities.
- **Tactical Dashboard**: Monitor wallet health, active strategies, and PnL.

---

## ⚡ Technical Specifications

- **Parallel Architecture**: Monorepo orchestration managed by `pnpm`.
- **Latency**: Sub-50ms signal processing via WebSocket.
- **Standards**: Compliant with Sui Move Design Patterns (Hot Potato, Coin Merging).
- **Sui SDK**: Deep integration using Programmable Transaction Blocks (PTBs) for complex, multi-step atomic calls.
- **AI Core**: Multi-provider support (OpenAI, Anthropic, Ollama) for cognitive reasoning and voice processing.

### ⛓️ On-Chain Deployment (Testnet)
- **Atomic Engine**: `0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043`
- **Mock Liquidity Asset**: `0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0` (MockPool utilized for reliable demo execution)

---

## 🚀 Quick Start

### Option A: The "One-Liner" (Linux/Mac)
Installs dependencies, builds the neural matrix, and initializes the environment.
```bash
./install.sh
```

### Option B: Docker Deployment (Recommended for Production)
Runs the Agent and Ops Unit in isolated containers.
```bash
docker-compose up --build -d
```
- **Ops Unit**: `http://localhost:3000`
- **Neural Matrix**: `http://localhost:3001`

### Option C: Manual Installation
```bash
# 1. Install dependencies
pnpm install

# 2. Configure Environment
cp .env.example .env
# Edit .env with your credentials

# 3. Ignite System
pnpm dev
```
    - **Frontend:** `http://localhost:3000`
    - **Agent API:** `http://localhost:3001`
    - **WebSocket Feed:** `ws://localhost:3001/ws/signals`

---

## 📂 Project Structure

```bash
Sui-Loop/
├── packages/
│   ├── agent/          # Node.js Autonomous Agent Backend
│   │   ├── src/
│   │   │   ├── services/   # SkillManager, LoopHub, SubscriptionService
│   │   │   └── routes/     # Express API Routes
│   │   └── skills/     # Installed Agent Capabilities
│   │
│   ├── web/            # Next.js 15 Frontend
│   │   ├── app/        # App Router (Marketplace, Agents, Dashboard)
│   │   └── components/ # Glassmorphism UI Components
│   │
│   └── contracts/      # Sui Move Smart Contracts
│       └── sources/    # Flash Loan & Safety Layer Modules
```

---

## 🔮 Roadmap
- [x] Marketplace Logic & API
- [x] Real-time WebSocket Logging
- [x] End-to-End Skill Installation
- [ ] Mainnet Deployment
- [ ] AI Strategy Optimization (Reinforcement Learning)

---

*Built with precision for the Sui Ecosystem.*
