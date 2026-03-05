# SuiLoop Protocol — Technical Documentation v1.0

> **Package ID**: `0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0`  
> **Registry**: `0xcbb6d114644b9573c76c1eee3f94ad4b8874273e7691f5c46d24add925b47e30`  
> **Network**: Sui Testnet  
> **Agent API**: `http://localhost:3001`  
> **WebSocket**: `ws://localhost:3001/ws/signals`  

---

## Table of Contents

1. [Protocol Overview](#1-protocol-overview)
2. [Smart Contract Layer](#2-smart-contract-layer)
3. [Neural Swarm Orchestrator](#3-neural-swarm-orchestrator)
4. [Autonomous Loop & Circuit Breaker](#4-autonomous-loop--circuit-breaker)
5. [Agent Backend Services](#5-agent-backend-services)
6. [Skill Plugin System](#6-skill-plugin-system)
7. [WebSocket Signal Feed](#7-websocket-signal-feed)
8. [Webhook System](#8-webhook-system)
9. [Authentication & Authorization](#9-authentication--authorization)
10. [Decentralized Audit (Walrus)](#10-decentralized-audit-walrus)
11. [Frontend Architecture](#11-frontend-architecture)
12. [Supabase Schema](#12-supabase-schema)
13. [Environment Variables](#13-environment-variables)
14. [API Reference](#14-api-reference)

---

## 1. Protocol Overview

SuiLoop is a full-stack autonomous DeFi protocol built natively for Sui. The system operates across four tightly integrated layers:

```
┌─────────────────────────────────────────────────────────────────┐
│ LAYER 0 │ Sui Blockchain — Move Smart Contracts (Atomic Engine) │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 1 │ Neural Swarm Daemon — 20 Autonomous Agent Keypairs    │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 2 │ Agent API Server — Express + WebSocket + LLM          │
├─────────────────────────────────────────────────────────────────┤
│ LAYER 3 │ Command Center — Next.js 15 + Supabase + Walrus       │
└─────────────────────────────────────────────────────────────────┘
```

**Core Invariants:**
- All flash loans are atomically enforced at the Move bytecode level via Hot Potato pattern
- No agent can withdraw user funds — only execute whitelisted functions
- All executions are archived to Sui Walrus every 5 minutes
- The Circuit Breaker auto-pauses on 5 consecutive failures

---

## 2. Smart Contract Layer

### 2.1 `atomic_engine.move`

The flash loan core. Implements the **Hot Potato** pattern — `LoopReceipt` has no `drop` ability, making unpaid debt physically impossible.

#### Structs

```move
/// MockPool for testnet demonstration
public struct MockPool<phantom Base, phantom Quote> has key {
    id: UID,
    base_reserve: Balance<Base>,
    quote_reserve: Balance<Quote>,
    fee_bps: u64,       // 30 basis points = 0.30%
}

/// Hot Potato — cannot be dropped, stored, or transferred.
/// MUST be consumed by repay_flash_loan in the same PTB.
public struct LoopReceipt {
    pool_id: ID,
    amount_borrowed: u64,
    fee_due: u64,
}
```

#### Public Functions

| Function | Parameters | Returns | Description |
|---|---|---|---|
| `create_pool` | `fee_bps, ctx` | `MockPool<B,Q>` | Initialize pool (owner only) |
| `deposit` | `pool, coin, ctx` | — | Add liquidity |
| `borrow_flash_loan` | `pool, amount, ctx` | `(Coin<B>, LoopReceipt)` | Borrow capital |
| `repay_flash_loan` | `pool, coin, receipt` | — | Repay + fee, destroy receipt |

#### Flash Loan Flow (PTB)
```
TX START
  ├── 1. borrow_flash_loan(pool, 50_000_000) → (coin, receipt)
  ├── 2. [Arbitrary strategy: swap, farm, arbitrage...]
  ├── 3. splitCoins(gas, [150_000]) → feeCoin     // 30bps
  ├── 4. mergeCoins(coin, [feeCoin])
  └── 5. repay_flash_loan(pool, coin, receipt)    // destroys hot potato
TX END — if step 5 missing → entire TX reverts
```

### 2.2 `agent_registry.move`

On-chain agent identity and signal publication.

```move
public struct AgentRegistry has key { id: UID, agents: Table<address, AgentMeta> }
public struct AgentCap has key { id: UID, agent: address }
public struct AgentMeta has store { name: String, registered_at: u64, signal_count: u64 }

public struct SignalPublished has copy, drop {
    agent: address,
    signal_data: vector<u8>,
    timestamp: u64,
}

public fun register_agent(registry, wallet_addr, name_bytes, ctx) -> AgentCap
public fun publish_signal(registry, agent_cap, signal_data, ctx)
```

`SignalPublished` events are queryable via `suiClient.queryEvents()` in real-time by the indexer.

### 2.3 `agent_vault.move`

Non-custodial vault model:
```move
public struct Vault<phantom Asset> has key {
    id: UID,
    balance: Balance<Asset>,
    owner: address,
    agent: address,     // can execute, cannot withdraw
}
```

### 2.4 `cetus_interface.move`

Interface module for Cetus DEX integration (swap routing for arbitrage strategies).

---

## 3. Neural Swarm Orchestrator

**File:** `packages/agent/scripts/suiloop_neural_swarm.ts`

### 3.1 Agent Roster

20 named agents mapped to dedicated Ed25519 keypairs stored as `.key` files in the project root. Each keypair is loaded at runtime:

```typescript
function loadKeypair(address: string): Ed25519Keypair | null {
    const raw = fs.readFileSync(`${PROJECT_ROOT}/${address}.key`, 'utf8').trim();
    const bytes = fromBase64(raw);
    // Sui .key format: 33 bytes (1-byte type prefix + 32-byte secret)
    const secret = bytes.length === 33 ? bytes.slice(1) : bytes;
    return Ed25519Keypair.fromSecretKey(secret);
}
```

### 3.2 Traffic Types

**Type A — Flash Loan (on-chain):**
```typescript
const tx = new Transaction();
const borrowAmount = 50_000_000n;   // 0.05 SUI
const feeAmount = 150_000n;          // 30 bps fee
const [borrowedCoin, receipt] = tx.moveCall({ target: `${PACKAGE_ID}::atomic_engine::borrow_flash_loan`, ... });
const [feeCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(feeAmount)]);
tx.mergeCoins(borrowedCoin, [feeCoin]);
tx.moveCall({ target: `${PACKAGE_ID}::atomic_engine::repay_flash_loan`, ... });
tx.setGasBudget(2_500_000);
```

**Type B — Signal Publication (on-chain):**
```typescript
const tx = new Transaction();
tx.moveCall({
    target: `${PACKAGE_ID}::agent_registry::publish_signal`,
    arguments: [registry, agentCap, tx.pure.vector('u8', signalBytes)]
});
tx.setGasBudget(1_500_000);
```

### 3.3 Tick Cycle

```
Every 8 seconds:
  ├── Select agents by traffic type
  ├── For flash_loan agents: buildFlashLoanTx() → submit
  ├── For signal agents: buildSignalTx() → submit  
  ├── Update ELO scores (win: +2, loss: -1)
  ├── Upsert stats to Supabase suiloop_agents
  └── Print leaderboard snapshot every 5 ticks
```

### 3.4 Fund Management

**File:** `packages/agent/scripts/fund_swarm.ts`

Distributes SUI from main wallet to all agents in a single PTB:
```typescript
const tx = new Transaction();
const amounts = agents.map(() => tx.pure.u64(AMOUNT_PER_AGENT)); // 0.05 SUI each
const coins = tx.splitCoins(tx.gas, amounts);
for (let i = 0; i < agents.length; i++) {
    tx.transferObjects([coins[i]], tx.pure.address(agents[i]));
}
tx.setGasBudget(50_000_000);
```

**Gas Budget per Agent:**
- Flash Loan: 2,500,000 MIST (~0.0025 SUI)
- Signal: 1,500,000 MIST (~0.0015 SUI)
- With 0.05 SUI balance: ~20 flash loans or ~33 signals per agent

---

## 4. Autonomous Loop & Circuit Breaker

**File:** `packages/agent/src/services/autonomousLoop.ts`

### 4.1 Market Data Sources

| Source | Data | Timeout |
|---|---|---|
| Pyth Network Hermes | SUI/USD price | 5s |
| Sui RPC `getReferenceGasPrice` | Gas price (MIST) | — |
| Sui RPC `getLatestSuiSystemState` | Total staked SUI (liquidity proxy) | — |
| Scallop Indexer API | Supply/Borrow APY | 4s |
| Navi (derived) | USDC APY | — |

### 4.2 Opportunity Detection

**Arbitrage:** Detects price discrepancy between CEX/DeepBook vs Cetus DEX.
```typescript
const priceDiscrepancy = (marketState.gasPrice % 50) / 10; // dynamic, gas-derived
if (priceDiscrepancy > config.minProfitPercentage) {
    // LLM validation → if confidence >= minConfidence → emitSignal('arbitrage_opportunity')
}
```

**Flash Loan:** Monitors Scallop (SUI) and Navi (USDC) spread.
```typescript
const suiSpread = scallopApy.borrow - scallopApy.supply;  // > 2% = opportunity
const usdcSpread = naviApy.borrow - naviApy.supply;       // > 2% = opportunity
```

**LLM Validation Layer:**
```typescript
const response = await llm.chat({
    messages: [
        { role: 'system', content: 'Reply strictly true/false. Is this trade safe?' },
        { role: 'user', content: `Spread: ${spread}%, Gas: ${gas}. Valid?` }
    ],
    maxTokens: 10
});
// true → confidence += 5
// false → confidence -= 20 to -30
```

### 4.3 Circuit Breaker

```typescript
const ERROR_THRESHOLD = 5;
let consecutiveErrors = 0;
let isPaused = false;

// In scan interval:
try {
    await scanMarket();
    consecutiveErrors = 0; // reset on success
} catch (error) {
    consecutiveErrors++;
    if (consecutiveErrors >= ERROR_THRESHOLD) {
        triggerCircuitBreaker(); // pause + webhook + emergency signal
    }
}

function triggerCircuitBreaker() {
    isPaused = true;
    triggerWebhooks('emergency.pause', { consecutiveErrors, threshold: ERROR_THRESHOLD });
    emitSignal('strategy_trigger', 'SYSTEM', {
        confidence: 100,
        details: { action: 'EMERGENCY_STOP', reason: 'consecutive_errors' }
    });
}
```

**API Controls:**
```
POST /api/loop/pause   → stopAutonomousLoop() + sets isPaused
POST /api/loop/resume  → resumeAutonomousLoop() + resets consecutiveErrors
GET  /api/loop/status  → { isRunning, isPaused, consecutiveErrors, config, marketState }
```

### 4.4 Deep Analysis (Cron — every 60s)

```typescript
cron.schedule('* * * * *', performDeepAnalysis);

// Calculates:
// - marketHealth (0-1): penalized by high gas, low liquidity, extreme price
// - riskLevel (0-1): sum of gas/liquidity/price risk factors
// - recommendations[]: actionable string array
// If riskLevel > 0.7 → emits 'price_deviation' signal + triggers webhook
```

---

## 5. Agent Backend Services

### 5.1 Service Inventory

| Service | File | Purpose |
|---|---|---|
| `autonomousLoop` | `autonomousLoop.ts` | Market scanner + Circuit Breaker |
| `loopHub` | `loopHub.ts` | Central strategy & marketplace (52KB) |
| `llmService` | `llmService.ts` | Multi-provider LLM (OpenAI, Ollama) |
| `skillManager` | `skillManager.ts` | Plugin sandbox + hot reload |
| `subscriptionService` | `subscriptionService.ts` | WebSocket server + Walrus archiver |
| `webhookService` | `webhookService.ts` | HMAC-SHA256 webhook delivery |
| `memoryService` | `memoryService.ts` | Agent memory + context persistence |
| `schedulerService` | `schedulerService.ts` | Cron job management |
| `agentRegistryService` | `agentRegistryService.ts` | On-chain signal publishing |
| `walrusService` | `walrusService.ts` | Walrus blob upload/download |
| `sessionService` | `sessionService.ts` | Conversation thread management |
| `queueService` | `queueService.ts` | Async task queue |
| `gatewayService` | `gatewayService.ts` | Doctor/health check subsystem |
| `systemAccess` | `systemAccess.ts` | OS-level system access |
| `browserService` | `browserService.ts` | Headless browser agents |
| `voiceService` | `voiceService.ts` | TTS/STT integration |

### 5.2 LLM Service

Supports multi-provider failover:
```typescript
providers = ['openai', 'ollama', 'anthropic'];
// Auto-selects based on OPENAI_API_KEY, OLLAMA_URL availability
// Used for: trade validation, signal generation, strategy recommendations
```

### 5.3 Memory Service

Persistent agent memory with vector-based context retrieval. Agents remember past executions, user preferences, and market patterns across sessions.

---

## 6. Skill Plugin System

**File:** `packages/agent/src/services/skillManager.ts`

Skills are sandboxed plugins loaded from `.suiloop/skills/` directories. Each skill requires a `SKILL.md` file with YAML frontmatter.

### Skill Structure
```
.suiloop/skills/
└── flash-loan-executor/
    ├── SKILL.md          # Metadata + instructions
    ├── index.ts          # Main execution logic
    └── package.json
```

### Live Skills

| Skill | Version | Key Capability |
|---|---|---|
| `flash-loan-executor` | 2.1.0 | Full PTB flash loan construction + execution |
| `price-oracle` | 1.5.0 | Multi-source price aggregation (Pyth + DEX) |
| `whale-tracker` | 1.2.0 | Large TX monitoring + alert dispatch |
| `knowledge-graph` | 1.0.0 | DeFi protocol knowledge base |
| `social-sentiment` | 1.0.0 | Market sentiment scoring |
| `telegram-alerts-pro` | 3.0.0 | Rich Telegram notification system |
| `web-scouter` | 1.0.0 | Protocol health + TVL scouting |

### Skill Execution API
```typescript
POST /api/execute
{
    "strategy": "flash-loan-executor",
    "asset": "SUI",
    "parameters": { "amount": 0.05 }
}
```

---

## 7. WebSocket Signal Feed

**Endpoint:** `ws://localhost:3001/ws/signals`

### Connection
```javascript
const ws = new WebSocket('ws://localhost:3001/ws/signals');

ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    // msg.type: 'welcome' | 'signal' | 'system_log' | 'pong' | 'error'
};
```

### Message Types

**Signal (from autonomousLoop / swarm):**
```json
{
    "type": "signal",
    "signal": {
        "id": "sig_abc123",
        "type": "flash_loan_opportunity",
        "pair": "SUI",
        "data": {
            "expectedProfit": 25,
            "profitPercentage": 2.5,
            "confidence": 78,
            "urgency": "high",
            "timeToLive": 60,
            "details": { "protocol": "Scallop", "spread": 2.5 }
        },
        "timestamp": "2026-03-05T22:00:00Z"
    }
}
```

**System Log:**
```json
{
    "type": "system_log",
    "log": {
        "id": "log_xyz",
        "level": "info",
        "message": "Flash loan executed: TX 3hjrt9mx...",
        "strategy_id": "flash-loan-executor",
        "asset": "SUI",
        "timestamp": "2026-03-05T22:00:00Z"
    }
}
```

### Signal Types
| Type | Description |
|---|---|
| `arbitrage_opportunity` | Price spread detected across pools |
| `flash_loan_opportunity` | Profitable borrow/repay spread |
| `liquidity_change` | Significant liquidity event |
| `gas_spike` | Gas price exceeds threshold |
| `price_deviation` | Market risk level > 70% |
| `strategy_trigger` | Circuit breaker or system event |

---

## 8. Webhook System

**File:** `packages/agent/src/services/webhookService.ts`

### Registration
```bash
POST /api/webhooks
Authorization: Bearer <api_key>
{
    "url": "https://your-endpoint.com/webhook",
    "events": ["opportunity.detected", "emergency.pause", "execution.completed"]
}
# Returns: { "id": "wh_xxx", "secret": "whsec_xxx" }
```

### Payload Verification
```typescript
// Verify HMAC-SHA256 signature
const sig = createHmac('sha256', webhookSecret)
    .update(JSON.stringify(payload))
    .digest('hex');
// Compare with X-Webhook-Signature header
```

### Event Types
| Event | Trigger |
|---|---|
| `opportunity.detected` | New trading signal |
| `execution.started` | Strategy execution begin |
| `execution.completed` | Successful execution |
| `execution.failed` | Execution error |
| `strategy.activated` | Loop started |
| `strategy.deactivated` | Loop stopped |
| `market.alert` | Risk level > 70% |
| `health.warning` | Scan error |
| `emergency.pause` | Circuit Breaker triggered |

### Retry Policy
- **Max retries:** 3
- **Delays:** 1s → 5s → 30s
- **Auto-disable:** After 10 cumulative failures

---

## 9. Authentication & Authorization

### API Key Auth
```bash
# Generate key
POST /api/auth/keys
# Returns: { "key": "sk_live_xxx", "permissions": ["read", "execute"] }

# Use key
GET /api/market
X-API-Key: sk_live_xxx
```

### JWT Auth
```bash
POST /api/auth/login
{ "apiKey": "sk_live_xxx" }
# Returns: { "token": "eyJ...", "expiresIn": "24h" }

# Use token
Authorization: Bearer eyJ...
```

### Permissions
| Permission | Access |
|---|---|
| `read` | Market data, status endpoints |
| `execute` | Strategy execution, loop control |
| `admin` | Key management, webhook registration |

### Rate Limiting
- **Default:** 60 requests/minute per API key
- **WebSocket:** No rate limit (push-based)

---

## 10. Decentralized Audit (Walrus)

**File:** `packages/agent/src/services/subscriptionService.ts` + `walrusService.ts`

### Upload Process (every 5 minutes)
```typescript
const payload = JSON.stringify({
    timestamp: new Date().toISOString(),
    count: logs.length,
    logs: systemLogs  // up to 50 recent entries
});

// Walrus Publisher API
PUT https://publisher.walrus-testnet.walrus.space/v1/blobs?epochs=5
Content-Type: application/json
```

### Response
```json
{
    "newlyCreated": {
        "blobObject": {
            "blobId": "abc123...",
            "size": 4096
        }
    }
}
```

### Verify an Archive
```
https://walruscan.com/testnet/blob/<blobId>
```

---

## 11. Frontend Architecture

**Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS, Framer Motion, Three.js, ReactFlow, Supabase JS

### Key Components
```
packages/web/
├── app/
│   ├── page.tsx              # Landing
│   ├── dashboard/page.tsx    # Main control center
│   ├── leaderboard/page.tsx  # 20-agent ELO leaderboard
│   ├── strategies/builder/   # ReactFlow visual builder
│   ├── marketplace/          # Signal marketplace
│   ├── agents/               # Fleet monitor
│   ├── plugins/              # Skill discovery
│   └── docs/                 # Protocol docs
├── components/
│   ├── layout/Navbar.tsx
│   ├── layout/Footer.tsx
│   └── ui/                   # Shared components
└── lib/
    ├── supabase.ts           # Supabase client (browser)
    └── i18n/                 # EN/ES/ZH translations
```

### Leaderboard Data Flow
```
Supabase suiloop_agents table
    → postgres_changes realtime subscription
    → AGENT_ROSTER_MANIFEST lookup (normalizeAddress)
    → AgentProfile[] sorted by ELO
    → Podium (Top 3) + Table (Rest)
    → Neural Feed ticker (lastSignal)
```

### Wallet Integration
```typescript
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
// Error handling for CN:-4005 (user rejection)
// Guest mode: full read-only without wallet
```

---

## 12. Supabase Schema

### `suiloop_agents`
```sql
CREATE TABLE suiloop_agents (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_address  TEXT UNIQUE NOT NULL,
    agent_name      TEXT,
    agent_role      TEXT,
    agent_specialty TEXT,
    elo             INTEGER DEFAULT 1000,
    total_txs       INTEGER DEFAULT 0,
    flash_loan_txs  INTEGER DEFAULT 0,
    signal_txs      INTEGER DEFAULT 0,
    win_rate        DECIMAL(5,2) DEFAULT 0,
    volume_usd      DECIMAL(18,4) DEFAULT 0,
    last_tx_hash    TEXT,
    last_signal     TEXT,
    last_activity   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### `agent_logs`
```sql
CREATE TABLE agent_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level       TEXT,           -- 'info'|'warn'|'error'|'success'|'system'
    message     TEXT,
    details     JSONB,
    strategy_id TEXT,
    asset       TEXT,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 13. Environment Variables

**File:** `packages/agent/.env`

```bash
# Sui
SUI_PRIVATE_KEY=suiprivkey1q...        # Main wallet private key
SUI_NETWORK=testnet
NEXT_PUBLIC_PACKAGE_ID=0x9451...       # Atomic Engine package
SUI_REGISTRY_ID=0xcbb6...             # Agent Registry object
SUI_POOL_ID=0x888e...                  # MockPool object

# AI
OPENAI_API_KEY=sk-...                  # GPT-4o-mini
OPENAI_MODEL=gpt-4o-mini              # Model selection

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...           # Service role key (server-side)
NEXT_PUBLIC_SUPABASE_URL=...          # Client-side
NEXT_PUBLIC_SUPABASE_ANON_KEY=...    # Anon key

# Notifications (optional)
TELEGRAM_BOT_TOKEN=...
DISCORD_WEBHOOK_URL=...

# Security
JWT_SECRET=...                         # API JWT signing secret
ROOT_API_KEY=sk_live_...              # Default root API key
```

---

## 14. API Reference

### Health
```
GET /health
→ { status: 'ok', uptime: 3600, version: '1.0.0' }
```

### Market State
```
GET /api/market
→ {
    suiPrice: 3.52,
    gasPrice: 1000,
    deepBookLiquidity: 1250000,
    scallopApy: { supply: 5.3, borrow: 7.5 },
    naviUsdcApy: { supply: 6.1, borrow: 9.0 },
    lastUpdate: "2026-03-05T22:00:00Z"
}
```

### Autonomous Loop
```
POST /api/loop/start    { scanInterval: 30000, minConfidence: 70 }
POST /api/loop/stop
POST /api/loop/pause    (Circuit Breaker manual trigger)
POST /api/loop/resume   (Reset consecutiveErrors, resume scanning)
GET  /api/loop/status   { isRunning, isPaused, consecutiveErrors, config, marketState, uptime }
```

### Strategy Execution
```
POST /api/execute
Auth: X-API-Key or Bearer token
{
    "strategy": "flash-loan-executor",
    "asset": "SUI",
    "parameters": { "amount": 0.05 }
}
→ { success: true, txHash: "3hjrt9...", profit: 0.00015 }
```

### Neural Swarm Status
```
GET /api/agents
→ Array of { address, name, role, elo, trades, volumeUsd, lastTx }
```

### Webhook Management
```
POST   /api/webhooks              Register webhook
GET    /api/webhooks              List user webhooks
DELETE /api/webhooks/:id          Unregister webhook
POST   /api/webhooks/:id/test     Send test payload
POST   /api/webhooks/:id/activate Re-enable disabled webhook
```

---

*Last updated: 2026-03-05 | SuiLoop Protocol v1.0.0*
