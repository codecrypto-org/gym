'use client';

import { useState, useEffect } from 'react';
import { createPublicClient, createWalletClient, custom, http, type Address, formatEther, parseEther } from 'viem';
import { anvil } from '../config/chains';
import { GymSBT_ABI, getGymSBTAddress } from '../contracts';

export function useGymSBT(account: Address | null) {
  const [pricePerMonth, setPricePerMonth] = useState<bigint | null>(null);
  const [contractAddress, setContractAddress] = useState<Address | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const publicClient = createPublicClient({
    chain: anvil,
    transport: http(anvil.rpcUrls.default.http[0]),
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const address = getGymSBTAddress(anvil.id);
    if (address) {
      setContractAddress((prev) => {
        const newAddress = address as Address;
        if (prev?.toLowerCase() === newAddress.toLowerCase()) {
          return prev;
        }
        return newAddress;
      });
    }
  }, []);

  // Load price when contract address is set
  useEffect(() => {
    if (contractAddress) {
      loadPrice();
    }
  }, [contractAddress]);

  // Check owner when account or contract address changes
  useEffect(() => {
    if (contractAddress && account) {
      checkOwner();
    } else {
      setIsOwner(false);
    }
  }, [account, contractAddress]);

  const loadPrice = async () => {
    if (!contractAddress) return;

    try {
      const price = await publicClient.readContract({
        address: contractAddress,
        abi: GymSBT_ABI,
        functionName: 'pricePerMonth',
        args: [],
      });
      setPricePerMonth(BigInt(price as unknown as string | number | bigint));
    } catch (err) {
      console.error('Error loading price:', err);
    }
  };

  const checkOwner = async () => {
    if (!contractAddress || !account) return;

    try {
      const owner = await publicClient.readContract({
        address: contractAddress,
        abi: GymSBT_ABI,
        functionName: 'owner',
        args: [],
      });
      setIsOwner((owner as unknown as Address).toLowerCase() === account.toLowerCase());
    } catch (err) {
      console.error('Error checking owner:', err);
    }
  };

  const purchaseToken = async (months: number) => {
    if (!contractAddress || !account || !pricePerMonth || typeof window === 'undefined' || !window.ethereum?.isMetaMask) {
      throw new Error('MetaMask no está conectado o contrato no disponible');
    }

    setLoading(true);
    setError(null);

    try {
      const walletClient = createWalletClient({
        chain: anvil,
        transport: custom(window.ethereum),
      });

      const totalPrice = pricePerMonth * BigInt(months);

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: GymSBT_ABI,
        functionName: 'purchaseToken',
        args: [BigInt(months)],
        value: totalPrice,
        account,
      });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      return receipt;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al comprar el token';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const setPrice = async (newPrice: string) => {
    if (!contractAddress || !account || typeof window === 'undefined' || !window.ethereum?.isMetaMask) {
      throw new Error('MetaMask no está conectado o contrato no disponible');
    }

    if (!isOwner) {
      throw new Error('Solo el propietario puede establecer el precio');
    }

    setLoading(true);
    setError(null);

    try {
      const walletClient = createWalletClient({
        chain: anvil,
        transport: custom(window.ethereum),
      });

      const priceInWei = parseEther(newPrice);

      const hash = await walletClient.writeContract({
        address: contractAddress,
        abi: GymSBT_ABI,
        functionName: 'setPricePerMonth',
        args: [priceInWei],
        account,
      });

      // Wait for transaction receipt
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      
      // Reload price
      await loadPrice();
      
      return receipt;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al establecer el precio';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = (months: number): string => {
    if (!pricePerMonth) return '0';
    const total = pricePerMonth * BigInt(months);
    return formatEther(total);
  };

  return {
    pricePerMonth: pricePerMonth ? formatEther(pricePerMonth) : null,
    contractAddress,
    isOwner,
    loading,
    error,
    purchaseToken,
    setPrice,
    calculatePrice,
    loadPrice,
  };
}

