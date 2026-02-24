#!/bin/bash
# Builds and deploys all Soroban contracts to Stellar Testnet
# Requires: soroban CLI installed, funded Testnet account

NETWORK="testnet"
SOROBAN_RPC_URL="https://soroban-testnet.stellar.org"
SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# 1. Build all contracts
soroban contract build

# 2. Deploy NiriumVault contract
echo "Deploying NiriumVault..."
VAULT_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/nirium_vault.wasm \
  --source $STELLAR_SECRET_KEY \
  --rpc-url $SOROBAN_RPC_URL \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE")

echo "Vault Contract ID: $VAULT_ID"

# 3. Initialize the vault contract (call init function if exists)
soroban contract invoke \
  --id $VAULT_ID \
  --source $STELLAR_SECRET_KEY \
  --rpc-url $SOROBAN_RPC_URL \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE" \
  -- initialize --admin $STELLAR_PUBLIC_KEY

# 4. Deploy MockPool for Testnet demos
echo "Deploying MockPool..."
POOL_ID=$(soroban contract deploy \
  --wasm target/wasm32-unknown-unknown/release/mock_pool.wasm \
  --source $STELLAR_SECRET_KEY \
  --rpc-url $SOROBAN_RPC_URL \
  --network-passphrase "$SOROBAN_NETWORK_PASSPHRASE")

echo "MockPool Contract ID: $POOL_ID"

# 5. Output .env values
echo ""
echo "=== Add these to your .env.local ==="
echo "CONTRACT_ID=$VAULT_ID"
echo "MOCK_POOL_ID=$POOL_ID"
