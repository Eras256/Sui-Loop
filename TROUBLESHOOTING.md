# 🔧 Troubleshooting Guide

This guide covers common issues you might encounter while running SuiLoop.

## 🛑 Common Errors

### 1. `ECONNREFUSED` / Backend Not Reachable
**Symptom**: User Interface shows "Connecting..." indefinitely or logs show connection errors.
**Cause**: The Agent Service (backend) is not running or crashed.
**Solution**:
1. Check terminal logs for crash dump.
2. Ensure port `3001` is free.
3. Restart the agent:
   ```bash
   pnpm start:agent
   ```

### 2. "Insufficient Funds" / Gas Error
**Symptom**: Transactions fail with `MoveAbort` or `InsufficientGas`.
**Cause**: The wallet address in `.env` has no SUI tokens (Testnet).
**Solution**:
1. Get failure address from logs.
2. Go to [Sui Discord Faucet](https://discord.gg/sui) or use web faucet.
3. Request SUI for your address on **Testnet**.

### 3. Docker "Container Exited"
**Symptom**: `docker-compose up` runs but containers stop immediately.
**Cause**: Missing `.env` file or invalid credentials inside container.
**Solution**:
- Ensure `.env` exists in root.
- Check logs: `docker logs suiloop-agent`

### 4. LLM "Rate Limit Exceeded"
**Symptom**: Agent stops replying or logs `429 Too Many Requests`.
**Cause**: OpenAI/Anthropic quota exhausted.
**Solution**:
- Switch provider in `packages/agent/src/config.ts`.
- Use **Failover** system (it should auto-switch, check logs if fallback failed too).
- Verify credit balance on provider dashboard.

## 🩺 System Doctor
Run the built-in diagnostic tool to identify issues automatically:

```bash
# If installed globally
suiloop doctor

# Or via direct API call
curl http://localhost:3001/api/doctor
```

## 🐛 Debugging Mode

To enable verbose logging for deep debugging:

**Local Run:**
```bash
DEBUG=suiloop:* pnpm dev
```

**Docker:**
Add `DEBUG=suiloop:*` to your `.env` file before building.

## 🆘 Getting Help
If you are still stuck:
1. Run `suiloop info` and capture output.
2. Capture the last 20 lines of logs.
3. Open an Issue on GitHub with these details.
