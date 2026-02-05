# SuiLoop Agent Python SDK

The official Python SDK for programmatic interaction with the SuiLoop Autonomous Agent Protocol. 
Perfect for algorithmic trading, backtesting strategies, and custom AI integrations.

## Installation

```bash
pip install suiloop
```

## Quick Start

```python
import asyncio
from suiloop import Agent

# Initialize
agent = Agent(
    api_key="sk_live_YOUR_KEY_HERE",
    base_url="http://localhost:3001"
)

async def main():
    # 1. Execute a Strategy (Synchronous)
    try:
        result = agent.execute("atomic-flash-loan", {
            "token": "SUI",
            "amount": 1000
        })
        print(f"Execution Result: {result}")
    except Exception as e:
        print(f"Error: {e}")

    # 2. Listen for Signals (Asynchronous)
    print("Listening for market signals...")
    async for signal in agent.listen():
        print(f"⚡ Opportunity Found: {signal}")
        
        # React automatically
        if signal.get('score', 0) > 90:
             agent.execute("sniper-entry", signal)

if __name__ == "__main__":
    asyncio.run(main())
```
