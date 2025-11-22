/**
 * Script to request testnet ETH from faucets
 *
 * Note: This is a workaround since there's no official CLI.
 * Most faucets have rate limits and CAPTCHA protection.
 */

const https = require('https');

// Your wallet address
const WALLET_ADDRESS = process.env.WALLET_ADDRESS || 'YOUR_WALLET_ADDRESS_HERE';

/**
 * Request ETH from Chainlink Faucet (requires API key)
 * Get API key from: https://faucets.chain.link/
 */
async function requestChainlinkFaucet() {
  console.log('🔗 Requesting from Chainlink Faucet...');
  console.log('⚠️  Note: You need to manually visit https://faucets.chain.link/sepolia');
  console.log(`   and request for address: ${WALLET_ADDRESS}`);
}

/**
 * Alternative: Use Alchemy SDK to check balance
 */
async function checkBalance() {
  const { Alchemy, Network } = require('alchemy-sdk');

  const settings = {
    apiKey: process.env.ALCHEMY_API_KEY,
    network: Network.WORLD_SEPOLIA,
  };

  const alchemy = new Alchemy(settings);

  try {
    const balance = await alchemy.core.getBalance(WALLET_ADDRESS);
    console.log(`💰 Current Balance: ${balance.toString()} wei`);
    console.log(`   = ${Number(balance) / 1e18} ETH`);
  } catch (error) {
    console.error('Error checking balance:', error.message);
  }
}

/**
 * Main function
 */
async function main() {
  console.log('🚰 World Chain Sepolia Testnet Faucet Helper\n');

  if (WALLET_ADDRESS === 'YOUR_WALLET_ADDRESS_HERE') {
    console.error('❌ Please set your wallet address!');
    console.log('   Set WALLET_ADDRESS environment variable or edit the script.\n');
    process.exit(1);
  }

  console.log(`📍 Wallet: ${WALLET_ADDRESS}\n`);

  console.log('📋 Available Methods:\n');
  console.log('1. 🌉 Bridge from Ethereum Sepolia (RECOMMENDED)');
  console.log('   → Get Sepolia ETH from: https://faucets.chain.link/sepolia');
  console.log('   → Bridge to World Chain: https://worldchain-sepolia.bridge.alchemy.com/\n');

  console.log('2. 🚰 Direct Faucet Requests');
  console.log('   → Alchemy: https://www.alchemy.com/faucets/world-chain-sepolia');
  console.log('   → Copy your address and paste in the faucet\n');

  console.log('3. ⚙️  Check Balance (requires Alchemy API key)');
  if (process.env.ALCHEMY_API_KEY) {
    await checkBalance();
  } else {
    console.log('   Set ALCHEMY_API_KEY to enable balance checking\n');
  }

  console.log('\n💡 Tip: The bridge method is most reliable!');
  console.log('   1. Get Sepolia ETH from Chainlink faucet');
  console.log('   2. Bridge it to World Chain Sepolia');
  console.log('   3. Start building! 🚀\n');
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { checkBalance };
