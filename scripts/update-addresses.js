#!/usr/bin/env node

/**
 * Script para actualizar las direcciones de los contratos deployados
 * Uso: node scripts/update-addresses.js <contract-address> [chain-id]
 */

const fs = require('fs');
const path = require('path');

const contractAddress = process.argv[2];
const chainId = process.argv[3] || '3133731337'; // Default: Anvil

if (!contractAddress) {
  console.error('Error: Se requiere la dirección del contrato');
  console.error('Uso: node scripts/update-addresses.js <contract-address> [chain-id]');
  process.exit(1);
}

// Validar formato de dirección
if (!/^0x[a-fA-F0-9]{40}$/.test(contractAddress)) {
  console.error('Error: Dirección de contrato inválida');
  process.exit(1);
}

const addressesFile = path.join(__dirname, '../web/lib/contracts/addresses.ts');

// Determinar el nombre de la red basado en el chainId
let networkName = 'anvil';
if (chainId === '3133731337') {
  networkName = 'anvil';
} else if (chainId === '11155111') {
  networkName = 'sepolia';
} else if (chainId === '1') {
  networkName = 'mainnet';
} else {
  networkName = `chain_${chainId}`;
}

// Leer el archivo actual si existe
let addressesContent = '';
if (fs.existsSync(addressesFile)) {
  addressesContent = fs.readFileSync(addressesFile, 'utf8');
} else {
  // Crear contenido inicial
  addressesContent = `/**
 * Contract addresses deployed on different networks
 * This file is automatically updated when deploying contracts
 */

export const GYM_SBT_ADDRESSES: Record<string, string> = {
  // Anvil local network (chainId: 3133731337)
  anvil: "",
  // Add other networks as needed
  // sepolia: "",
  // mainnet: "",
};

export const getGymSBTAddress = (chainId: number): string | undefined => {
  // Anvil chain ID
  if (chainId === 3133731337) {
    return GYM_SBT_ADDRESSES.anvil;
  }
  // Add other chain IDs as needed
  return undefined;
};
`;
}

// Actualizar la dirección en el objeto GYM_SBT_ADDRESSES
const addressRegex = new RegExp(`(anvil|sepolia|mainnet|chain_\\d+):\\s*"[^"]*"`, 'g');
const newAddressEntry = `${networkName}: "${contractAddress}"`;

// Si la red ya existe, reemplazarla; si no, agregarla
if (addressesContent.includes(`${networkName}:`)) {
  addressesContent = addressesContent.replace(
    new RegExp(`${networkName}:\\s*"[^"]*"`),
    newAddressEntry
  );
} else {
  // Agregar la nueva entrada antes del cierre del objeto
  addressesContent = addressesContent.replace(
    /(\s+)(\/\/ Add other networks as needed)/,
    `$1${newAddressEntry},\n$1$2`
  );
}

// Actualizar la función getGymSBTAddress si es necesario
if (!addressesContent.includes(`if (chainId === ${chainId})`)) {
  const chainIdCheck = `  if (chainId === ${chainId}) {
    return GYM_SBT_ADDRESSES.${networkName};
  }`;
  
  addressesContent = addressesContent.replace(
    /(\/\/ Add other chain IDs as needed)/,
    `${chainIdCheck}\n  $1`
  );
}

// Escribir el archivo actualizado
fs.writeFileSync(addressesFile, addressesContent, 'utf8');

console.log(`✅ Dirección del contrato actualizada:`);
console.log(`   Red: ${networkName}`);
console.log(`   Chain ID: ${chainId}`);
console.log(`   Dirección: ${contractAddress}`);
console.log(`   Archivo: ${addressesFile}`);

