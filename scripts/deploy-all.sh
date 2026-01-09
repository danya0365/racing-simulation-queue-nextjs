#!/bin/bash

#######################################
# Racing Queue - Full Deployment Script
# 
# This script deploys both Supabase and Vercel
# 
# Usage:
#   ./scripts/deploy-all.sh
#   
# What it does:
#   1. Check environment setup
#   2. Deploy Supabase migrations
#   3. Generate TypeScript types
#   4. Deploy to Vercel
#######################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

echo -e "${PURPLE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         🏎️  Racing Queue - Full Deployment                 ║"
echo "║                                                            ║"
echo "║           Supabase + Vercel Production Deploy              ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Navigate to project root
cd "$PROJECT_ROOT"

# Step 1: Environment Check
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}📋 Step 1/4: Environment Check${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
./scripts/setup-env.sh production

# Step 2: Deploy Supabase
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}🗄️  Step 2/4: Deploy Supabase Migrations${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Do you want to deploy Supabase migrations? (yes/no)${NC}"
read -r deploy_supabase

if [ "$deploy_supabase" == "yes" ]; then
    ./scripts/deploy-supabase.sh push
else
    echo -e "${YELLOW}⏭️  Skipping Supabase deployment${NC}"
fi

# Step 3: Generate Types
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}🔄 Step 3/4: Generate TypeScript Types${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Do you want to regenerate TypeScript types? (yes/no)${NC}"
read -r generate_types

if [ "$generate_types" == "yes" ]; then
    ./scripts/deploy-supabase.sh generate
else
    echo -e "${YELLOW}⏭️  Skipping type generation${NC}"
fi

# Step 4: Deploy Vercel
echo -e "\n${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${PURPLE}🚀 Step 4/4: Deploy to Vercel${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"

echo -e "${YELLOW}Do you want to deploy to Vercel? (yes/no)${NC}"
read -r deploy_vercel

if [ "$deploy_vercel" == "yes" ]; then
    ./scripts/deploy-vercel.sh production
else
    echo -e "${YELLOW}⏭️  Skipping Vercel deployment${NC}"
fi

# Complete
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║            🎉 Full Deployment Complete! 🎉                 ║"
echo "║                                                            ║"
echo "║      🏎️  Racing Queue is now live in production!           ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📝 Deployment Summary:${NC}"
echo "  • Supabase: ${deploy_supabase:-skipped}"
echo "  • TypeScript Types: ${generate_types:-skipped}"
echo "  • Vercel: ${deploy_vercel:-skipped}"
echo ""
echo -e "${CYAN}🔗 Quick Links:${NC}"
echo "  • Vercel Dashboard: https://vercel.com"
echo "  • Supabase Dashboard: https://supabase.com/dashboard"
echo ""
echo -e "${PURPLE}🏎️ Happy Racing!${NC}"
