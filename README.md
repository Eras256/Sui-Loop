
# ♾️ SuiLoop Protocol v2.0

![SuiLoop Banner](https://img.shields.io/badge/Status-Operational-neon_cyan) ![Version](https://img.shields.io/badge/Version-2.0.5-purple) ![License](https://img.shields.io/badge/License-MIT-white)

**SuiLoop** is the first institutional-grade Autonomous Agent Protocol built on the **Sui Network**. It empowers users to deploy "Warhead" units—financial agents capable of executing complex DeFi strategies (like Atomic Flash Loans, Arbitrage, and Liquidity Provisioning) with sub-second latency.

The system features a **Neural Matrix** backend that coordinates agent skills, marketplace installations, and real-time telemetry via WebSockets.

---

## 🚀 Key Features

### 🧠 Autonomous Agent Core (`@suiloop/agent`)
- **Skill System**: Modular architecture allowing dynamic installation of capabilities (Flash Loans, Oracles, Telegram Alerts).
- **Neural Matrix**: Real-time event bus and memory system utilizing WebSockets for live telemetry.
- **Safety Layer**: Pre-transaction checks for slippage, liquidity concentration, and volatility guards.

### 🌐 Command Center (`suiloop-web`)
- **Marketplace**: Browse and install agent skills directly from the UI.
- **Live Ops Terminal**: Monitor agent thought processes, system logs, and execution signals in real-time.
- **Glass & Neon UI**: A futuristic, high-performance interface built with Next.js 15 and Tailwind CSS.

### ⚡ Technical Highlights
- **Parallel Execution**: Monorepo orchestrating Frontend and Agent Backend simultaneously.
- **Hot Potato Pattern**: Native Sui Move implementations for flash loans without collateral.
- **WebSocket Telemetry**: Bi-directional communication for zero-latency monitoring.
- **Forensic Auditability**: Cryptographically signed execution logs downloadable as JSON "Black Box" reports.

### ⛓️ Deployed Contracts (Testnet)
SuiLoop v2.0 is live on Sui Testnet.
- **Package ID**: `0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043`
- **Atomic Engine**: `suiloop::atomic_engine`
- **Mock Pool**: `0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0`

---

## 🛠️ Installation & Setup

### Prerequisites
- Node.js v18+
- pnpm (recommended)
- Sui CLI (for contract deployment)

### logic Initialization
1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/Sui-Loop.git
    cd Sui-Loop
    ```

2.  **Install Dependencies**
    ```bash
    pnpm install
    ```

3.  **Start the Neural Matrix (Dev Mode)**
    This command launches both the Next.js Frontend and the Agent Backend server in parallel.
    ```bash
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
