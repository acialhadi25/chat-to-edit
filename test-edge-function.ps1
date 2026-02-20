# Quick test for edge function authentication
# This will help us debug the 401 error

Write-Host "Testing edge function directly..." -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if function is accessible
Write-Host "Test 1: Checking if function is accessible (without auth)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/chat-with-credits" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
        } `
        -Body '{"messages":[{"role":"user","content":"test"}]}' `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "Unexpected success (should be 401)" -ForegroundColor Red
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 401) {
        Write-Host "✅ Function is accessible and requires auth (401 as expected)" -ForegroundColor Green
    } else {
        Write-Host "❌ Unexpected status: $statusCode" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Test 2: Get your auth token from browser console" -ForegroundColor Yellow
Write-Host "1. Open https://chat-to-edit.vercel.app in browser" -ForegroundColor Gray
Write-Host "2. Open Developer Console (F12)" -ForegroundColor Gray
Write-Host "3. Run this command:" -ForegroundColor Gray
Write-Host "   (await supabase.auth.getSession()).data.session.access_token" -ForegroundColor Cyan
Write-Host "4. Copy the token (long string)" -ForegroundColor Gray
Write-Host ""

$token = Read-Host "Paste your auth token here (or press Enter to skip)"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Skipped. Run this script again with a token to test authentication." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "Test 3: Testing with your auth token..." -ForegroundColor Yellow

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test"
        }
    )
    excelContext = $null
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-WebRequest -Uri "https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/chat-with-credits" `
        -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
            "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhdGZrcXd3bWpvaHJ2ZGZubXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MjU5NzcsImV4cCI6MjA1MjUwMTk3N30.Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks"
        } `
        -Body $body `
        -UseBasicParsing `
        -TimeoutSec 30
    
    Write-Host "✅ SUCCESS! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response Headers:" -ForegroundColor Cyan
    $response.Headers.GetEnumerator() | Where-Object { $_.Key -like "X-*" } | ForEach-Object {
        Write-Host "  $($_.Key): $($_.Value)" -ForegroundColor Gray
    }
    
    Write-Host ""
    Write-Host "Response (first 500 chars):" -ForegroundColor Cyan
    $content = $response.Content
    if ($content.Length -gt 500) {
        Write-Host $content.Substring(0, 500) -ForegroundColor Gray
        Write-Host "... (truncated)" -ForegroundColor DarkGray
    } else {
        Write-Host $content -ForegroundColor Gray
    }
    
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "❌ FAILED with status: $statusCode" -ForegroundColor Red
    
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host ""
        Write-Host "Error Response:" -ForegroundColor Yellow
        Write-Host $responseBody -ForegroundColor Gray
        
        # Try to parse as JSON for better display
        try {
            $json = $responseBody | ConvertFrom-Json
            Write-Host ""
            Write-Host "Parsed Error:" -ForegroundColor Yellow
            Write-Host "  Error: $($json.error)" -ForegroundColor Red
            if ($json.details) {
                Write-Host "  Details: $($json.details)" -ForegroundColor Red
            }
        } catch {
            # Not JSON, already displayed above
        }
    } catch {
        Write-Host "Could not read error response" -ForegroundColor DarkGray
    }
}

Write-Host ""
Write-Host "Troubleshooting tips:" -ForegroundColor Yellow
Write-Host "- If 401: Token might be expired, try logging out and back in" -ForegroundColor Gray
Write-Host "- If 401: Check edge function logs with: npx supabase functions logs chat-with-credits" -ForegroundColor Gray
Write-Host "- If 500: Check DEEPSEEK_API_KEY is set in Supabase secrets" -ForegroundColor Gray
Write-Host "- If timeout: DeepSeek API might be slow or down" -ForegroundColor Gray
