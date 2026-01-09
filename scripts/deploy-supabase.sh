#!/bin/bash

#######################################
# Racing Queue - Supabase Deployment Script
# 
# This script deploys database migrations to Supabase
# 
# Usage:
#   ./scripts/deploy-supabase.sh [command]
#   
# Commands:
#   push        - Push migrations to remote (default)
#   reset       - Reset and push (WARNING: destroys data)
#   status      - Show migration status
#   generate    - Generate TypeScript types
#   
# Prerequisites:
#   - Supabase CLI installed: npm i -g supabase
#   - Logged in to Supabase: supabase login
#   - Project linked: supabase link --project-ref <project-id>
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

# Default command
COMMAND="${1:-push}"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          🗄️  Racing Queue - Supabase Deployment            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Error: Supabase CLI is not installed${NC}"
    echo -e "${YELLOW}Please install it with: npm i -g supabase${NC}"
    echo -e "${YELLOW}Or use: brew install supabase/tap/supabase${NC}"
    exit 1
fi

# Navigate to project root
cd "$PROJECT_ROOT"

# Check if supabase directory exists
if [ ! -d "supabase" ]; then
    echo -e "${RED}❌ Error: supabase directory not found${NC}"
    echo -e "${YELLOW}Please initialize Supabase with: supabase init${NC}"
    exit 1
fi

# Show project info
echo -e "${BLUE}📋 Project Information${NC}"
echo -e "  • Project Root: $PROJECT_ROOT"
echo -e "  • Supabase Dir: $PROJECT_ROOT/supabase"
echo ""

case "$COMMAND" in
    push)
        echo -e "${BLUE}🚀 Pushing migrations to remote Supabase...${NC}"
        echo -e "${YELLOW}⚠️  This will apply all pending migrations${NC}"
        echo ""
        
        # Check for linked project
        if ! supabase db remote list &> /dev/null; then
            echo -e "${YELLOW}📝 Project may not be linked. Attempting to push...${NC}"
        fi
        
        # Push migrations
        echo -e "${YELLOW}  → Pushing database changes...${NC}"
        if supabase db push; then
            echo -e "${GREEN}✅ Database migrations pushed successfully!${NC}"
        else
            echo -e "${RED}❌ Failed to push migrations${NC}"
            echo -e "${YELLOW}💡 Make sure your project is linked with: supabase link --project-ref <project-id>${NC}"
            exit 1
        fi
        ;;
        
    reset)
        echo -e "${RED}⚠️  WARNING: This will RESET and DESTROY all data!${NC}"
        echo -e "${YELLOW}Are you sure you want to continue? (yes/no)${NC}"
        read -r confirmation
        
        if [ "$confirmation" != "yes" ]; then
            echo -e "${BLUE}Operation cancelled.${NC}"
            exit 0
        fi
        
        echo -e "${YELLOW}  → Resetting database...${NC}"
        if supabase db reset; then
            echo -e "${GREEN}✅ Database reset successfully!${NC}"
        else
            echo -e "${RED}❌ Failed to reset database${NC}"
            exit 1
        fi
        ;;
        
    status)
        echo -e "${BLUE}📊 Checking migration status...${NC}"
        echo ""
        
        # List migrations
        echo -e "${YELLOW}=== Local Migrations ===${NC}"
        ls -la supabase/migrations/ 2>/dev/null || echo "No migrations found"
        echo ""
        
        # Show diff if possible
        echo -e "${YELLOW}=== Database Diff ===${NC}"
        supabase db diff --schema public 2>/dev/null || echo "Could not get diff (project may not be linked)"
        ;;
        
    generate)
        echo -e "${BLUE}🔄 Generating TypeScript types...${NC}"
        
        # Generate types from remote
        echo -e "${YELLOW}  → Generating types from remote database...${NC}"
        if supabase gen types typescript --linked --schema public > src/domain/types/supabase.ts; then
            echo -e "${GREEN}✅ Types generated at: src/domain/types/supabase.ts${NC}"
        else
            echo -e "${YELLOW}  → Trying local database...${NC}"
            if supabase gen types typescript --local --schema public > src/domain/types/supabase.ts; then
                echo -e "${GREEN}✅ Types generated from local database${NC}"
            else
                echo -e "${RED}❌ Failed to generate types${NC}"
                exit 1
            fi
        fi
        ;;
        
    *)
        echo -e "${RED}❌ Unknown command: $COMMAND${NC}"
        echo ""
        echo "Usage: ./scripts/deploy-supabase.sh [command]"
        echo ""
        echo "Commands:"
        echo "  push      - Push migrations to remote (default)"
        echo "  reset     - Reset and push (WARNING: destroys data)"
        echo "  status    - Show migration status"
        echo "  generate  - Generate TypeScript types"
        exit 1
        ;;
esac

# Success
echo -e "\n${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              ✅ Supabase Command Complete!                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

echo -e "${BLUE}📝 Next steps:${NC}"
echo "  1. Check Supabase dashboard for changes"
echo "  2. Verify RLS policies are active"
echo "  3. Test database connections"
echo "  4. Generate TypeScript types: npm run supabase-generate"
echo ""
echo -e "${CYAN}🗄️ Supabase deployment complete!${NC}"
