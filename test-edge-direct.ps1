# Test edge function directly to see error details
Write-Host "Testing chat-with-credits edge function..." -ForegroundColor Cyan

# Get token from user
Write-Host "`nPaste your auth token from browser console:" -ForegroundColor Yellow
Write-Host "(Run: (await supabase.auth.getSession()).data.session.access_token)" -ForegroundColor Gray
$token = Read-Host "Token"

if ([string]::IsNullOrWhiteSpace($token)) {
    Write-Host "No token provided, testing without auth..." -ForegroundColor Yellow
    $token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlhdGZrcXd3bWpvaHJ2ZGZubXdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY5MjU5NzcsImV4cCI6MjA1MjUwMTk3N30.Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks-Ql-Ks"
}

$url = "https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/chat-with-credits"

$body = @{
    messages = @(
        @{
            role = "user"
            content = "test message"
        }
    )
    excelContext = $null
} | ConvertTo-Json -Depth 10

Write-Host "`nSending request..." -ForegroundColor Cyan

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
    Write-Host "`nResponse:" -ForegroundColor Cyan
    Write-Host $response.Content
    
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
