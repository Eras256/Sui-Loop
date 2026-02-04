# Build Stage
FROM node:18-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace config
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/agent/package.json ./packages/agent/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY packages/agent ./packages/agent

# Build
WORKDIR /app/packages/agent
RUN pnpm build

# Runtime Stage
FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/packages/agent/dist ./dist
COPY --from=builder /app/packages/agent/node_modules ./node_modules
COPY --from=builder /app/packages/agent/package.json ./

# Environment variables should be passed at runtime
ENV NODE_ENV=production

EXPOSE 3000

CMD ["node", "dist/index.js"]
