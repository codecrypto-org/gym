/**
 * Contract addresses deployed on different networks
 * This file is automatically updated when deploying contracts
 */

export const GYM_SBT_ADDRESSES: Record<string, string> = {
  // Anvil local network (chainId: 3133731337)
  anvil: "0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0",
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

