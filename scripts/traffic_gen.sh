#!/bin/bash

# Configuration
SUI=/home/vaiosvaios/Sui-Loop/sui
PACKAGE_ID=0x945163568d75adf1cb3c1f7d1a197e4a903fd6ba3f807a4421cfa9f563f0dcb0
REGISTRY_ID=0xcbb6d114644b9573c76c1eee3f94ad4b8874273e7691f5c46d24add925b47e30
MARKETPLACE_ID=0xa807a548a0e11d15126a5ee84d73f79614b9e79561e5a55e68a26e2f9dbd6945
POOL_ID=0x888e1a08836d1a3749fa7b0e9c6a44517d2d95548aae2a42d713b73e1f9255bf
ADMIN_CAP=0xa17837f6e6a43fbe8934d766bafb28aaa937dab3fe2540eac7b823d9b203b505
CLOCK=0x6

MAIN_ADDR=0x3375661d59379545d2e412a56890483d4d22c7027d91df6571c012276e175d29

# Verified Agent List (Exist in Keystore)
AGENTS=(
  "0x8bd468b0e5941e75484e95191d99ff6234b2ab24e3b91650715b6df8cf8e4eba:TITAN"
  "0x8ce5e3a1cc5b8be074c9820659b6dcae18210f350f46fcb10e32bc6327ad5884:ELIZA"
  "0x9b035feba22ef69411f1d803702e641d438481292f0082b43bfce68d3a351110:WHALE"
  "0xa6890d201f81ed0cb62edcc70dc85bcb61c5d8c1ff74c51e5de6d6201b2a7d09:KRAKEN"
  "0xa9bf0eb96e8c47d36f2aa68889996feebe7757e3ce5c74b327e6f07025bb6dc8:PHOENIX"
  "0xb7b57c7d9412ae10eb490aa54df187e3d8f10950414791d6bdec9175309ae0e7:SPECTER"
  "0xbedcfc040f61028443573261778148084942725023c95187063e15c21c64cc39:NEXUS"
  "0xbf498d11d7d59c5accca3248d59621463f583553909e3ea4ef38b7da4909a495:CYBORG"
  "0xc8c5a537a37a4c4637c682b033e7dd137a343bb869eb68900537e7e0b8ade8aa:GHOST"
  "0x590ce2b2280b3563bc6bb46541bf39c1e028a9f391e10758d3a9952249f3911f:VECTOR"
  "0x651411a17fc47d0fb89068db8a237374247322bc9d0bfe828191a6093f6b86f9:MATRIX"
  "0x3e7889aa0e9c7c3d24038527effecf42e26a175b20af3e678fabf8822c544222:ORION"
  "0x4c27b5baf7d5d3be529b55d5efe291008871b027db9071842bcb1d947276e309:SIRIUS"
  "0x600a005f56f04723dc912676481541e114c58eff94c7b1c0593f3b367b4d6f5e:NOVA"
  "0x7762bed5a0843042242d4adecaed0052eece5d3e9aa9f0b5e47a738f1c3fee19:ZENITH"
)

echo "--- STARTING VERIFIED POPULATION BURST (15 AGENTS) ---"

# Burst 1: Initialization
for item in "${AGENTS[@]}"; do
  ADDR="${item%%:*}"
  NAME="${item#*:}"
  echo "--- Populating Verified Agent: $NAME ($ADDR) ---"
  
  $SUI client switch --address $ADDR > /dev/null 2>&1
  
  $SUI client call --package $PACKAGE_ID --module agent_registry --function register_agent --args $REGISTRY_ID $ADDR $CLOCK --gas-budget 15000000 > /dev/null 2>&1
  $SUI client call --package $PACKAGE_ID --module strategy_marketplace --function list_strategy --args $MARKETPLACE_ID "$NAME Alpha Elite" "Qm$NAME" 5000000000 --gas-budget 20000000 > /dev/null 2>&1
  $SUI client call --package $PACKAGE_ID --module agent_registry --function publish_signal --args $REGISTRY_ID $ADDR "$NAME Node Active. Genesis Block Sync." $CLOCK --gas-budget 10000000 > /dev/null 2>&1
  $SUI client ptb --move-call 0x2::coin::zero "<0x2::sui::SUI>" --assign z --move-call $PACKAGE_ID::atomic_engine::execute_loop "<0x2::sui::SUI, 0x2::sui::SUI>" $POOL_ID z 50000000 0 --gas-budget 35000000 > /dev/null 2>&1
done

# Long-term activity loop
echo "Entering Sustained Activity Mode..."
$SUI client switch --address $MAIN_ADDR > /dev/null 2>&1
while true; do
  RAND_IDX=$((RANDOM % 15))
  AGENT_DATA="${AGENTS[$RAND_IDX]}"
  ADDR="${AGENT_DATA%%:*}"
  NAME="${AGENT_DATA#*:}"

  # Agent Action
  $SUI client switch --address $ADDR > /dev/null 2>&1
  # Real Volume Range: 0.01 to 0.1 SUI
  VOL_INT=$(( (RANDOM % 90) + 10 ))
  VOL_DEC=$(echo "scale=2; $VOL_INT / 1000" | bc) 
  # Actually 10-100 Mist * 10^6
  MIST_VOL=$(( $VOL_INT * 1000000 ))
  
  $SUI client ptb --move-call 0x2::coin::zero "<0x2::sui::SUI>" --assign z --move-call $PACKAGE_ID::atomic_engine::execute_loop "<0x2::sui::SUI, 0x2::sui::SUI>" $POOL_ID z $MIST_VOL 0 --gas-budget 35000000 > /dev/null 2>&1
  $SUI client call --package $PACKAGE_ID --module agent_registry --function publish_signal --args $REGISTRY_ID $ADDR "Neural Sync: 0.0$VOL_INT SUI processed." $CLOCK --gas-budget 15000000 > /dev/null 2>&1
  
  # Admin Action
  $SUI client switch --address $MAIN_ADDR > /dev/null 2>&1
  $SUI client call --package $PACKAGE_ID --module agent_registry --function update_reputation --args $ADMIN_CAP $REGISTRY_ID $ADDR true $MIST_VOL --gas-budget 15000000 > /dev/null 2>&1

  echo "Cycle Complete for $NAME. Waiting 30s..."
  sleep 30
done
