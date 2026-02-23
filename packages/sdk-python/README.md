# SuiLoop Agent Python SDK

The official Python SDK for programmatic interaction with the SuiLoop Autonomous Agent Protocol.
Atomic Flash Loans · SUI/USDC Multi-Asset · Walrus Blackbox · ElizaOS AI Layer.

## Installation

```bash
pip install suiloop
```

## Quick Start

```python
import asyncio
from suiloop import Agent

agent = Agent(
    api_key="sk_live_YOUR_KEY_HERE",
    base_url="http://localhost:3001"    # or your deployed agent URL
)

# ── Health Check ──────────────────────────────────────────────────────────────
print(agent.ping())  # True / False

# ── Execute Strategies ────────────────────────────────────────────────────────

# SUI Flash Loan (Hot Potato pattern, atomic)
result = agent.execute("atomic-flash-loan", {"amount": 1.0}, asset="SUI")
print(f"✅ TX: {result['txHash']}")

# USDC Vault Yield Loop
result = agent.execute("usdc-yield-loop", {"amount": 100.0}, asset="USDC")
print(f"💰 Profit: {result.get('profit')}")

# Demo mode (no real tx, no API key needed)
demo = agent.execute_demo("atomic-flash-loan", asset="SUI")

# ── Market Data ───────────────────────────────────────────────────────────────
market = agent.get_market()
print(f"SUI Price: ${market['suiPrice']}")
print(f"Scallop APY: {market['scallopApy']['supply']}%")
print(f"Navi USDC APY: {market['naviUsdcApy']['supply']}%")

# ── Autonomous Loop Control ───────────────────────────────────────────────────
agent.start_loop(config={
    "minProfitPercentage": 0.1,
    "maxGasPrice": 3000,
    "minConfidence": 65
})
status = agent.get_loop_status()
print(f"Loop running: {status['isRunning']}")
agent.stop_loop()

# ── Real-time Signal Stream ───────────────────────────────────────────────────
async def main():
    # Create a filtered subscription
    sub = agent.create_subscription(
        signal_types=["arbitrage_opportunity", "flash_loan_opportunity"],
        min_confidence=70,
        pairs=["SUI/USDC"]
    )

    # Stream signals
    async for signal in agent.listen(subscription_id=sub.get("subscriptionId")):
        print(f"⚡ {signal['type']} | {signal.get('pair')} | score={signal.get('score')}")

        # Auto-execute high confidence signals
        if signal.get("confidence", 0) > 85:
            asset = "USDC" if "USDC" in signal.get("pair", "") else "SUI"
            agent.execute("atomic-flash-loan", asset=asset)

asyncio.run(main())
```

## API Reference

| Method | Description |
|---|---|
| `ping()` | Check if agent API is reachable |
| `health()` | Detailed health status |
| `execute(strategy, params, asset)` | Execute a strategy (SUI or USDC) |
| `execute_demo(strategy, asset)` | Simulated execution (no real tx) |
| `get_market()` | Live SUI price, APYs, liquidity |
| `get_signals(limit)` | Recent market signals |
| `start_loop(config)` | Start autonomous market scanner |
| `stop_loop()` | Stop scanner |
| `trigger_scan()` | Manual scan cycle |
| `get_loop_status()` | Scanner status + stats |
| `create_subscription(...)` | Create filtered signal subscription |
| `listen(subscription_id)` | `async` WebSocket signal stream |
