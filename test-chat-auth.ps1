# Test chat-with-credits authentication
# This script tests if the edge function can authenticate users properly

Write-Host "Testing chat-with-credits authentication..." -ForegroundColor Cyan

# Get user token from browser console
Write-Host "`nTo get your auth token:" -ForegroundColor Yellow
Write-Host "1. Open browser console on https://chat-to-edit.vercel.app"
Write-Host "2. Run: (await supabase.auth.getSession()).data.session.access_token"
Write-Host "3. Copy the token and paste it here"
Write-Host ""

$token = Read-Host "Enter your auth token"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "Error: Token is required" -ForegroundColor Red
    exit 1
}

$url = "https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/chat-with-credits"

$body = @{
    messages = @(
        @{
            role = "user"
            content = "Hello, test message"
        }
    )
    excelContext = $null
} | ConvertTo-Json -Depth 10

Write-Host "`nSending request to: $url" -ForegroundColor Cyan
Write-Host "Token (first 20 chars): $($token.Substring(0, [Math]::Min(20, $token.Length)))..." -ForegroundColor Gray

try {
    $response = Invoke-WebRequest -Uri $url -Method POST `
        -Headers @{
            "Content-Type" = "application/json"
            "Authorization" = "Bearer $token"
            "apikey" = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhdGZrcXd3bWpvaHJ2ZGZubXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MjU5NzcsImV4cCI6MjA1MjUwMTk3N30.Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks"
        } `
        -Body $body `
        -UseBasicParsing

    Write-Host "`n✅ Success! Status: $($response.StatusCode)" -ForegroundColor Green
    Write-Host "Headers:" -ForegroundColor Cyan
    $response.Headers | Format-Table
    
    Write-Host "`nResponse (first 500 chars):" -ForegroundColor Cyan
    $content = $response.Content
    if ($content.Length -gt 500) {
        Write-Host $content.Substring(0, 500)
        Write-Host "... (truncated)" -ForegroundColor Gray
    } else {
        Write-Host $content
    }
    
} catch {
    Write-Host "`n❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "Status Code: $statusCode" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "`nResponse Body:" -ForegroundColor Yellow
            Write-Host $responseBody
        } catch {
            Write-Host "Could not read response body" -ForegroundColor Gray
        }
    }
}

Write-Host "`n" -ForegroundColor Gray
Write-Host "If you see 401 Unauthorized, check:" -ForegroundColor Yellow
Write-Host "1. Token is valid and not expired"
Write-Host "2. SUPABASE_SERVICE_ROLE_KEY is set in edge function secrets"
Write-Host "3. Edge function is using correct authentication method"
