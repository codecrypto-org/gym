import { injected } from 'wagmi/connectors';

/**
 * Custom connector for Rabbit Wallet
 * Rabbit wallet injects itself into window.ethereum
 * This connector uses the standard injected connector which will
 * automatically detect Rabbit wallet when it's available
 */
export function rabbitWallet() {
  // Use the injected connector which will detect window.ethereum
  // Rabbit wallet should inject itself into window.ethereum
  return injected();
}
