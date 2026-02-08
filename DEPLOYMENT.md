# Suiloop Deployment Guide

This project is a monorepo containing the web frontend and the agent backend.

## Frontend (Vercel)

The frontend is built with Next.js and is located in `packages/web`.

### Steps:
1.  Connect your repository to Vercel.
2.  Set the **Root Directory** to `packages/web`.
3.  Vercel should automatically detect Next.js.
4.  Configure the following Environment Variables:
    *   `NEXT_PUBLIC_SUI_NETWORK`: `testnet` or `mainnet`
    *   `NEXT_PUBLIC_PACKAGE_ID`: Your deployed Move package ID.
    *   `NEXT_PUBLIC_POOL_ID`: Your deployed pool ID.
    *   `NEXT_PUBLIC_API_URL`: The URL of your Agent backend (e.g., `https://agent.yourdomain.com`).
    *   `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
    *   `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key.
    *   `NEXT_PUBLIC_WALRUS_PUBLISHER_URL`: (Optional) Walrus publisher URL.
    *   `NEXT_PUBLIC_WALRUS_AGGREGATOR_URL`: (Optional) Walrus aggregator URL.

## Backend / Agent (Railway / Render / VPS)

The agent runs an Express server with WebSockets and is located in `packages/agent`.

### Steps:
1.  Deploy the `packages/agent` directory.
2.  Build Command: `pnpm install && pnpm build`
3.  Start Command: `pnpm start` or `node dist/index.js`
4.  Configure Environment Variables (see `packages/agent/.env.example`).
5.  Ensure port `3001` (or your configured `PORT`) is open for HTTP and WebSocket traffic.

## Supabase Setup
Ensure you have run the `SUPABASE_SCHEMA.sql` in your Supabase SQL editor to set up the required tables for strategies and signals.
