# Deploy Chat Edge Function to Supabase
# This script deploys the updated chat function with quickOptions support

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deploy Chat Edge Function" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Supabase CLI is installed
Write-Host "Checking Supabase CLI..." -ForegroundColor Yellow
$supabaseCli = Get-Command supabase -ErrorAction SilentlyContinue

if (-not $supabaseCli) {
    Write-Host "ERROR: Supabase CLI not found!" -ForegroundColor Red
    Write-Host "Install it with: npm install -g supabase" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Supabase CLI found" -ForegroundColor Green
Write-Host ""

# Check if logged in
Write-Host "Checking Supabase login..." -ForegroundColor Yellow
$loginCheck = supabase projects list 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Not logged in to Supabase!" -ForegroundColor Red
    Write-Host "Login with: supabase login" -ForegroundColor Yellow
    exit 1
}

Write-Host "✓ Logged in to Supabase" -ForegroundColor Green
Write-Host ""

# Deploy function
Write-Host "Deploying chat function..." -ForegroundColor Yellow
Write-Host ""

supabase functions deploy chat

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Green
    Write-Host "✓ Deployment Successful!" -ForegroundColor Green
    Write-Host "==================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Refresh your browser (Ctrl+F5)" -ForegroundColor White
    Write-Host "2. Upload Excel file" -ForegroundColor White
    Write-Host "3. Send command (e.g., 'Jumlahkan kolom Harga')" -ForegroundColor White
    Write-Host "4. Click Quick Action button" -ForegroundColor White
    Write-Host "5. Check console logs (F12)" -ForegroundColor White
    Write-Host ""
    Write-Host "Expected logs:" -ForegroundColor Cyan
    Write-Host "  - 'Quick option: { hasAction: true }'" -ForegroundColor Gray
    Write-Host "  - 'Applying quick action'" -ForegroundColor Gray
    Write-Host "  - 'Action applied successfully'" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "==================================" -ForegroundColor Red
    Write-Host "✗ Deployment Failed!" -ForegroundColor Red
    Write-Host "==================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Check if you're in the correct directory" -ForegroundColor White
    Write-Host "2. Verify supabase/functions/chat/index.ts exists" -ForegroundColor White
    Write-Host "3. Check Supabase project is linked" -ForegroundColor White
    Write-Host "4. Run: supabase link --project-ref iatfkqwwmjohrvdfnmwm" -ForegroundColor White
    Write-Host ""
    exit 1
}
