/**
 * Contract addresses deployed on different networks
 * This file is automatically updated when deploying contracts
 */

export const GYM_SBT_ADDRESSES: Record<string, string> = {
  // Anvil local network (chainId: 31337 - default)
  anvil: "0xB7f8BC63BbcaD18155201308C8f3540b07f84F5e",

  // Add other networks as needed
  // sepolia: "",
  // mainnet: "",
};

export const getGymSBTAddress = (chainId: number): string | undefined => {
  // Anvil chain ID (default is 31337)
  if (chainId === 31337) {
    return GYM_SBT_ADDRESSES.anvil;
  }
  // Add other chain IDs as needed
  return undefined;
};

