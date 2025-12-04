# ⚠️ CRITICAL: You Must Restart Your Dev Server!

## The Problem
Your app is **STILL using the old (wrong) program ID** because Next.js caches environment variables at build/start time.

You can confirm this by checking your browser console:
```javascript
// In browser console, check:
console.log(window.__NEXT_DATA__.props?.pageProps)
// or check the network tab to see what program ID is being used
```

## Steps to Fix (DO THIS NOW)

### Step 1: Kill the Dev Server
Find the terminal where `npm run dev` or `yarn dev` is running and press:
- **Mac/Linux**: `Ctrl + C`
- **Windows**: `Ctrl + C`

Or find and kill the process:
```bash
# Find the process
lsof -ti:3001 | xargs kill -9

# Or kill all node processes (careful if you have other node apps)
pkill -f "next dev"
```

### Step 2: Clear Next.js Cache (Already Done)
```bash
cd /Users/ryankaelle/dev/aegis/aegis-app
rm -rf .next
```
✅ This was already done in the previous fix.

### Step 3: Start Dev Server with Fresh Environment
```bash
cd /Users/ryankaelle/dev/aegis/aegis-app

# Start the dev server
npm run dev
# or
yarn dev
```

Wait for it to say:
```
✓ Ready in Xms
○ Local: http://localhost:3001
```

### Step 4: Hard Refresh Browser
**This is critical!** Your browser has cached JavaScript bundles with the old program ID.

- **Mac**: `Cmd + Shift + R` or `Cmd + Option + R`
- **Windows/Linux**: `Ctrl + Shift + F5` or `Ctrl + F5`
- **Alternative**: Open DevTools (F12), right-click refresh button, select "Empty Cache and Hard Reload"

### Step 5: Verify Environment is Loaded
In your browser console (F12), run:
```javascript
// This should log the environment variables
console.log('Program ID:', process.env.NEXT_PUBLIC_PROGRAM_ID);
```

**Expected output**: 
```
Program ID: ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ
```

If it still shows `9tU6KfJ3KaDKS6uARRdSNBPLQ3xcpGWwp8N56PZDv3hn`, the server didn't restart properly.

### Step 6: Try Creating a Vault Again
1. Connect your wallet
2. Create a new vault
3. Check the console logs for the transaction signature
4. Immediately run the verification script:

```bash
node /Users/ryankaelle/dev/aegis/aegis-app/scripts/verify-vault.mjs <vault_address> <signature>
```

## How to Verify It's Actually Working

After creating a vault, you should see:
- ✅ Transaction appears in Solana Explorer (not "Not Found")
- ✅ Vault account exists on-chain
- ✅ Vault shows up in your dashboard
- ✅ Verification script shows "Transaction found!" and "Vault account EXISTS!"

## Why This Happens

Next.js environment variables are:
1. **Loaded at build time** - embedded into the JavaScript bundles
2. **Cached by browser** - the old bundles are cached
3. **Not hot-reloaded** - changing .env doesn't automatically update running app

This means you MUST:
- ✅ Restart the dev server
- ✅ Clear the build cache
- ✅ Hard refresh the browser

## Still Not Working?

If after following all steps it still doesn't work:

### Debug Step 1: Check what the frontend is actually using
Add this to your browser console after hard refresh:
```javascript
// Check the built-in config
fetch('/api/config').then(r => r.json()).then(console.log)

// Or check the HTML source
console.log(document.documentElement.innerHTML.includes('9tU6KfJ'))
```

### Debug Step 2: Check .env file
```bash
cat /Users/ryankaelle/dev/aegis/aegis-app/.env.local | grep PROGRAM_ID
```

Should show: `NEXT_PUBLIC_PROGRAM_ID=ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ`

### Debug Step 3: Check if server picked it up
In the terminal where you ran `npm run dev`, add this to a component temporarily:
```typescript
console.log('Server Program ID:', process.env.NEXT_PUBLIC_PROGRAM_ID);
```

### Debug Step 4: Nuclear option
```bash
cd /Users/ryankaelle/dev/aegis/aegis-app

# Kill everything
pkill -f "next"
rm -rf .next
rm -rf node_modules/.cache

# Restart
npm run dev
```

Then hard refresh browser (Cmd+Shift+R)

## Quick Test Script
After restarting, run this to test:
```bash
cd /Users/ryankaelle/dev/aegis/aegis-app
node scripts/test-vault-creation.mjs
```

All checks should pass ✅


