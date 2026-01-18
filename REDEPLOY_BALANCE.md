# Redeploy Balance Contract Only

Since only the `balance` contract was changed, you only need to redeploy that one.

## Quick Redeploy

Using the existing build script:

```bash
cd contracts

# Build the balance contract
./build.sh build balance

# Deploy only the balance contract
./build.sh deploy balance
```

## Manual Redeploy

Or manually:

```bash
cd contracts/balance

# Build
leo build --network testnet

# Deploy (replace with your private key)
leo deploy --network testnet --private-key YOUR_PRIVATE_KEY --broadcast --yes
```

## Important Notes

⚠️ **If you already have users with deposits:**
- The old balance contract will still work
- Users with existing Balance records from the old contract can still use them
- New deposits will use the new contract with credits.aleo integration
- You may need to migrate existing users (optional)

⚠️ **If no users yet:**
- Safe to redeploy - no migration needed
- Just update your frontend config with the new program address

## After Redeployment

1. **Update frontend `.env`** with new program address:
   ```env
   NEXT_PUBLIC_BALANCE_CONTRACT=equiclear_balance.aleo
   NEXT_PUBLIC_BALANCE_PROGRAM_ADDRESS=aleo1xxxxx...  # New address
   ```

2. **Test deposit** to verify credits.aleo integration works

3. **Other contracts don't need redeployment** - they're unchanged
