'use client';

import { useState, useEffect, useRef } from 'react';
import { createWalletClient, custom, type Address } from 'viem';
import { anvil } from '../config/chains';

// Helper function to check if MetaMask is available (not Phantom or other wallets)
const isMetaMask = (): boolean => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return false;
  }
  
  // Explicitly check for Phantom and reject it
  if (window.ethereum.isPhantom || (window as any).phantom) {
    return false;
  }
  
  // Check if it's MetaMask (has isMetaMask property)
  // Phantom and other wallets don't have this property
  return window.ethereum.isMetaMask === true;
};

export function useWallet() {
  const [account, setAccount] = useState<Address | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const listenersSetupRef = useRef(false);
  const reloadingRef = useRef(false);

  // Get MetaMask provider specifically (exclude Phantom)
  const getMetaMaskProvider = () => {
    if (typeof window === 'undefined' || !window.ethereum) {
      return null;
    }

    // Explicitly reject Phantom
    if (window.ethereum.isPhantom || (window as any).phantom) {
      return null;
    }

    // Check if it's MetaMask specifically
    if (window.ethereum.isMetaMask && !window.ethereum.isPhantom) {
      return window.ethereum;
    }

    // Check if MetaMask is in providers array (EIP-6963)
    // Filter out Phantom from providers
    if (window.ethereum.providers) {
      const metaMaskProvider = window.ethereum.providers.find(
        (provider: any) => provider.isMetaMask && !provider.isPhantom
      );
      if (metaMaskProvider) {
        return metaMaskProvider;
      }
    }

    return null;
  };

  // Check initial connection and subscribe to account changes
  useEffect(() => {
    // Prevent multiple setups
    if (listenersSetupRef.current) {
      return;
    }

    const provider = getMetaMaskProvider();
    
    if (!provider) {
      return;
    }

    listenersSetupRef.current = true;

    // Check initial connection
    const checkConnection = async () => {
      try {
        const accounts = await provider.request({ method: 'eth_accounts' });
        if (accounts.length > 0) {
          const newAccount = accounts[0] as Address;
          setAccount((prevAccount) => {
            // Only update if account actually changed
            if (prevAccount?.toLowerCase() !== newAccount.toLowerCase()) {
              return newAccount;
            }
            return prevAccount;
          });
        } else {
          setAccount((prevAccount) => prevAccount ? null : prevAccount);
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
        setAccount(null);
      }
    };

    checkConnection();

    // Subscribe to account changes
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length > 0) {
        const newAccount = accounts[0] as Address;
        setAccount((prevAccount) => {
          // Only update if account actually changed
          if (prevAccount?.toLowerCase() !== newAccount.toLowerCase()) {
            return newAccount;
          }
          return prevAccount;
        });
      } else {
        // User disconnected their wallet
        setAccount((prevAccount) => prevAccount ? null : prevAccount);
      }
    };

    // Subscribe to chain changes
    const handleChainChanged = (chainId: string) => {
      // Don't reload automatically - just log the change
      // The user can manually refresh if needed
      const newChainId = parseInt(chainId, 16);
      console.log('Chain changed to:', newChainId);
      
      // If we're not on Anvil, show a message but don't reload
      if (newChainId !== anvil.id) {
        console.warn('Please switch to Anvil network (Chain ID: 3133731337)');
      }
    };

    // Add event listeners
    provider.on('accountsChanged', handleAccountsChanged);
    provider.on('chainChanged', handleChainChanged);

    // Cleanup: remove listeners on unmount
    return () => {
      listenersSetupRef.current = false;
      reloadingRef.current = false;
      if (provider && typeof provider.removeListener === 'function') {
        try {
          provider.removeListener('accountsChanged', handleAccountsChanged);
          provider.removeListener('chainChanged', handleChainChanged);
        } catch (err) {
          console.error('Error removing listeners:', err);
        }
      }
    };
  }, []); // Empty dependency array - only run once on mount

  const connect = async () => {
    const provider = getMetaMaskProvider();
    
    if (!provider) {
      setError('MetaMask no está instalado. Por favor, instala MetaMask para continuar.');
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      // Request account access
      const accounts = await provider.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length > 0) {
        setAccount(accounts[0] as Address);
      }

      // Check current chain before switching
      try {
        const currentChainId = await provider.request({ method: 'eth_chainId' });
        const currentChainIdNumber = parseInt(currentChainId as string, 16);
        
        // Only switch if we're not already on the correct chain
        if (currentChainIdNumber !== anvil.id) {
          try {
            await provider.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${anvil.id.toString(16)}` }],
            });
          } catch (switchError: any) {
            // If the chain doesn't exist, add it
            if (switchError.code === 4902) {
              await provider.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: `0x${anvil.id.toString(16)}`,
                    chainName: anvil.name,
                    nativeCurrency: anvil.nativeCurrency,
                    rpcUrls: anvil.rpcUrls.default.http,
                  },
                ],
              });
            }
          }
        }
      } catch (err) {
        console.error('Error checking/switching chain:', err);
      }
    } catch (err: any) {
      setError(err.message || 'Error al conectar la wallet');
      console.error('Error connecting wallet:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAccount(null);
    setError(null);
  };

  const getWalletClient = () => {
    const provider = getMetaMaskProvider();
    
    if (!provider) {
      return null;
    }

    return createWalletClient({
      chain: anvil,
      transport: custom(provider),
    });
  };

  return {
    account,
    isConnecting,
    error,
    connect,
    disconnect,
    getWalletClient,
    isConnected: account !== null,
  };
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    ethereum?: any;
    phantom?: any;
  }
}

