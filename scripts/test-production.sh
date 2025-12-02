#!/bin/bash
# ==================================
# Production Deployment Verification Script
# ==================================
# Tests all fixes after Railway deployment
#
# Usage: ./scripts/test-production.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Production Deployment Verification${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Test 1: CORS Headers
echo -e "${YELLOW}Test 1: CORS Headers (x-user-id)${NC}"
CORS_RESPONSE=$(curl -s -i -X OPTIONS \
  -H "Origin: https://aegis-vaults.xyz" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: x-user-id" \
  https://aegis-guardian-production.up.railway.app/api/api-keys 2>&1)

if echo "$CORS_RESPONSE" | grep -q "x-user-id"; then
    echo -e "${GREEN}✅ PASS: x-user-id header is allowed${NC}"
else
    echo -e "${RED}❌ FAIL: x-user-id header NOT in CORS headers${NC}"
    echo "Response headers:"
    echo "$CORS_RESPONSE" | grep -i "access-control"
fi
echo ""

# Test 2: Apple Touch Icon
echo -e "${YELLOW}Test 2: Apple Touch Icon${NC}"
ICON_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aegis-vaults.xyz/apple-touch-icon.png)

if [ "$ICON_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ PASS: apple-touch-icon.png returns 200${NC}"
else
    echo -e "${RED}❌ FAIL: apple-touch-icon.png returns ${ICON_STATUS}${NC}"
fi
echo ""

# Test 3: Program Exists on Devnet
echo -e "${YELLOW}Test 3: Solana Program Exists${NC}"
PROGRAM_ID="ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ"

if solana program show $PROGRAM_ID --url devnet &> /dev/null; then
    echo -e "${GREEN}✅ PASS: Program exists on devnet${NC}"
    solana program show $PROGRAM_ID --url devnet | head -5
else
    echo -e "${RED}❌ FAIL: Program NOT found on devnet${NC}"
fi
echo ""

# Test 4: Guardian API Health
echo -e "${YELLOW}Test 4: Guardian API Health${NC}"
GUARDIAN_HEALTH=$(curl -s https://aegis-guardian-production.up.railway.app/api/health)

if echo "$GUARDIAN_HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✅ PASS: Guardian API is healthy${NC}"
    echo "$GUARDIAN_HEALTH"
else
    echo -e "${RED}❌ FAIL: Guardian API health check failed${NC}"
    echo "$GUARDIAN_HEALTH"
fi
echo ""

# Test 5: Frontend Responds
echo -e "${YELLOW}Test 5: Frontend Health${NC}"
FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://aegis-vaults.xyz)

if [ "$FRONTEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ PASS: Frontend returns 200${NC}"
else
    echo -e "${RED}❌ FAIL: Frontend returns ${FRONTEND_STATUS}${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}Next Step: Manual Vault Creation Test${NC}"
echo ""
echo "1. Open https://aegis-vaults.xyz in your browser"
echo "2. Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+F5 (Windows)"
echo "3. Open DevTools Console (F12)"
echo "4. Connect your wallet"
echo "5. Create a new vault"
echo "6. Copy the vault address and transaction signature from console"
echo "7. Run:"
echo -e "   ${GREEN}node scripts/verify-vault.mjs <vault_address> <signature>${NC}"
echo ""
echo -e "${YELLOW}Expected:${NC}"
echo "  ✅ Transaction found!"
echo "  ✅ Vault account EXISTS!"
echo "  ✅ Program account EXISTS on this network"
echo ""

