#!/bin/bash

#######################################
# Racing Queue - Vercel Deployment Script
# 
# This script deploys the Next.js app to Vercel
# 
# Usage:
#   ./scripts/deploy-vercel.sh [environment]
#   
# Environments:
#   production  - Deploy to production (default)
#   preview     - Deploy preview version
#   
# Prerequisites:
#   - Vercel CLI installed: npm i -g vercel
#   - Logged in to Vercel: vercel login
#######################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Default environment
ENVIRONMENT="${1:-production}"

echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║           🏎️  Racing Queue - Vercel Deployment             ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Error: Vercel CLI is not installed${NC}"
    echo -e "${YELLOW}Please install it with: npm i -g vercel${NC}"
    exit 1
fi

# Check if logged in to Vercel
echo -e "${BLUE}📋 Checking Vercel authentication...${NC}"
if ! vercel whoami &> /dev/null; then
    echo -e "${RED}❌ Error: Not logged in to Vercel${NC}"
    echo -e "${YELLOW}Please login with: vercel login${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Authenticated as: $(vercel whoami)${NC}"

# Navigate to project root
cd "$PROJECT_ROOT"

# Run pre-deployment checks
echo -e "\n${BLUE}🔍 Running pre-deployment checks...${NC}"

# Type check
echo -e "${YELLOW}  → Running TypeScript type check...${NC}"
if npm run type-check; then
    echo -e "${GREEN}  ✅ Type check passed${NC}"
else
    echo -e "${RED}  ❌ Type check failed${NC}"
    exit 1
fi

# Build test
echo -e "${YELLOW}  → Testing production build...${NC}"
if npm run build; then
    echo -e "${GREEN}  ✅ Build successful${NC}"
else
    echo -e "${RED}  ❌ Build failed${NC}"
    exit 1
fi

# Deploy based on environment
echo -e "\n${BLUE}🚀 Deploying to Vercel...${NC}"

if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${YELLOW}  → Deploying to PRODUCTION...${NC}"
    vercel --prod
else
    echo -e "${YELLOW}  → Deploying PREVIEW...${NC}"
    vercel
fi

# Success
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ Deployment Successful!                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📝 Post-deployment checklist:${NC}"
echo "  1. Check the deployment URL in your browser"
echo "  2. Verify environment variables in Vercel dashboard"
echo "  3. Test authentication flows"
echo "  4. Check database connectivity"
echo ""
echo -e "${PURPLE}🏎️ Racing Queue deployed successfully!${NC}"
