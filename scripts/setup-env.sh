#!/bin/bash

#######################################
# Racing Queue - Environment Setup Script
# 
# This script helps setup environment variables for deployment
# 
# Usage:
#   ./scripts/setup-env.sh [environment]
#   
# Environments:
#   local       - Setup for local development (default)
#   production  - Setup for production
#   staging     - Setup for staging
#   
# What this script does:
#   1. Validates required environment variables
#   2. Creates .env files if needed
#   3. Checks Supabase/Vercel connectivity
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

# Default environment
ENVIRONMENT="${1:-local}"

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          🔧 Racing Queue - Environment Setup               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Navigate to project root
cd "$PROJECT_ROOT"

echo -e "${YELLOW}Environment: $ENVIRONMENT${NC}"
echo ""

# Function to check if a file exists
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}  ✅ $1 exists${NC}"
        return 0
    else
        echo -e "${RED}  ❌ $1 not found${NC}"
        return 1
    fi
}

# Function to prompt for input
prompt_variable() {
    local var_name="$1"
    local description="$2"
    local default_value="$3"
    local is_secret="$4"
    
    if [ "$is_secret" == "true" ]; then
        echo -en "${YELLOW}Enter $description [$var_name]: ${NC}"
        read -rs value
        echo ""
    else
        echo -en "${YELLOW}Enter $description [$var_name] (default: $default_value): ${NC}"
        read -r value
    fi
    
    echo "${value:-$default_value}"
}

# Check for required files
echo -e "${BLUE}📋 Checking required files...${NC}"
check_file ".env.example"

# Create .env.local if not exists
if [ ! -f ".env.local" ] && [ "$ENVIRONMENT" == "local" ]; then
    echo -e "\n${YELLOW}Creating .env.local from .env.example...${NC}"
    cp .env.example .env.local
    echo -e "${GREEN}  ✅ Created .env.local${NC}"
fi

# Validate environment based on target
echo -e "\n${BLUE}🔍 Validating environment: $ENVIRONMENT${NC}"

case "$ENVIRONMENT" in
    local)
        echo -e "${YELLOW}Checking local development setup...${NC}"
        
        # Check if Supabase is running locally
        if command -v supabase &> /dev/null; then
            echo -e "  → Checking local Supabase..."
            if supabase status 2>/dev/null | grep -q "API URL"; then
                echo -e "${GREEN}  ✅ Local Supabase is running${NC}"
            else
                echo -e "${YELLOW}  ⚠️  Local Supabase is not running${NC}"
                echo -e "${YELLOW}      Start with: npm run supabase-start${NC}"
            fi
        else
            echo -e "${YELLOW}  ⚠️  Supabase CLI not installed${NC}"
        fi
        
        echo -e "\n${GREEN}Local development environment is ready!${NC}"
        echo -e "Run: ${CYAN}npm run dev${NC} to start development server"
        ;;
        
    production)
        echo -e "${YELLOW}Checking production requirements...${NC}"
        
        # Required environment variables for production
        required_vars=(
            "NEXT_PUBLIC_SUPABASE_URL"
            "NEXT_PUBLIC_SUPABASE_ANON_KEY"
            "SUPABASE_SERVICE_ROLE_KEY"
            "NEXT_PUBLIC_APP_URL"
        )
        
        all_set=true
        for var in "${required_vars[@]}"; do
            if [ -n "${!var}" ]; then
                echo -e "${GREEN}  ✅ $var is set${NC}"
            else
                echo -e "${RED}  ❌ $var is NOT set${NC}"
                all_set=false
            fi
        done
        
        if [ "$all_set" == "false" ]; then
            echo -e "\n${RED}❌ Missing required environment variables${NC}"
            echo -e "${YELLOW}Set them in your Vercel project settings or .env.local file${NC}"
            exit 1
        fi
        
        # Check Vercel CLI
        if command -v vercel &> /dev/null; then
            echo -e "${GREEN}  ✅ Vercel CLI is installed${NC}"
            
            if vercel whoami &> /dev/null; then
                echo -e "${GREEN}  ✅ Logged in as: $(vercel whoami)${NC}"
            else
                echo -e "${YELLOW}  ⚠️  Not logged in to Vercel${NC}"
                echo -e "${YELLOW}      Run: vercel login${NC}"
            fi
        else
            echo -e "${YELLOW}  ⚠️  Vercel CLI not installed${NC}"
            echo -e "${YELLOW}      Install with: npm i -g vercel${NC}"
        fi
        
        echo -e "\n${GREEN}Production environment checklist complete!${NC}"
        ;;
        
    staging)
        echo -e "${YELLOW}Checking staging requirements...${NC}"
        echo -e "${BLUE}Staging uses -staging suffix for Supabase project${NC}"
        echo -e "\n${GREEN}Staging environment ready!${NC}"
        ;;
        
    *)
        echo -e "${RED}❌ Unknown environment: $ENVIRONMENT${NC}"
        echo "Valid environments: local, production, staging"
        exit 1
        ;;
esac

# Print summary
echo -e "\n${PURPLE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              📋 Environment Setup Summary                   ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║                                                            ║"
echo "║  Environment Variables (.env.local):                       ║"
echo "║  ─────────────────────────────────────────────────────────  ║"
echo "║  • NEXT_PUBLIC_SUPABASE_URL      - Supabase API URL        ║"
echo "║  • NEXT_PUBLIC_SUPABASE_ANON_KEY - Public API key          ║"
echo "║  • SUPABASE_SERVICE_ROLE_KEY     - Server-side key         ║"
echo "║  • NEXT_PUBLIC_APP_URL           - Application URL         ║"
echo "║                                                            ║"
echo "║  Quick Commands:                                           ║"
echo "║  ─────────────────────────────────────────────────────────  ║"
echo "║  • npm run dev              - Start dev server             ║"
echo "║  • npm run build            - Build for production         ║"
echo "║  • npm run deploy:vercel    - Deploy to Vercel             ║"
echo "║  • npm run deploy:supabase  - Deploy database              ║"
echo "║  • npm run deploy:all       - Deploy everything            ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
