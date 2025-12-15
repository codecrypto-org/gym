#!/bin/bash

# Script para verificar el estado de Anvil y el contrato desplegado

set -e

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ANVIL_URL="http://localhost:8545"
CHAIN_ID="3133731337"
CONTRACT_ADDRESS="0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"

echo -e "${BLUE}🔍 Verificando estado de Anvil...${NC}"

# Verificar si Anvil está corriendo
echo -e "${BLUE}1. Verificando conexión con Anvil en ${ANVIL_URL}...${NC}"
CHAIN_ID_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  ${ANVIL_URL} 2>/dev/null || echo "")

if [ -z "$CHAIN_ID_RESPONSE" ]; then
  echo -e "${RED}❌ Error: Anvil no está corriendo en ${ANVIL_URL}${NC}"
  echo -e "${YELLOW}💡 Para iniciar Anvil, ejecuta:${NC}"
  echo -e "   anvil --chain-id ${CHAIN_ID}"
  exit 1
fi

# Extraer Chain ID
RESPONSE_CHAIN_ID=$(echo "$CHAIN_ID_RESPONSE" | grep -o '"result":"[^"]*"' | sed 's/"result":"0x//' | sed 's/"//' | tr '[:lower:]' '[:upper:]')
DECIMAL_CHAIN_ID=$((16#${RESPONSE_CHAIN_ID}))

if [ "$DECIMAL_CHAIN_ID" != "$CHAIN_ID" ]; then
  echo -e "${YELLOW}⚠️  Chain ID incorrecto: ${DECIMAL_CHAIN_ID} (esperado: ${CHAIN_ID})${NC}"
else
  echo -e "${GREEN}✅ Anvil está corriendo correctamente (Chain ID: ${DECIMAL_CHAIN_ID})${NC}"
fi

# Verificar si el contrato existe
echo -e "${BLUE}2. Verificando contrato en ${CONTRACT_ADDRESS}...${NC}"
CONTRACT_CODE=$(curl -s -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"${CONTRACT_ADDRESS}\",\"latest\"],\"id\":1}" \
  ${ANVIL_URL} 2>/dev/null | grep -o '"result":"[^"]*"' | sed 's/"result":"//' | sed 's/"//' || echo "")

if [ -z "$CONTRACT_CODE" ] || [ "$CONTRACT_CODE" == "0x" ]; then
  echo -e "${RED}❌ El contrato no está desplegado en ${CONTRACT_ADDRESS}${NC}"
  echo -e "${YELLOW}💡 Para redesplegar el contrato, ejecuta:${NC}"
  echo -e "   ./scripts/deploy.sh"
  exit 1
else
  echo -e "${GREEN}✅ Contrato encontrado en ${CONTRACT_ADDRESS}${NC}"
fi

# Verificar el precio actual
echo -e "${BLUE}3. Verificando precio actual del contrato...${NC}"
PRICE_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"${CONTRACT_ADDRESS}\",\"data\":\"0x18160ddd\"},\"latest\"],\"id\":1}" \
  ${ANVIL_URL} 2>/dev/null || echo "")

# Intentar leer pricePerMonth (function selector: 0x26a49e37)
PRICE_DATA=$(curl -s -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"${CONTRACT_ADDRESS}\",\"data\":\"0x26a49e37\"},\"latest\"],\"id\":1}" \
  ${ANVIL_URL} 2>/dev/null | grep -o '"result":"[^"]*"' | sed 's/"result":"//' | sed 's/"//' || echo "")

if [ -n "$PRICE_DATA" ] && [ "$PRICE_DATA" != "0x" ]; then
  # Convertir de hex a decimal y luego a ETH
  PRICE_HEX=$(echo "$PRICE_DATA" | sed 's/0x//')
  PRICE_DECIMAL=$(echo "ibase=16; ${PRICE_HEX^^}" | bc 2>/dev/null || echo "0")
  if [ "$PRICE_DECIMAL" != "0" ]; then
    PRICE_ETH=$(echo "scale=18; ${PRICE_DECIMAL} / 1000000000000000000" | bc 2>/dev/null || echo "0")
    echo -e "${GREEN}✅ Precio actual: ${PRICE_ETH} ETH${NC}"
  else
    echo -e "${YELLOW}⚠️  Precio no establecido (0)${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  No se pudo leer el precio del contrato${NC}"
fi

# Verificar el owner
echo -e "${BLUE}4. Verificando owner del contrato...${NC}"
OWNER_DATA=$(curl -s -X POST -H "Content-Type: application/json" \
  --data "{\"jsonrpc\":\"2.0\",\"method\":\"eth_call\",\"params\":[{\"to\":\"${CONTRACT_ADDRESS}\",\"data\":\"0x8da5cb5b\"},\"latest\"],\"id\":1}" \
  ${ANVIL_URL} 2>/dev/null | grep -o '"result":"[^"]*"' | sed 's/"result":"//' | sed 's/"//' || echo "")

if [ -n "$OWNER_DATA" ] && [ "$OWNER_DATA" != "0x" ]; then
  OWNER_ADDRESS="0x$(echo "$OWNER_DATA" | sed 's/0x//' | tail -c 41)"
  echo -e "${GREEN}✅ Owner: ${OWNER_ADDRESS}${NC}"
  echo -e "${BLUE}   (Cuenta 0 de Anvil: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266)${NC}"
else
  echo -e "${YELLOW}⚠️  No se pudo leer el owner del contrato${NC}"
fi

echo -e "${GREEN}✅ Verificación completada${NC}"
