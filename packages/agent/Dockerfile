# Base stage for dependencies
FROM node:20-slim AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable

# Install system dependencies for Puppeteer & Build tools
RUN apt-get update && apt-get install -y \
    openssl \
    chromium \
    ca-certificates \
    procps \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Set Puppeteer to skip download and use installed chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app

# Build stage
FROM base AS build
COPY . .
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile
RUN pnpm --filter @suiloop/agent build

# Production stage
FROM base AS production
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/packages/agent/dist /app/packages/agent/dist
COPY --from=build /app/packages/agent/package.json /app/packages/agent/package.json

# Copy artifacts and data dirs if they exist, or create them
RUN mkdir -p /app/.suiloop/data /app/.suiloop/skills /app/.suiloop/logs

WORKDIR /app/packages/agent

# Expose API and WebSocket ports
EXPOSE 3001

# Start the agent
CMD ["node", "dist/server.js"]
