'use client';

import { useAccount, useConnect, useDisconnect, useSwitchChain } from 'wagmi';
import { anvil } from '../config/chains';

// Type for Ethereum provider with Rabbit-specific properties
interface RabbitProvider {
  isRabbit?: boolean;
  _rabbit?: boolean;
  __RABBIT__?: boolean;
  constructor?: {
    name?: string;
  };
  providers?: RabbitProvider[];
  request?: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
}

// Helper to check if Rabbit wallet is available
const isRabbitWalletAvailable = (): boolean => {
  if (typeof window === 'undefined') {
    return false;
  }

  if (!window.ethereum) {
    return false;
  }

  const ethereum = window.ethereum as RabbitProvider | RabbitProvider[];

  // If window.ethereum is an array, find Rabbit wallet
  if (Array.isArray(ethereum)) {
    return ethereum.some(
      (provider: RabbitProvider) => 
        provider.isRabbit || 
        provider._rabbit ||
        provider.__RABBIT__ ||
        (provider.constructor?.name === 'RabbitProvider')
    );
  }

  // Check if it's Rabbit wallet directly
  if (
    ethereum.isRabbit ||
    ethereum._rabbit ||
    ethereum.__RABBIT__ ||
    (ethereum.constructor?.name === 'RabbitProvider')
  ) {
    return true;
  }

  // Also check providers array if it exists (EIP-6963)
  if (ethereum.providers && Array.isArray(ethereum.providers)) {
    return ethereum.providers.some(
      (provider: RabbitProvider) => 
        provider.isRabbit || 
        provider._rabbit ||
        provider.__RABBIT__ ||
        (provider.constructor?.name === 'RabbitProvider')
    );
  }

  // Fallback: if ethereum is available, assume it might be Rabbit
  // (useful for development/testing)
  return !!window.ethereum;
};

export function useWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending: isConnecting, error } = useConnect();
  const { disconnect } = useDisconnect();
  const { switchChain } = useSwitchChain();

  // Get Rabbit wallet connector
  const rabbitConnector = connectors.find(
    (connector) => connector.name === 'Rabbit Wallet' || connector.id === 'injected'
  );

  // Check if Rabbit wallet is available
  const rabbitAvailable = !!rabbitConnector || isRabbitWalletAvailable();

  const handleConnect = async () => {
    // If no connector is available, let wagmi handle the error
    if (!rabbitConnector) {
      // Try to connect anyway - wagmi will show appropriate error
      return;
    }

    try {
      await connect({ connector: rabbitConnector });
      
      // Switch to Anvil network if needed
      try {
        await switchChain({ chainId: anvil.id });
      } catch (switchError: unknown) {
        // If chain doesn't exist, it will be added automatically by wagmi
        console.error('Error switching chain:', switchError);
      }
    } catch (err: unknown) {
      // Error is already handled by wagmi's useConnect hook
      console.error('Error connecting wallet:', err);
    }
  };

  const handleDisconnect = () => {
    disconnect();
  };

  // Only show error message if there's a connection error from wagmi
  const errorMessage = error?.message || 
    (!rabbitAvailable && !isConnected && typeof window !== 'undefined' ? 'Rabbit Wallet no está instalado. Por favor, instala Rabbit Wallet para continuar.' : null);

  return {
    account: address || null,
    isConnected,
    isConnecting,
    error: errorMessage,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isRabbitAvailable: rabbitAvailable,
  };
}
