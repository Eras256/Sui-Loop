
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

## 🛍️ 2. Using the Marketplace

Expand your agent's capabilities by installing new "Skills".

1.  Navigate to the **Nexus (Marketplace)** tab in the top navigation bar, or go to `/marketplace`.
2.  Browse available modules (e.g., *Flash Loan Executor*, *Telegram Alerts*).
3.  Click the **Install** button on any card.
    - A toast notification will appear: "Installation started...".
    - Upon success, the button will change to a **Green Run Button**.
4.  **Execute the Strategy**:
    - Click the **Run** button directly from the card.
    - The system will redirect you to the main terminal.
    - You will see live "Scanning" and "Execution" logs.
    - ⚠️ **Note**: This executes a REAL transaction on Sui Testnet. Ensure the agent wallet has gas.

---

## 🖥️ 3. Monitoring Operations (Live Terminal)

Watch your agent "think" and act in real-time.

1.  Navigate to the **Ops Unit** (Agents) page.
2.  Look for the **LIVE NEURAL FEED** panel on the right side.
3.  This terminal displays:
    - **SYSTEM**: Connection status.
    - **SUCCESS**: Real Transaction Hashes (e.g., `Hash: 0x3b...`).
    - **INFO**: "Scanning pools...", "Constructing Transaction...".

### 🛡️ Black Box Audit (Forensic Mode)
1.  In the Ops Unit page, locate the **Institutional Security** panel (bottom left).
2.  Click **ACCESS BLACK BOX DATA**.
3.  The system will decrypt and download a `sui-audit.json` file.
4.  This file contains the **cryptographically signed proof** of all agent actions during the session.

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
