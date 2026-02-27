# SuiLoop MCP Server

> Connect Claude Desktop, Cursor, or any MCP-compatible AI to your SuiLoop autonomous DeFi agent.

## What is this?

The SuiLoop MCP Server implements the [Model Context Protocol](https://modelcontextprotocol.io/) so that any compatible AI assistant can **directly control your Sui blockchain trading agent** using natural language.

Ask Claude:
> *"What is the current SUI price and APY?"*
> *"Start the autonomous loop with a minimum 0.2% profit threshold"*
> *"Execute a USDC flash loan strategy"*
> *"Show me the top 5 agents on the leaderboard"*

## Available Tools

| Tool | Description |
|------|-------------|
| `get_market_state` | Live SUI price (Pyth), Scallop APY, Navi USDC APY, DeepBook liquidity |
| `get_agent_health` | Agent uptime, RPC latency, LLM status, wallet gas |
| `get_loop_status` | Is the autonomous scanner running? Scans & signals count |
| `start_loop` | Start the 10-second autonomous market scanner |
| `stop_loop` | Stop the autonomous scanner |
| `trigger_scan` | Force one immediate market scan cycle |
| `execute_strategy` | Execute a flash loan / arbitrage strategy on-chain |
| `get_signals` | Recent market signals and confidence scores |
| `get_leaderboard` | Top agents by ELO from on-chain events |

## Installation

```bash
# From the Sui-Loop monorepo root
pnpm install
cd packages/mcp
pnpm build
```

## Integration: Claude Desktop

Add to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`  
**Linux:** `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "suiloop": {
      "command": "node",
      "args": ["/absolute/path/to/Sui-Loop/packages/mcp/dist/index.js"],
      "env": {
        "SUILOOP_AGENT_URL": "http://localhost:3001",
        "SUILOOP_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```

> **Note:** Replace the path with your actual absolute path to the `dist/index.js` file.

## Integration: Cursor

Add to `.cursor/mcp.json` in your project root:

```json
{
  "mcpServers": {
    "suiloop": {
      "command": "node",
      "args": ["packages/mcp/dist/index.js"],
      "env": {
        "SUILOOP_AGENT_URL": "http://localhost:3001",
        "SUILOOP_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```

## Integration: npx (no build required)

```json
{
  "mcpServers": {
    "suiloop": {
      "command": "npx",
      "args": ["-y", "@suiloop/mcp"],
      "env": {
        "SUILOOP_AGENT_URL": "http://localhost:3001",
        "SUILOOP_API_KEY": "sk_live_your_key_here"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SUILOOP_AGENT_URL` | `http://localhost:3001` | URL of your running SuiLoop agent |
| `SUILOOP_API_KEY` | *(empty)* | Your SuiLoop API key (from the Agents page) |

## Prerequisites

The SuiLoop agent backend must be running:

```bash
cd packages/agent
pnpm dev
```

## Example Prompts

Once connected to Claude Desktop, try:

- *"Check the health of my SuiLoop agent"*
- *"What are the current Scallop and Navi APYs?"*
- *"Start the loop with a minimum 0.5% profit threshold"*
- *"Execute a SUI atomic flash loan strategy"*
- *"Show me the last 5 market signals"*
- *"Stop the autonomous loop"*
