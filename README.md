# Juby - Goal-Based Savings with DeFi Yields

Juby is a World App Mini-App that enables users to save USDC with goal-based deposits and earn DeFi yields through Morpho protocol integration. Built with human verification via World ID and designed for the World Chain Sepolia testnet.

## Features

### Core Features

- **World ID Authentication**: Human verification using Worldcoin's World ID protocol
- **Goal-Based Savings**: Set a target date for your savings goal (6 months, 1 year, 2 years, or 3 years)
- **DeFi Yield Generation**: Earn 5% APY through Morpho-compatible vault integration
- **Early Withdrawal Penalty**: If you withdraw before your goal date, Juby keeps 50% of earned yield as a retention mechanism
- **On-Time Withdrawals**: Withdraw after your goal date to receive 100% of principal + yields
- **Transparent Tracking**: View your deposits, current value, yields, and goal progress in real-time

### Smart Financial Design

- **Behavioral Incentives**: The 50% penalty mechanism encourages commitment to savings goals
- **Flexible Goals**: Choose from multiple time horizons based on your financial objectives
- **Real Yields**: Powered by ERC4626-compliant vaults following Morpho conventions
- **Secure Storage**: Smart contract-based custody with proven vault patterns

## Architecture

### Technology Stack

- **Frontend**: Next.js 16 (App Router) with React 19
- **Styling**: Tailwind CSS v4
- **Authentication**: NextAuth v5 with World ID wallet authentication
- **Blockchain Integration**:
  - MiniKit SDK (`@worldcoin/minikit-js`) for World App integration
  - Viem for Ethereum interactions
- **Network**: World Chain Sepolia (Chain ID: 4801)
- **Smart Contracts**: Solidity contracts deployed on World Chain Sepolia

### Project Structure

```
juby-app-eth/
├── app/                    # Next.js App Router
│   ├── page.tsx           # Login/Landing page with World ID auth
│   ├── dashboard/         # User dashboard
│   ├── invest/            # Investment screen
│   └── withdraw/          # Withdrawal screen
├── components/            # React components
│   ├── InvestmentScreen.tsx
│   ├── WithdrawScreen.tsx
│   ├── DashboardNav.tsx
│   └── ...
├── lib/
│   ├── auth/             # Authentication logic
│   │   └── wallet/       # World ID wallet auth helpers
│   ├── contracts/        # Contract ABIs and addresses
│   │   ├── abis.ts
│   │   └── addresses.ts
│   └── providers/        # Client-side providers (MiniKit, Session)
├── contracts/            # Solidity smart contracts
│   ├── JubyVault.sol    # Main vault with goal-based logic
│   ├── MockMorphoVault.sol  # ERC4626 vault simulating Morpho
│   └── MockUSDC.sol     # Test USDC token
└── public/              # Static assets
```

## Smart Contracts

### JubyVault (Main Contract)

The core contract that manages user deposits, goal dates, and withdrawals.

**Key Functions:**
- `deposit(uint256 amount, uint256 goalDate)`: Deposit USDC with a goal date
- `withdraw()`: Withdraw funds (with penalty if early)
- `getDepositInfo(address user)`: View deposit details
- `calculateCurrentValue(address user)`: Calculate current value including yields

**Deployed Address**: `0xb125F0a1501fD8383EC421dcF52A37d100a5dE02`

### MockMorphoVault (ERC4626 Vault)

An ERC4626-compliant vault that simulates Morpho protocol behavior with 5% APY.

**Features:**
- Follows ERC4626 tokenized vault standard
- Automatic yield accrual (5% APY)
- Dead deposit protection against share inflation attacks
- Compatible with Morpho conventions

**Deployed Address**: `0x4A7Ffcc8E6F797Ba4Dd4dE7610Eca3e0E39483ad`

### MockUSDC

Test USDC token with 6 decimals for World Chain Sepolia testing.

**Deployed Address**: `0xF7CD2D04750748165B203d71D2A35e4426b2546f`

## How It Works

### User Flow

1. **Authentication**
   - User opens Juby in World App
   - Authenticates with World ID via wallet signature
   - Session created with NextAuth

2. **Deposit Flow**
   ```
   User Input → Amount & Goal Date
        ↓
   Approve USDC (via MiniKit.sendTransaction)
        ↓
   Deposit to JubyVault
        ↓
   JubyVault deposits to MockMorphoVault
        ↓
   Yield starts accruing automatically
   ```

3. **Withdrawal Flow**
   ```
   User clicks Withdraw
        ↓
   Check: Before or After Goal Date?
        ↓
   ├─ Before: Calculate 50% penalty on yields
   └─ After: No penalty
        ↓
   Withdraw from vault (via MiniKit.sendTransaction)
        ↓
   Receive USDC + remaining yields
   ```

### Penalty Calculation Example

**Scenario**:
- Principal: $1,000 USDC
- Goal Date: 2 years from deposit
- Current Yield Earned: $50 USDC
- User withdraws after 1 year (early)

**Calculation**:
- Total Current Value: $1,050
- Penalty: $50 × 50% = $25
- User Receives: $1,000 + ($50 - $25) = $1,025
- Juby Treasury Receives: $25

If user waited until goal date:
- User Receives: $1,050 (full amount)

## Setup & Installation

### Prerequisites

- Node.js 20+
- npm or yarn
- World App (for testing as a Mini-App)
- World Chain Sepolia ETH for gas

### Environment Variables

Create a `.env.local` file:

```env
# NextAuth Configuration
NEXTAUTH_SECRET=your_secret_here
NEXTAUTH_URL=http://localhost:3000
HMAC_SECRET_KEY=your_hmac_secret_here

# World App Configuration
NEXT_PUBLIC_WORLD_APP_ID=app_your_app_id_here
```

### Installation Steps

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd juby-app-eth
   npm install
   ```

2. **Configure Environment**
   - Copy `.env.local.example` to `.env.local`
   - Add your World App ID from [World Developer Portal](https://developer.worldcoin.org/)

3. **Run Development Server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

4. **Test in World App Simulator**
   - Follow [MiniKit documentation](https://docs.worldcoin.org/mini-apps) to test in World App

## Development Commands

```bash
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Production build
npm start            # Run production server
npm run lint         # Run ESLint
```

## Smart Contract Deployment

See [contracts/DEPLOYMENT.md](contracts/DEPLOYMENT.md) for detailed deployment instructions.

**Quick Deploy (Remix)**:
1. Deploy MockUSDC
2. Deploy MockMorphoVault (pass USDC address)
3. Deploy JubyVault (pass USDC and MorphoVault addresses)
4. Initialize JubyVault with treasury address
5. Update `lib/contracts/addresses.ts` with deployed addresses

## Testing

See [TESTING_GUIDE.md](TESTING_GUIDE.md) for comprehensive testing instructions.

### Quick Test Flow

1. **Get Testnet Tokens**
   - Obtain World Chain Sepolia ETH (see [GET_TESTNET_ETH.md](GET_TESTNET_ETH.md))
   - Mint test USDC: Call `mint()` on MockUSDC contract

2. **Test Deposit**
   - Open app in World App
   - Authenticate with World ID
   - Enter amount and select goal date
   - Approve USDC → Deposit

3. **Test Withdrawal**
   - Navigate to Withdraw screen
   - View current value and penalty (if early)
   - Confirm withdrawal

## Technical Highlights

### MiniKit Integration

All blockchain transactions use MiniKit's `sendTransaction` command:

```typescript
import { MiniKit } from '@worldcoin/minikit-js';

// Example: Deposit transaction
const result = await MiniKit.commandsAsync.sendTransaction({
  transaction: [{
    address: CONTRACTS.JUBY_VAULT,
    abi: JUBY_VAULT_ABI,
    functionName: "deposit",
    args: [amountInWei, goalDateTimestamp],
  }],
});
```

### World ID Authentication

Uses wallet-based authentication with SIWE (Sign-In with Ethereum):

```typescript
const result = await MiniKit.commandsAsync.walletAuth({
  nonce,
  expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  statement: "Authenticate with Juby",
});
```

### ERC4626 Compliance

MockMorphoVault implements full ERC4626 standard:
- `deposit()`, `mint()`, `withdraw()`, `redeem()`
- `convertToShares()`, `convertToAssets()`
- Automatic yield accrual with time-based calculations

## Network Information

**World Chain Sepolia Testnet**
- Chain ID: 4801
- RPC: `https://worldchain-sepolia.g.alchemy.com/public`
- Explorer: [https://sepolia.worldscan.org](https://sepolia.worldscan.org)
- Faucet: Bridge from Ethereum Sepolia (see GET_TESTNET_ETH.md)

## Resources

- [World App MiniKit Docs](https://docs.worldcoin.org/mini-apps)
- [World Chain Documentation](https://docs.worldcoin.org/world-chain)
- [ERC4626 Standard](https://eips.ethereum.org/EIPS/eip-4626)
- [Morpho Protocol](https://morpho.org)
- [Next.js Documentation](https://nextjs.org/docs)

## License

MIT

## Support

For issues or questions:
- Check existing documentation in the `contracts/` and root directory
- Review [TESTING_GUIDE.md](TESTING_GUIDE.md) for common issues
- Open an issue on GitHub
