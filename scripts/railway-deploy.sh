#!/bin/bash
# ==================================
# Aegis Frontend - Railway Deployment Script
# ==================================
# This script deploys the aegis-app frontend to Railway
#
# Prerequisites:
# - Railway CLI installed (npm install -g @railway/cli)
# - Railway account
# - Logged in to Railway (railway login)
#
# Usage:
#   ./scripts/railway-deploy.sh

set -e  # Exit on error
set -u  # Exit on undefined variable

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Aegis Frontend - Railway Deployment${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo -e "${RED}Error: Railway CLI is not installed${NC}"
    echo "Install it with: npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo -e "${RED}Error: Not logged in to Railway${NC}"
    echo "Run: railway login"
    exit 1
fi

echo -e "${YELLOW}Step 1: Creating Railway project for frontend...${NC}"
railway init --name "aegis-app"
echo -e "${GREEN}✓ Project created${NC}"
echo ""

# Link to the project
railway link

echo -e "${YELLOW}Step 2: Setting environment variables...${NC}"

# Set all required environment variables
railway variables --set NEXT_PUBLIC_GUARDIAN_API_URL="https://aegis-guardian-production.up.railway.app"
railway variables --set NEXT_PUBLIC_SOLANA_RPC_URL="https://api.devnet.solana.com"
railway variables --set NEXT_PUBLIC_SOLANA_NETWORK="devnet"
railway variables --set NEXT_PUBLIC_PROGRAM_ID="ET9WDoFE2bf4bSmciLL7q7sKdeSYeNkWbNMHbAMBu2ZJ"
railway variables --set NODE_ENV="production"
railway variables --set PORT="3000"

echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

echo -e "${YELLOW}Step 3: Deploying to Railway...${NC}"
railway up
echo -e "${GREEN}✓ Deployment initiated${NC}"
echo ""

echo -e "${YELLOW}Step 4: Getting deployment URL...${NC}"
DEPLOYMENT_URL=$(railway domain)
echo -e "${GREEN}✓ Frontend deployed to: ${DEPLOYMENT_URL}${NC}"
echo ""

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Next Steps:${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "1. Configure custom domain:"
echo -e "   ${YELLOW}railway domain add aegis-vaults.xyz${NC}"
echo ""
echo -e "2. Update DNS records:"
echo -e "   - Add CNAME record pointing aegis-vaults.xyz to Railway domain"
echo ""
echo -e "3. Update CORS on Guardian backend:"
echo -e "   - Ensure aegis-vaults.xyz is in CORS_ORIGINS"
echo ""
echo -e "4. Test the deployment:"
echo -e "   ${YELLOW}curl -I https://aegis-vaults.xyz/api/health${NC}"
echo ""
echo -e "${GREEN}Deployment complete!${NC}"
