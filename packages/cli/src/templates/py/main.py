import asyncio
import os
from dotenv import load_dotenv
from suiloop import Agent

load_dotenv()

agent = Agent(
    api_key=os.getenv("SUILOOP_API_KEY", ""),
    base_url="http://localhost:3001"
)

async def main():
    print("🤖 Starting SuiLoop Agent (Python)...")
    
    if not agent.ping():
        print("❌ Could not connect to Agent Network")
        return

    print("✅ Connected to Neural Matrix")
    print("🔌 Listening for market signals...")

    async for signal in agent.listen():
        print(f"⚡ Signal Received: {signal}")
        
        # --- AUTOMATED EXECUTION EXAMPLE ---
        # Trigger an atomic execution when high-confidence arbitrage is spotted:
        if signal.get("type") == "signal":
            payload = signal.get("payload", {})
            confidence = payload.get("confidence", 0)
            
            if confidence > 80:
                asset = "USDC" if "USDC" in payload.get("pair", "") else "SUI"
                print(f"🚀 High confidence ({confidence}%)! Triggering flash loan on {asset}...")
                
                # We use execute_demo here to prevent real testnet SUI un-intended spend
                # Replace with agent.execute() for real action
                result = agent.execute_demo("atomic-flash-loan", asset=asset)
                print(f"💰 Execution Result: {result}")

if __name__ == "__main__":
    asyncio.run(main())
