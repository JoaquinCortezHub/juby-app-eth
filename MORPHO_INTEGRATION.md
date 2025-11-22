# Morpho DeFi Integration - Juby Vault

## 🎯 Overview

This implementation integrates Morpho-style yield generation into Juby with a unique goal-based savings model that penalizes early withdrawals. Built for World Chain Sepolia using World's `sendTransaction` command for all contract interactions.

## 📋 Table of Contents

- [Architecture](#architecture)
- [Smart Contracts](#smart-contracts)
- [Frontend Integration](#frontend-integration)
- [Deployment Guide](#deployment-guide)
- [User Flow](#user-flow)
- [Next Steps](#next-steps)
- [Testing](#testing)

## 🏗️ Architecture

### System Design

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ (World MiniKit)
       │ sendTransaction
       ▼
┌─────────────────────┐
│    JubyVault.sol    │  ◄─── Main Contract
│  Goal-Based Logic   │
└──────┬──────────────┘
       │
       │ deposit/redeem
       ▼
┌──────────────────────┐
│ MockMorphoVault.sol  │  ◄─── ERC4626 Vault
│  Simulates 5% APY    │       (Morpho-compliant)
└──────┬───────────────┘
       │
       │ stores
       ▼
┌─────────────────┐
│  MockUSDC.sol   │  ◄─── Test Token
└─────────────────┘
```

### Key Features

1. **Goal-Based Savings**: Users set a target withdrawal date
2. **Early Withdrawal Penalty**: 50% of yield goes to Juby treasury if withdrawn early
3. **ERC4626 Compliant**: Compatible with real Morpho vaults post-hackathon
4. **World Chain Native**: Uses `sendTransaction` for all blockchain interactions
5. **Morpho Best Practices**: Implements dead deposit protection and proper share mechanics

## 📜 Smart Contracts

### 1. JubyVault.sol (Main Contract)

**Purpose**: Manages user deposits with goal dates and penalty logic

**Key Functions**:
- `deposit(uint256 amount, uint256 goalDate)`: Deposit USDC with a savings goal
- `withdraw()`: Withdraw with automatic penalty calculation
- `getUserInfo(address user)`: Get deposit info including potential penalties
- `previewWithdrawal(address user)`: Preview withdrawal amounts

**Penalty Logic**:
```solidity
if (block.timestamp < goalDate && yield > 0) {
    penalty = yield / 2;  // 50% to Juby treasury
    userReceives = principal + (yield - penalty);
} else {
    userReceives = principal + yield;  // Full amount
}
```

**Storage**:
```solidity
struct UserDeposit {
    uint256 shares;       // Morpho vault shares
    uint256 principal;    // Original deposit
    uint256 goalDate;     // Target withdrawal date
    uint256 depositDate;  // When deposited
    bool exists;          // Active deposit flag
}
```

### 2. MockMorphoVault.sol (ERC4626 Vault)

**Purpose**: Simulates Morpho vault with yield generation

**Morpho Conventions Implemented**:
- ✅ Dead deposit protection (1e9 shares at 0xdead)
- ✅ Share price appreciation (yield accrual)
- ✅ Full ERC4626 standard compliance
- ✅ Proper asset/share conversion

**Yield Simulation**:
```solidity
// 5% APY calculation
uint256 yield = (totalAssets * 500 * timeElapsed) / (365 days * 10000);
```

**ERC4626 Functions**:
- `deposit()`, `mint()`, `withdraw()`, `redeem()`
- `convertToShares()`, `convertToAssets()`
- `totalAssets()` with real-time yield accrual

### 3. MockUSDC.sol (Test Token)

**Purpose**: ERC20 token for testing (6 decimals like real USDC)

**Features**:
- Public `mint()` function for easy testing
- Standard ERC20 interface
- 6 decimal precision

## 💻 Frontend Integration

### Contract Addresses (`lib/contracts/addresses.ts`)

```typescript
export const CONTRACTS = {
  MOCK_USDC: "0x...",      // Deploy and update
  MORPHO_VAULT: "0x...",   // Deploy and update
  JUBY_VAULT: "0x...",     // Deploy and update
};
```

### ABIs (`lib/contracts/abis.ts`)

Exported ABIs for all three contracts with TypeScript typing.

### Components

#### 1. InvestmentScreen (`components/InvestmentScreen.tsx`)

**Features**:
- Amount selection with slider and editable input
- Goal date picker (6 months, 1 year, 2 years, 3 years)
- Two-step transaction flow:
  1. Approve USDC spending
  2. Deposit to JubyVault
- Real-time transaction status
- Error handling

**Usage of sendTransaction**:
```typescript
// Step 1: Approve
await sendTransaction({
  transaction: [{
    address: CONTRACTS.MOCK_USDC,
    abi: MOCK_USDC_ABI,
    functionName: "approve",
    args: [CONTRACTS.JUBY_VAULT, amount]
  }]
});

// Step 2: Deposit
await sendTransaction({
  transaction: [{
    address: CONTRACTS.JUBY_VAULT,
    abi: JUBY_VAULT_ABI,
    functionName: "deposit",
    args: [amount, goalDate]
  }]
});
```

#### 2. WithdrawScreen (`components/WithdrawScreen.tsx`)

**Features**:
- Displays current investment value
- Shows principal, yield, and goal date
- Early withdrawal warning with penalty calculation
- Visual breakdown of amounts
- Confirmation modal
- Handles withdrawal with `sendTransaction`

**Penalty Display Logic**:
```typescript
if (isEarly && potentialPenalty > 0) {
  // Show warning and penalty breakdown
  userWillReceive = currentValue - potentialPenalty;
} else {
  // Show success message
  userWillReceive = currentValue;
}
```

## 🚀 Deployment Guide

See [`contracts/DEPLOYMENT.md`](contracts/DEPLOYMENT.md) for detailed deployment instructions.

### Quick Start

1. **Get World Chain Sepolia ETH**
   - Visit: https://www.alchemy.com/faucets/world-chain-sepolia

2. **Deploy Contracts** (Remix recommended for hackathon)
   - Deploy MockUSDC
   - Deploy MockMorphoVault (pass USDC address)
   - Deploy JubyVault (pass USDC, Morpho, Treasury addresses)

3. **Initialize Vault**
   - Mint 1000 USDC to yourself
   - Approve MockMorphoVault
   - Call `deposit(1000000000, yourAddress)` on MockMorphoVault

4. **Update Frontend**
   - Edit `lib/contracts/addresses.ts`
   - Add deployed contract addresses

5. **Configure World Developer Portal**
   - Add JubyVault contract to your World App
   - Configure allowed contract interactions

## 👤 User Flow

### Deposit Flow

1. User navigates to `/invest` page
2. Selects investment amount (slider + input)
3. Chooses goal date (6mo, 1yr, 2yr, 3yr)
4. Clicks "Recibir e Invertir"
5. **Transaction 1**: Approves USDC spending
6. **Transaction 2**: Deposits to JubyVault with goal date
7. JubyVault deposits to MockMorphoVault
8. User receives success confirmation
9. Redirects to dashboard

### Withdraw Flow

1. User navigates to `/withdraw` page
2. Views current investment value and yield
3. Sees penalty warning if withdrawing early
4. Reviews breakdown:
   - Total value
   - Penalty (if applicable)
   - Final amount to receive
5. Clicks "Confirmar Retiro"
6. Confirms in modal
7. **Transaction**: Calls `withdraw()` on JubyVault
8. JubyVault calculates penalty
9. Redeems from MockMorphoVault
10. Transfers USDC to user (minus penalty)
11. Penalty sent to Juby treasury
12. Redirects to dashboard

## 📊 Data Flow

### Deposit

```
User USDC → JubyVault → MockMorphoVault
                ↓
         Record: {
           shares,
           principal,
           goalDate,
           depositDate
         }
```

### Withdraw

```
JubyVault.withdraw()
    ↓
Calculate: currentValue = convertToAssets(shares)
    ↓
Calculate: yield = currentValue - principal
    ↓
Check: block.timestamp < goalDate?
    ↓
  YES: penalty = yield / 2
   NO: penalty = 0
    ↓
Redeem from MockMorphoVault
    ↓
Transfer penalty to treasury (if applicable)
    ↓
Transfer remaining to user
```

## ✅ Next Steps

### Before Testing

- [ ] Deploy contracts to World Chain Sepolia
- [ ] Update `lib/contracts/addresses.ts` with deployed addresses
- [ ] Configure contracts in World Developer Portal
- [ ] Mint test USDC tokens

### Testing Checklist

- [ ] Test deposit with different amounts
- [ ] Test deposit with different goal dates
- [ ] Verify yield accrual over time
- [ ] Test early withdrawal (before goal)
- [ ] Test on-time withdrawal (after goal)
- [ ] Verify penalty calculations
- [ ] Test error cases (insufficient balance, etc.)
- [ ] Verify transaction status feedback

### Production Readiness

- [ ] Replace MockMorphoVault with real Morpho vault address
- [ ] Update to production USDC address
- [ ] Implement proper user address detection (wallet)
- [ ] Add contract verification on block explorer
- [ ] Implement proper error messages
- [ ] Add loading skeletons
- [ ] Add analytics/tracking
- [ ] Security audit for JubyVault contract

### Future Enhancements

- [ ] Support multiple concurrent deposits
- [ ] Support different goal date types (days, weeks, months)
- [ ] Add deposit history view
- [ ] Show projected yield at different time points
- [ ] Add social features (leaderboards, achievements)
- [ ] Support multiple asset types (ETH, wBTC, etc.)
- [ ] Implement flexible penalty tiers (graduated penalties)
- [ ] Add notification system for goal date approach

## 🧪 Testing

### Manual Testing

1. **Mint USDC**:
   ```javascript
   // On MockUSDC contract
   mint(YOUR_ADDRESS, 10000000000) // 10,000 USDC
   ```

2. **Deposit Test**:
   - Go to `/invest`
   - Select amount: $1000
   - Choose goal: 1 year
   - Complete deposit flow
   - Verify deposit in contract

3. **Check Info**:
   ```javascript
   // On JubyVault contract
   getUserInfo(YOUR_ADDRESS)
   // Should return principal, currentValue, yield, goalDate, etc.
   ```

4. **Wait for Yield** (or fast-forward time in testnet):
   - Wait a few hours/days
   - Check `getUserInfo` again
   - Verify `currentValue` > `principal`

5. **Early Withdrawal Test**:
   - Go to `/withdraw` before goal date
   - Verify penalty calculation shown
   - Complete withdrawal
   - Verify received amount = currentValue - penalty

6. **On-Time Withdrawal Test**:
   - Deposit again with short goal (e.g., 1 hour in testnet)
   - Wait for goal date to pass
   - Go to `/withdraw`
   - Verify no penalty shown
   - Complete withdrawal
   - Verify received full amount

### Contract Functions for Testing

```javascript
// Check user deposit
getUserInfo(userAddress)

// Preview withdrawal
previewWithdrawal(userAddress)

// Check vault total assets (includes yield)
MockMorphoVault.totalAssets()

// Convert shares to assets
MockMorphoVault.convertToAssets(shares)
```

## 📝 Notes

### Why Mock Morpho?

- Morpho not deployed on World Chain Sepolia
- Mock vault follows exact ERC4626 standard
- Can swap to real Morpho on mainnet without code changes
- Demonstrates understanding of Morpho architecture

### Security Considerations

- ✅ ReentrancyGuard not needed (no external calls before state changes)
- ✅ Integer overflow protected (Solidity 0.8+)
- ✅ Dead deposit prevents share inflation attack
- ⚠️  One deposit per user (consider upgrading to multiple)
- ⚠️  No emergency pause mechanism
- ⚠️  Treasury address immutable (consider upgradeable)

### Gas Optimization

Current implementation prioritizes clarity for hackathon. Production optimizations:
- Pack struct variables
- Use `uint96` for amounts (save gas)
- Batch operations where possible
- Consider EIP-2612 for gasless approvals

## 🎓 Learning Resources

- [Morpho Documentation](https://docs.morpho.org/)
- [ERC4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [World Chain Docs](https://docs.world.org/)
- [MiniKit SendTransaction](https://docs.world.org/mini-apps/commands/send-transaction)

## 🤝 Support

For issues or questions:
- Check contract deployment guide: `contracts/DEPLOYMENT.md`
- Review transaction errors in block explorer
- Test with small amounts first
- Verify contract addresses are correct

---

Built with ❤️ for the [Your Hackathon Name] using Morpho, World Chain, and Next.js
