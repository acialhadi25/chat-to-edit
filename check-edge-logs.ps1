# Check edge function logs for errors
$env:SUPABASE_ACCESS_TOKEN = "sbp_9506ffb4dd76c26954024aa9a40fff1bed95d2e0"

Write-Host "Fetching recent edge function logs..." -ForegroundColor Cyan
Write-Host "This will show errors from chat-with-credits function" -ForegroundColor Yellow
Write-Host ""

# Note: Supabase CLI doesn't have a direct logs command for edge functions
# We need to check via dashboard or use the API

Write-Host "To check logs, please:" -ForegroundColor Green
Write-Host "1. Go to: https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/functions/chat-with-credits/logs"
Write-Host "2. Look for recent 401 errors"
Write-Host "3. Check what the error message says"
Write-Host ""
Write-Host "Or test the function directly with curl..." -ForegroundColor Cyan
