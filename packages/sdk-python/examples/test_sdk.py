import sys
import os
import json

# Add src to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from suiloop.client import Agent

def main():
    print("🧪 Testing SuiLoop Python SDK...")
    
    # Initialize Agent
    agent = Agent(
        api_key="sk_live_your_api_key_here",
        base_url="http://localhost:3001"
    )

    try:
        # 1. Check Health
        print("1. Checking Agent Health...")
        health = agent.health()
        print(f"✅ Agent Health Status: {health.get('status')}")

        # 2. Get Market Info
        print("\n2. Fetching Market State...")
        market = agent.get_market()
        print(f"✅ SUI Price: ${market.get('suiPrice')}")
        print(f"✅ Gas Price: {market.get('gasPrice')} MIST")

        # 3. Execute Strategy
        print("\n3. Executing Flash Loan Strategy...")
        result = agent.execute(
            strategy="flash-loan-executor",
            params={"amount": 0.1},
            asset="SUI"
        )

        if result.get("success"):
            print("✅ Strategy Executed Successfully!")
            print(f"🔗 Hash: {result.get('txHash')}")
        else:
            print(f"❌ Strategy Execution Failed: {result.get('error')}")

    except Exception as e:
        print(f"💥 SDK Test Error: {e}")

if __name__ == "__main__":
    main()
