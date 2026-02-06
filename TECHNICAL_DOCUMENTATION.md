
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
- **Hot Potato Pattern**: Implements the `LoopReceipt` struct (without `drop` ability) to mathematically guarantee loan repayment within the same transaction block.
- **Deployed Package (Testnet)**: `0x9a2f...` (Atomic Engine).
- **Execution Flow**:
    1. Agent scans pools (Frontend/Backend).
    2. Builds **Programmable Transaction Block (PTB)**.
    3. Calls `atomic_engine::execute_loop`.
    4. Borrows Flash Loan -> Merges Funds -> Repays -> Profit.
    5. Returns **Hash** to UI via WebSocket.

### D. Forensic Audit Module
Institutional clients require proof of execution.
- **Black Box Recorder**: The `SubscriptionService` buffers all events in a circular log.
- **Audit Generation**: `sui-audit.json` can be exported from the Ops Unit.
- **Content**: Contains `audit_id`, `enclave_signature` (simulated SGX), and the full array of executed logs including Transaction Hashes.

---

## 2. Core Workflows

### 📦 Marketplace Skill Installation
This process allows users to extend agent capabilities without restarting the core kernel.

1.  **User Trigger:** User clicks "Install" on `http://localhost:3000/marketplace`.
2.  **API Call:** Frontend sends `POST /api/marketplace/install/:skillId`.
3.  **Proxy Forwarding:** Next.js forwards this to `localhost:3001`.
4.  **Download Phase (`LoopHub`):** Backend fetches the skill source (simulated via `downloadSkill`).
5.  **Installation Phase (`SkillManager`):**
    - Creates functionality directory in `.suiloop/skills/`.
    - Generates a valid `SKILL.md` manifest to prevent hydration errors.
    - Registers the new capability in memory.
6.  **Telemetry:**
    - `broadcastLog` emits "Installing..." and "Success" events via WebSocket.
    - Frontend Terminal receives and displays these logs in real-time.

### 📡 Real-Time Telemetry System
To provide observability, we implemented a custom logging pipeline.

1.  **Emission:** Any backend service creates a log via `broadcastLog(level, message)`.
2.  **Buffering:** The log is pushed to a circular buffer (`systemLogs`) in memory (last 50 events).
3.  **Broadcasting:** The log is JSON-serialized and sent to all connected WebSocket clients on `/ws/signals`.
4.  **Reconnection:** When a new client connects, they immediately receive the contents of the `systemLogs` buffer to ensure context is not lost.

---

## 3. API Reference

### REST Endpoints
- `GET /api/marketplace/featured`: Returns list of featured skills.
- `GET /api/marketplace/installed`: Returns installed skills with active status.
- `POST /api/marketplace/install/:id`: Triggers installation process.
- `POST /api/execute-demo`: **(NEW)** Executes real On-Chain Atomic Loop on Testnet.
- `GET /api/health`: System health check.

### WebSocket Events (`ws://host/ws/signals`)
- **Incoming (Client -> Server):**
    - `{ type: "subscribe", ... }`: Subscribe to specific trading signals.
- **Outgoing (Server -> Client):**
    - `{ type: "system_log", log: { level, message, timestamp } }`: Operational logs.
    - `{ type: "signal", signal: { ... } }`: Trading opportunities.
    - `{ type: "welcome" }`: Connection confirmation.

---

## 4. Development Environment

The project uses a unified start script to ensure synchronization:

```json
"scripts": {
  "dev": "pnpm --parallel --filter suiloop-web --filter @suiloop/agent dev"
}
```

- **Frontend** runs via `next dev`.
- **Backend** runs via `tsx src/server.ts` (handling TypeScript execution on the fly).
- **Desktop App** is currently excluded from the main dev loop to prevent port conflicts (Port 1420).

