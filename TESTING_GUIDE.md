# Morpho Integration Testing Guide

## 🎯 Overview

This guide walks you through testing the complete Juby Vault Morpho integration on World Chain Sepolia testnet.

## ✅ Prerequisites Checklist

Before testing, ensure you have:
- [ ] MetaMask or compatible wallet installed
- [ ] World Chain Sepolia network configured
- [ ] Testnet ETH in your wallet
- [ ] Contracts deployed (MockUSDC, MockMorphoVault, JubyVault)
- [ ] Contract addresses updated in `lib/contracts/addresses.ts`
- [ ] World Developer Portal configured

---

## 📋 Step-by-Step Testing

### Phase 1: Setup & Deployment

#### 1.1 Get World Chain Sepolia ETH

```
1. Go to: https://www.alchemy.com/faucets/world-chain-sepolia
2. Connect your wallet
3. Request testnet ETH
4. Wait for confirmation (should be instant)
5. Verify in MetaMask: You should see ETH balance
```

#### 1.2 Add World Chain Sepolia to MetaMask

```
Network Name: World Chain Sepolia
RPC URL: https://worldchain-sepolia.g.alchemy.com/public
Chain ID: 4801
Currency Symbol: ETH
Block Explorer: https://sepolia.worldscan.org
```

#### 1.3 Deploy Contracts Using Remix

**Step 1: Deploy MockUSDC**

```solidity
1. Go to https://remix.ethereum.org
2. Create new file: MockUSDC.sol
3. Paste code from contracts/MockUSDC.sol
4. Compile: Solidity 0.8.20+
5. Deploy tab > Environment: "Injected Provider - MetaMask"
6. Make sure MetaMask is on World Chain Sepolia
7. Click "Deploy"
8. Copy deployed address
```

**Step 2: Deploy MockMorphoVault**

```solidity
1. Create new file: MockMorphoVault.sol
2. Paste code from contracts/MockMorphoVault.sol
3. Compile
4. Deploy with parameter:
   - _asset: [YOUR_MOCK_USDC_ADDRESS]
5. Copy deployed address
```

**Step 3: Deploy JubyVault**

```solidity
1. Create new file: JubyVault.sol
2. Paste code from contracts/JubyVault.sol
3. Compile
4. Deploy with parameters:
   - _asset: [YOUR_MOCK_USDC_ADDRESS]
   - _morphoVault: [YOUR_MOCK_MORPHO_VAULT_ADDRESS]
   - _jubyTreasury: [YOUR_WALLET_ADDRESS] (for testing)
5. Copy deployed address
```

#### 1.4 Update Frontend Configuration

Edit `lib/contracts/addresses.ts`:

```typescript
export const CONTRACTS = {
  MOCK_USDC: "0xYOUR_DEPLOYED_MOCK_USDC_ADDRESS",
  MORPHO_VAULT: "0xYOUR_DEPLOYED_MORPHO_VAULT_ADDRESS",
  JUBY_VAULT: "0xYOUR_DEPLOYED_JUBY_VAULT_ADDRESS",
} as const;
```

#### 1.5 Initialize MockMorphoVault (CRITICAL!)

In Remix, on MockUSDC contract:

```javascript
// 1. Mint 1000 USDC to yourself
mint(YOUR_WALLET_ADDRESS, "1000000000")
// Amount: 1000000000 = 1000 USDC (6 decimals)

// 2. Approve MockMorphoVault
approve(MORPHO_VAULT_ADDRESS, "1000000000")

// Switch to MockMorphoVault contract:
// 3. Create initial deposit (dead deposit)
deposit("1000000000", YOUR_WALLET_ADDRESS)
```

✅ **Verification**: Call `totalSupply()` on MockMorphoVault. Should return 1000000000.

---

### Phase 2: Test User Deposit Flow

#### 2.1 Mint Test USDC to Your Wallet

In Remix, on MockUSDC:

```javascript
// Mint 10,000 USDC for testing
mint(YOUR_WALLET_ADDRESS, "10000000000")
```

**Verify**: Call `balanceOf(YOUR_WALLET_ADDRESS)` → Should show 10000000000

#### 2.2 Test Deposit via Frontend

**In your app:**

```
1. Start dev server: npm run dev
2. Navigate to http://localhost:3000
3. Log in with World ID
4. Go to /invest page
5. Set amount: $1000
6. Choose goal: 1 año (12 months)
7. Click "Recibir e Invertir"
```

**Expected Flow:**

```
Step 1: Approving USDC...
→ World App opens
→ Confirm transaction in World App
→ Wait for confirmation

Step 2: Depositing...
→ World App opens again
→ Confirm transaction
→ Success dialog appears
```

**Common Issues:**

❌ **"Transaction failed"**
- Check that contracts are deployed correctly
- Verify addresses in `addresses.ts` are correct
- Ensure you have testnet ETH for gas

❌ **"Insufficient balance"**
- Mint more USDC using `mint()` function
- Check you're using the right wallet address

❌ **"Insufficient allowance"**
- This shouldn't happen with the two-step flow
- If it does, manually approve via Remix

#### 2.3 Verify Deposit Worked

**In Remix, on JubyVault contract:**

```javascript
// Call getUserInfo
getUserInfo(YOUR_WALLET_ADDRESS)

// Expected output:
{
  principal: 1000000000,        // Your deposit
  currentValue: ~1000000000,    // Same initially
  yield: 0,                     // No yield yet
  goalDate: [TIMESTAMP],        // 1 year from now
  isEarly: true,                // Before goal date
  potentialPenalty: 0           // No yield to penalize yet
}
```

**In Remix, on MockMorphoVault:**

```javascript
// Check your shares
balanceOf(JUBY_VAULT_ADDRESS)  // Should be > 0

// Check total assets
totalAssets()  // Should be > initial 1000 USDC
```

✅ **Success Criteria:**
- JubyVault shows your deposit
- MockMorphoVault received USDC
- JubyVault holds vault shares

---

### Phase 3: Test Yield Accrual

#### 3.1 Wait for Yield to Accrue

The MockMorphoVault accrues 5% APY automatically.

**Option A: Wait a Few Hours**
```
Real time: Wait 2-3 hours
Expected yield: ~$0.50-1.00 (depending on time)
```

**Option B: Fast-Forward Time (Advanced)**
```
This requires forking the testnet and using Hardhat
Not recommended for initial testing
```

#### 3.2 Check Yield Accumulation

**In Remix, on MockMorphoVault:**

```javascript
// Check total assets (should be growing)
totalAssets()
// Compare with initial totalAssets
// Difference = total yield generated

// Convert shares to assets
convertToAssets(JUBY_VAULT_SHARES)
// This should be > principal after some time
```

**In Remix, on JubyVault:**

```javascript
getUserInfo(YOUR_WALLET_ADDRESS)

// Check these fields:
{
  currentValue: [...],  // Should be > principal
  yield: [...],         // Should be > 0
  potentialPenalty: [...]  // Should be yield / 2
}
```

**Example After 1 Hour:**
```javascript
{
  principal: 1000000000,        // $1000
  currentValue: 1000570,        // $1000.57
  yield: 570,                   // $0.57
  goalDate: [TIMESTAMP],
  isEarly: true,
  potentialPenalty: 285         // $0.285 (50%)
}
```

✅ **Success Criteria:**
- `currentValue` > `principal`
- `yield` > 0
- `potentialPenalty` = `yield / 2`

---

### Phase 4: Test Early Withdrawal (With Penalty)

#### 4.1 Preview Withdrawal

**In Remix, on JubyVault:**

```javascript
previewWithdrawal(YOUR_WALLET_ADDRESS)

// Returns:
{
  userWillReceive: [...],  // principal + (yield / 2)
  penaltyAmount: [...]     // yield / 2
}
```

**Calculate Expected Amount:**
```
Example:
principal = 1000 USDC
yield = 0.57 USDC
penalty = 0.285 USDC (50% of yield)
userWillReceive = 1000 + 0.285 = 1000.285 USDC
```

#### 4.2 Withdraw via Frontend

**In your app:**

```
1. Navigate to /withdraw
2. You should see:
   - Principal: $1000.00
   - Ganancias: +$0.57
   - Valor actual: $1000.57
   - "Retiro anticipado" warning (amber box)
   - Penalización: -$0.285
   - Recibirás: $1000.285

3. Click "Confirmar Retiro"
4. Click "Confirmar" in modal
5. Approve transaction in World App
6. Wait for success
7. Should redirect to dashboard
```

#### 4.3 Verify Withdrawal

**In Remix, on MockUSDC:**

```javascript
// Check your USDC balance
balanceOf(YOUR_WALLET_ADDRESS)

// Should have:
// initial_balance - 1000 + 1000.285 = initial_balance + 0.285
```

**In Remix, on JubyVault:**

```javascript
// Check deposit is deleted
getUserInfo(YOUR_WALLET_ADDRESS)

// Should return all zeros:
{
  principal: 0,
  currentValue: 0,
  yield: 0,
  goalDate: 0,
  isEarly: false,
  potentialPenalty: 0
}
```

**In Remix, on MockUSDC (Check Treasury):**

```javascript
// Check treasury received penalty
balanceOf(TREASURY_ADDRESS)

// Should equal penalty amount: ~0.285 USDC
```

✅ **Success Criteria:**
- You received: principal + (yield / 2)
- Treasury received: yield / 2
- Your deposit is deleted from JubyVault
- MockMorphoVault balance decreased

---

### Phase 5: Test On-Time Withdrawal (No Penalty)

#### 5.1 Make New Deposit with Short Goal

**In your app:**

```
1. Go to /invest
2. Amount: $500
3. Goal: 6 meses
4. Complete deposit
```

#### 5.2 Wait for Goal Date to Pass

**Option A: Create Short Goal for Testing**

Edit InvestmentScreen.tsx temporarily:

```typescript
const options = [
  { months: 0.0007, label: "1 min" },  // For testing
  { months: 0.014, label: "20 min" },  // For testing
  { months: 12, label: "1 año" },
  { months: 24, label: "2 años" },
];
```

Calculate timestamp:
```javascript
// 1 minute from now
goalDate = Math.floor(Date.now() / 1000) + 60
```

**Option B: Manually Set Goal in Past**

In Remix, after deposit, you can't change the goal. You must:
1. Deploy new test contract with modifiable goals, OR
2. Wait 6 months (not practical), OR
3. Use Option A above

#### 5.3 Withdraw After Goal Date

**In Remix, first check:**

```javascript
getUserInfo(YOUR_WALLET_ADDRESS)

// Verify:
{
  isEarly: false,           // ✅ Goal date passed!
  potentialPenalty: 0       // ✅ No penalty
}
```

**In your app:**

```
1. Navigate to /withdraw
2. You should see:
   - Green success box (not amber warning!)
   - "¡Felicitaciones! Alcanzaste tu meta"
   - No penalty shown
   - Recibirás: Full amount (principal + all yield)

3. Click "Confirmar Retiro"
4. Confirm in modal
5. Approve in World App
6. Success!
```

#### 5.4 Verify Full Withdrawal

**Check your USDC balance:**

```javascript
balanceOf(YOUR_WALLET_ADDRESS)

// Should receive: principal + full yield
// Example: 500 + 0.30 = 500.30 USDC
```

**Check treasury (should NOT receive anything):**

```javascript
balanceOf(TREASURY_ADDRESS)

// Should be same as before (no new penalty)
```

✅ **Success Criteria:**
- Received full amount (principal + 100% yield)
- Treasury received nothing
- No penalty deducted
- Green success message shown

---

## 🔍 Testing Checklist

### Smart Contracts
- [ ] MockUSDC deploys successfully
- [ ] MockMorphoVault deploys with USDC address
- [ ] JubyVault deploys with all addresses
- [ ] Can mint USDC
- [ ] Can approve USDC
- [ ] MockMorphoVault accepts deposits
- [ ] Dead deposit initialized correctly

### Deposit Flow
- [ ] Frontend connects to World App
- [ ] USDC approval transaction works
- [ ] Deposit transaction works
- [ ] JubyVault records deposit correctly
- [ ] Goal date stored correctly
- [ ] MockMorphoVault receives USDC
- [ ] JubyVault receives shares

### Yield Accrual
- [ ] totalAssets increases over time
- [ ] convertToAssets shows growth
- [ ] getUserInfo shows currentValue > principal
- [ ] Yield calculation is correct (~5% APY)

### Early Withdrawal
- [ ] Frontend shows penalty warning
- [ ] Penalty calculation is 50% of yield
- [ ] Preview withdrawal shows correct amounts
- [ ] Withdrawal transaction works
- [ ] User receives principal + (yield / 2)
- [ ] Treasury receives yield / 2
- [ ] Deposit deleted from contract

### On-Time Withdrawal
- [ ] Frontend shows success message (no penalty)
- [ ] No penalty calculated
- [ ] User receives principal + full yield
- [ ] Treasury receives nothing
- [ ] Deposit deleted from contract

### Edge Cases
- [ ] Cannot deposit with goal date in past
- [ ] Cannot withdraw without deposit
- [ ] Cannot deposit twice without withdrawing
- [ ] Proper error messages shown
- [ ] Transaction failures handled gracefully

---

## 🐛 Common Issues & Solutions

### Issue: "Transaction failed"

**Causes:**
- Wrong contract addresses
- Insufficient gas
- Contracts not deployed

**Solutions:**
```bash
# 1. Verify addresses
cat lib/contracts/addresses.ts

# 2. Check you have testnet ETH
# In MetaMask, verify balance > 0.01 ETH

# 3. Re-deploy contracts if needed
```

### Issue: "Insufficient balance"

**Cause:** Not enough USDC minted

**Solution:**
```javascript
// In Remix, on MockUSDC
mint(YOUR_ADDRESS, "100000000000")  // 100,000 USDC
```

### Issue: Yield not accruing

**Causes:**
- Not enough time passed
- Vault not initialized

**Solutions:**
```javascript
// 1. Check vault is initialized
MockMorphoVault.totalSupply()  // Should be > 0

// 2. Wait longer (at least 1 hour)

// 3. Check totalAssets is growing
MockMorphoVault.totalAssets()
// Call again after 30 minutes, should be higher
```

### Issue: "Slippage too high"

**Cause:** Share price changed significantly during transaction

**Solution:**
```javascript
// This shouldn't happen in testing
// If it does, there's a bug in MockMorphoVault
// Check lastYieldUpdate is being set correctly
```

### Issue: World App not opening

**Causes:**
- Not in World App environment
- MiniKit not initialized
- Wrong network

**Solutions:**
```
1. Test in World App mobile app (not browser)
2. Or use World App Simulator for development
3. Verify you're on World Chain Sepolia
```

---

## 📊 Expected Values

### After 1 Hour
```
Principal: 1000 USDC
Yield: ~0.57 USDC
Early penalty: ~0.285 USDC
Early withdrawal: ~1000.285 USDC
On-time withdrawal: ~1000.57 USDC
```

### After 1 Day
```
Principal: 1000 USDC
Yield: ~13.7 USDC
Early penalty: ~6.85 USDC
Early withdrawal: ~1006.85 USDC
On-time withdrawal: ~1013.7 USDC
```

### After 1 Week
```
Principal: 1000 USDC
Yield: ~95.9 USDC
Early penalty: ~47.95 USDC
Early withdrawal: ~1047.95 USDC
On-time withdrawal: ~1095.9 USDC
```

**Formula:**
```
Yield = Principal × 0.05 × (time_elapsed / 365 days)
```

---

## ✅ Success Criteria Summary

Your implementation is working correctly if:

1. ✅ Deposits create records in JubyVault
2. ✅ USDC moves from user → JubyVault → MockMorphoVault
3. ✅ Yield accrues over time (~5% APY)
4. ✅ Early withdrawals deduct 50% penalty
5. ✅ On-time withdrawals have no penalty
6. ✅ Penalties go to treasury address
7. ✅ All transactions work through World's sendTransaction
8. ✅ Frontend shows accurate information

---

## 🎥 Demo Flow for Hackathon

**Recommended demo sequence:**

1. **Show Deposit** (2 min)
   - Navigate to /invest
   - Select amount and goal
   - Complete transaction
   - Show success

2. **Show Contract State** (1 min)
   - Open Remix
   - Call getUserInfo
   - Show deposit recorded

3. **Wait & Show Yield** (30 sec)
   - Call getUserInfo again
   - Point out yield increase

4. **Show Early Withdrawal Warning** (1 min)
   - Navigate to /withdraw
   - Highlight penalty warning
   - Show penalty calculation

5. **Complete Withdrawal** (1 min)
   - Confirm withdrawal
   - Show success
   - Verify USDC received

Total: ~5-6 minutes

---

## 📞 Need Help?

If you encounter issues:

1. Check contract addresses are correct
2. Verify you have testnet ETH
3. Check Remix console for errors
4. Look at browser console for frontend errors
5. Verify transactions on block explorer: https://sepolia.worldscan.org

Good luck with your testing! 🚀
