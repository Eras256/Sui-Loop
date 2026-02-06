
# 🏗️ SuiLoop Technical Documentation

**Version:** 2.0.5
**Last Updated:** February 2026

## 1. System Architecture

SuiLoop operates as a **Monorepo** managed by `pnpm`, split into three primary decoupled packages:

### A. The Neural Matrix (Backend Agent) - `@suiloop/agent`
Running on **Express** and **Node.js**, this is the brain of the operation.
- **Port:** 3001
- **Key Services:**
    - `SkillManager`: Handles the dynamic loading, validation, and registration of agent capabilities (`skills`). It ensures `SKILL.md` manifests are valid.
    - `LoopHub`: Connects to the remote marketplace registry to fetch skill metadata and source code.
    - `SubscriptionService`: Manages WebSocket connections (`/ws/signals`) and broadcasts system logs (`broadcastLog`) and trading signals.
    - `MemoryService`: Short-term and long-term memory for agent context.

### 4. Autonomous & Multimodal Core
SuiLoop v2.1 introduces full autonomy capabilities, moving beyond simple reactive execution.

#### A. Session Manager (Context Isolation)
The agent supports persistent conversational threads (`/api/sessions`), allowing for:
- **Multi-tasking**: Users can maintain separate contexts for "Arbitrage Strategy" and "Portfolio Review".
- **Pruning**: Automated cleanup of stale sessions to preserve LLM context window efficiency.

#### B. Resilient Job Queue
To ensure reliability in 24/7 operations, all heavy tasks (scans, executions) are routed through an in-memory Queue Service:
- **Concurrency Control**: Limits simultaneous executions to prevent rate-limiting.
- **Exponential Backoff**: Automated retries for failed API calls or network glitches.

#### C. Scheduler Service (Cron Automation)
- **Persistence**: Jobs are serialized to `.suiloop/data/jobs.json`, surviving agent restarts.
- **Precision**: Uses `node-cron` for exact timing.
- **Integration**: Directly invokes `SkillManager` to execute strategies without HTTP overhead.

#### D. Voice Service (Multimodal Interface)
- **STT (Speech-to-Text)**: Processes OGG/WEBM audio via OpenAI Whisper.
- **TTS (Text-to-Speech)**: Synthesizes agent responses using the `alloy` voice model.

#### E. AI Core 2.0 (Multi-Model Intelligence)
The updated `LLMService` provides enterprise-grade reliability:
- **AWS Bedrock Support**: Native integration with Amazon Bedrock for accessing Claude 3 and Titan models securely.
- **Automatic Failover**: If the primary provider (e.g., OpenAI) times out or errors, the request is instantly routed to a fallback provider (e.g., Anthropic or Bedrock).
- **Synthetic Mode**: A zero-cost mock provider for unit testing and CI pipelines.

### 5. Resilience & Initialization (v2.1)

#### A. Gateway Doctor
The system acts as its own immune system via `GatewayService`.
- **Vitals**: Monitors CPU/RAM in real-time.
- **Pulse**: Pings Sui RPC to measure latency and verify block height.
- **Lock**: Prevents operation if Gas < 0.1 SUI or LLM API is down.
- **Endpoints**: `/api/health` (Heartbeat) and `/api/doctor` (Deep Diagnostics).

#### B. Awakening Protocol (Onboarding)
Zero-friction setup logic implemented in `server.ts`:
1.  **Detection**: Server boots and checks for `.env` credentials.
2.  **Interception**: If missing, standard routes are blocked.
3.  **Wizard**: Launches a React/HTML interface on port 3001.
4.  **Injection**: User credentials are securely written to file system.
5.  **Reboot**: System auto-restarts into full operational mode.

### 6. Deployment & Security
The system is designed for secure, institutional environments:
- **Environment Isolation**: The agent runs in a distinct runtime from the frontend.
- **Private Key Management**: Keys are stored in `.env` and never exposed to the client or logs.
- **Simulated Enclave**: All high-consequence actions are signed and logged to an immutable local ledger (`sui-audit.json`).

### B. The Command Center (Frontend) - `suiloop-web`
Built with **Next.js 15 (App Router)** and **React 19**.
- **Port:** 3000
- **Proxy Configuration:**
    Uses `next.config.js` rewrites to query the backend seamlessly:
    ```javascript
    async rewrites() {
        return [{ source: '/api/:path*', destination: 'http://localhost:3001/api/:path*' }];
    }
    ```
- **Live Terminal:** Implements a WebSocket client in `ActiveAgents` page to consume the `system_log` stream.

### C. The Execution Layer (Contracts) - `@suiloop/contracts`
**Production Ready (Testnet)** - Sui Move modules ensuring atomic safety.
**Formally Verified**: The `atomic_engine` module includes **Move Prover** specifications (`spec`) that mathematically guarantee:
1.  **Solvency**: A loan cannot even be initiated if the pool lacks liquidity.
2.  **Repayment Invariant**: The transaction *must* fail if the pool balance does not increase by at least the principal + fee.


#### 1. The Hot Potato Pattern (`LoopReceipt`)
We leverage Sui Move's linear type system regarding abilities. The `LoopReceipt` struct has NO abilities (specifically lacking `drop`), meaning it cannot be discarded, ignored, or transferred. It *must* be consumed by the specific `repay` function that burns it.

```move
// atomic_engine.move
public struct LoopReceipt {
    flash_loan_amount: u64,
    pool_id: ID
}

public fun borrow_flash_loan<T>(...): (Coin<T>, LoopReceipt) {
    // ... logic to lend coin ...
    let receipt = LoopReceipt { flash_loan_amount: amount, pool_id: object::id(pool) };
    (loan_coin, receipt) // The user is stuck with this receipt!
}

public fun repay_flash_loan<T>(..., receipt: LoopReceipt) {
    let LoopReceipt { flash_loan_amount, pool_id } = receipt; // Receipt is unpacked and destroyed here
    // ... logic to verify repayment ...
}
```

#### 2. Programmable Transaction Blocks (PTBs)
The Agent constructs extensive PTBs to chain multiple actions into a single atomic transaction.

**Execution Flow (`/api/execute-demo`):**
1.  `SplitCoins`: Creates a coin object for gas/fees.
2.  `MoveCall (atomic_engine::execute_loop)`:
    *   **Input**: `MockPool` Object, `Coin` Object.
    *   **Arguments**: `borrow_amount` (1 SUI), `min_profit` (0).
3.  **On-Chain Logic**:
    *   Contract borrows 1 SUI.
    *   Contract "executes strategy" (simulated merge).
    *   Contract calculates repayment (Amount + Fee).
    *   Contract repays `MockPool`.
    *   Contract emits `LoopExecuted` event.
4.  `TransferObjects`: Any profit is sent to the Agent's wallet.

### D. Native Desktop Layer - `@suiloop/desktop`
Built with **Tauri v2** and **Rust**, enabling:
- **System Tray**: Background persistence for the agent.
- **Performance**: Native webview rendering with minimal RAM footprint (vs Electron).
- **Cross-Platform**: Builds for Windows (`.msi`), macOS (`.dmg`), and Linux (`.deb`).

### E. CLI Management Tool - `@suiloop/cli`
A standalone command-line interface for system administration:
- **Commands**: `suiloop health`, `suiloop doctor`, `suiloop create`.
- **Integration**: Communicates directly with the running Agent API over HTTP.

### F. Forensic Audit Module (Walrus Integrated)
Institutional clients require not just local logs, but immutable proof of agent behavior.

- **Decentralized Storage**: The `SubscriptionService` automatically packages system logs every 5 minutes.
- **Walrus Protocol**: These log packages are uploaded as blobs to the **Sui Walrus** network (Testnet Publisher).
- **Immutable Evidence**: The returned `Blob ID` serves as a permanent, tamper-proof record of the agent's internal state and decision logic at that timestamp.


---

## 2. Core Workflows

### 📦 Marketplace Skill Installation
This process allows users to extend agent capabilities dynamically.

1.  **User Trigger**: "Install" on `http://localhost:3000/marketplace`.
2.  **LoopHub Download**: Backend fetches the skill package (simulated download).
3.  **Hot-Swapping**: The `SkillManager` injects the code into the runtime environment without restarting the Node process.
4.  **Registration**: The new skill (e.g., `Flash Loan Executor`) registers its capabilities in the central `skillRegistry` map.

### 📡 Real-Time Telemetry System
To provide observability, we implemented a custom low-latency logging pipeline via WebSockets.

1.  **Emission**: `broadcastLog(level, message)`.
2.  **Broadcasting**: JSON-serialized payloads sent to `/ws/signals`.
3.  **Frontend Ingestion**: The `ActiveAgents` component maintains a rolling buffer of logs, rendering them with syntax highlighting in the "Live Neural Feed".

---

## 3. API Reference

### REST Endpoints
- `GET /api/marketplace/featured`: Returns list of featured skills.
- `POST /api/marketplace/install/:id`: Triggers hot-swap installation.
- `POST /api/execute-demo`: **(Critical)** Executes the real On-Chain Atomic Loop.
- `GET /api/health`: System heartbeat.

---

## 4. Development Environment

**Start Command:**
```bash
pnpm dev
# Runs: "concurrently \"next dev\" \"tsx src/server.ts\""
```

- **Frontend**: Next.js 15 (Port 3000)
- **Backend**: Express + TypeScript (Port 3001)


