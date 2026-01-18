# EquiClear Deployment Guide

## Overview
You need to deploy **ALL 4 contracts** separately on Aleo Testnet. Each contract is an independent program.

## Contracts to Deploy

1. ✅ **equiclear_balance.aleo** - Balance management (deposits/withdrawals)
2. ✅ **equiclear_auction.aleo** - Auction creation and settlement
3. ✅ **equiclear_bid.aleo** - Bid placement
4. ✅ **equiclear_claim.aleo** - Claims and refunds

## Deployment Order

Deploy in this order (some contracts may reference others):

1. **First**: `equiclear_balance.aleo` (no dependencies)
2. **Second**: `equiclear_auction.aleo` (no dependencies)
3. **Third**: `equiclear_bid.aleo` (uses Balance records)
4. **Fourth**: `equiclear_claim.aleo` (uses Settlement records from bid)

## Prerequisites

1. **Install Leo CLI**:
   ```bash
   curl -sSf https://aleo.org/install.sh | sh
   ```

2. **Get Aleo Testnet Credits**:
   - Visit: https://faucet.aleo.org/
   - Request testnet credits for deployment

3. **Create/Import Account**:
   ```bash
   leo account new
   # Or import existing: leo account import
   ```

## Deployment Steps

### 1. Deploy Balance Contract

```bash
cd contracts/balance
leo build
leo deploy --network testnet
```

**Save the program address** - you'll need it for frontend config.

### 2. Deploy Auction Contract

```bash
cd ../auction
leo build
leo deploy --network testnet
```

**Save the program address**.

### 3. Deploy Bid Contract

```bash
cd ../bid
leo build
leo deploy --network testnet
```

**Save the program address**.

### 4. Deploy Claim Contract

```bash
cd ../claim
leo build
leo deploy --network testnet
```

**Save the program address**.

## Update Frontend Configuration

After deployment, update your frontend environment variables:

```env
# .env.local or .env
NEXT_PUBLIC_BALANCE_CONTRACT=equiclear_balance.aleo
NEXT_PUBLIC_AUCTION_CONTRACT=equiclear_auction.aleo
NEXT_PUBLIC_BID_CONTRACT=equiclear_bid.aleo
NEXT_PUBLIC_CLAIM_CONTRACT=equiclear_claim.aleo

# Optional: Program addresses (if needed)
NEXT_PUBLIC_BALANCE_PROGRAM_ADDRESS=aleo1xxxxx...
NEXT_PUBLIC_AUCTION_PROGRAM_ADDRESS=aleo1xxxxx...
NEXT_PUBLIC_BID_PROGRAM_ADDRESS=aleo1xxxxx...
NEXT_PUBLIC_CLAIM_PROGRAM_ADDRESS=aleo1xxxxx...
```

## Verify Deployment

Check your contracts on Aleo Explorer:
- Testnet: https://explorer.aleo.org/testnet

Search for your program IDs:
- `equiclear_balance.aleo`
- `equiclear_auction.aleo`
- `equiclear_bid.aleo`
- `equiclear_claim.aleo`

## Testing After Deployment

1. **Test Deposit**:
   - Connect wallet
   - Go to Wallet page
   - Deposit some testnet credits
   - Verify Balance record is created

2. **Test Bid**:
   - Create or find an active auction
   - Place a bid
   - Verify Balance is deducted

3. **Test Withdraw**:
   - Withdraw some credits
   - Verify credits are returned to wallet

## Important Notes

- ⚠️ **Each contract costs credits to deploy** (usually 1-5 credits on testnet)
- ⚠️ **Contracts are immutable** once deployed (marked with `@noupgrade`)
- ⚠️ **Save all program addresses** for frontend configuration
- ⚠️ **Test thoroughly on testnet** before considering mainnet

## Troubleshooting

### Build Errors
- Check Leo version: `leo --version` (should be latest)
- Ensure all imports are correct
- Check for syntax errors

### Deployment Errors
- Ensure you have enough testnet credits
- Check network connectivity
- Verify account has sufficient balance

### Runtime Errors
- Check program addresses are correct
- Verify all contracts are deployed
- Check function signatures match

## Next Steps

After deployment:
1. Update frontend environment variables
2. Test all functions (deposit, bid, withdraw, claim)
3. Monitor transactions on Aleo Explorer
4. Set up indexer (optional) for better UX
