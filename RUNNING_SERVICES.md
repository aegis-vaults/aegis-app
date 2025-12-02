# Running Aegis Services

## Service Architecture

The Aegis platform consists of multiple services that need to run together:

1. **aegis-guardian** (Backend) - Port 3000
2. **aegis-app** (Frontend) - Port 3001 (auto-selected if 3000 is in use)
3. **aegis-protocol** (On-chain) - Deployed to Solana devnet/mainnet

## Starting Services

### Option 1: Both Services Running (Recommended for Development)

```bash
# Terminal 1: Start Guardian backend
cd /Users/ryankaelle/dev/aegis/aegis-guardian
npm run dev
# Should start on http://localhost:3000

# Terminal 2: Start Frontend
cd /Users/ryankaelle/dev/aegis/aegis-app
npm run dev
# Will auto-select http://localhost:3001 (since 3000 is in use)
```

### Option 2: Frontend Only (for UI development)

```bash
# Terminal 1: Start Frontend
cd /Users/ryankaelle/dev/aegis/aegis-app
npm run dev
# Will run on http://localhost:3000
```

**Note**: Without the Guardian backend running, API calls will fail, but you can still develop and test the UI.

## Port Configuration

- **Guardian Backend**: Always port 3000 (configured in aegis-guardian)
- **Frontend**: Automatically selects:
  - Port 3000 if available
  - Port 3001 if 3000 is in use
  - Next available port if both are in use

## Environment Variables

The frontend is configured to connect to the Guardian backend at:
```
NEXT_PUBLIC_GUARDIAN_API_URL=http://localhost:3000
```

This is correct regardless of which port the frontend runs on.

## Troubleshooting

### "Port already in use" errors
```bash
# Check what's using the ports
lsof -ti:3000
lsof -ti:3001

# Kill specific process
kill <PID>
```

### Multiple dev servers running
```bash
# Check all Next.js dev servers
ps aux | grep "next dev"

# Kill all (if needed)
pkill -f "next dev"
```

### Frontend can't reach backend
1. Verify Guardian is running: `curl http://localhost:3000/api/health`
2. Check Guardian logs for errors
3. Verify `.env.local` has correct `NEXT_PUBLIC_GUARDIAN_API_URL`

## Quick Status Check

```bash
# Check if Guardian is running
curl -s http://localhost:3000/api/health && echo "✓ Guardian running" || echo "✗ Guardian not running"

# Check if Frontend is accessible
curl -s http://localhost:3001 > /dev/null && echo "✓ Frontend running on 3001" || \
curl -s http://localhost:3000 > /dev/null && echo "✓ Frontend running on 3000" || \
echo "✗ Frontend not running"
```

## Current Status

After fixing the chunk loading errors:
- ✅ Frontend compiles successfully
- ✅ All pages load without errors
- ✅ Zero TypeScript compilation errors
- ✅ Production build successful

See `TROUBLESHOOTING.md` for details on resolved issues.
