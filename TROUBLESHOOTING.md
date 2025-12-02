# Aegis Frontend - Troubleshooting Guide

## Issue: ChunkLoadError and Compilation Hanging

### Problem
The frontend was experiencing:
- `ChunkLoadError: Loading chunk app/layout failed`
- `Uncaught SyntaxError: Invalid or unexpected token`
- Hydration errors
- Compilation hanging/taking extremely long

### Root Causes
1. **Multiple Dev Server Instances**: Several `next dev` processes were running simultaneously on different ports, causing conflicts
2. **Webpack Module Resolution**: The `pino-pretty` optional dependency (from `@walletconnect/logger` → `pino`) wasn't being properly handled by webpack, causing compilation to hang
3. **Stale Cache**: The `.next` build cache contained corrupted chunks from previous builds

### Solution

#### 1. Updated `next.config.js`
Added comprehensive webpack configuration to handle optional dependencies:

```javascript
webpack: (config, { isServer }) => {
  // Ignore node-specific modules in client bundle
  if (!isServer) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      'pino-pretty': false,
      'fs': false,
      'net': false,
      'tls': false,
      'encoding': false,
    }
  }

  // Suppress warnings for optional dependencies
  config.ignoreWarnings = [
    { module: /node_modules\/pino/ },
    { module: /node_modules\/@walletconnect/ },
  ]

  return config
}
```

#### 2. Cleaned Up Processes
Killed all conflicting `next dev` processes to ensure only one instance runs.

#### 3. Cleared Build Cache
Removed the `.next` directory and `node_modules/.cache` to ensure fresh compilation.

### Verification
All pages now compile successfully:
- ✅ Root page: 21.4s (9100 modules)
- ✅ Dashboard: 1703ms (9305 modules)
- ✅ Vaults: 6.7s (9316 modules)
- ✅ Transactions: 1259ms (9330 modules)
- ✅ Settings: 1079ms (9342 modules)

### How to Prevent This Issue

1. **Always check for running processes before starting dev server**:
   ```bash
   ps aux | grep "next dev"
   ```

2. **Clear cache when experiencing strange errors**:
   ```bash
   rm -rf .next node_modules/.cache
   ```

3. **Use a single terminal for the dev server** to avoid accidentally starting multiple instances

4. **If compilation hangs**, check webpack warnings - they often indicate missing optional dependencies that need webpack configuration

### Current Status
✅ **RESOLVED** - Frontend is running successfully on http://localhost:3000 with zero compilation errors.

---

## Issue: Hydration Errors with WalletMultiButton

### Problem
Hydration errors when using `WalletMultiButton`:
```
Error: Hydration failed because the initial UI does not match what was rendered on the server.
Warning: Expected server HTML to contain a matching <i> in <button>.
```

### Root Cause
The `WalletMultiButton` component from `@solana/wallet-adapter-react-ui` renders differently on the server vs client, causing React hydration mismatches. The wallet adapter needs access to browser APIs that aren't available during server-side rendering.

### Solution

#### Created Client-Only Wrapper Component
Created `/src/components/shared/wallet-button.tsx`:

```typescript
'use client';

import { useEffect, useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export function WalletButton({ className }: { className?: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className={className || "wallet-adapter-button wallet-adapter-button-trigger"}>
        Select Wallet
      </button>
    );
  }

  return <WalletMultiButton className={className} />;
}
```

#### Updated Components
Replaced all instances of `WalletMultiButton` with `WalletButton`:
- `/src/app/page.tsx` (Landing page)
- `/src/components/shared/header.tsx` (Dashboard header)

### How It Works
The wrapper component:
1. Tracks if the component has mounted on the client with `useState` + `useEffect`
2. Renders a placeholder button during SSR (server-side rendering)
3. Renders the actual `WalletMultiButton` only after client-side hydration
4. This ensures server and client HTML match initially, preventing hydration errors

### Verification
✅ No hydration errors
✅ Wallet button works on landing page
✅ Wallet button works in dashboard header
✅ All pages compile successfully

---

### Known Warnings (Non-Critical)
- `punycode` deprecation warning - This is a known issue with Node.js transitive dependencies and does not affect functionality
- MetaMask connection errors - Expected when MetaMask is installed but user wants to use Phantom/Solflare
