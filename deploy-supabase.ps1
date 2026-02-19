# Supabase Deployment Script
# This script deploys edge functions and database migrations to Supabase

$PROJECT_ID = "iatfkqwwmjohrvdfnmwm"
$ACCESS_TOKEN = "sbp_9506ffb4dd76c26954024aa9a40fff1bed95d2e0"
$SUPABASE_URL = "https://iatfkqwwmjohrvdfnmwm.supabase.co"

Write-Host "🚀 Starting Supabase Deployment..." -ForegroundColor Green
Write-Host ""

# Check if npx is available
if (!(Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npx not found. Please install Node.js" -ForegroundColor Red
    exit 1
}

Write-Host "📦 Installing Supabase CLI locally..." -ForegroundColor Yellow
npm install --save-dev supabase

Write-Host ""
Write-Host "🔐 Logging in to Supabase..." -ForegroundColor Yellow
$env:SUPABASE_ACCESS_TOKEN = $ACCESS_TOKEN
npx supabase link --project-ref $PROJECT_ID

Write-Host ""
Write-Host "📊 Deploying database migrations..." -ForegroundColor Yellow
npx supabase db push

Write-Host ""
Write-Host "⚡ Deploying edge functions..." -ForegroundColor Yellow

# Deploy chat function
Write-Host "  - Deploying chat function..." -ForegroundColor Cyan
npx supabase functions deploy chat --no-verify-jwt

# Deploy chat-docs function
Write-Host "  - Deploying chat-docs function..." -ForegroundColor Cyan
npx supabase functions deploy chat-docs --no-verify-jwt

# Deploy chat-pdf function
Write-Host "  - Deploying chat-pdf function..." -ForegroundColor Cyan
npx supabase functions deploy chat-pdf --no-verify-jwt

Write-Host ""
Write-Host "🔧 Setting up environment secrets..." -ForegroundColor Yellow
Write-Host "  Please set these secrets manually in Supabase Dashboard:" -ForegroundColor Cyan
Write-Host "  1. Go to: https://supabase.com/dashboard/project/$PROJECT_ID/settings/functions" -ForegroundColor White
Write-Host "  2. Add these secrets:" -ForegroundColor White
Write-Host "     - DEEPSEEK_API_KEY: Your DeepSeek API key" -ForegroundColor White
Write-Host "     - LOVABLE_API_KEY: Your Lovable API key (optional)" -ForegroundColor White
Write-Host "     - MIDTRANS_SERVER_KEY: Your Midtrans server key" -ForegroundColor White

Write-Host ""
Write-Host "✅ Deployment completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Yellow
Write-Host "  1. Set environment secrets in Supabase Dashboard" -ForegroundColor White
Write-Host "  2. Test the application: npm run dev" -ForegroundColor White
Write-Host "  3. Verify edge functions are working" -ForegroundColor White
