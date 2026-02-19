# Deploy Edge Functions to Supabase
# This script deploys all edge functions and sets environment secrets

Write-Host "🚀 Deploying Edge Functions to Supabase..." -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is available
try {
    $version = npx supabase --version
    Write-Host "✅ Supabase CLI version: $version" -ForegroundColor Green
} catch {
    Write-Host "❌ Supabase CLI not found. Please install it first." -ForegroundColor Red
    exit 1
}

# Set environment variables
$env:SUPABASE_ACCESS_TOKEN = "sbp_9506ffb4dd76c26954024aa9a40fff1bed95d2e0"
$PROJECT_REF = "iatfkqwwmjohrvdfnmwm"

Write-Host "📦 Project: $PROJECT_REF" -ForegroundColor Yellow
Write-Host ""

# Deploy edge functions
Write-Host "📤 Deploying edge functions..." -ForegroundColor Cyan

$functions = @(
    "chat",
    "process-excel",
    "midtrans-webhook",
    "midtrans-create-transaction"
)

foreach ($func in $functions) {
    Write-Host "  → Deploying $func..." -ForegroundColor White
    try {
        npx supabase functions deploy $func --project-ref $PROJECT_REF --no-verify-jwt
        Write-Host "  ✅ $func deployed successfully" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠️  Failed to deploy $func : $_" -ForegroundColor Yellow
    }
    Write-Host ""
}

Write-Host ""
Write-Host "🔐 Setting Environment Secrets..." -ForegroundColor Cyan
Write-Host ""

# Set secrets
Write-Host "  → Setting DEEPSEEK_API_KEY..." -ForegroundColor White
try {
    $deepseekKey = "sk-c20aba98ff9c42e8a57a54a392ca1df4"
    npx supabase secrets set DEEPSEEK_API_KEY=$deepseekKey --project-ref $PROJECT_REF
    Write-Host "  ✅ DEEPSEEK_API_KEY set successfully" -ForegroundColor Green
} catch {
    Write-Host "  ⚠️  Failed to set DEEPSEEK_API_KEY: $_" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Note: Set these secrets manually in Supabase Dashboard if needed:" -ForegroundColor Yellow
Write-Host "  - LOVABLE_API_KEY (optional, for fallback AI)" -ForegroundColor Gray
Write-Host "  - MIDTRANS_SERVER_KEY (for payment processing)" -ForegroundColor Gray
Write-Host ""
Write-Host "🌐 Dashboard: https://supabase.com/dashboard/project/$PROJECT_REF/settings/functions" -ForegroundColor Cyan
Write-Host ""

Write-Host "✅ Deployment Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "🧪 Test your functions:" -ForegroundColor Cyan
Write-Host "  Chat: https://$PROJECT_REF.supabase.co/functions/v1/chat" -ForegroundColor Gray
Write-Host "  Process Excel: https://$PROJECT_REF.supabase.co/functions/v1/process-excel" -ForegroundColor Gray
Write-Host ""
