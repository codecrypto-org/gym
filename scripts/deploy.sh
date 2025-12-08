#!/bin/bash

# Script para deployar el contrato GymSBT y actualizar las direcciones en la aplicación web

set -e

# Colores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Deployando contrato GymSBT...${NC}"

# Ir al directorio de smart contracts
cd "$(dirname "$0")/../sc"

# Ejecutar el script de deploy
DEPLOY_OUTPUT=$(forge script script/DeployGymSBT.s.sol:DeployGymSBT \
  --rpc-url http://localhost:55556 \
  --broadcast \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 2>&1)

# Extraer la dirección del contrato del output
# Compatible con macOS (BSD grep) y Linux (GNU grep)
CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep "GymSBT deployed at:" | sed -E 's/.*GymSBT deployed at: (0x[a-fA-F0-9]{40}).*/\1/' || echo "")

if [ -z "$CONTRACT_ADDRESS" ]; then
  echo "❌ Error: No se pudo extraer la dirección del contrato del output"
  echo "$DEPLOY_OUTPUT"
  exit 1
fi

echo -e "${GREEN}✅ Contrato deployado en: $CONTRACT_ADDRESS${NC}"

# Volver al directorio raíz
cd ..

# Actualizar las direcciones en la aplicación web
echo -e "${BLUE}📝 Actualizando direcciones en la aplicación web...${NC}"
node scripts/update-addresses.js "$CONTRACT_ADDRESS" 3133731337

echo -e "${GREEN}✅ Deploy completado!${NC}"
echo -e "${BLUE}📋 Resumen:${NC}"
echo "   - Contrato: $CONTRACT_ADDRESS"
echo "   - Red: Anvil (Chain ID: 3133731337)"
echo "   - ABI: web/lib/contracts/GymSBT.json"
echo "   - Direcciones: web/lib/contracts/addresses.ts"

