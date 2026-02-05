# @suiloop/sdk

The official TypeScript SDK for the **SuiLoop Autonomous Agent Protocol**.
Build custom trading bots, arbitrage seekers, and market analyzers powered by the SuiLoop Neural Engine.

## Installation

```bash
npm install @suiloop/sdk
# or
pnpm add @suiloop/sdk
```

## Quick Start
Get an API Key from the [Agent Console](http://localhost:3000/agents).

```typescript
import { Agent } from '@suiloop/sdk';

// Initialize the bot
const agent = new Agent({
    apiKey: 'sk_live_YOUR_KEY_HERE',
    // Optional: Defaults to localhost for dev
    baseUrl: 'http://localhost:3001' 
});

async function main() {
    // 1. Check connection
    const healthy = await agent.ping();
    console.log('System Status:', healthy ? 'ONLINE' : 'OFFLINE');

    // 2. Subscribe to real-time signals
    agent.subscribe((signal) => {
        console.log('⚡ New Opportunity:', signal);
    });

    // 3. Execute a flash loan strategy
    const result = await agent.execute('atomic-flash-loan', {
        amountIn: 1000, 
        tokenIn: 'SUI'
    });
    
    console.log('Execution Result:', result);
}

main();
```

## Features

- **Auth Management**: Automatically handles API Key headers.
- **WebSocket Stream**: Real-time market updates and loop signals.
- **Type Safety**: Full TypeScript support for all request/response objects.
- **Error Handling**: Standardized error parsing from the Agent API.
