#!/bin/bash

# Midtrans Sandbox Quick Setup Script
# This script helps you quickly setup Midtrans sandbox for testing

set -e

echo "🚀 Midtrans Sandbox Quick Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Sandbox credentials
MIDTRANS_CLIENT_KEY="YOUR_MIDTRANS_CLIENT_KEY"
MIDTRANS_SERVER_KEY="YOUR_MIDTRANS_SERVER_KEY"
MERCHANT_ID="YOUR_MERCHANT_ID"

echo "📋 Sandbox Credentials:"
echo "  Merchant ID: $MERCHANT_ID"
echo "  Client Key: $MIDTRANS_CLIENT_KEY"
echo "  Server Key: $MIDTRANS_SERVER_KEY"
echo ""

# Step 1: Check if .env exists
echo "📝 Step 1: Setting up environment variables..."
if [ -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
    read -p "Do you want to update it? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Backup existing .env
        cp .env .env.backup
        echo -e "${GREEN}✅ Backed up existing .env to .env.backup${NC}"
    else
        echo "Skipping .env update"
    fi
else
    cp .env.example .env
    echo -e "${GREEN}✅ Created .env from .env.example${NC}"
fi

# Update .env with sandbox credentials
if [[ $REPLY =~ ^[Yy]$ ]] || [ ! -f ".env.backup" ]; then
    sed -i.bak "s/VITE_MIDTRANS_CLIENT_KEY=.*/VITE_MIDTRANS_CLIENT_KEY=$MIDTRANS_CLIENT_KEY/" .env
    sed -i.bak "s/VITE_MIDTRANS_IS_PRODUCTION=.*/VITE_MIDTRANS_IS_PRODUCTION=false/" .env
    rm .env.bak 2>/dev/null || true
    echo -e "${GREEN}✅ Updated .env with sandbox credentials${NC}"
fi

echo ""

# Step 2: Check Supabase CLI
echo "🔧 Step 2: Checking Supabase CLI..."
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Supabase CLI is installed${NC}"
    SUPABASE_VERSION=$(supabase --version)
    echo "   Version: $SUPABASE_VERSION"
else
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "   Install it from: https://supabase.com/docs/guides/cli"
    echo "   Or run: npm install -g supabase"
    exit 1
fi

echo ""

# Step 3: Check if Supabase is linked
echo "🔗 Step 3: Checking Supabase project..."
if [ -f "supabase/.temp/project-ref" ]; then
    PROJECT_REF=$(cat supabase/.temp/project-ref)
    echo -e "${GREEN}✅ Linked to Supabase project: $PROJECT_REF${NC}"
else
    echo -e "${YELLOW}⚠️  Not linked to Supabase project${NC}"
    echo "   Run: supabase link --project-ref your-project-ref"
    read -p "Do you want to link now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase link
    else
        echo "Skipping Supabase link"
    fi
fi

echo ""

# Step 4: Set Supabase secrets
echo "🔐 Step 4: Setting Supabase Edge Function secrets..."
read -p "Do you want to set Midtrans secrets in Supabase? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Setting MIDTRANS_SERVER_KEY..."
    supabase secrets set MIDTRANS_SERVER_KEY="$MIDTRANS_SERVER_KEY" || echo -e "${RED}Failed to set secret${NC}"
    
    echo "Setting MIDTRANS_IS_PRODUCTION..."
    supabase secrets set MIDTRANS_IS_PRODUCTION="false" || echo -e "${RED}Failed to set secret${NC}"
    
    echo -e "${GREEN}✅ Secrets set successfully${NC}"
else
    echo "Skipping secrets setup"
    echo "You can set them manually later with:"
    echo "  supabase secrets set MIDTRANS_SERVER_KEY=$MIDTRANS_SERVER_KEY"
    echo "  supabase secrets set MIDTRANS_IS_PRODUCTION=false"
fi

echo ""

# Step 5: Run migrations
echo "🗄️  Step 5: Running database migrations..."
read -p "Do you want to run migrations? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    supabase db push || echo -e "${RED}Failed to run migrations${NC}"
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo "Skipping migrations"
fi

echo ""

# Step 6: Deploy Edge Functions
echo "☁️  Step 6: Deploying Edge Functions..."
read -p "Do you want to deploy Edge Functions? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Deploying midtrans-create-transaction..."
    supabase functions deploy midtrans-create-transaction || echo -e "${RED}Failed to deploy${NC}"
    
    echo "Deploying midtrans-webhook..."
    supabase functions deploy midtrans-webhook || echo -e "${RED}Failed to deploy${NC}"
    
    echo "Deploying midtrans-subscription..."
    supabase functions deploy midtrans-subscription || echo -e "${RED}Failed to deploy${NC}"
    
    echo "Deploying subscription-renewal..."
    supabase functions deploy subscription-renewal || echo -e "${RED}Failed to deploy${NC}"
    
    echo -e "${GREEN}✅ Edge Functions deployed${NC}"
else
    echo "Skipping Edge Functions deployment"
fi

echo ""

# Step 7: Get Supabase URL and Keys
echo "🔑 Step 7: Getting Supabase credentials..."
if command -v supabase &> /dev/null; then
    echo "Run this command to get your credentials:"
    echo "  supabase status"
    echo ""
    read -p "Do you want to see status now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        supabase status
    fi
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Configure Webhook URL in Midtrans Dashboard:"
echo "   https://dashboard.sandbox.midtrans.com/"
echo "   Settings > Configuration > Notification URL"
echo "   Set to: https://YOUR-PROJECT.supabase.co/functions/v1/midtrans-webhook"
echo ""
echo "2. Test the integration:"
echo "   Option A: Open src/test-midtrans.html in browser"
echo "   Option B: Run ./test-midtrans-api.sh"
echo "   Option C: Start dev server and go to /billing"
echo ""
echo "3. Use test cards:"
echo "   Success: 4811 1111 1111 1114 (CVV: 123)"
echo "   Denied:  4911 1111 1111 1113 (CVV: 123)"
echo "   3DS:     4611 1111 1111 1112 (CVV: 123, OTP: 112233)"
echo ""
echo "4. Read the testing guide:"
echo "   cat MIDTRANS_TESTING_GUIDE.md"
echo ""
echo "🎉 Happy Testing!"
echo ""
