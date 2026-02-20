# Midtrans Payment Testing Script
# This script helps you test the payment integration

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Midtrans Payment Testing Script" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Configuration
$WEBSITE_URL = "https://chat-to-edit.vercel.app"
$WEBHOOK_URL = "https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook"
$SANDBOX_DASHBOARD = "https://dashboard.sandbox.midtrans.com"

Write-Host "Website: $WEBSITE_URL" -ForegroundColor Green
Write-Host "Webhook: $WEBHOOK_URL" -ForegroundColor Green
Write-Host ""

# Menu
Write-Host "Select Test Scenario:" -ForegroundColor Yellow
Write-Host "1. Open Website (Start Testing)" -ForegroundColor White
Write-Host "2. Open Midtrans Sandbox Dashboard" -ForegroundColor White
Write-Host "3. Open BCA VA Simulator" -ForegroundColor White
Write-Host "4. Open QRIS Simulator" -ForegroundColor White
Write-Host "5. Open Indomaret Simulator" -ForegroundColor White
Write-Host "6. Check Webhook Logs" -ForegroundColor White
Write-Host "7. Check Database (Transactions)" -ForegroundColor White
Write-Host "8. Test Webhook Manually" -ForegroundColor White
Write-Host "9. Show Test Cards Reference" -ForegroundColor White
Write-Host "0. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (0-9)"

switch ($choice) {
    "1" {
        Write-Host "`nOpening website..." -ForegroundColor Green
        Write-Host "Steps to test:" -ForegroundColor Yellow
        Write-Host "1. Login to your account" -ForegroundColor White
        Write-Host "2. Go to Pricing page" -ForegroundColor White
        Write-Host "3. Click 'Upgrade to Pro'" -ForegroundColor White
        Write-Host "4. Use test card: 4811 1111 1111 1114" -ForegroundColor White
        Write-Host "5. CVV: 123, Expiry: 01/2025, OTP: 112233" -ForegroundColor White
        Start-Process $WEBSITE_URL
    }
    "2" {
        Write-Host "`nOpening Midtrans Sandbox Dashboard..." -ForegroundColor Green
        Write-Host "Check your transactions here" -ForegroundColor Yellow
        Start-Process $SANDBOX_DASHBOARD
    }
    "3" {
        Write-Host "`nOpening BCA VA Simulator..." -ForegroundColor Green
        Write-Host "Use this to simulate bank transfer payment" -ForegroundColor Yellow
        Start-Process "https://simulator.sandbox.midtrans.com/bca/va/index"
    }
    "4" {
        Write-Host "`nOpening QRIS Simulator..." -ForegroundColor Green
        Write-Host "Use this to simulate GoPay/QRIS payment" -ForegroundColor Yellow
        Start-Process "https://simulator.sandbox.midtrans.com/qris/index"
    }
    "5" {
        Write-Host "`nOpening Indomaret Simulator..." -ForegroundColor Green
        Write-Host "Use this to simulate Indomaret payment" -ForegroundColor Yellow
        Start-Process "https://simulator.sandbox.midtrans.com/indomaret/index"
    }
    "6" {
        Write-Host "`nChecking webhook logs..." -ForegroundColor Green
        Write-Host "Running: npx supabase functions logs midtrans-webhook --tail" -ForegroundColor Yellow
        Write-Host ""
        npx supabase functions logs midtrans-webhook --tail
    }
    "7" {
        Write-Host "`nTo check database, run these SQL queries:" -ForegroundColor Green
        Write-Host ""
        Write-Host "-- Check latest transactions" -ForegroundColor Yellow
        Write-Host "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;" -ForegroundColor White
        Write-Host ""
        Write-Host "-- Check subscriptions" -ForegroundColor Yellow
        Write-Host "SELECT * FROM user_subscriptions ORDER BY created_at DESC LIMIT 10;" -ForegroundColor White
        Write-Host ""
        Write-Host "-- Check webhook logs" -ForegroundColor Yellow
        Write-Host "SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;" -ForegroundColor White
        Write-Host ""
        Write-Host "Open Supabase Dashboard to run these queries" -ForegroundColor Green
        $openSupabase = Read-Host "Open Supabase Dashboard? (y/n)"
        if ($openSupabase -eq "y") {
            Start-Process "https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/editor"
        }
    }
    "8" {
        Write-Host "`nTesting webhook manually..." -ForegroundColor Green
        Write-Host "This will send a test webhook notification" -ForegroundColor Yellow
        Write-Host ""
        
        $testOrderId = "ORDER-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        $testTxnId = "TXN-test-$(Get-Date -Format 'yyyyMMddHHmmss')"
        
        $body = @{
            transaction_status = "settlement"
            order_id = $testOrderId
            transaction_id = $testTxnId
            gross_amount = "109890"
            payment_type = "credit_card"
            transaction_time = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
        } | ConvertTo-Json
        
        Write-Host "Sending webhook to: $WEBHOOK_URL" -ForegroundColor Cyan
        Write-Host "Order ID: $testOrderId" -ForegroundColor Cyan
        Write-Host ""
        
        try {
            $response = Invoke-RestMethod -Uri $WEBHOOK_URL -Method Post -Body $body -ContentType "application/json"
            Write-Host "✅ Webhook sent successfully!" -ForegroundColor Green
            Write-Host "Response: $response" -ForegroundColor White
        } catch {
            Write-Host "❌ Error sending webhook:" -ForegroundColor Red
            Write-Host $_.Exception.Message -ForegroundColor Red
        }
    }
    "9" {
        Write-Host "`n==================================" -ForegroundColor Cyan
        Write-Host "Test Cards Quick Reference" -ForegroundColor Cyan
        Write-Host "==================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "✅ SUCCESS Cards:" -ForegroundColor Green
        Write-Host "VISA:       4811 1111 1111 1114" -ForegroundColor White
        Write-Host "Mastercard: 5211 1111 1111 1117" -ForegroundColor White
        Write-Host "JCB:        3528 2033 2456 4357" -ForegroundColor White
        Write-Host "AMEX:       3701 9216 9722 458" -ForegroundColor White
        Write-Host ""
        Write-Host "❌ DENIED by Bank:" -ForegroundColor Red
        Write-Host "VISA:       4911 1111 1111 1113" -ForegroundColor White
        Write-Host "Mastercard: 5111 1111 1111 1118" -ForegroundColor White
        Write-Host ""
        Write-Host "⚠️ DENIED by FDS (Fraud):" -ForegroundColor Yellow
        Write-Host "VISA:       4611 1111 1111 1116" -ForegroundColor White
        Write-Host "Mastercard: 5411 1111 1111 1115" -ForegroundColor White
        Write-Host ""
        Write-Host "All cards:" -ForegroundColor Cyan
        Write-Host "CVV: 123" -ForegroundColor White
        Write-Host "Expiry: 01/2025 (or any future date)" -ForegroundColor White
        Write-Host "OTP: 112233" -ForegroundColor White
        Write-Host ""
        Write-Host "For complete reference, see: MIDTRANS_TEST_CARDS_REFERENCE.md" -ForegroundColor Green
    }
    "0" {
        Write-Host "`nExiting..." -ForegroundColor Green
        exit
    }
    default {
        Write-Host "`nInvalid choice!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Press any key to continue..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Run script again
& $MyInvocation.MyCommand.Path
