# How to Use SuiLoop

This guide walks you through the steps to set up, run, and interact with the SuiLoop Autonomous Atomic Leverage Protocol on the **Sui Testnet**.

---

## 1. Prerequisites

Before starting, ensure you have the following:

### A. Wallet Setup
1.  **Install Sui Wallet** (Browser Extension) or any compatible wallet.
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

### Step 1: Launch the Agent
*   On the Home page, you will see a Terminal log simulating the AI's thought process.
*   Click the **"⚡ ACTIVATE"** button in the top navigation bar.
*   This will take you to the **Dashboard** (Command Center).

### Step 2: Authentication
*   The Dashboard is protected. You will see a "DASHBOARD LOCKED" screen.
*   Click **"Connect Wallet"**.
*   Select your Sui Wallet and approve the connection.

### Step 3: Deploy Strategy
*   Locate the **"Agent Status"** card (right side).
*   Click the **"⚡ DEPLOY STRATEGY"** button.
*   **What happens next?**
    1.  The application builds a **Programmable Transaction Block (PTB)**.
    2.  Your Wallet popup will appear requesting a signature.
    3.  Review the transaction (Calling `suiloop::atomic_engine::execute_loop`).
    4.  Click **Approve**.

### Step 4: Atomic Execution
The transaction executes **5 steps atomically** (all-or-nothing):

| Step | Action | Description |
|------|--------|-------------|
| 1 | Flash Loan | Borrow 0.1 SUI from MockPool |
| 2 | Merge Funds | Combine with 0.01 SUI user funds |
| 3 | Calculate | Compute repayment + 0.3% fee |
| 4 | Repay | Return loan (destroys Hot Potato) |
| 5 | Profit | Transfer remaining to user |

### Step 5: Verification
*   Wait for the **"⚡ Atomic Loop Executed Successfully!"** toast notification.
*   Copy the **Transaction Digest** shown.
*   Go to **[Suiscan (Testnet)](https://suiscan.xyz/testnet/home)** and search for your Digest to see the on-chain execution.

---

## 5. Contract Addresses (Testnet v0.0.4)

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

## 7. Troubleshooting

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

### "DeepBook V3 Unreachable" Log (Agent)
*   **This IS NOT an error.** It means the Agent detected instability or fragmented liquidity on the official DeepBook Testnet pools.
*   The Agent successfully auto-switched to the **Deterministic Simulation Layer** (MockPool).
*   Your strategy will proceed normally in simulation mode.

---

## 8. CLI Interaction (Advanced)

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

## 9. Understanding the Hot Potato Pattern 🥔🔥

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

## 🏆 Hackathon

Built for **[ETHGlobal HackMoney 2026](https://ethglobal.com/events/hackmoney2026)** 🚀

*Last updated: February 4, 2026*

