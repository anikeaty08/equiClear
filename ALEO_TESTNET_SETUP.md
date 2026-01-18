# Aleo Testnet Integration Guide

## Overview
EquiClear is fully integrated with Aleo Testnet and uses **real Aleo testnet credits** for all transactions. This document explains how the on-chain flow works.

## How It Works

### 1. **Deposit Flow (Real Aleo Credits)**
When a user deposits credits:

1. **User transfers credits** from their wallet to the `equiclear_balance.aleo` program address using `credits.aleo/transfer_public` or `credits.aleo/transfer_private`
2. **User calls `deposit`** function with:
   - Their address
   - The credits record (consumed by the function)
   - Token ID (1field for Aleo credits)
   - Timestamp
3. **Program creates**:
   - A private `Balance` record (only visible to the user)
   - A `DepositReceipt` record
   - Updates public `total_deposits` mapping

**Result**: Real Aleo testnet credits are locked in the program, user receives a private Balance record.

### 2. **Bid Flow (Deducts Real Credits)**
When a user places a bid:

1. **User calls `place_bid`** function with:
   - Their address
   - Their `Balance` record (to deduct from)
   - Auction ID
   - Quantity
   - Max price
   - Timestamp
2. **Program validates**:
   - Balance belongs to user
   - Balance has sufficient amount (quantity * max_price)
3. **Program deducts** the required amount from Balance record
4. **Program creates**:
   - A private `Bid` record
   - Updated `Balance` record (with deducted amount)
   - Updates public bid counts

**Result**: Real credits are deducted from user's balance and locked for the bid.

### 3. **Auction Settlement (Dutch Auction)**
After auction ends:

1. **Auction is settled** with a uniform clearing price
2. **Bids are processed**:
   - Winners: Get items at clearing price, receive refund for difference
   - Losers: Get full refund
3. **Settlement records** are created with:
   - Quantity won/lost
   - Price paid
   - Refund amount

### 4. **Claim/Withdraw Flow (Real Credits Returned)**
When a user claims or withdraws:

1. **For Claims**:
   - User calls `claim_items` or `claim_and_refund` with their Settlement record
   - Program creates `WinClaim` and `Refund` records
   - Refund amount is returned as a `Balance` record (can be withdrawn)

2. **For Withdrawals**:
   - User calls `withdraw` with their `Balance` record
   - Program validates balance belongs to user
   - Program creates:
     - Updated `Balance` record (remaining amount)
     - `credits.aleo/Credits` record (returned to user)
     - `WithdrawReceipt` record

**Result**: Real Aleo testnet credits are returned to user's wallet.

## Key Points

- ✅ **All transactions use real Aleo testnet credits**
- ✅ **Credits are transferred on-chain** via credits.aleo program
- ✅ **Bids deduct real credits** from user's balance
- ✅ **Winners pay clearing price**, losers get full refund
- ✅ **All balances are private** (ZK proofs)
- ✅ **Fully functional on Aleo Testnet**

## Wallet Integration

### Puzzle Wallet
- Automatically handles credits transfers
- Uses `requestCreateEvent` with type 'Transfer' for credits
- Provides credits records for deposit function

### Leo Wallet
- Uses Leo Wallet Adapter
- Handles credits transfers through adapter
- Provides credits records for deposit function

## Testing on Aleo Testnet

1. **Get Testnet Credits**:
   - Use Aleo Testnet faucet: https://faucet.aleo.org/
   - Or request from testnet validators

2. **Connect Wallet**:
   - Install Puzzle Wallet or Leo Wallet
   - Connect to Aleo Testnet
   - Ensure you have testnet credits

3. **Deposit**:
   - Go to Wallet page
   - Enter amount to deposit
   - Wallet will transfer credits to program
   - Balance record is created

4. **Bid**:
   - Go to an active auction
   - Enter quantity to bid
   - Credits are deducted from balance
   - Bid is placed privately

5. **Claim/Withdraw**:
   - After auction settlement, claim items
   - Or withdraw unused balance
   - Credits are returned to wallet

## Contract Addresses (Testnet)

- `equiclear_balance.aleo` - Balance management
- `equiclear_auction.aleo` - Auction creation and settlement
- `equiclear_bid.aleo` - Bid placement
- `equiclear_claim.aleo` - Claims and refunds

## Notes

- All amounts are in **credits** (1 credit = 1,000,000 microcredits)
- Balance records are **private** and only visible to the owner
- Bids are **private** until settlement
- Settlement uses **uniform clearing price** (Dutch auction)
- Refunds are automatic for losers and partial winners
