#!/bin/bash

# 🚀 Bossio.io Production Deployment Script
# This script uses CLIs to automate the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting Bossio.io Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required CLIs are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    command -v neonctl >/dev/null 2>&1 || { print_error "neonctl is required but not installed. Run: npm install -g neonctl"; exit 1; }
    command -v vercel >/dev/null 2>&1 || { print_error "vercel is required but not installed. Run: npm install -g vercel"; exit 1; }
    command -v stripe >/dev/null 2>&1 || { print_error "stripe is required but not installed. Run: brew install stripe/stripe-cli/stripe"; exit 1; }
    command -v gcloud >/dev/null 2>&1 || { print_error "gcloud is required but not installed. Install Google Cloud SDK."; exit 1; }
    
    print_success "All CLI tools are installed"
}

# Build the application
build_application() {
    print_status "Building application..."
    npm run build
    print_success "Application built successfully"
}

# Setup Neon database
setup_database() {
    print_status "Setting up Neon database..."
    
    # Check if already authenticated
    if ! neonctl me >/dev/null 2>&1; then
        print_status "Please authenticate with Neon:"
        neonctl auth
    fi
    
    # Create project if it doesn't exist
    print_status "Creating Neon project..."
    PROJECT_ID=$(neonctl projects create --name "bossio-production" --output json 2>/dev/null | jq -r '.id' || echo "")
    
    if [ -z "$PROJECT_ID" ]; then
        print_warning "Project may already exist, getting existing project..."
        PROJECT_ID=$(neonctl projects list --output json | jq -r '.[] | select(.name=="bossio-production") | .id' | head -1)
    fi
    
    if [ -n "$PROJECT_ID" ]; then
        print_success "Using Neon project: $PROJECT_ID"
        
        # Get connection string
        DATABASE_URL=$(neonctl connection-string --project-id "$PROJECT_ID" --output plain)
        print_success "Database URL obtained"
        
        # Run migrations
        print_status "Running database migrations..."
        DATABASE_URL="$DATABASE_URL" npx drizzle-kit push
        print_success "Database migrations completed"
    else
        print_error "Failed to create or find Neon project"
        exit 1
    fi
}

# Setup Stripe
setup_stripe() {
    print_status "Checking Stripe authentication..."
    
    if ! stripe config --list >/dev/null 2>&1; then
        print_status "Please authenticate with Stripe:"
        stripe login
    fi
    
    print_success "Stripe is configured"
}

# Deploy to Vercel
deploy_vercel() {
    print_status "Deploying to Vercel..."
    
    # Check if already authenticated
    if ! vercel whoami >/dev/null 2>&1; then
        print_status "Please authenticate with Vercel:"
        vercel login
    fi
    
    # Deploy to production
    print_status "Deploying to production..."
    vercel --prod --yes
    
    # Get deployment URL
    DEPLOYMENT_URL=$(vercel ls --limit 1 --output json | jq -r '.[0].url' || echo "")
    if [ -n "$DEPLOYMENT_URL" ]; then
        print_success "Deployed to: https://$DEPLOYMENT_URL"
        
        # Add environment variables
        print_status "Setting up environment variables..."
        echo "$DATABASE_URL" | vercel env add DATABASE_URL production || print_warning "DATABASE_URL may already exist"
        
        print_success "Environment variables configured"
    else
        print_error "Failed to get deployment URL"
        exit 1
    fi
}

# Test deployment
test_deployment() {
    print_status "Testing deployment..."
    
    if [ -n "$DEPLOYMENT_URL" ]; then
        # Test homepage
        if curl -s -f "https://$DEPLOYMENT_URL" >/dev/null; then
            print_success "Homepage is accessible"
        else
            print_error "Homepage test failed"
        fi
        
        # Test API health
        if curl -s -f "https://$DEPLOYMENT_URL/api/health" >/dev/null 2>&1; then
            print_success "API is responding"
        else
            print_warning "API health check failed (may be expected if endpoint doesn't exist)"
        fi
    fi
}

# Setup webhook forwarding for local testing
setup_webhooks() {
    print_status "Setting up Stripe webhook forwarding..."
    print_warning "Run this command in a separate terminal for local webhook testing:"
    echo "stripe listen --forward-to https://$DEPLOYMENT_URL/api/webhooks/stripe"
}

# Main deployment flow
main() {
    print_status "🚀 Bossio.io Production Deployment Starting..."
    
    check_dependencies
    build_application
    setup_database
    setup_stripe
    deploy_vercel
    test_deployment
    setup_webhooks
    
    echo ""
    print_success "🎉 Deployment Complete!"
    echo ""
    echo "📋 Next Steps:"
    echo "1. Visit your site: https://$DEPLOYMENT_URL"
    echo "2. Configure Google OAuth with production domain"
    echo "3. Test payment flow with Stripe"
    echo "4. Set up your first barbershop"
    echo ""
    echo "🔧 Management Commands:"
    echo "- Database: neonctl operations list"
    echo "- Deployment: vercel logs --follow"
    echo "- Payments: stripe events list"
    echo ""
}

# Run main function
main "$@"