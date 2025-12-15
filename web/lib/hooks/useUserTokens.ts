'use client';

import { useState, useEffect } from 'react';
import { useReadContract, usePublicClient } from 'wagmi';
import { formatEther, type Address } from 'viem';
import { anvil } from '../config/chains';
import { GymSBT_ABI, getGymSBTAddress } from '../contracts';

export interface UserToken {
  tokenId: bigint;
  expirationDate: Date;
  isValid: boolean;
  daysRemaining: number;
}

export function useUserTokens(account: Address | null) {
  const [contractAddress, setContractAddress] = useState<Address | null>(null);
  const [tokens, setTokens] = useState<UserToken[]>([]);
  const [loading, setLoading] = useState(false);
  const publicClient = usePublicClient();

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

  // Read balance
  const { data: balanceData } = useReadContract({
    address: contractAddress || undefined,
    abi: GymSBT_ABI,
    functionName: 'balanceOf',
    args: account ? [account] : undefined,
    query: {
      enabled: !!contractAddress && !!account,
    },
  });

  const balance = balanceData ? (typeof balanceData === 'bigint' ? balanceData : BigInt(String(balanceData))) : BigInt(0);

  // Fetch user tokens
  useEffect(() => {
    if (!contractAddress || !account || !publicClient || balance === BigInt(0)) {
      setTokens([]);
      return;
    }

    const fetchTokens = async () => {
      setLoading(true);
      try {
        const userTokens: UserToken[] = [];
        
        // Since we don't have a tokenOfOwnerByIndex function, we need to iterate
        // through possible token IDs. We'll check up to a reasonable limit (e.g., 1000)
        // or until we find all tokens
        const maxTokenId = 1000;
        let foundCount = 0;

        for (let i = 1; i <= maxTokenId && foundCount < Number(balance); i++) {
          try {
            // Check if token exists and belongs to user
            const owner = await publicClient.readContract({
              address: contractAddress,
              abi: GymSBT_ABI,
              functionName: 'ownerOf',
              args: [BigInt(i)],
            });

            const ownerAddress = typeof owner === 'string' ? owner : String(owner);
            if (ownerAddress.toLowerCase() === account.toLowerCase()) {
              // Get expiration date
              const expirationTimestamp = await publicClient.readContract({
                address: contractAddress,
                abi: GymSBT_ABI,
                functionName: 'getExpiration',
                args: [BigInt(i)],
              });

              const expiration = typeof expirationTimestamp === 'bigint' 
                ? expirationTimestamp 
                : BigInt(String(expirationTimestamp));

              // Check if token is valid
              const isValid = await publicClient.readContract({
                address: contractAddress,
                abi: GymSBT_ABI,
                functionName: 'isValid',
                args: [BigInt(i)],
              });

              const isValidBool = typeof isValid === 'boolean' ? isValid : Boolean(isValid);
              
              const expirationDate = new Date(Number(expiration) * 1000);
              const now = new Date();
              const daysRemaining = Math.ceil((expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

              userTokens.push({
                tokenId: BigInt(i),
                expirationDate,
                isValid: isValidBool,
                daysRemaining,
              });

              foundCount++;
            }
          } catch (err) {
            // Token doesn't exist or error reading, continue
            continue;
          }
        }

        // Sort by token ID
        userTokens.sort((a, b) => {
          if (a.tokenId < b.tokenId) return -1;
          if (a.tokenId > b.tokenId) return 1;
          return 0;
        });

        setTokens(userTokens);
      } catch (err) {
        console.error('Error fetching user tokens:', err);
        setTokens([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTokens();
  }, [contractAddress, account, publicClient, balance]);

  return {
    tokens,
    balance: Number(balance),
    loading,
  };
}
