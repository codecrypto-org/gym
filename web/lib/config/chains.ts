import { defineChain } from 'viem';

/**
 * Anvil local network configuration
 * Chain ID: 31337 (default Anvil chain ID)
 * Port: 8545 (default Anvil port)
 */
export const anvil = defineChain({
  id: 31337,
  name: 'Anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545'],
    },
  },
});

