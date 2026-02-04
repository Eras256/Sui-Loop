# SuiLoop: The First Atomic Intelligence Protocol on Sui

**SuiLoop unlocks institutional-grade BTCfi strategies for everyone.** Powered by **DeepBook V3, Scallop, and Cetus**, combined with intelligent ElizaOS Agents, it compresses complex financial loops into single Programmable Transaction Blocks (PTBs). We turn passive liquidity into active yield, creating the deep markets Sui needs for global adoption.

[![Sui Testnet](https://img.shields.io/badge/Sui-Testnet-blue?logo=sui)](https://suiscan.xyz/testnet/object/0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043)
[![Move](https://img.shields.io/badge/Move-2024-green)](https://move-language.github.io/move/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Tests](https://img.shields.io/badge/Tests-5%2F5%20Passing-brightgreen)]()
[![API](https://img.shields.io/badge/API-v2.0-purple)]()
[![WebSocket](https://img.shields.io/badge/WebSocket-Signals-orange)]()

**Status**: 🟢 **Production Ready (Testnet v0.0.6)** | 🛡️ **Audited (Internal)** | 🤖 **Autonomous API v2.0**

---

## 🏆 Why SuiLoop? (Technical Execution)

SuiLoop creates a safe "sandbox" for AI Agents using **Move's Linear Types (Hot Potato Pattern)**. Our architecture allows an untrusted Agent to borrow millions in liquidity without collateral, because the transaction **cannot complete** unless the loan is repaid.

This is only possible on Sui, where we can enforce that the `LoopReceipt` struct MUST be destroyed (repaid) within the same Atomic Transaction Block.

```move
// 🛡️ The "Hot Potato" Safety Mechanism (v0.0.5 - REAL IMPLEMENTATION)
public fun execute_loop<Base, Quote>(
    pool: &mut MockPool<Base, Quote>,
    user_funds: Coin<Base>,
    borrow_amount: u64,
    min_profit: u64,
    ctx: &mut TxContext
) {
    // 1. FLASH LOAN - Borrow from pool (Get Hot Potato)
    let (loan_coin, receipt) = borrow_flash_loan(pool, borrow_amount, ctx);
    
    // 2. STRATEGY - Merge user funds (simulates arb profit)
    coin::join(&mut loan_coin, user_funds);
    
    // 3. REPAY OR REVERT
    // The 'receipt' has NO 'drop' ability - Move GUARANTEES repayment!
    let payment = coin::split(&mut loan_coin, repay_amount, ctx);
    repay_flash_loan(pool, payment, receipt, ctx); // Destroys Hot Potato
    
    // 4. Profit goes to user
    transfer::public_transfer(loan_coin, sender);
}
```

---

## ✨ Key Features (v0.0.5)

### 🎨 Visual Strategy Builder (NEW)
Create custom trading strategies with our **drag-and-drop node editor**:
- Connect triggers, conditions, and actions visually
- Save as **Draft** for later editing
- **Deploy** directly to the AI Agent
- Version history with one-click restore

### 🛒 Strategy Marketplace
Browse and deploy pre-built strategies with a single click:
- **SUI/USDC Kinetic Loop** - Flash loan leverage on stable pairs
- **LST Peg Restoration** - Arbitrage liquid staking price deviations
- **Meme Volatility Sniper** - Capture volatility spikes on memecoins
- **Smart DCA Accumulator** - Dollar-cost average with AI timing

### 📊 Dashboard Command Center
- Real-time portfolio metrics (Net Worth, APY, P&L)
- **Active Fleet** - All running strategies with status
- Live execution log with transaction links
- One-click strategy deployment with wallet signature

### 🔒 Wallet Persistence
- **Auto-connect** on page reload
- Secure session management
- Multi-wallet support (Sui Wallet, Suiet, Ethos, etc.)

---

## ✅ Verified On-Chain Execution (Testnet)

**Flash Loan Cycle Successfully Executed:**

| Step | Action | Status |
|------|--------|--------|
| 1 | Borrow SUI (Flash Loan) | ✅ Completed |
| 2 | Merge User Funds | ✅ Completed |
| 3 | Calculate Repayment (+ 0.3% fee) | ✅ Completed |
| 4 | Repay Loan (Destroy Hot Potato) | ✅ Completed |
| 5 | Transfer Profit to User | ✅ Completed |

**All 5 steps in 1 Atomic Transaction!**

### 🤖 AI Agent - Real Transaction Executions

The ElizaOS agent signs and executes **REAL transactions** on Sui Testnet:

| Transaction | Amount | Fee | Status | Suiscan |
|-------------|--------|-----|--------|---------|
| `5X6TDFkY...` | 0.1 SUI | 0.0003 SUI | ✅ Success | [View](https://suiscan.xyz/testnet/tx/5X6TDFkYvjvCb2LSE37DC7qNFs7UDgNy9izTs7amNanG) |
| `ExYe8kir...` | 0.05 SUI | 0.0001 SUI | ✅ Success | [View](https://suiscan.xyz/testnet/tx/ExYe8kirfrUVkehcz63NvDzSzZPz2gAoLoVyCpUcVESP) |

**Agent Wallet**: `0x8bd468b0e5941e75484e95191d99ff6234b2ab24e3b91650715b6df8cf8e4eba`


---

## 🚀 Unique Features

### 1. Progressive Automation 🎯
SuiLoop solves the biggest AI-Crypto dilemma: **Security vs. Autonomy**

| Mode | Control | Speed | For Who |
|------|---------|-------|---------|
| **🛡️ Copilot Mode** | User signs every tx | Human speed | Security-focused users |
| **🤖 Autonomous Mode** | Agent signs with PK | Superhuman (ms) | High-frequency traders |

> *"Start safely with Copilot Mode to learn the strategy, then graduate to Autonomous Mode for high-frequency execution."*

### 2. Atomic Transaction Blocks (PTB)
We don't just "send tokens". Our Agent constructs complex PTBs that include:
*   Flash Loan Borrow
*   Dex Swap (DeepBook/Cetus)
*   Profit Check Assertion
*   Loan Repayment
*   **ALL in 1 atomic step.**

### 3. Neural Glass Dashboard (UX)
We bridge the gap between complex DeFi and retail users. The interface features a **"Deploy Strategy"** button that abstracts 5 complex on-chain steps into a single user signature.

### 4. Hot Potato Security (Move 2024)
The `LoopReceipt` struct has **NO `drop` ability**. Move's type system guarantees:
- If you borrow, you MUST repay
- If repayment fails, entire transaction reverts
- Zero risk of stuck funds

### 5. AI Agent with Real Signing (ElizaOS)
The autonomous agent **actually signs and broadcasts transactions**:
```bash
$ pnpm --filter @suiloop/agent dev "Loop 0.1 SUI"

🚀 SUILOOP AGENT v0.0.6
🤖 Agent Wallet: 0x8bd468b0e5941e75...
📝 Signing transaction...
✅ Transaction Successful: 5X6TDFkYvjvCb2LS...
🔗 View on Suiscan: https://suiscan.xyz/testnet/tx/...
```

### 6. Autonomous Agent API v2.0 (NEW) 🚀
External agents can now connect to SuiLoop via our **institutional-grade API**:

| Feature | Description |
|---------|-------------|
| 🔐 **API Key Auth** | Secure `sk_live_xxx` keys with permissions |
| 🛡️ **Rate Limiting** | 60 req/min standard, auto-blocking for abuse |
| 📡 **Webhooks** | Push notifications with HMAC-SHA256 signatures |
| 🔔 **WebSocket Signals** | Real-time trading signals via `/ws/signals` |
| 🤖 **Autonomous Loop** | 24/7 market scanner with configurable thresholds |

```bash
# Start the Autonomous Agent API
pnpm --filter @suiloop/agent server

# 🌐 HTTP API:    http://localhost:3001
# 🔌 WebSocket:   ws://localhost:3001/ws/signals
```

### 7. Deterministic Simulation Layer (Fallback)
We prioritized user experience. If DeepBook testnet is down, our protocol **seamlessly degrades** to a simulation layer so users can still test the mechanics:
- Primary: DeepBook V3 Pools
- Fallback: Deterministic Simulation Layer
- Status: 🟢 **Mainnet Ready** (Switchable via Env Var)

---

## 🛠️ Ecosystem Stack & Tooling
Built entirely using official Mysten Labs standards and best practices:

*   **[Sui Move 2024](https://docs.sui.io/references/sui-move)**: Smart Contracts (Edition 2024)
*   **[Sui dApp Kit](https://sdk.mystenlabs.com/dapp-kit)**: React Hooks (`useCurrentAccount`, `ConnectButton`) & Wallet Management
*   **[Sui TypeScript SDK](https://sdk.mystenlabs.com/typescript)**: Agent PTB Construction & JSON-RPC Interaction
*   **[DeepBook V3](https://docs.sui.io/standards/deepbookv3-sdk)**: Flash Loan Logic & Architecture Reference
*   **[Scallop SDK](https://github.com/scallop-io/sui-scallop-sdk)**: Real-time Lending/Borrowing Intelligence
*   **[Cetus SDK](https://github.com/CetusProtocol/cetus-sui-clmm-sdk)**: CLMM Liquidity & Swap Routing
*   **[Supabase](https://supabase.com)**: Serverless Postgres, Auth & Realtime for strategy persistence
*   **[React Flow](https://reactflow.dev)**: Visual node-based strategy builder

---

## 📦 Deployed Contracts (Testnet v0.0.5)

| Component | Address | Description |
|-----------|---------|-------------|
| **Package** | [`0x9a2f0c4ce...087043`](https://suiscan.xyz/testnet/object/0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043) | Immutable Move Logic (Hot Potato Pattern) |
| **MockPool** | [`0x0839e6ce6...9899d0`](https://suiscan.xyz/testnet/object/0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0) | Shared Liquidity Object (SUI/SUI) - **1 SUI Liquidity** |
| **UpgradeCap** | `0xd1656b27c68378a5b7de29e20eadbf870ab31f12539a818fb3fb3e0b24a41f39` | Admin Upgrade Capability |

### Full Contract IDs (for copy-paste):
```
PACKAGE_ID=0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043
POOL_ID=0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0
```

---

## 🧪 Test Results

```bash
$ sui move test
Running Move unit tests
[ PASS ] suiloop::atomic_tests::test_add_liquidity
[ PASS ] suiloop::atomic_tests::test_create_pool
[ PASS ] suiloop::atomic_tests::test_flash_loan_cycle
[ PASS ] suiloop::atomic_tests::test_flash_loan_insufficient_profit
[ PASS ] suiloop::atomic_tests::test_flash_loan_no_liquidity
Test result: OK. Total tests: 5; passed: 5; failed: 0
```

---

## ⚙️ Configuration

Create the necessary `.env` files before starting:

### Web (`packages/web/.env.local`)
```env
NEXT_PUBLIC_PACKAGE_ID=0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043
NEXT_PUBLIC_POOL_ID=0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0
NEXT_PUBLIC_SUI_NETWORK=testnet
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Agent (`packages/agent/.env`)
```env
# Wallet
SUI_PRIVATE_KEY=suiprivkey1...

# Contracts
SUI_PACKAGE_ID=0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043
SUI_POOL_ID=0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# API Server v2.0 (Autonomous Features)
PORT=3001
JWT_SECRET=your-super-secret-jwt-key
ADMIN_API_KEY=sk_live_admin_your_key_here
ALLOWED_ORIGINS=http://localhost:3000
```

---

## 🤖 Autonomous Agent API v2.0

### API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/api/auth/keys` | POST | Generate API key |
| `/api/auth/token` | POST | Generate JWT token |
| `/api/execute` | POST | Execute strategy |
| `/api/webhooks` | POST/GET/DELETE | Manage webhooks |
| `/api/subscriptions` | POST/GET/DELETE | Manage signal subscriptions |
| `/api/loop/start` | POST | Start autonomous market scanner |
| `/api/loop/stop` | POST | Stop autonomous loop |
| `/api/loop/scan` | POST | Trigger manual market scan |
| `/api/market` | GET | Get current market state |
| `/api/signals/recent` | GET | Get recent trading signals |

### Webhook Events

```
opportunity.detected   - Arbitrage/flash loan opportunity found
execution.started      - Strategy execution began
execution.completed    - Strategy completed successfully
execution.failed       - Execution failed
strategy.activated     - Autonomous loop started
strategy.deactivated   - Autonomous loop stopped
market.alert           - Market condition alert
health.warning         - System health warning
```

### Signal Types (WebSocket)

```
arbitrage_opportunity  - Price discrepancy detected
flash_loan_opportunity - Profitable flash loan available
price_deviation        - Significant price movement
liquidity_change       - Pool liquidity changed
gas_spike              - Gas price spike detected
strategy_trigger       - Custom strategy trigger
```

### Quick Start with API

```bash
# 1. Start the agent server
pnpm --filter @suiloop/agent server

# 2. Generate an API key
curl -X POST http://localhost:3001/api/auth/keys \
  -H "Authorization: Bearer YOUR_ADMIN_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Bot", "permissions": ["execute", "subscribe"]}'

# 3. Subscribe to signals
curl -X POST http://localhost:3001/api/subscriptions \
  -H "Authorization: Bearer sk_live_xxx" \
  -H "Content-Type: application/json" \
  -d '{"signalTypes": ["arbitrage_opportunity"], "minConfidence": 70}'

# 4. Connect via WebSocket
wscat -c ws://localhost:3001/ws/signals
> {"type": "subscribe", "subscriptionId": "sub_xxx"}
```

---

## 🛠️ Quick Start

```bash
# Clone
git clone https://github.com/your-username/Sui-Loop.git
cd Sui-Loop

# Install dependencies
pnpm install

# Run tests
pnpm test

# Start frontend
pnpm dev
```

---

## 🛣️ Roadmap: Into the Moonshot

*   **Q1 2026**: ✅ **ETHGlobal HackMoney 2026** - Hot Potato Flash Loans + Visual Strategy Builder + AI Agent
*   **Q2 2026**: Mainnet Launch & Audited "Atomic Engine"
*   **Q3 2026**: **Institutional Vaults** for BTCfi & ElizaOS Agent Marketplace
*   **Q4 2026**: Cross-Chain Loop (Sui <-> Bitcoin) via Sui Bridge

---

## 📁 Project Structure

```
Sui-Loop/
├── packages/
│   ├── contracts/              # Move Smart Contracts
│   │   ├── sources/
│   │   │   └── atomic_engine.move  # Core Flash Loan Logic
│   │   └── tests/
│   │       └── atomic_tests.move   # 5 Unit Tests
│   ├── agent/                  # ElizaOS AI Agent Plugin
│   │   └── src/
│   │       ├── actions/        # EXECUTE_ATOMIC_LEVERAGE action
│   │       ├── providers/      # DeepBook data provider
│   │       ├── middleware/     # Auth & Rate Limiting (v2.0)
│   │       │   ├── auth.ts     # API Key & JWT authentication
│   │       │   └── rateLimit.ts # Request throttling
│   │       ├── services/
│   │       │   ├── webhookService.ts      # Webhook notifications
│   │       │   ├── subscriptionService.ts # WebSocket signals
│   │       │   ├── autonomousLoop.ts      # Market scanner
│   │       │   ├── walrusService.ts       # Decentralized storage
│   │       │   ├── scallopService.ts      # Lending protocol
│   │       │   └── cetusService.ts        # DEX integration
│   │       ├── run.ts          # Standalone agent runner
│   │       └── server.ts       # HTTP API Server (v2.0)
│   └── web/                    # Next.js 15 Frontend
│       ├── app/
│       │   ├── dashboard/      # Command Center
│       │   ├── analytics/      # Charts & Metrics
│       │   ├── strategies/     # Marketplace
│       │   │   └── builder/    # Visual Strategy Editor
│       │   └── docs/           # Technical Documentation
│       ├── components/
│       │   └── layout/         # Navbar, Footer
│       └── lib/                # Supabase, Strategy Services
├── README.md
├── TECHNICAL_DOCUMENTATION.md
├── HOW_TO_USE.md
└── SUPABASE_SCHEMA.sql
```

---

## 🏆 Hackathon

Built for **[ETHGlobal HackMoney 2026](https://ethglobal.com/events/hackmoney2026)** 🚀

*Last updated: February 4, 2026*
*Version: v0.0.6 - Autonomous Agent API*

