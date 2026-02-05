import asyncio
import os
from dotenv import load_dotenv
from suiloop import Agent

load_dotenv()

agent = Agent(
    api_key=os.getenv("SUILOOP_API_KEY"),
    base_url="http://localhost:3001"
)

async def main():
    print("🤖 Starting SuiLoop Agent (Python)...")
    
    if not agent.ping():
        print("❌ Could not connect to Agent Network")
        return

    print("✅ Connected to Neural Matrix")

    async for signal in agent.listen():
        print(f"⚡ Signal Received: {signal}")
        # Add your logic here

if __name__ == "__main__":
    asyncio.run(main())
