import { defineChain } from 'viem';

/**
 * Anvil local network configuration
 * Chain ID: 3133731337
 * Port: 55556
 */
export const anvil = defineChain({
  id: 3133731337,
  name: 'Anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ether',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:55556'],
    },
  },
});

