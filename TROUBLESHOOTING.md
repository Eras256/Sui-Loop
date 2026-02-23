# 🔧 Troubleshooting Guide

Common issues you might encounter running SuiLoop, with solutions.

---

## 🛑 Common Errors

### 1. `ECONNREFUSED` / Backend Not Reachable
**Symptom**: UI shows "Connecting..." indefinitely or logs show connection errors.
**Cause**: The Agent API server (`packages/agent`) is not running.
**Solution**:
1. Check terminal for crash logs.
2. Confirm port `3001` is free: `lsof -i :3001`
3. Start the agent:
   ```bash
   pnpm start:agent
   # or
   cd packages/agent && pnpm dev
   ```

---

### 2. "Insufficient Funds" / Gas Error
**Symptom**: Transactions fail with `MoveAbort` or `InsufficientGas`.
**Cause**: The wallet address in `.env` has no SUI (Testnet).
**Solution**:
1. Get your agent wallet address from startup logs.
2. Go to [Sui Testnet Faucet](https://faucet.sui.io) and request SUI.
3. Or use the Discord faucet: [discord.gg/sui](https://discord.gg/sui).

---

### 3. `Invalid SUI_PRIVATE_KEY` Format
**Symptom**: Agent crashes on startup with `Invalid private key` error.
**Cause**: Using a raw base64 key instead of the `suiprivkey1...` bech32 format.
**Solution**:
Export your private key from Sui Wallet as **bech32** (`suiprivkey1...`) and set it in `.env`:
```bash
SUI_PRIVATE_KEY=suiprivkey1qpq7...
```
Both bech32 (`suiprivkey1...`) and base64 formats are now supported.

---

### 4. WebSocket Not Connecting in Production (Vercel)
**Symptom**: Dashboard shows no real-time logs; console errors mention `ws://localhost:3001`.
**Cause**: Vercel doesn't support WebSocket proxying — the browser tries to open a raw WS connection to `localhost` from a deployed URL (blocked as mixed content).
**Solution**:
- Deploy the agent backend on a persistent server (Railway, Fly.io, VPS).
- Set `NEXT_PUBLIC_API_URL=https://your-agent.fly.dev` in Vercel dashboard.
- The frontend `lib/constants.ts` will automatically switch to `wss://` for `https://` origins.

---

### 5. Docker "Container Exited"
**Symptom**: `docker-compose up` starts but containers stop immediately.
**Cause**: Missing `.env` file or invalid credentials inside the container.
**Solution**:
```bash
# Check logs
docker logs suiloop-agent

# Verify .env exists
ls -la packages/agent/.env
```

---

### 6. LLM "Rate Limit Exceeded"
**Symptom**: Agent stops replying or logs `429 Too Many Requests`.
**Cause**: OpenAI/Anthropic quota exhausted.
**Solution**:
- The `llmService.ts` has a provider failover chain — check logs to see which fallbacks were tried.
- Add a secondary provider API key to `.env` (`ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`).
- Verify credit balance on your provider dashboard.

---

### 7. Walrus Upload Failing (Blackbox Logger)
**Symptom**: Logs show `⚠️ [Blackbox] Walrus upload failed`.
**Cause**: Walrus Testnet may be temporarily unreliable.
**Solution**:
- This is non-blocking — execution continues and a local fallback ID is assigned.
- Check [Walrus Testnet status](https://walrus.space) for outages.
- The fallback blob ID format is `local-{strategy_id}-{timestamp}`.

---

## 🩺 System Doctor

Run the built-in diagnostic tool:

```bash
# Via API
curl http://localhost:3001/health

# Full system check
curl http://localhost:3001/api/admin/stats \
  -H "x-api-key: YOUR_API_KEY"
```

---

## 🐛 Debugging Mode

Enable verbose logging:

```bash
# Local
DEBUG=suiloop:* pnpm dev

# Docker
# Add to .env before building:
DEBUG=suiloop:*
```

---

## 🆘 Getting Help

1. Run `curl http://localhost:3001/health` and copy the output.
2. Capture the last 50 lines of agent logs.
3. Open an Issue on [GitHub](https://github.com/suiloop/sui-loop) with these details.
