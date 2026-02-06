# 🎮 How to Use SuiLoop

Welcome to the **SuiLoop Command Center**. This guide will walk you through operating the first autonomous agent protocol on Sui.

## 🏁 Phase 0: Deployment & Initialization

Choose your deployment vector matching your operational security level.

### Vector A: Docker Containment (Recommended)
Isolates the agent environment to prevent system interference.
```bash
# 1. Configure Credentials
# Create .env and add SUI_PRIVATE_KEY and OPENAI_API_KEY
nano .env

# 2. Launch Containers
docker-compose up -d --build

# 3. Access Command Center
# Open http://localhost:3000 in your browser
```

### Vector B: Cloud Deployment (Railway/Fly.io)
For 24/7 autonomous operations (Cron Jobs).
1.  **Railway**: Connect your GitHub repo. The system automatically detects `railway.json`.
2.  **Variables**: Add `SUI_PRIVATE_KEY` and `OPENAI_API_KEY` in the Railway dashboard.
3.  **Deploy**: The agent will auto-boot and start the Scheduler Service.

### Vector C: Local Execution (Dev Mode)
```bash
./install.sh
pnpm dev
```
You will see the **Landing Page** with the 3D rotating Loop logo.

---

### 3. Deploying a "Skill" (Agent Capability)
The **Nexus (Marketplace)** is your arsenal. Here you provision your agent with specific strategies.

1.  Navigate to `/marketplace`.
2.  **Select Strategy**: "Flash Loan Executor" (High Risk / High Reward).
3.  **Install**: Click the button.
    *   *System Action*: The Neural Matrix hot-swaps the new logic module into the running kernel without downtime.
4.  **Verification**: The button changes to a green **RUN** indicator.

### 4. Executing an Atomic Loop (Live Fire Exercise)
⚠️ **Warning:** The following action broadcasts a REAL transaction to the Sui Testnet.

1.  Click **RUN** on the strategy card.
2.  **Observe the Ops Terminal**:
    *   `Scanning Pools...`: The agent checks DeepBook/Cetus (simulated liquidity in mock).
    *   `Constructing PTB...`: The agent builds the complex atomic transaction block.
    *   `Signing...`: The agent uses its enclave wallet to sign via Ed25519.
3.  **Result**:
    *   If successful, you will see a green `SUCCESS` log with a **Transaction Hash**.
    *   **Verify**: Copy this hash and check it on [SuiScan (Testnet)](https://suiscan.xyz).

---

## 🖥️ 5. Forensic Audit & Monitoring
Transparency is paramount for institutional DeFi.

### The Live Neural Feed
Located on the right side of the **Ops Unit** (`/agents`), this terminal provides a raw stream of the agent's "consciousness". It has memory, so scrolling up reveals past actions.

### Phase 3: Autonomous Operations (v2.1)

#### 1. Scheduling Recurring Tasks (Cron)
Enable 24/7 operation by scheduling a strategy:
```bash
# Example: Create a job via API to run Flash Loan every 5 minutes
curl -X POST http://localhost:3001/api/jobs \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Auto-Flash-Loan",
    "cronExpression": "0/5 * * * *", 
    "taskType": "skill_execution",
    "payload": { "skillId": "flash-loan-executor" }
  }'
```
*Result: The agent will wake up every 5 minutes, scan the mempool, and execute if profitable.*

#### 2. Voice Command Interface
If using the experimental Voice UI:
1. Hold the **Mic Button** on the dashboard.
2. Speak clearly: *"Agent, check liquidity on Cetus pool and report status."*
3. Release to send. The agent will respond with both text logs and synthesized audio.

### Phase 4: Forensic Audit & Monitoring
1.  **View Logs**: The dashboard terminal streams real-time logs via WebSocket.
2.  **Verify On-Chain**:
    -   Click the **Transaction Hash** link in the logs to view on `suiscan.xyz`.
    -   Confirm the successful execution of the Programmable Transaction Block (PTB).
3.  **Export Audit**:
    -   For compliance, locate the `sui-audit.json` file in the agent's root directory.
    -   This file contains cryptographic signatures of the agent's decision-making process.t executed.
    *   This file serves as the **compliance artifact** for the session.

---

## 🧩 4. Creating a Custom Skill (Advanced)

Developers can create custom skills for the agent.

1.  Navigate to `packages/agent/skills/`.
2.  Create a new folder (e.g., `my-custom-strategy`).
3.  Add a `SKILL.md` file:
    ```yaml
    ---
    name: My Strategy
    version: 1.0.0
    permissions: [blockchain:read]
    ---
    ```
4.  Restart the backend server. The agent will automatically detect and load your new skill.

---

## ❓ Troubleshooting

**"ECONNREFUSED" Error:**
- This means the Backend Agent is not running.
- **Fix:** Stop the terminal (`Ctrl+C`) and run `pnpm dev` again. Ensure no other process is using port 3001.

**Logs not appearing:**
- Check if "Connected to SuiLoop Neural Matrix" appears in the terminal.
- If not, verify that the backend is running at `localhost:3001`.

**Installation stuck:**
- Check the console logs in your terminal for detailed backend errors.
- Ensure you have write permissions in the `packages/agent/skills` directory.
