# Deployment Issue Fix

## Problem
The program `equiclear_balance.aleo` already exists on testnet, but you can't upgrade it because it has `@noupgrade`.

## Solutions

### Option 1: Deploy with New Name (Recommended for Testnet)

Since this is testnet and you're updating the contract, deploy with a versioned name:

1. **Update program name**:
   ```bash
   cd contracts/balance
   ```

2. **Change program name in main.leo**:
   - Change `program equiclear_balance.aleo` to `program equiclear_balance_v2.aleo`
   - Update `program.json` to match

3. **Update frontend config** to use the new name

### Option 2: Check if Old Deployment is Same

If your old deployment already has the credits.aleo integration, you might not need to redeploy. Check the deployed contract on Aleo Explorer.

### Option 3: Wait and Retry

The 500 error might be a temporary network issue. Try again in a few minutes:

```bash
cd contracts
./build.sh deploy balance
```

## Recommended: Deploy with New Name

Since you're adding credits.aleo support, it's safer to deploy as a new program on testnet:

1. This avoids upgrade restrictions
2. You can test the new version alongside the old one
3. Once confirmed working, you can deprecate the old one

## Quick Fix Script

```bash
cd contracts/balance

# Backup original
cp src/main.leo src/main.leo.backup
cp program.json program.json.backup

# Update program name
sed -i 's/program equiclear_balance\.aleo/program equiclear_balance_v2.aleo/g' src/main.leo
sed -i 's/"equiclear_balance.aleo"/"equiclear_balance_v2.aleo"/g' program.json

# Build and deploy
cd ..
./build.sh build balance
./build.sh deploy balance
```

Then update your frontend `.env`:
```env
NEXT_PUBLIC_BALANCE_CONTRACT=equiclear_balance_v2.aleo
```
