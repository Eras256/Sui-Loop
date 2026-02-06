
# 🎮 How to Use SuiLoop

Welcome to the **SuiLoop Command Center**. This guide will walk you through operating the first autonomous agent protocol on Sui.

## 🏁 1. Getting Started

1.  **Launch the System**:
    Open your terminal and run:
    ```bash
    pnpm dev
    ```
    Wait until you see the "SERVER RUNNING" and "Ready" messages.

2.  **Access the Dashboard**:
    Open your browser to [http://localhost:3000](http://localhost:3000).
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

### Black Box Data Extraction
1.  In **Ops Unit**, find the **Institutional Security** panel (bottom left).
2.  Click **ACCESS BLACK BOX DATA**.
3.  **Decrypting Sequence**: The system will simulate an SGX enclave decryption process.
4.  **Download**: A `sui-audit.json` file will arrive on your device.
    *   Open this JSON to see the cryptographic proof of the loop you just executed.
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
