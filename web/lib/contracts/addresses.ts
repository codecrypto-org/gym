/**
 * Contract addresses deployed on different networks
 * This file is automatically updated when deploying contracts
 */

export const GYM_SBT_ADDRESSES: Record<string, string> = {
  // Anvil local network (chainId: 31337 - default)
  anvil: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  // Add other networks as needed
  // sepolia: "",
  // mainnet: "",
};

export const getGymSBTAddress = (chainId: number): string | undefined => {
  // Anvil chain ID (default is 31337)
  if (chainId === 31337 || chainId === 3133731337) {
    return GYM_SBT_ADDRESSES.anvil;
  }
  // Add other chain IDs as needed
  return undefined;
};

