# SuiLoop - Hackathon Deployment (Active Demo)

**Date:** 07.02.2026 UTC 17:01
**Status:** Active Hackathon Demo

## 📦 Package Information (Hackathon)
- **Package ID:** `0x673686ac6a1a259b1d39553e6cdb2fb2478a13db4bccd83ea6f7c079af89a7fb`
- **Network:** Sui Testnet
- **Fee Configuration:** **0.1 SUI** (Adjusted for Judges & Testing)

## 🔗 Deployment Transaction
- **Transaction Digest:** `AEzLuNxG6RGZRfXw5LvPXBsmYdBxJ5eT9aSc84YX1FBA`
- **Sender:** `0x8bd468b0e5941e75484e95191d99ff6234b2ab24e3b91650715b6df8cf8e4eba`
- **Timestamp:** 1770483708456 (07.02.2026)
- **Fee Paid:** ~0.27 SUI (Gas)

## 🛠️ Key Functionality (Demo Mode)

This deployment mirrors the production environment (`0xc24c...`) with one key adjustment for the Hackathon:

### 1. Cost-Effective Licensing
- **Action:** `atomic_engine::create_agent_cap`
- **Cost:** **0.1 SUI** (vs 5 SUI in Mainnet)
- **Result:** Users mint a real, functional `AgentCap` on-chain.

### 2. Institutional Grade Security
Even with the lowered fee, the security model is fully active:
- **AgentCap Required:** Agents cannot execute strategies without this capability.
- **On-Chain Revocation:** The "Stop" button executes `destroy_agent_cap`, permanently burning the license and halting all operations.

### 3. Flash Loan Execution
- **Action:** `atomic_engine::execute_strategy_secure`
- **Mechanism:** Atomic Flash Loan -> Arbitrage/Strategy -> Repay -> Profit.
- **Safety:** Zero-risk architecture ensures user funds are never exposed if a strategy fails.

## 📝 Notes for Judges
This contract allows you to experience the full "Professional Mode" workflow (Minting Licenses, Revoking Permissions) without needing to faucet large amounts of testnet tokens. The logic is identical to our Mainnet 5 SUI contract.
