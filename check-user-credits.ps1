# Check user credits after AI operation
Write-Host "Checking user credits and API usage..." -ForegroundColor Cyan

$env:SUPABASE_ACCESS_TOKEN = "sbp_9506ffb4dd76c26954024aa9a40fff1bed95d2e0"

Write-Host "`n1. Checking user profile credits..." -ForegroundColor Yellow
npx supabase db execute --query "SELECT id, email, credits_remaining, credits_limit, credits_used, subscription_tier, updated_at FROM user_profiles ORDER BY updated_at DESC LIMIT 3;"

Write-Host "`n2. Checking recent API usage logs..." -ForegroundColor Yellow
npx supabase db execute --query "SELECT user_id, operation_type, credits_used, credits_before, credits_after, created_at FROM api_usage_logs ORDER BY created_at DESC LIMIT 5;"

Write-Host "`n3. Checking recent transactions..." -ForegroundColor Yellow
npx supabase db execute --query "SELECT user_id, amount, status, created_at FROM transactions ORDER BY created_at DESC LIMIT 3;"

Write-Host "`nDone!" -ForegroundColor Green
