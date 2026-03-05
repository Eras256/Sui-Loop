#!/bin/bash

# Configuration
SUI=/home/vaiosvaios/Sui-Loop/sui
SENDER=0x066606066f3eeb33262854679ce6f5d4861f6f04f744f731b75d79731e3ce58f

# Agent List
AGENTS=(
  "0x8bd468b0e5941e75484e95191d99ff6234b2ab24e3b91650715b6df8cf8e4eba"
  "0x8ce5e3a1cc5b8be074c9820659b6dcae18210f350f46fcb10e32bc6327ad5884"
  "0x9b035feba22ef69411f1d803702e641d438481292f0082b43bfce68d3a351110"
  "0xa6890d201f81ed0cb62edcc70dc85bcb61c5d8c1ff74c51e5de6d6201b2a7d09"
  "0xa9bf0eb96e8c47d36f2aa68889996feebe7757e3ce5c74b327e6f07025bb6dc8"
  "0xb7b57c7d9412ae10eb490aa54df187e3d8f10950414791d6bdec9175309ae0e7"
  "0xbedcfc040f61028443573261778148084942725023c95187063e15c21c64cc39"
  "0xbf498d11d7d59c5accca3248d59621463f583553909e3ea4ef38b7da4909a495"
  "0xc8c5a537a37a4c4637c682b033e7dd137a343bb869eb68900537e7e0b8ade8aa"
  "0x590ce2b2280b3563bc6bb46541bf39c1e028a9f391e10758d3a9952249f3911f"
  "0x651411a17fc47d0fb89068db8a237374247322bc9d0bfe828191a6093f6b86f9"
  "0x3e7889aa0e9c7c3d24038527effecf42e26a175b20af3e678fabf8822c544222"
  "0x4c27b5baf7d5d3be529b55d5efe291008871b027db9071842bcb1d947276e309"
  "0x600a005f56f04723dc912676481541e114c58eff94c7b1c0593f3b367b4d6f5e"
  "0x7762bed5a0843042242d4adecaed0052eece5d3e9aa9f0b5e47a738f1c3fee19"
)

AMOUNT=66666666 # ~ 0.066 SUI each, total 1 SUI among 15 agents

echo "--- STARTING AGENT REFUELING (15 AGENTS) ---"

$SUI client switch --address $SENDER > /dev/null 2>&1

# Build a PTB to send to everyone in one go (more efficient)
COMMAND="$SUI client ptb"
for ADDR in "${AGENTS[@]}"; do
  COMMAND="$COMMAND --split-coins gas \[$AMOUNT\] --assign c$ADDR --transfer-objects \[c$ADDR\] @$ADDR"
done
COMMAND="$COMMAND --gas-coin @0x7ecaa2e6246619ba46d8ff70b7a28cfc52351ad646bfab1a7c5c8abe7b72949e --gas-budget 50000000"

echo "Executing PTB for mass distribution..."
eval $COMMAND

echo "--- REFUELING COMPLETE ---"
