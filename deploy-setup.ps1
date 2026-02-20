# ChaTtoEdit - Database and Edge Functions Setup Script (PowerShell)
# This script applies migrations and deploys edge functions

$ErrorActionPreference = "Stop"

Write-Host "🚀 ChaTtoEdit Setup Script" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
try {
    $null = Get-Command supabase -ErrorAction Stop
    Write-Host "✓ Supabase CLI found" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found" -ForegroundColor Red
    Write-Host "Please install it first:"
    Write-Host "  npm install -g supabase"
    Write-Host "  or visit: https://supabase.com/docs/guides/cli"
    exit 1
}
Write-Host ""

# Check if logged in
Write-Host "Checking Supabase authentication..."
try {
    $null = supabase projects list 2>&1
    Write-Host "✓ Authenticated" -ForegroundColor Green
} catch {
    Write-Host "⚠ Not logged in to Supabase" -ForegroundColor Yellow
    Write-Host "Logging in..."
    supabase login
}
Write-Host ""

# Link project
$PROJECT_REF = "iatfkqwwmjohrvdfnmwm"
Write-Host "Linking to project: $PROJECT_REF"

try {
    supabase link --project-ref $PROJECT_REF
    Write-Host "✓ Project linked" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to link project" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Apply migrations
Write-Host "📦 Applying database migrations..." -ForegroundColor Cyan
Write-Host ""

try {
    supabase db push
    Write-Host "✓ Migrations applied successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Migration failed" -ForegroundColor Red
    Write-Host "Try applying manually via Supabase Dashboard"
    exit 1
}
Write-Host ""

# Set environment variables for edge functions
Write-Host "🔐 Setting environment variables for edge functions..." -ForegroundColor Cyan
Write-Host ""

supabase secrets set MIDTRANS_SERVER_KEY=your-midtrans-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=false
supabase secrets set DEEPSEEK_API_KEY=your-deepseek-api-key

Write-Host "✓ Environment variables set" -ForegroundColor Green
Write-Host ""

# Deploy edge functions
Write-Host "🚀 Deploying edge functions..." -ForegroundColor Cyan
Write-Host ""

Write-Host "Deploying midtrans-create-transaction..."
try {
    supabase functions deploy midtrans-create-transaction
    Write-Host "✓ midtrans-create-transaction deployed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Failed to deploy midtrans-create-transaction" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Deploying midtrans-webhook..."
try {
    supabase functions deploy midtrans-webhook
    Write-Host "✓ midtrans-webhook deployed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Failed to deploy midtrans-webhook" -ForegroundColor Yellow
}
Write-Host ""

Write-Host "Deploying chat-with-credits..."
try {
    supabase functions deploy chat-with-credits
    Write-Host "✓ chat-with-credits deployed" -ForegroundColor Green
} catch {
    Write-Host "⚠ Failed to deploy chat-with-credits" -ForegroundColor Yellow
}
Write-Host ""

# Success message
Write-Host "==========================" -ForegroundColor Cyan
Write-Host "✅ Setup Complete!" -ForegroundColor Green
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:"
Write-Host "1. Start dev server: npm run dev"
Write-Host "2. Visit: http://localhost:8080/pricing"
Write-Host "3. Test payment flow with card: 4811 1111 1111 1114"
Write-Host ""
Write-Host "Documentation:"
Write-Host "- Quick Start: QUICK_START_PAYMENT.md"
Write-Host "- Testing Guide: test-payment-flow.md"
Write-Host "- Full Guide: PAYMENT_IMPLEMENTATION_GUIDE.md"
Write-Host ""
