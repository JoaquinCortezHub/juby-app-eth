# Juby Vault Deployment Guide

## Overview

This guide explains how to deploy the Juby Vault smart contracts to World Chain Sepolia testnet.

## Contracts

1. **MockUSDC.sol** - Test USDC token with public minting
2. **MockMorphoVault.sol** - ERC4626-compliant vault simulating Morpho (5% APY)
3. **JubyVault.sol** - Main vault with goal-based savings and early withdrawal penalties

## Architecture

```
User → JubyVault → MockMorphoVault → Yield Generation
         ↓
    (Early withdrawal)
         ↓
    50% yield penalty → Juby Treasury
```

## Prerequisites

- Node.js and npm installed
- Wallet with World Chain Sepolia ETH
- Deployment tool (Hardhat, Foundry, or Remix)

## Network Information

**World Chain Sepolia Testnet:**
- Chain ID: `4801`
- RPC URL: `https://worldchain-sepolia.g.alchemy.com/public`
- Block Explorer: `https://sepolia.worldscan.org`
- Faucet: `https://www.alchemy.com/faucets/world-chain-sepolia`

## Deployment Steps

### Option 1: Using Remix (Easiest for Hackathon)

1. **Get Testnet ETH**
   - Visit https://www.alchemy.com/faucets/world-chain-sepolia
   - Enter your wallet address
   - Receive World Chain Sepolia ETH

2. **Add World Chain Sepolia to MetaMask**
   - Network Name: `World Chain Sepolia`
   - RPC URL: `https://worldchain-sepolia.g.alchemy.com/public`
   - Chain ID: `4801`
   - Currency Symbol: `ETH`
   - Block Explorer: `https://sepolia.worldscan.org`

3. **Deploy with Remix**
   - Go to https://remix.ethereum.org
   - Create new files and paste contract code
   - Compile with Solidity 0.8.20+
   - Switch MetaMask to World Chain Sepolia
   - Deploy in this order:

   a. **Deploy MockUSDC**
      - Constructor: No parameters
      - Copy deployed address

   b. **Deploy MockMorphoVault**
      - Constructor parameter: `_asset` = MockUSDC address
      - Copy deployed address

   c. **Deploy JubyVault**
      - Constructor parameters:
        - `_asset` = MockUSDC address
        - `_morphoVault` = MockMorphoVault address
        - `_jubyTreasury` = Your treasury wallet address
      - Copy deployed address

4. **Initialize MockMorphoVault**
   - Call `deposit` on MockMorphoVault with:
     - `assets`: `1000000000` (1000 USDC with 6 decimals)
     - `receiver`: Your address
   - This creates the dead deposit (Morpho best practice)

5. **Mint Test USDC**
   - Call `mint` on MockUSDC
   - Parameters:
     - `to`: Your wallet address or test user address
     - `amount`: `1000000000` (1000 USDC)

### Option 2: Using Hardhat

1. **Install Hardhat**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   npx hardhat init
   ```

2. **Configure hardhat.config.js**
   ```javascript
   require("@nomicfoundation/hardhat-toolbox");

   module.exports = {
     solidity: "0.8.20",
     networks: {
       worldchainSepolia: {
         url: "https://worldchain-sepolia.g.alchemy.com/public",
         chainId: 4801,
         accounts: [process.env.PRIVATE_KEY]
       }
     }
   };
   ```

3. **Create deployment script** (`scripts/deploy.js`)
   ```javascript
   const hre = require("hardhat");

   async function main() {
     console.log("Deploying to World Chain Sepolia...");

     // Deploy MockUSDC
     const MockUSDC = await hre.ethers.getContractFactory("MockUSDC");
     const usdc = await MockUSDC.deploy();
     await usdc.waitForDeployment();
     console.log("MockUSDC deployed to:", await usdc.getAddress());

     // Deploy MockMorphoVault
     const MockMorphoVault = await hre.ethers.getContractFactory("MockMorphoVault");
     const morphoVault = await MockMorphoVault.deploy(await usdc.getAddress());
     await morphoVault.waitForDeployment();
     console.log("MockMorphoVault deployed to:", await morphoVault.getAddress());

     // Deploy JubyVault
     const treasuryAddress = "YOUR_TREASURY_ADDRESS_HERE";
     const JubyVault = await hre.ethers.getContractFactory("JubyVault");
     const jubyVault = await JubyVault.deploy(
       await usdc.getAddress(),
       await morphoVault.getAddress(),
       treasuryAddress
     );
     await jubyVault.waitForDeployment();
     console.log("JubyVault deployed to:", await jubyVault.getAddress());

     // Initialize vault with dead deposit
     console.log("Initializing MockMorphoVault...");
     await usdc.mint(await morphoVault.getAddress(), 1000000000n);
     await morphoVault.deposit(1000000000n, await morphoVault.getAddress());

     console.log("\nDeployment Complete!");
     console.log("====================");
     console.log("MockUSDC:", await usdc.getAddress());
     console.log("MockMorphoVault:", await morphoVault.getAddress());
     console.log("JubyVault:", await jubyVault.getAddress());
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
   ```

4. **Deploy**
   ```bash
   npx hardhat run scripts/deploy.js --network worldchainSepolia
   ```

## Post-Deployment

### Save Contract Addresses

Create a file `lib/contracts/addresses.ts` in your frontend:

```typescript
export const CONTRACTS = {
  MOCK_USDC: "0x...", // Your deployed MockUSDC address
  MORPHO_VAULT: "0x...", // Your deployed MockMorphoVault address
  JUBY_VAULT: "0x...", // Your deployed JubyVault address
} as const;

export const WORLD_CHAIN_SEPOLIA = {
  chainId: 4801,
  name: "World Chain Sepolia",
  rpcUrl: "https://worldchain-sepolia.g.alchemy.com/public",
  blockExplorer: "https://sepolia.worldscan.org",
} as const;
```

### Verify Contracts (Optional)

Visit the block explorer and verify your contracts for transparency:
- Go to https://sepolia.worldscan.org
- Find your contract address
- Click "Verify & Publish"
- Upload source code and constructor parameters

## Testing the Deployment

### 1. Mint Test USDC
```javascript
// Call on MockUSDC contract
mint(userAddress, 1000000000) // 1000 USDC
```

### 2. Test Deposit Flow
```javascript
// 1. Approve JubyVault to spend USDC
approve(jubyVaultAddress, 1000000000)

// 2. Deposit with goal date (e.g., 1 year from now)
const oneYearFromNow = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);
deposit(1000000000, oneYearFromNow)
```

### 3. Check User Info
```javascript
getUserInfo(userAddress)
// Returns: principal, currentValue, yield, goalDate, isEarly, potentialPenalty
```

### 4. Test Withdrawal
```javascript
// Preview first
previewWithdrawal(userAddress)

// Then withdraw
withdraw()
```

## Important Notes

- **First deposit** to MockMorphoVault must be ≥ 1,000,000,000 (1000 USDC) due to dead deposit
- Users can only have **one active deposit** at a time
- **Early withdrawal** (before goal date) incurs 50% yield penalty
- Yield accrues at **~5% APY** (simulated)
- All amounts use **6 decimals** (USDC standard)

## Troubleshooting

**"Insufficient balance"**: Mint more MockUSDC tokens
**"Insufficient allowance"**: Approve JubyVault to spend USDC first
**"First deposit too small"**: Ensure ≥ 1e9 (1000 USDC) for vault initialization
**"Goal date must be in future"**: Use timestamp > current time

## Next Steps

After deployment:
1. Save contract addresses to frontend
2. Extract and save ABIs
3. Implement frontend integration with MiniKit sendTransaction
4. Test complete user flow
