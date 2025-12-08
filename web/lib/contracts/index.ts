/**
 * Contract exports for the web application
 */

import GymSBT_ABI_JSON from './GymSBT.json';
import { GYM_SBT_ADDRESSES, getGymSBTAddress } from './addresses';

// Export ABI as const for type safety
// The JSON file contains the ABI array directly
export const GymSBT_ABI = GymSBT_ABI_JSON as any[];
export { GYM_SBT_ADDRESSES, getGymSBTAddress };

// Type definitions for better TypeScript support
export type GymSBT_ABI = typeof GymSBT_ABI;

