#!/bin/bash

# SuiLoop Installer Script
# Installs dependencies and prepares the Autonomous Agent environment.

set -e

echo "
 ╔══════════════════════════════════════════════════════════════╗
 ║                                                              ║
 ║   🤖 SUILOOP v0.0.7 - NEURAL MATRIX INSTALLER                ║
 ║                                                              ║
 ╚══════════════════════════════════════════════════════════════╝
"

# 1. Check Pre-requisites
echo "[SYSTEM] Verifying Dependencies... OK"

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v20+."
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v docker &> /dev/null; then
    echo "⚠️  Docker not found. You will only be able to run in local mode."
else
    echo "✅ Docker detected."
fi

# 2. Setup Environment
echo "⚙️  Setting up environment..."

if [ ! -f .env ]; then
    echo "📝 Creating .env from template..."
    cp .env.example .env 2>/dev/null || touch .env
    echo "# SuiLoop Configuration" >> .env
    echo "SUI_PRIVATE_KEY=" >> .env
    echo "OPENAI_API_KEY=" >> .env
    echo "⚠️  Please edit .env with your credentials!"
fi

# 3. Install Dependencies
echo "📥 Installing dependencies..."
pnpm install

# 4. Build Project
echo "🏗️  Building packages..."
pnpm build

# 5. Create Data Directories
echo "📂 Initializing data layers..."
mkdir -p packages/agent/.suiloop/data
mkdir -p packages/agent/.suiloop/skills
mkdir -p packages/agent/.suiloop/logs

echo "[SYSTEM] Igniting Neural Core v0.0.7... OK"
echo "? Select Personality: > [Arbitrage_V1]"
echo ""

echo "
✅ Installation Complete!

🚀 To start the agent locally:
   pnpm dev

🐳 To start with Docker:
   docker-compose up --build

📄 Documentation:
   See HOW_TO_USE.md for operational guide.
"
