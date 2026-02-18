# Midtrans Quick Reference

Referensi cepat untuk testing dan development Midtrans integration.

## 🔑 Sandbox Credentials

```
Merchant ID: [Your Merchant ID]
Client Key:  [Your Client Key]
Server Key:  [Your Server Key]
Environment: Sandbox
```

## 💳 Test Cards

| Type      | Card Number         | CVV | Expiry | OTP    | Result                    |
| --------- | ------------------- | --- | ------ | ------ | ------------------------- |
| Success   | 4811 1111 1111 1114 | 123 | 01/25  | -      | ✅ Settlement             |
| Denied    | 4911 1111 1111 1113 | 123 | 01/25  | -      | ❌ Denied                 |
| 3D Secure | 4611 1111 1111 1112 | 123 | 01/25  | 112233 | ✅ Settlement (after OTP) |

## 🚀 Quick Start

```bash
# 1. Setup environment
chmod +x setup-midtrans-sandbox.sh
./setup-midtrans-sandbox.sh

# 2. Test with HTML page
open src/test-midtrans.html

# 3. Test with API
chmod +x test-midtrans-api.sh
./test-midtrans-api.sh
```

## 📡 API Endpoints

### Create Transaction

```bash
POST https://YOUR-PROJECT.supabase.co/functions/v1/midtrans-create-transaction
Authorization: Bearer YOUR_SUPABASE_ANON_KEY
Content-Type: application/json

{
  "orderId": "ORDER-123",
  "amount": 99000,
  "customerDetails": {
    "firstName": "John",
    "email": "john@example.com"
  },
  "itemDetails": [{
    "id": "ITEM-1",
    "price": 99000,
    "quantity": 1,
    "name": "Pro Subscription"
  }]
}
```

### Webhook Handler

```bash
POST https://YOUR-PROJECT.supabase.co/functions/v1/midtrans-webhook
Content-Type: application/json

{
  "transaction_time": "2024-01-01 12:00:00",
  "transaction_status": "settlement",
  "transaction_id": "txn-123",
  "status_code": "200",
  "signature_key": "...",
  "order_id": "ORDER-123",
  "gross_amount": "99000.00"
}
```

## 💰 Subscription Tiers

| Tier       | Price (IDR) | Price (USD) | Limits                           |
| ---------- | ----------- | ----------- | -------------------------------- |
| Free       | 0           | 0           | 50 ops, 10 uploads, 20 AI msgs   |
| Pro        | 99,000      | ~$7         | 1K ops, 100 uploads, 500 AI msgs |
| Enterprise | 499,000     | ~$35        | Unlimited                        |

## 🔍 Testing Scenarios

### 1. Successful Payment

```javascript
// Use success card: 4811 1111 1111 1114
// Expected: transaction_status = "settlement"
// Expected: subscription status = "active"
```

### 2. Failed Payment

```javascript
// Use denied card: 4911 1111 1111 1113
// Expected: transaction_status = "deny"
// Expected: subscription status unchanged
```

### 3. 3D Secure

```javascript
// Use 3DS card: 4611 1111 1111 1112
// Enter OTP: 112233
// Expected: transaction_status = "settlement"
```

## 🗄️ Database Tables

### Check Transaction

```sql
SELECT * FROM transactions
WHERE order_id = 'YOUR-ORDER-ID';
```

### Check Subscription

```sql
SELECT * FROM user_subscriptions
WHERE user_id = 'YOUR-USER-ID';
```

### Check Webhook Logs

```sql
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Check Usage

```sql
SELECT * FROM usage_tracking
WHERE user_id = 'YOUR-USER-ID';
```

## 🔧 Common Commands

### Supabase

```bash
# Link project
supabase link --project-ref YOUR-PROJECT-REF

# Set secrets
supabase secrets set MIDTRANS_SERVER_KEY=YOUR_MIDTRANS_SERVER_KEY
supabase secrets set MIDTRANS_IS_PRODUCTION=false

# Deploy functions
supabase functions deploy midtrans-create-transaction
supabase functions deploy midtrans-webhook

# View logs
supabase functions logs midtrans-create-transaction
supabase functions logs midtrans-webhook

# Run migrations
supabase db push
```

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Build
npm run build
```

## 🐛 Debugging

### Check Edge Function Logs

```bash
supabase functions logs midtrans-create-transaction --tail
```

### Check Browser Console

```javascript
// Open DevTools (F12)
// Check Console tab for errors
// Check Network tab for API calls
```

### Verify Snap.js Loaded

```javascript
// In browser console
console.log(window.snap);
// Should show snap object
```

## 📞 Support Links

- [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/)
- [Midtrans Docs](https://docs.midtrans.com/)
- [Test Cards](https://docs.midtrans.com/en/technical-reference/sandbox-test)
- [Webhook Docs](https://docs.midtrans.com/en/after-payment/http-notification)

## ⚡ Quick Fixes

### Issue: Snap popup not opening

```javascript
// Check if Snap.js is loaded
console.log(window.snap);

// Verify client key
console.log(import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
```

### Issue: Invalid signature

```bash
# Verify server key is set
supabase secrets list

# Check webhook handler logs
supabase functions logs midtrans-webhook
```

### Issue: Transaction not found

```sql
-- Check if transaction was created
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'transactions';
```

## 🎯 Testing Checklist

- [ ] Environment variables set
- [ ] Edge functions deployed
- [ ] Database migrated
- [ ] Webhook URL configured
- [ ] Test HTML page works
- [ ] Success card works
- [ ] Denied card shows error
- [ ] 3DS flow works
- [ ] Webhook received
- [ ] Database updated
- [ ] Subscription activated

## 📝 Notes

- Always use sandbox environment for testing
- Never commit real credentials to git
- Test all payment methods before production
- Monitor webhook delivery rate
- Set up error tracking (Sentry)

---

**Last Updated:** 2024-02-18
**Version:** 1.0.0
