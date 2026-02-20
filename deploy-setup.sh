#!/bin/bash

# ChaTtoEdit - Database and Edge Functions Setup Script
# This script applies migrations and deploys edge functions

set -e  # Exit on error

echo "🚀 ChaTtoEdit Setup Script"
echo "=========================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Please install it first:"
    echo "  npm install -g supabase"
    echo "  or visit: https://supabase.com/docs/guides/cli"
    exit 1
fi

echo -e "${GREEN}✓ Supabase CLI found${NC}"
echo ""

# Check if logged in
echo "Checking Supabase authentication..."
if ! supabase projects list &> /dev/null; then
    echo -e "${YELLOW}⚠ Not logged in to Supabase${NC}"
    echo "Logging in..."
    supabase login
fi

echo -e "${GREEN}✓ Authenticated${NC}"
echo ""

# Link project
PROJECT_REF="iatfkqwwmjohrvdfnmwm"
echo "Linking to project: $PROJECT_REF"

if supabase link --project-ref $PROJECT_REF; then
    echo -e "${GREEN}✓ Project linked${NC}"
else
    echo -e "${RED}❌ Failed to link project${NC}"
    exit 1
fi
echo ""

# Apply migrations
echo "📦 Applying database migrations..."
echo ""

if supabase db push; then
    echo -e "${GREEN}✓ Migrations applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo "Try applying manually via Supabase Dashboard"
    exit 1
fi
echo ""

# Set environment variables for edge functions
echo "🔐 Setting environment variables for edge functions..."
echo ""

supabase secrets set MIDTRANS_SERVER_KEY=your-midtrans-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=false
supabase secrets set DEEPSEEK_API_KEY=your-deepseek-api-key

echo -e "${GREEN}✓ Environment variables set${NC}"
echo ""

# Deploy edge functions
echo "🚀 Deploying edge functions..."
echo ""

echo "Deploying midtrans-create-transaction..."
if supabase functions deploy midtrans-create-transaction; then
    echo -e "${GREEN}✓ midtrans-create-transaction deployed${NC}"
else
    echo -e "${YELLOW}⚠ Failed to deploy midtrans-create-transaction${NC}"
fi
echo ""

echo "Deploying midtrans-webhook..."
if supabase functions deploy midtrans-webhook; then
    echo -e "${GREEN}✓ midtrans-webhook deployed${NC}"
else
    echo -e "${YELLOW}⚠ Failed to deploy midtrans-webhook${NC}"
fi
echo ""

echo "Deploying chat-with-credits..."
if supabase functions deploy chat-with-credits; then
    echo -e "${GREEN}✓ chat-with-credits deployed${NC}"
else
    echo -e "${YELLOW}⚠ Failed to deploy chat-with-credits${NC}"
fi
echo ""

# Verify setup
echo "🔍 Verifying setup..."
echo ""

echo "Checking database functions..."
if supabase db execute "SELECT routine_name FROM information_schema.routines WHERE routine_name IN ('get_user_usage', 'get_user_subscription_tier', 'track_usage', 'check_usage_limit');" &> /dev/null; then
    echo -e "${GREEN}✓ Database functions exist${NC}"
else
    echo -e "${YELLOW}⚠ Could not verify database functions${NC}"
fi
echo ""

# Success message
echo "=========================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=========================="
echo ""
echo "Next steps:"
echo "1. Start dev server: npm run dev"
echo "2. Visit: http://localhost:8080/pricing"
echo "3. Test payment flow with card: 4811 1111 1111 1114"
echo ""
echo "Documentation:"
echo "- Quick Start: QUICK_START_PAYMENT.md"
echo "- Testing Guide: test-payment-flow.md"
echo "- Full Guide: PAYMENT_IMPLEMENTATION_GUIDE.md"
echo ""
