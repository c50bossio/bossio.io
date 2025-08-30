#!/bin/bash

# 🛠️ Bossio.io Development Tools Script
# Helpful commands for development and testing

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_header() {
    echo -e "${BLUE}===========================================${NC}"
    echo -e "${BLUE}  🛠️  Bossio.io Development Tools${NC}"
    echo -e "${BLUE}===========================================${NC}"
}

show_menu() {
    echo ""
    echo "Select an option:"
    echo "1) 🚀 Start development server"
    echo "2) 🗄️  Run database migrations" 
    echo "3) 💳 Test Stripe webhooks locally"
    echo "4) 🔍 Check deployment status"
    echo "5) 📊 View database operations"
    echo "6) 🧪 Run test suite"
    echo "7) 🏗️  Build for production"
    echo "8) 📝 Show environment status"
    echo "9) 🔧 Quick CLI setup check"
    echo "0) 🚪 Exit"
    echo ""
}

start_dev() {
    echo -e "${GREEN}Starting development server...${NC}"
    npm run dev
}

run_migrations() {
    echo -e "${GREEN}Running database migrations...${NC}"
    npx drizzle-kit push
}

test_webhooks() {
    echo -e "${GREEN}Starting Stripe webhook listener...${NC}"
    echo -e "${YELLOW}This will forward webhooks to localhost:3000${NC}"
    stripe listen --forward-to localhost:3000/api/webhooks/stripe
}

check_deployment() {
    echo -e "${GREEN}Checking deployment status...${NC}"
    echo ""
    echo "Vercel deployments:"
    vercel ls --limit 5
    echo ""
    echo "Neon database status:"
    neonctl operations list --limit 5
}

view_db_operations() {
    echo -e "${GREEN}Recent database operations:${NC}"
    neonctl operations list --limit 10
}

run_tests() {
    echo -e "${GREEN}Running test suite...${NC}"
    npm test
}

build_production() {
    echo -e "${GREEN}Building for production...${NC}"
    npm run build
    echo -e "${GREEN}Build complete! Run './deploy-production.sh' to deploy.${NC}"
}

show_env_status() {
    echo -e "${GREEN}Environment Status:${NC}"
    echo ""
    echo "📦 Node.js: $(node --version)"
    echo "📦 NPM: $(npm --version)"
    echo ""
    echo "🔧 CLI Tools:"
    command -v neonctl >/dev/null 2>&1 && echo "✅ Neon CLI installed" || echo "❌ Neon CLI missing"
    command -v vercel >/dev/null 2>&1 && echo "✅ Vercel CLI installed" || echo "❌ Vercel CLI missing"  
    command -v stripe >/dev/null 2>&1 && echo "✅ Stripe CLI installed" || echo "❌ Stripe CLI missing"
    command -v gcloud >/dev/null 2>&1 && echo "✅ Google Cloud CLI installed" || echo "❌ Google Cloud CLI missing"
    echo ""
    echo "🔐 Authentication Status:"
    neonctl me >/dev/null 2>&1 && echo "✅ Neon authenticated" || echo "❌ Neon not authenticated (run: neonctl auth)"
    vercel whoami >/dev/null 2>&1 && echo "✅ Vercel authenticated" || echo "❌ Vercel not authenticated (run: vercel login)"
    stripe config --list >/dev/null 2>&1 && echo "✅ Stripe authenticated" || echo "❌ Stripe not authenticated (run: stripe login)"
}

cli_setup_check() {
    echo -e "${GREEN}CLI Setup Check:${NC}"
    echo ""
    echo "🔧 Installation commands if needed:"
    echo "npm install -g neonctl vercel"
    echo "brew install stripe/stripe-cli/stripe"
    echo ""
    echo "🔐 Authentication commands:"
    echo "neonctl auth"
    echo "vercel login"  
    echo "stripe login"
    echo "gcloud auth login"
}

# Main menu loop
main() {
    print_header
    
    while true; do
        show_menu
        read -p "Enter choice [0-9]: " choice
        
        case $choice in
            1) start_dev ;;
            2) run_migrations ;;
            3) test_webhooks ;;
            4) check_deployment ;;
            5) view_db_operations ;;
            6) run_tests ;;
            7) build_production ;;
            8) show_env_status ;;
            9) cli_setup_check ;;
            0) echo -e "${GREEN}Goodbye!${NC}"; exit 0 ;;
            *) echo -e "${YELLOW}Invalid option. Please try again.${NC}" ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

main "$@"