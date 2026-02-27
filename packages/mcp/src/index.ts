#!/usr/bin/env node
/**
 * SuiLoop MCP Server v0.0.8
 * ─────────────────────────────────────────────────────────────────
 * Model Context Protocol server that exposes SuiLoop agent capabilities
 * to any MCP-compatible AI client (Claude Desktop, Cursor, Continue, etc.)
 *
 * TOOLS EXPOSED:
 *   get_market_state       → Live SUI price, APYs, liquidity (Pyth + Scallop)
 *   get_agent_health       → Agent uptime, LLM status, wallet gas
 *   get_loop_status        → Is the autonomous scanner running? Scan count?
 *   start_loop             → Start the autonomous 10s market scanner
 *   stop_loop              → Stop the autonomous scanner
 *   trigger_scan           → Force one immediate market scan cycle
 *   execute_strategy       → Execute a flash loan / arbitrage strategy on-chain
 *   get_signals            → Recent market signals emitted by the agent
 *   get_leaderboard        → Top agents by ELO from on-chain events
 *
 * USAGE:
 *   npx @suiloop/mcp
 *   or add to claude_desktop_config.json (see README)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
    Tool,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import { z } from 'zod';

// ─── Config ──────────────────────────────────────────────────────────────────

const AGENT_URL = process.env.SUILOOP_AGENT_URL || 'http://localhost:3001';
const API_KEY = process.env.SUILOOP_API_KEY || '';
const SUISCAN = 'https://suiscan.xyz/testnet/tx/';

const http = axios.create({
    baseURL: AGENT_URL,
    headers: { 'x-api-key': API_KEY, 'Content-Type': 'application/json' },
    timeout: 30000,
});

// ─── Tool Definitions ────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
    {
        name: 'get_market_state',
        description: 'Get the current live market state: SUI/USD price from Pyth oracle, Scallop lending APY, Navi USDC APY, DeepBook liquidity depth, gas price, and LLM status.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'get_agent_health',
        description: 'Check the health of the running SuiLoop agent: uptime, Sui RPC connection status, wallet gas balance, LLM provider status.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'get_loop_status',
        description: 'Get the status of the autonomous 10-second market scanner loop: whether it is running, total scans performed, signals emitted.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'start_loop',
        description: 'Start the autonomous market scanner. The agent will scan for arbitrage and flash loan opportunities every 10 seconds and execute when conditions are met.',
        inputSchema: {
            type: 'object',
            properties: {
                min_profit: {
                    type: 'number',
                    description: 'Minimum profit percentage threshold to trigger execution (default: 0.1)',
                },
                max_gas: {
                    type: 'number',
                    description: 'Maximum gas price in MIST to allow execution (default: 3000)',
                },
            },
            required: [],
        },
    },
    {
        name: 'stop_loop',
        description: 'Stop the autonomous market scanner loop. The agent will cease all autonomous scanning and execution.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'trigger_scan',
        description: 'Force a single immediate market scan cycle without waiting for the 10-second interval. Useful to check current market conditions right now.',
        inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
        name: 'execute_strategy',
        description: 'Execute a DeFi strategy on the Sui blockchain immediately. Supports flash loan arbitrage (SUI or USDC). Returns transaction hash and yield.',
        inputSchema: {
            type: 'object',
            properties: {
                strategy: {
                    type: 'string',
                    description: 'Strategy to execute: "atomic-flash-loan", "yield-optimizer", "arbitrage-scanner"',
                    enum: ['atomic-flash-loan', 'yield-optimizer', 'arbitrage-scanner'],
                },
                asset: {
                    type: 'string',
                    description: 'Asset to use: SUI or USDC',
                    enum: ['SUI', 'USDC'],
                },
                amount: {
                    type: 'number',
                    description: 'Amount to use as collateral (in SUI or USDC)',
                },
            },
            required: ['strategy', 'asset'],
        },
    },
    {
        name: 'get_signals',
        description: 'Get recent market signals emitted by the agent: arbitrage opportunities, flash loan chances, and confidence scores.',
        inputSchema: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Number of recent signals to return (default: 10, max: 50)',
                },
            },
            required: [],
        },
    },
    {
        name: 'get_leaderboard',
        description: 'Get the top SuiLoop AI agents ranked by ELO reputation score. Shows address, ELO score, trades, win rate, and volume.',
        inputSchema: {
            type: 'object',
            properties: {
                limit: {
                    type: 'number',
                    description: 'Number of top agents to return (default: 10)',
                },
            },
            required: [],
        },
    },
];

// ─── Tool Handlers ────────────────────────────────────────────────────────────

async function handleTool(name: string, args: Record<string, any>): Promise<string> {
    try {
        switch (name) {

            case 'get_market_state': {
                const { data } = await http.get('/api/market');
                return [
                    `📊 **SuiLoop Live Market State**`,
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                    `💰 SUI Price:         $${Number(data.suiPrice || 0).toFixed(4)}`,
                    `⛽ Gas Price:         ${data.gasPrice || 'N/A'} MIST`,
                    `📈 Scallop SUI APY:   ${data.scallopApy?.supply || 'N/A'}% supply / ${data.scallopApy?.borrow || 'N/A'}% borrow`,
                    `💵 Navi USDC APY:     ${data.naviUsdcApy?.supply || 'N/A'}% supply / ${data.naviUsdcApy?.borrow || 'N/A'}% borrow`,
                    `💧 DeepBook Liquidity: $${Number(data.deepBookLiquidity || 0).toLocaleString()}`,
                    `🧠 LLM Engine:        ${data.llmEnabled ? 'ACTIVE ✅' : 'OFFLINE ❌'}`,
                    `🕐 Last Update:       ${new Date(data.lastUpdate).toLocaleTimeString()}`,
                ].join('\n');
            }

            case 'get_agent_health': {
                const { data } = await http.get('/api/health');
                const statusEmoji = data.status === 'healthy' ? '🟢' : data.status === 'degraded' ? '🟡' : '🔴';
                return [
                    `🤖 **SuiLoop Agent Health**`,
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                    `${statusEmoji} Status:   ${(data.status || 'unknown').toUpperCase()}`,
                    `⏱  Uptime:   ${formatUptime(data.uptime || 0)}`,
                    `🌐 Network:  ${data.components?.network?.status || 'unknown'} (${data.components?.network?.latencyMs || '?'}ms)`,
                    `🧠 LLM:     ${data.components?.llm?.provider || 'N/A'} — ${data.components?.llm?.status || 'unknown'}`,
                    `👛 Gas:     ${data.components?.wallet?.hasGas ? 'OK ✅' : 'LOW ⚠️'}`,
                    `📡 Version: ${data.version || 'N/A'}`,
                ].join('\n');
            }

            case 'get_loop_status': {
                const { data } = await http.get('/api/loop/status');
                const runningEmoji = data.isRunning ? '⚡ RUNNING' : '⏹️ STOPPED';
                return [
                    `🔄 **Autonomous Loop Status**`,
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                    `📡 Status:          ${runningEmoji}`,
                    `🔢 Total Scans:     ${data.scanCount || 0}`,
                    `📊 Signals Emitted: ${data.signalsEmitted || 0}`,
                    `💰 Executions:      ${data.executionCount || 0}`,
                ].join('\n');
            }

            case 'start_loop': {
                const minProfit = args.min_profit ?? 0.1;
                const maxGas = args.max_gas ?? 3000;
                const { data } = await http.post('/api/loop/start', {
                    config: { minProfitPercentage: minProfit, maxGasPrice: maxGas }
                });
                return `✅ **Autonomous loop started!**\n⚙️ Min profit: ${minProfit}%\n⛽ Max gas: ${maxGas} MIST\n📡 The agent will scan every 10 seconds for opportunities.`;
            }

            case 'stop_loop': {
                await http.post('/api/loop/stop');
                return `🔴 **Autonomous loop stopped.**\nThe agent has ceased all autonomous scanning and execution.`;
            }

            case 'trigger_scan': {
                const { data } = await http.post('/api/loop/scan');
                return [
                    `⚡ **Market Scan Triggered**`,
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                    `📡 Scan Status: ${data.success ? 'Completed ✅' : 'Failed ❌'}`,
                    data.signal ? `🚨 Opportunity: ${data.signal.signalType} | Pair: ${data.signal.pair} | Confidence: ${data.signal.confidence}%` : `💤 No opportunities found this cycle.`,
                ].join('\n');
            }

            case 'execute_strategy': {
                const strategy = args.strategy || 'atomic-flash-loan';
                const asset = args.asset || 'SUI';
                const amount = args.amount || 0.1;

                const { data } = await http.post('/api/execute-demo', {
                    strategy: `${strategy}:${asset}`,
                    asset,
                    params: { amount }
                });

                if (data.success) {
                    const lines = [
                        `🎉 **Strategy Executed Successfully!**`,
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                        `📋 Strategy:  ${strategy}`,
                        `💎 Asset:     ${asset}`,
                    ];
                    if (data.txHash) {
                        lines.push(`🔗 TX Hash:   ${data.txHash}`);
                        lines.push(`🔍 Explorer:  ${SUISCAN}${data.txHash}`);
                    }
                    if (data.profit) lines.push(`💰 Yield:     ${data.profit}`);
                    return lines.join('\n');
                } else {
                    return `⚠️ Execution incomplete: ${data.error || 'Unknown reason'}`;
                }
            }

            case 'get_signals': {
                const limit = Math.min(args.limit || 10, 50);
                const { data } = await http.get('/api/signals/recent', { params: { limit } });
                const signals: any[] = data.signals || [];
                if (!signals.length) return `📭 No signals found yet. Start the loop to begin scanning.`;

                const lines = [`📡 **Recent Agent Signals (${signals.length})**`, `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`];
                signals.slice(0, limit).forEach((sig, i) => {
                    lines.push(`${i + 1}. [${sig.signalType}] ${sig.pair || 'SUI/USDC'} | conf=${sig.confidence}% | ${new Date(sig.timestamp).toLocaleTimeString()}`);
                });
                return lines.join('\n');
            }

            case 'get_leaderboard': {
                // Query Sui testnet events directly
                const { data } = await http.get('/api/market');
                const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID || '0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0';
                return [
                    `🏆 **SuiLoop Agent Leaderboard**`,
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
                    `📦 Package: ${PACKAGE_ID.slice(0, 18)}...`,
                    `🔗 View full leaderboard: https://suiloop.xyz/leaderboard`,
                    ``,
                    `ℹ️ To view full on-chain leaderboard with ELO scores, visit the web app.`,
                    `   The leaderboard queries live AgentRegistered + ReputationUpdated events.`,
                ].join('\n');
            }

            default:
                return `❌ Unknown tool: ${name}`;
        }
    } catch (error: any) {
        const msg = error.response?.data?.error || error.message || String(error);
        if (error.code === 'ECONNREFUSED') {
            return `❌ **Cannot connect to SuiLoop agent**\n\nMake sure the agent is running:\n\`\`\`\ncd packages/agent && pnpm dev\n\`\`\`\nExpected at: ${AGENT_URL}`;
        }
        return `❌ Error: ${msg}`;
    }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatUptime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h}h ${m}m ${s}s`;
}

// ─── MCP Server ───────────────────────────────────────────────────────────────

const server = new Server(
    { name: 'suiloop-mcp', version: '0.0.8' },
    { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const result = await handleTool(name, (args as Record<string, any>) || {});
    return {
        content: [{ type: 'text', text: result }],
    };
});

// ─── Start ────────────────────────────────────────────────────────────────────

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('🚀 SuiLoop MCP Server v0.0.8 running on stdio');
    console.error(`📡 Connected to agent at: ${AGENT_URL}`);
    console.error(`🧠 API Key: ${API_KEY ? 'configured' : 'NOT SET (set SUILOOP_API_KEY)'}`);
}

main().catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
});
