
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

#### A. Scheduler Service (Cron Automation)
- **Persistence**: Jobs are serialized to `.suiloop/data/jobs.json`, surviving agent restarts.
- **Precision**: Uses `node-cron` for exact timing (e.g., "Run Flash Loan scan every 30 seconds" -> `*/30 * * * * *`).
- **Integration**: Directly invokes `SkillManager` to execute strategies without HTTP overhead.

#### B. Voice Service (Multimodal Interface)
- **STT (Speech-to-Text)**: Processes OGG/WEBM audio via OpenAI Whisper model to transcribe voice commands.
- **TTS (Text-to-Speech)**: Synthesizes agent responses using the `alloy` voice model for audio feedback.
- **Workflow**:
  1. Frontend captures Mic audio -> `POST /api/voice/transcribe`
  2. Agent processes command -> LLM Decision
  3. Agent Executes -> Generates Text Response
  4. Agent converts Text -> Audio -> `POST /api/voice/speak`

### 5. Deployment & Security
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

### D. Forensic Audit Module
Institutional clients require cryptographically verifiable proof of execution.

- **Black Box Recorder**: The `SubscriptionService` buffers all events in a circular log.
- **Data Structure**:
    ```json
    {
      "audit_id": "BLK-BOX-1770...",
      "timestamp": "ISO8601",
      "enclave_signature": "0x8a2f... (Simulated SGX Signature)",
      "system_events": [ ...Array of Logs... ]
    }
    ```
- **Audit Generation**: When requested via the "Black Box" button, the system freezes the log buffer, signs the payload, and generates a downloadable `sui-audit.json`.

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


