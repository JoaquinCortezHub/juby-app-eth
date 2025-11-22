/**
 * Contract Addresses for World Chain Sepolia
 *
 * IMPORTANT: Update these addresses after deploying contracts
 * See contracts/DEPLOYMENT.md for deployment instructions
 */

export const CONTRACTS = {
  // TODO: Replace with actual deployed addresses
  MOCK_USDC: "0xF7CD2D04750748165B203d71D2A35e4426b2546f", // Replace after deployment
  MORPHO_VAULT: "0x4A7Ffcc8E6F797Ba4Dd4dE7610Eca3e0E39483ad", // Replace after deployment
  JUBY_VAULT: "0xb125F0a1501fD8383EC421dcF52A37d100a5dE02", // Replace after deployment
} as const;

export const WORLD_CHAIN_SEPOLIA = {
  chainId: 4801,
  name: "World Chain Sepolia",
  rpcUrl: "https://worldchain-sepolia.g.alchemy.com/public",
  blockExplorer: "https://sepolia.worldscan.org",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18,
  },
} as const;

// Helper to check if addresses are configured
export function areContractsDeployed(): boolean {
  return (
    CONTRACTS.MOCK_USDC !== "0xF7CD2D04750748165B203d71D2A35e4426b2546f" &&
    CONTRACTS.MORPHO_VAULT !== "0x4A7Ffcc8E6F797Ba4Dd4dE7610Eca3e0E39483ad" &&
    CONTRACTS.JUBY_VAULT !== "0xb125F0a1501fD8383EC421dcF52A37d100a5dE02"
  );
}

// USDC decimals (standard)
export const USDC_DECIMALS = 6;

// Helper to convert USDC amount to wei (with 6 decimals)
export function toUSDC(amount: number): bigint {
  return BigInt(Math.floor(amount * 10 ** USDC_DECIMALS));
}

// Helper to convert USDC wei to human-readable amount
export function fromUSDC(wei: bigint): number {
  return Number(wei) / 10 ** USDC_DECIMALS;
}
