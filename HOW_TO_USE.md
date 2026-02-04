# How to Use SuiLoop

This guide covers **two usage paths**:
1. **🧑 Human Users** - Interact via the web dashboard
2. **🤖 External Agents** - Connect via the Autonomous API

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Installation](#2-installation)
3. [Running the Application](#3-running-the-application)
4. [🧑 Human User Flow](#4--human-user-flow)
5. [🤖 External Agent Flow](#5--external-agent-flow)
6. [Troubleshooting](#6-troubleshooting)
7. [Reference](#7-reference)

---

## 1. Prerequisites

### A. Wallet Setup (For Humans)
1.  **Install Sui Wallet** (Browser Extension) or compatible wallet (Suiet, Ethos, etc.)
2.  **Switch to Testnet**: Wallet → Settings → Network → **Sui Testnet**
3.  **Fund Your Wallet**: Use the **[Sui Faucet](https://faucet.sui.io/)** for free testnet tokens

### B. Software Requirements
*   Node.js (v18 or later)
*   pnpm (recommended) or npm
*   Git

---

## 2. Installation

```bash
# Clone the repository
git clone https://github.com/Eras256/Sui-Loop.git
cd Sui-Loop

# Install dependencies
pnpm install

# Configure environment
cp packages/web/.env.example packages/web/.env.local
cp packages/agent/.env.example packages/agent/.env
# Edit both files with your credentials
```

---

## 3. Running the Application

### Web Dashboard (For Humans)
```bash
pnpm dev
# Open http://localhost:3000
```

### Agent API Server (For External Agents)
```bash
pnpm --filter @suiloop/agent server
# HTTP API: http://localhost:3001
# WebSocket: ws://localhost:3001/ws/signals
```

---

## 4. 🧑 Human User Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         HUMAN USER JOURNEY                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   [1] CONNECT WALLET                                                    │
│        ↓                                                                │
│   [2] BROWSE MARKETPLACE  ─or─  [2b] OPEN BUILDER                       │
│        ↓                              ↓                                 │
│   [3] SELECT STRATEGY           [3b] CREATE CUSTOM FLOW                 │
│        ↓                              ↓                                 │
│   [4] CLICK "DEPLOY"            [4b] CLICK "DEPLOY AGENT"               │
│        ↓                              ↓                                 │
│   [5] SIGN WALLET TRANSACTION ←──────┘                                  │
│        ↓                                                                │
│   [6] VIEW IN DASHBOARD (Active Fleet)                                  │
│        ↓                                                                │
│   [7] MONITOR EXECUTION LOG                                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Connect Wallet
1. Click **"Connect Wallet"** button in the Navbar
2. Select your wallet (Sui Wallet, Suiet, etc.)
3. Approve the connection
4. ✅ Your wallet auto-reconnects on future visits

### Step 2: Choose Your Path

#### Option A: Strategy Marketplace (`/strategies`)
Browse pre-built strategies ready to deploy:

| Strategy | Description | Risk | APY |
|----------|-------------|------|-----|
| SUI/USDC Kinetic Loop | Flash loan leverage on stable pairs | Medium | 12-25% |
| LST Peg Restoration | Liquid staking arbitrage | Low | 8-15% |
| Meme Volatility Sniper | Capture memecoin spikes | High | 50%+ |
| Smart DCA Accumulator | AI-timed dollar-cost averaging | Low | 5-10% |

#### Option B: Visual Builder (`/strategies/builder`)
Create custom strategies with drag-and-drop:

1. **Drag Triggers** from sidebar (Price, Time, Gas, Balance)
2. **Connect Nodes** to build your flow
3. **Name Your Strategy** in the top bar
4. **Save Draft** or **Deploy Agent**

### Step 3: Deploy Strategy
1. Click **"Deploy"** on a strategy card (Marketplace) or **Play button** (Builder)
2. Review the confirmation modal
3. Click **"Confirm Deploy"**
4. **Sign the wallet transaction**
5. Wait for confirmation toast

### Step 4: Monitor in Dashboard (`/dashboard`)
- **Active Fleet**: See all running strategies
- **Net Worth**: Real-time portfolio value
- **Execution Log**: Live transaction feed with Suiscan links
- **Controls**: Pause, resume, or stop strategies

---

## 5. 🤖 External Agent Flow

External trading bots can connect to SuiLoop's institutional-grade API.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL AGENT JOURNEY                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   [1] OBTAIN API KEY (POST /api/auth/keys)                              │
│        ↓                                                                │
│   [2] REGISTER WEBHOOK (optional)                                       │
│        ↓                                                                │
│   [3] CREATE SUBSCRIPTION (POST /api/subscriptions)                     │
│        ↓                                                                │
│   [4] CONNECT WEBSOCKET (ws://host/ws/signals)                          │
│        ↓                                                                │
│   [5] RECEIVE SIGNALS (arbitrage, flash_loan, etc.)                     │
│        ↓                                                                │
│   [6] EXECUTE STRATEGY (POST /api/execute)                              │
│        ↓                                                                │
│   [7] RECEIVE WEBHOOK CONFIRMATION                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Step 1: Get API Key

```bash
# Using admin key to generate a new API key
curl -X POST http://localhost:3001/api/auth/keys \
  -H "Authorization: Bearer YOUR_ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"name": "My Trading Bot", "permissions": ["execute", "subscribe"]}'

# Response:
{
  "success": true,
  "apiKey": "sk_live_abc123...",  # Save this! Only shown once
  "warning": "Save this API key - it won't be shown again!"
}
```

### Step 2: Register Webhook (Optional)

```bash
curl -X POST http://localhost:3001/api/webhooks \
  -H "Authorization: Bearer sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://mybot.com/webhook",
    "events": ["opportunity.detected", "execution.completed"]
  }'

# Response:
{
  "success": true,
  "webhookId": "wh_xyz789",
  "secret": "whsec_..."  # For signature verification
}
```

### Step 3: Subscribe to Signals

```bash
curl -X POST http://localhost:3001/api/subscriptions \
  -H "Authorization: Bearer sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "signalTypes": ["arbitrage_opportunity", "flash_loan_opportunity"],
    "minConfidence": 70,
    "minProfitPercentage": 0.5
  }'

# Response:
{
  "success": true,
  "subscription": {
    "id": "sub_def456",
    "signalTypes": ["arbitrage_opportunity", "flash_loan_opportunity"]
  },
  "websocketUrl": "/ws/signals"
}
```

### Step 4: Connect WebSocket

```javascript
// Node.js example
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001/ws/signals');

ws.on('open', () => {
  // Subscribe using your subscription ID
  ws.send(JSON.stringify({
    type: 'subscribe',
    subscriptionId: 'sub_def456'
  }));
});

ws.on('message', (data) => {
  const message = JSON.parse(data);
  
  if (message.type === 'signal') {
    console.log('🚨 Signal received:', message.signal);
    // Analyze and decide to execute
  }
});
```

### Step 5: Receive Signals

Signals arrive in real-time:

```json
{
  "type": "signal",
  "signal": {
    "id": "sig_abc123",
    "type": "arbitrage_opportunity",
    "pair": "SUI/USDC",
    "data": {
      "profitPercentage": 1.2,
      "confidence": 85,
      "urgency": "high",
      "details": {
        "buyPrice": 2.45,
        "sellPrice": 2.48,
        "source": "DeepBook",
        "destination": "Cetus"
      }
    }
  }
}
```

### Step 6: Execute Strategy

```bash
curl -X POST http://localhost:3001/api/execute \
  -H "Authorization: Bearer sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "strategy": "atomic_arb",
    "params": {
      "amount": "0.5 SUI",
      "pair": "SUI/USDC"
    }
  }'

# Response:
{
  "success": true,
  "result": { "digest": "5X6TDFkY..." },
  "logs": ["Executing atomic leverage...", "Transaction successful"]
}
```

### Step 7: Start Autonomous Loop (Optional)

For fully autonomous operation:

```bash
# Start the market scanner
curl -X POST http://localhost:3001/api/loop/start \
  -H "Authorization: Bearer sk_live_abc123" \
  -H "Content-Type: application/json" \
  -d '{
    "config": {
      "minProfitPercentage": 0.3,
      "maxGasPrice": 3000,
      "minConfidence": 60
    }
  }'

# The loop will:
# - Scan market every 10 seconds
# - Detect arbitrage opportunities
# - Emit signals to subscribers
# - Trigger webhooks
```

---

## 6. Troubleshooting

### For Humans 🧑

| Issue | Solution |
|-------|----------|
| "Insufficient Balance" | Get testnet SUI from [faucet.sui.io](https://faucet.sui.io/) |
| "Wallet Not Connecting" | Refresh page, ensure Testnet is selected |
| "Strategy Failed" | Hot Potato protected you - trade wasn't profitable |
| "Duplicate Strategies" | Clear LocalStorage: `sui-loop-fleet-*` |

### For Agents 🤖

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check API key format: `sk_live_xxx` |
| 429 Too Many Requests | Rate limited - wait or upgrade limits |
| WebSocket Disconnected | Reconnect and re-subscribe |
| Webhook Not Received | Check URL, verify HMAC signature |

---

## 7. Reference

### API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/health` | GET | ❌ | Health check |
| `/api/info` | GET | ❌ | Server info |
| `/api/auth/keys` | POST | ✅ | Generate API key |
| `/api/auth/token` | POST | ❌ | Generate JWT |
| `/api/execute` | POST | ✅ | Execute strategy |
| `/api/webhooks` | POST/GET/DELETE | ✅ | Manage webhooks |
| `/api/subscriptions` | POST/GET/DELETE | ✅ | Manage subscriptions |
| `/api/loop/start` | POST | ✅ | Start autonomous loop |
| `/api/loop/stop` | POST | ✅ | Stop autonomous loop |
| `/api/loop/scan` | POST | ✅ | Manual market scan |
| `/api/market` | GET | ✅ | Current market state |
| `/api/signals/recent` | GET | ✅ | Recent signals |

### Signal Types

| Signal | Description |
|--------|-------------|
| `arbitrage_opportunity` | Price discrepancy between DEXs |
| `flash_loan_opportunity` | Profitable flash loan detected |
| `price_deviation` | Significant price movement |
| `liquidity_change` | Pool depth changed |
| `gas_spike` | High gas prices |
| `strategy_trigger` | Custom strategy triggered |

### Webhook Events

| Event | Description |
|-------|-------------|
| `opportunity.detected` | Trading opportunity found |
| `execution.started` | Strategy execution began |
| `execution.completed` | Execution successful |
| `execution.failed` | Execution failed |
| `strategy.activated` | Loop started |
| `strategy.deactivated` | Loop stopped |
| `market.alert` | Market condition alert |
| `health.warning` | System warning |

### Contract Addresses (Testnet)

| Component | Address |
|-----------|---------|
| **Package** | `0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043` |
| **MockPool** | `0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0` |

---

## 🏆 Hackathon

Built for **[ETHGlobal HackMoney 2026](https://ethglobal.com/events/hackmoney2026)** 🚀

*Last updated: February 4, 2026*
*Version: v0.0.6 - Autonomous Agent API*
