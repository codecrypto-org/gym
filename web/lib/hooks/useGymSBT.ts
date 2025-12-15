'use client';

import { useState, useEffect } from 'react';
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, usePublicClient } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { formatEther, parseEther, type Address } from 'viem';
import { anvil } from '../config/chains';
import { GymSBT_ABI, getGymSBTAddress } from '../contracts';

export function useGymSBT(account: Address | null) {
  const [contractAddress, setContractAddress] = useState<Address | null>(null);
  const publicClient = usePublicClient();
  const queryClient = useQueryClient();

  // Get contract address
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

  // Read price per month
  const { data: priceData, refetch: refetchPrice } = useReadContract({
    address: contractAddress || undefined,
    abi: GymSBT_ABI,
    functionName: 'pricePerMonth',
    query: {
      enabled: !!contractAddress,
      refetchInterval: false,
      staleTime: 0, // Always consider data stale to allow refetching
    },
  });

  const pricePerMonth = priceData ? (typeof priceData === 'bigint' ? priceData : BigInt(String(priceData))) : null;

  // Debug: log price changes
  useEffect(() => {
    if (pricePerMonth !== null) {
      console.log('Price updated:', formatEther(pricePerMonth), 'ETH');
    }
  }, [pricePerMonth]);

  // Read owner
  const { data: ownerData, isLoading: isLoadingOwner } = useReadContract({
    address: contractAddress || undefined,
    abi: GymSBT_ABI,
    functionName: 'owner',
    query: {
      enabled: !!contractAddress,
    },
  });

  // Debug logging
  useEffect(() => {
    if (account && ownerData) {
      const accountLower = account.toLowerCase();
      const ownerLower = String(ownerData).toLowerCase();
      const isOwnerCheck = accountLower === ownerLower;
      console.log('Owner check:', {
        account: accountLower,
        owner: ownerLower,
        isOwner: isOwnerCheck,
        contractAddress,
        expectedOwner: '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266',
      });
    }
  }, [account, ownerData, contractAddress]);

  const isOwner = account && ownerData && account.toLowerCase() === String(ownerData).toLowerCase();

  // Write contract hooks
  const { writeContract, data: hash, isPending: isWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  const loading = isWriting || isConfirming;
  const error = writeError?.message || null;

  // Refetch price when transaction is confirmed
  const [lastConfirmedHash, setLastConfirmedHash] = useState<string | null>(null);
  useEffect(() => {
    if (isConfirmed && hash && hash !== lastConfirmedHash) {
      console.log('Transaction confirmed, refetching price...', { hash, contractAddress });
      setLastConfirmedHash(hash);
      // Invalidate and refetch the price query
      const timer = setTimeout(async () => {
        if (contractAddress) {
          // Invalidate all readContract queries for this contract
          await queryClient.invalidateQueries({
            predicate: (query) => {
              const key = query.queryKey;
              return (
                Array.isArray(key) &&
                key[0] === 'readContract' &&
                typeof key[1] === 'object' &&
                key[1] !== null &&
                'address' in key[1] &&
                (key[1] as { address?: string }).address?.toLowerCase() === contractAddress.toLowerCase() &&
                'functionName' in key[1] &&
                (key[1] as { functionName?: string }).functionName === 'pricePerMonth'
              );
            },
          });
          // Also manually refetch
          await refetchPrice();
          console.log('Price refetched');
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isConfirmed, hash, lastConfirmedHash, refetchPrice, contractAddress, queryClient]);

  const calculatePrice = (months: number): string => {
    if (!pricePerMonth || months <= 0) return '0';
    const total = pricePerMonth * BigInt(months);
    return formatEther(total);
  };

  const purchaseToken = async (months: number) => {
    if (!contractAddress || !pricePerMonth) {
      const errorMsg = 'Contrato no disponible o precio no establecido';
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    if (!account) {
      const errorMsg = 'Wallet no conectada. Por favor, conecta tu wallet primero.';
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    const totalPrice = pricePerMonth * BigInt(months);

    try {
      await writeContract({
        address: contractAddress,
        abi: GymSBT_ABI,
        functionName: 'purchaseToken',
        args: [BigInt(months)],
        value: totalPrice,
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Error al comprar el token';
      console.error(errorMsg, err);
      return Promise.reject(new Error(errorMsg));
    }
  };

  const setPrice = async (priceInEth: string) => {
    if (!contractAddress) {
      const errorMsg = 'Contrato no disponible';
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    if (!account) {
      const errorMsg = 'Wallet no conectada. Por favor, conecta tu wallet primero.';
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    const priceInWei = parseEther(priceInEth);

    try {
      await writeContract({
        address: contractAddress,
        abi: GymSBT_ABI,
        functionName: 'setPricePerMonth',
        args: [priceInWei],
      });
      // The refetch will happen automatically when the transaction is confirmed
      // via the useEffect hook that watches isConfirmed
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error al establecer el precio';
      console.error(errorMsg, err);
      return Promise.reject(new Error(errorMsg));
    }
  };

  const withdrawFunds = async () => {
    if (!contractAddress) {
      const errorMsg = 'Contrato no disponible';
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    if (!account) {
      const errorMsg = 'Wallet no conectada. Por favor, conecta tu wallet primero.';
      console.error(errorMsg);
      return Promise.reject(new Error(errorMsg));
    }

    try {
      await writeContract({
        address: contractAddress,
        abi: GymSBT_ABI,
        functionName: 'withdrawFunds',
        args: [],
      });
    } catch (err: any) {
      const errorMsg = err.message || 'Error al retirar fondos';
      console.error(errorMsg, err);
      return Promise.reject(new Error(errorMsg));
    }
  };

  return {
    pricePerMonth,
    contractAddress,
    isOwner,
    loading,
    error,
    calculatePrice,
    purchaseToken,
    setPrice,
    withdrawFunds,
    isConfirmed,
    refetchPrice,
  };
}
