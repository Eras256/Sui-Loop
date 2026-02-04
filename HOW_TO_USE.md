# How to Use SuiLoop

This guide walks you through the steps to set up, run, and interact with the SuiLoop Autonomous Atomic Leverage Protocol on the **Sui Testnet**.

---

## 1. Prerequisites

Before starting, ensure you have the following:

### A. Wallet Setup
1.  **Install Sui Wallet** (Browser Extension) or any compatible wallet (Suiet, Ethos, etc.).
2.  **Switch to Testnet**:
    *   Open Wallet -> Settings -> Network -> **Sui Testnet**.
3.  **Fund Your Wallet**:
    *   You need Testnet SUI to pay for gas.
    *   Use the **[Sui Faucet](https://faucet.sui.io/)** to get free testnet tokens.

### B. Software Requirements
*   Node.js (v18 or later)
*   pnpm (recommended) or npm
*   Git

---

## 2. Installation

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/Sui-Loop.git
    cd Sui-Loop
    ```

2.  **Install Dependencies**:
    ```bash
    pnpm install
    ```

3.  **Configure Environment** (Optional - for Supabase persistence):
    ```bash
    cp packages/web/.env.example packages/web/.env.local
    # Edit .env.local with your Supabase credentials
    ```

---

## 3. Running the Application

Start the local development server:

```bash
pnpm dev
# or
cd packages/web
npm run dev
```

Open your browser and navigate to: **http://localhost:3000**

---

## 4. Using the Protocol

### 🏠 Landing Page
*   On the Home page, you will see the SuiLoop branding and live AI terminal.
*   Click the **"DEPLOY AGENT"** button in the navigation bar.

### 🛒 Strategy Marketplace
*   Browse available strategies - each shows APY, risk level, and description.
*   Click **"Deploy"** on any strategy to activate it.
*   Pre-built options include:
    - **SUI/USDC Kinetic Loop** - Leverage on stable pairs
    - **LST Peg Restoration** - Liquid staking arbitrage
    - **Meme Volatility Sniper** - Capture memecoin volatility
    - **Smart DCA Accumulator** - AI-timed dollar-cost averaging

### 🎨 Visual Strategy Builder
Access via **Navbar → Builder** or `/strategies/builder`:

1.  **Create Strategy**: Drag triggers and conditions from the sidebar
2.  **Connect Nodes**: Link components to build your flow
3.  **Name Your Strategy**: Enter a custom name in the top bar
4.  **Save Draft**: Click "Save Draft" to save without deploying
5.  **Deploy Agent**: Click the play button to deploy and activate

**Available Nodes:**
- **Triggers**: Price > $X, Time-based (Every 1 Hour), High Gas Fee, SUI Balance
- **Actions**: Coming soon (Swap, Stake, Lend, etc.)

### 📊 Dashboard (Command Center)
Access via **Navbar → Dashboard** or `/dashboard`:

1.  **Connect Wallet**: Click the wallet button to authenticate
2.  **View Active Fleet**: See all running strategies with status
3.  **Monitor Performance**: Real-time Net Worth, APY, and P&L
4.  **Execution Log**: Live feed of all agent actions with transaction links

### ⚡ Deploying a Strategy

**From Marketplace:**
1.  Click **"Deploy"** on a strategy card
2.  Confirm in the modal by clicking **"Confirm Deploy"**
3.  Sign the transaction in your wallet popup
4.  Wait for confirmation - strategy appears in Active Fleet

**From Builder:**
1.  Create your custom flow
2.  Click the **Play button** (Deploy Agent)
3.  Sign the wallet message to authorize
4.  Sign the on-chain transaction
5.  Strategy is now active!

### Step-by-step: Atomic Execution
The transaction executes **5 steps atomically** (all-or-nothing):

| Step | Action | Description |
|------|--------|-------------|
| 1 | Flash Loan | Borrow 0.1 SUI from MockPool |
| 2 | Merge Funds | Combine with 0.01 SUI user funds |
| 3 | Calculate | Compute repayment + 0.3% fee |
| 4 | Repay | Return loan (destroys Hot Potato) |
| 5 | Profit | Transfer remaining to user |

### Verification
*   Wait for the **"⚡ Atomic Loop Executed Successfully!"** toast notification.
*   Copy the **Transaction Digest** shown.
*   Go to **[Suiscan (Testnet)](https://suiscan.xyz/testnet/home)** and search for your Digest.

---

## 5. Contract Addresses (Testnet v0.0.5)

| Component | Address |
|-----------|---------|
| **Package** | `0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043` |
| **MockPool** | `0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0` |

View on Explorer:
- [Package on Suiscan](https://suiscan.xyz/testnet/object/0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043)
- [MockPool on Suiscan](https://suiscan.xyz/testnet/object/0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0)

---

## 6. Running Tests

To verify the smart contracts work correctly:

```bash
pnpm test
# or
cd packages/contracts
sui move test
```

Expected output:
```
[ PASS ] suiloop::atomic_tests::test_add_liquidity
[ PASS ] suiloop::atomic_tests::test_create_pool
[ PASS ] suiloop::atomic_tests::test_flash_loan_cycle
[ PASS ] suiloop::atomic_tests::test_flash_loan_insufficient_profit
[ PASS ] suiloop::atomic_tests::test_flash_loan_no_liquidity
Test result: OK. Total tests: 5; passed: 5; failed: 0
```

---

## 7. Features Overview

| Feature | Description | Location |
|---------|-------------|----------|
| **Landing Page** | Hero, features, live terminal | `/` |
| **Dashboard** | Command center with metrics | `/dashboard` |
| **Marketplace** | Pre-built strategies | `/strategies` |
| **Builder** | Visual strategy editor | `/strategies/builder` |
| **Analytics** | Performance charts | `/analytics` |
| **Docs** | Documentation | `/docs` |

---

## 8. Troubleshooting

### "Insufficient Balance"
*   Ensure you are on **Testnet** and have at least 0.1 SUI in your wallet.
*   Visit **[faucet.sui.io](https://faucet.sui.io/)** to get testnet tokens.

### "Pool Empty" / "POOL_INSUFFICIENT_LIQUIDITY"
*   The MockPool needs liquidity. An admin must call `add_liquidity` first.
*   Current pool has **1 SUI** liquidity available.

### "Strategy Failed: Insufficient Profit"
*   This is **expected behavior** - the Hot Potato pattern prevents unprofitable trades.
*   The transaction reverted to protect your funds.

### "Wallet Not Connecting"
*   Refresh the page and try again.
*   Make sure you're on Sui Testnet network in your wallet.
*   The app supports auto-reconnect on page reload.

### "Strategy appears as DRAFT instead of RUNNING"
*   Only deployed strategies appear in Active Fleet.
*   Use the **Deploy Agent** button (not Save Draft) to activate.

### "DeepBook V3 Unreachable" Log (Agent)
*   **This IS NOT an error.** It means the Agent detected instability on DeepBook Testnet.
*   The Agent auto-switches to the **Deterministic Simulation Layer**.
*   Your strategy will proceed normally in simulation mode.

### "Duplicate Strategies in Active Fleet"
*   Clear your browser's LocalStorage for the site.
*   DevTools (F12) → Application → Local Storage → Delete `sui-loop-fleet-*` entries.

---

## 9. CLI Interaction (Advanced)

For developers who want to interact directly with the contracts:

### Add Liquidity to Pool
```bash
sui client call \
  --package 0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043 \
  --module atomic_engine \
  --function add_liquidity \
  --type-args 0x2::sui::SUI 0x2::sui::SUI \
  --args 0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0 <YOUR_COIN_OBJECT_ID> \
  --gas-budget 50000000
```

### Execute Flash Loan Loop
```bash
sui client ptb --gas-budget 50000000 \
  --split-coins gas "[10000000]" \
  --assign user_funds \
  --move-call 0x9a2f0c4ce838201bcc0d85f313621d47551511b891213458f6d57d4a1b087043::atomic_engine::execute_loop \
    "<0x2::sui::SUI, 0x2::sui::SUI>" \
    @0x0839e6ce61e303da44f3d999648536f573ee22937d31f7eb132c57451d9899d0 \
    user_funds \
    100000000 \
    0
```

---

## 10. Understanding the Hot Potato Pattern 🥔🔥

SuiLoop uses Move's **linear type system** to guarantee flash loan repayment:

```move
// The LoopReceipt has NO 'drop' ability
// This means it MUST be consumed - you cannot ignore it!
public struct LoopReceipt { ... }

// Borrow creates the "Hot Potato"
let (loan, receipt) = borrow_flash_loan(pool, amount, ctx);

// You MUST call repay to destroy it
// If you don't, the Move compiler/runtime rejects the transaction
repay_flash_loan(pool, payment, receipt, ctx);
```

This is **compile-time security** - the vulnerability literally cannot exist in valid Move code.

---

## 11. Keyboard Shortcuts (Builder)

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Y` | Redo |
| `Delete` | Remove selected node |
| `Scroll` | Zoom in/out on canvas |
| `Drag` | Move nodes or pan canvas |

---

## 🏆 Hackathon

Built for **[ETHGlobal HackMoney 2026](https://ethglobal.com/events/hackmoney2026)** 🚀

*Last updated: February 4, 2026*
*Version: v0.0.5*

