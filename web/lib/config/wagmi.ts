import { createConfig, http } from 'wagmi';
import { rabbitWallet } from './rabbitConnector';
import { anvil } from './chains';

export const wagmiConfig = createConfig({
  chains: [anvil],
  connectors: [rabbitWallet()],
  transports: {
    [anvil.id]: http(anvil.rpcUrls.default.http[0]),
  },
});

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
    phantom?: any;
  }
}
