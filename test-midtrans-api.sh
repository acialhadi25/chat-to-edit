#!/bin/bash

# Midtrans Sandbox Testing Script
# This script tests the Midtrans Edge Functions

echo "🧪 Midtrans Sandbox API Testing"
echo "================================"
echo ""

# Configuration
SUPABASE_URL="YOUR_SUPABASE_URL"
SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
MIDTRANS_SERVER_KEY="YOUR_MIDTRANS_SERVER_KEY"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "⚙️  Configuration:"
echo "Supabase URL: $SUPABASE_URL"
echo "Midtrans Server Key: $MIDTRANS_SERVER_KEY (Sandbox)"
echo ""

# Test 1: Create Transaction
echo "📝 Test 1: Create Transaction"
echo "------------------------------"

ORDER_ID="TEST-$(date +%s)"
echo "Order ID: $ORDER_ID"

TRANSACTION_PAYLOAD=$(cat <<EOF
{
  "orderId": "$ORDER_ID",
  "amount": 99000,
  "customerDetails": {
    "firstName": "Test",
    "lastName": "User",
    "email": "test@example.com",
    "phone": "+628123456789"
  },
  "itemDetails": [
    {
      "id": "PRO-MONTHLY",
      "price": 99000,
      "quantity": 1,
      "name": "Pro Subscription - Monthly"
    }
  ]
}
EOF
)

echo "Payload:"
echo "$TRANSACTION_PAYLOAD" | jq .
echo ""

echo "Calling Edge Function..."
RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/functions/v1/midtrans-create-transaction" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d "$TRANSACTION_PAYLOAD")

echo "Response:"
echo "$RESPONSE" | jq .
echo ""

# Check if successful
if echo "$RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Transaction created successfully!${NC}"
    SNAP_TOKEN=$(echo "$RESPONSE" | jq -r '.token')
    echo "Snap Token: $SNAP_TOKEN"
    echo ""
    echo "You can test this payment at:"
    echo "https://app.sandbox.midtrans.com/snap/v2/vtweb/$SNAP_TOKEN"
else
    echo -e "${RED}❌ Failed to create transaction${NC}"
fi

echo ""
echo "================================"
echo ""

# Test 2: Webhook Simulation
echo "📨 Test 2: Webhook Notification Simulation"
echo "-------------------------------------------"

WEBHOOK_PAYLOAD=$(cat <<EOF
{
  "transaction_time": "$(date -u +"%Y-%m-%d %H:%M:%S")",
  "transaction_status": "settlement",
  "transaction_id": "test-txn-$(date +%s)",
  "status_message": "Success",
  "status_code": "200",
  "signature_key": "dummy-signature-for-testing",
  "payment_type": "credit_card",
  "order_id": "$ORDER_ID",
  "merchant_id": "G183260451",
  "gross_amount": "99000.00",
  "fraud_status": "accept",
  "currency": "IDR"
}
EOF
)

echo "Webhook Payload:"
echo "$WEBHOOK_PAYLOAD" | jq .
echo ""

echo "Note: In production, signature_key must be valid SHA512 hash"
echo "For testing, you may need to disable signature verification"
echo ""

# Uncomment to test webhook
# echo "Calling Webhook Handler..."
# WEBHOOK_RESPONSE=$(curl -s -X POST \
#   "$SUPABASE_URL/functions/v1/midtrans-webhook" \
#   -H "Content-Type: application/json" \
#   -d "$WEBHOOK_PAYLOAD")
# 
# echo "Webhook Response:"
# echo "$WEBHOOK_RESPONSE" | jq .

echo ""
echo "================================"
echo ""

# Test 3: Direct Midtrans API Test
echo "🔗 Test 3: Direct Midtrans API Test"
echo "------------------------------------"

DIRECT_ORDER_ID="DIRECT-$(date +%s)"
echo "Order ID: $DIRECT_ORDER_ID"

MIDTRANS_PAYLOAD=$(cat <<EOF
{
  "transaction_details": {
    "order_id": "$DIRECT_ORDER_ID",
    "gross_amount": 99000
  },
  "customer_details": {
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "+628123456789"
  },
  "item_details": [
    {
      "id": "PRO-MONTHLY",
      "price": 99000,
      "quantity": 1,
      "name": "Pro Subscription - Monthly"
    }
  ]
}
EOF
)

echo "Calling Midtrans Snap API directly..."
AUTH_HEADER=$(echo -n "$MIDTRANS_SERVER_KEY:" | base64)

MIDTRANS_RESPONSE=$(curl -s -X POST \
  "https://app.sandbox.midtrans.com/snap/v1/transactions" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -H "Authorization: Basic $AUTH_HEADER" \
  -d "$MIDTRANS_PAYLOAD")

echo "Midtrans Response:"
echo "$MIDTRANS_RESPONSE" | jq .
echo ""

if echo "$MIDTRANS_RESPONSE" | jq -e '.token' > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Direct Midtrans API call successful!${NC}"
    DIRECT_TOKEN=$(echo "$MIDTRANS_RESPONSE" | jq -r '.token')
    REDIRECT_URL=$(echo "$MIDTRANS_RESPONSE" | jq -r '.redirect_url')
    echo ""
    echo "Snap Token: $DIRECT_TOKEN"
    echo "Payment URL: $REDIRECT_URL"
    echo ""
    echo "Test this payment by opening the URL above in your browser"
else
    echo -e "${RED}❌ Direct Midtrans API call failed${NC}"
    echo "Error details:"
    echo "$MIDTRANS_RESPONSE" | jq .
fi

echo ""
echo "================================"
echo ""

# Summary
echo "📊 Test Summary"
echo "---------------"
echo ""
echo "Test Cards for Sandbox:"
echo "  ✅ Success: 4811 1111 1111 1114 (CVV: 123)"
echo "  ❌ Denied:  4911 1111 1111 1113 (CVV: 123)"
echo "  ⏳ 3DS:     4611 1111 1111 1112 (CVV: 123, OTP: 112233)"
echo ""
echo "Next Steps:"
echo "1. Update SUPABASE_URL and SUPABASE_ANON_KEY in this script"
echo "2. Deploy Edge Functions: supabase functions deploy"
echo "3. Set MIDTRANS_SERVER_KEY in Supabase Edge Function secrets"
echo "4. Run this script again to test"
echo "5. Open test-midtrans.html in browser for frontend testing"
echo ""
echo "Documentation: https://docs.midtrans.com/en/snap/integration-guide"
echo ""
