# How to Get World Chain Sepolia Testnet ETH

## 🚨 Issues with Faucets?

Most faucets have rate limits, CAPTCHA, or are frequently down. **The bridge method is more reliable!**

---

## ✅ **RECOMMENDED: Bridge Method** (Most Reliable)

### **Why Bridge?**
- ✅ More reliable than faucets
- ✅ No rate limits
- ✅ Get exactly the amount you need
- ✅ Works 24/7

### **Steps:**

#### **Step 1: Get Ethereum Sepolia ETH**

Choose ONE of these working faucets:

**🏆 Chainlink Faucet (Best Option):**
```
URL: https://faucets.chain.link/sepolia
Amount: 0.1 Sepolia ETH
Wait time: 24 hours between requests
Speed: 1-5 minutes

How to use:
1. Visit the link
2. Connect your wallet
3. Click "Send request"
4. Wait ~2 minutes
5. ✅ Done!
```

**🌐 Alchemy Sepolia Faucet:**
```
URL: https://sepoliafaucet.com/
Amount: 0.5 Sepolia ETH
Wait time: 24 hours
Speed: Instant

How to use:
1. Sign up for free Alchemy account
2. Login to faucet
3. Enter wallet address
4. Click "Send Me ETH"
5. ✅ Done!
```

**⚡ QuickNode Faucet:**
```
URL: https://faucet.quicknode.com/ethereum/sepolia
Amount: 0.05 Sepolia ETH
Wait time: 12 hours
Requirement: Need 0.001 ETH on mainnet

How to use:
1. Connect wallet (must have 0.001 ETH mainnet)
2. Complete CAPTCHA
3. Click "Continue"
4. ✅ Done!
```

#### **Step 2: Bridge to World Chain Sepolia**

**Using Alchemy Bridge:**

```
URL: https://worldchain-sepolia.bridge.alchemy.com/

Steps:
1. Visit the bridge
2. Connect your wallet (MetaMask)
3. Source chain: Ethereum Sepolia
4. Destination chain: World Chain Sepolia
5. Amount: 0.05 ETH (keep some for gas on Sepolia)
6. Click "Bridge"
7. Confirm in MetaMask
8. Wait 1-2 minutes
9. ✅ You now have World Chain Sepolia ETH!
```

**Alternative Bridges:**

**Superbridge:**
```
URL: https://superbridge.app/
- Select: Sepolia → World Chain Sepolia
- Optimized for OP Stack chains
- Very fast (~30 seconds)
```

**Relay.link:**
```
URL: https://relay.link/bridge/ethereum-sepolia
- No fees (just gas)
- Supports 30+ testnets
- Instant transfers
```

---

## 🎯 **Alternative: Direct Faucets** (If bridge doesn't work)

### **Alchemy World Chain Faucet:**
```
URL: https://www.alchemy.com/faucets/world-chain-sepolia

How to use:
1. Create free Alchemy account
2. Connect wallet
3. Click "Send Me ETH"
4. Wait 24 hours between requests

Troubleshooting:
- If it says "Try again later": Wait full 24 hours
- If connection fails: Clear browser cache
- If stuck: Try different browser
```

### **Google Cloud Web3 Faucet:**
```
URL: https://cloud.google.com/application/web3/faucet

Features:
- No signup required
- Very fast (seconds)
- May support World Chain Sepolia

How to use:
1. Visit the link
2. Select network (try finding World Chain)
3. Enter wallet address
4. Complete CAPTCHA
5. Click "Get ETH"
```

---

## 💻 **Programmatic Options**

### **No Official CLI** ❌

Unfortunately, World Chain doesn't have a CLI like Stellar's `stellar account fund`.

### **Workaround: Use Script**

I've created a helper script: `scripts/request-testnet-eth.js`

```bash
# Install dependencies
npm install alchemy-sdk

# Set your wallet address
export WALLET_ADDRESS=0xYOUR_ADDRESS_HERE

# Optional: Set Alchemy API key for balance checking
export ALCHEMY_API_KEY=your_api_key

# Run the script
node scripts/request-testnet-eth.js
```

The script will:
- Display your wallet address
- Show all available faucet links
- Check your balance (if API key provided)
- Guide you through the process

### **Check Balance Programmatically:**

```javascript
const { Alchemy, Network } = require('alchemy-sdk');

const alchemy = new Alchemy({
  apiKey: 'YOUR_ALCHEMY_API_KEY',
  network: Network.WORLD_SEPOLIA,
});

const balance = await alchemy.core.getBalance('YOUR_WALLET_ADDRESS');
console.log(`Balance: ${Number(balance) / 1e18} ETH`);
```

---

## 🆘 **Troubleshooting**

### **Problem: Faucet says "Rate limited"**
```
Solution:
✅ Wait full 24 hours from last request
✅ Try a different faucet
✅ Use the bridge method instead
```

### **Problem: "Transaction failed" on bridge**
```
Solution:
✅ Ensure you have enough Sepolia ETH for gas (~0.01 ETH)
✅ Wait a few minutes and try again
✅ Try a different bridge (Superbridge or Relay)
```

### **Problem: ETH not arriving**
```
Solution:
✅ Check transaction on block explorer:
   - Sepolia: https://sepolia.etherscan.io/
   - World Chain Sepolia: https://sepolia.worldscan.org/
✅ Wait 5-10 minutes (congestion)
✅ Verify you used correct wallet address
```

### **Problem: "Network not supported"**
```
Solution:
✅ Add World Chain Sepolia to MetaMask:
   Network Name: World Chain Sepolia
   RPC URL: https://worldchain-sepolia.g.alchemy.com/public
   Chain ID: 4801
   Currency: ETH
   Block Explorer: https://sepolia.worldscan.org
```

---

## 📊 **Comparison: Faucets vs Bridge**

| Method | Speed | Reliability | Amount | Effort |
|--------|-------|-------------|--------|--------|
| Direct Faucet | Slow (24h limit) | ⚠️ Low (often down) | 0.05-0.5 ETH | Low |
| Bridge | Fast (1-2 min) | ✅ High | Custom | Medium |
| Script | N/A | ❌ No official CLI | N/A | N/A |

**Winner:** 🏆 **Bridge Method**

---

## 🎯 **Quick Start for Your Project**

**Minimum ETH Needed:**
- Deploy 3 contracts: ~0.015 ETH
- Test transactions: ~0.01 ETH
- Buffer for failures: ~0.025 ETH
- **Total: ~0.05 ETH**

**Recommended Path:**

```
1. Get 0.1 Sepolia ETH from Chainlink faucet
   (5 minutes)

2. Bridge 0.08 ETH to World Chain Sepolia
   (2 minutes)

3. Keep 0.02 ETH on Sepolia for future bridging

4. ✅ Start deploying contracts!
```

---

## 🔗 **Useful Links**

### Faucets:
- [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)
- [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
- [Alchemy World Chain Faucet](https://www.alchemy.com/faucets/world-chain-sepolia)

### Bridges:
- [Alchemy World Chain Bridge](https://worldchain-sepolia.bridge.alchemy.com/)
- [Superbridge](https://superbridge.app/)
- [Relay.link](https://relay.link/bridge/ethereum-sepolia)

### Explorers:
- [World Chain Sepolia Explorer](https://sepolia.worldscan.org/)
- [Ethereum Sepolia Explorer](https://sepolia.etherscan.io/)

### Documentation:
- [World Chain Bridges Docs](https://docs.world.org/world-chain/providers/bridges)
- [Thirdweb Faucet Guide](https://blog.thirdweb.com/faucet-guides/how-to-get-free-sepolia-ether-eth-from-world-chain-sepolia-testnet-faucet/)

---

## 💡 **Pro Tips**

1. **Always keep some Sepolia ETH** - Makes future bridging easier
2. **Use multiple faucets** - Maximize your testnet ETH
3. **Bridge in batches** - Gas fees are the same for 0.05 or 0.5 ETH
4. **Save contract addresses** - Avoid redeploying and wasting gas
5. **Test with small amounts first** - Don't waste testnet ETH on mistakes

---

## 🚀 **You're Ready!**

Once you have World Chain Sepolia ETH:
1. ✅ Deploy your contracts ([See TESTING_GUIDE.md](TESTING_GUIDE.md))
2. ✅ Test your Morpho integration
3. ✅ Build your hackathon project!

Good luck! 🎉
