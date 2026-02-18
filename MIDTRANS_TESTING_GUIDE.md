# Panduan Testing Midtrans Sandbox

Dokumen ini berisi panduan lengkap untuk testing integrasi Midtrans menggunakan sandbox environment.

## 📋 Kredensial Sandbox

Dapatkan kredensial sandbox Anda dari [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/):

```
Merchant ID: [Your Merchant ID]
Client Key: [Your Client Key]
Server Key: [Your Server Key]
Environment: Sandbox (Testing)
```

## 🚀 Setup Awal

### 1. Update Environment Variables

**File: `.env`**

```env
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_MIDTRANS_IS_PRODUCTION=false
```

### 2. Setup Supabase Edge Functions

**Set secrets di Supabase Dashboard:**

```bash
# Via Supabase CLI
supabase secrets set MIDTRANS_SERVER_KEY=your-midtrans-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=false

# Atau via Dashboard:
# Settings > Edge Functions > Secrets
```

### 3. Deploy Edge Functions

```bash
# Deploy semua functions
supabase functions deploy midtrans-create-transaction
supabase functions deploy midtrans-webhook
supabase functions deploy midtrans-subscription
supabase functions deploy subscription-renewal
```

### 4. Run Database Migration

```bash
# Apply migration untuk subscription tables
supabase migration up
```

## 🧪 Metode Testing

### Metode 1: HTML Test Page (Recommended untuk Frontend)

1. Buka file `src/test-midtrans.html` di browser
2. File ini sudah include Snap.js dengan Client Key yang benar
3. Klik tombol test untuk mencoba berbagai skenario

**Fitur:**

- ✅ Test basic payment (Pro tier - IDR 99,000)
- ✅ Test enterprise payment (IDR 499,000)
- ✅ Test custom amount
- ✅ Real-time console logging
- ✅ Test cards reference

### Metode 2: API Testing dengan Bash Script

```bash
# Edit script dengan Supabase credentials Anda
nano test-midtrans-api.sh

# Update variables:
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Make executable
chmod +x test-midtrans-api.sh

# Run tests
./test-midtrans-api.sh
```

### Metode 3: Manual cURL Testing

#### Test 1: Create Transaction

```bash
curl -X POST https://your-project.supabase.co/functions/v1/midtrans-create-transaction \
  -H "Authorization: Bearer YOUR_SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "TEST-001",
    "amount": 99000,
    "customerDetails": {
      "firstName": "Test",
      "email": "test@example.com"
    },
    "itemDetails": [{
      "id": "PRO-MONTHLY",
      "price": 99000,
      "quantity": 1,
      "name": "Pro Subscription - Monthly"
    }]
  }'
```

**Expected Response:**

```json
{
  "token": "snap-token-here",
  "redirectUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/..."
}
```

#### Test 2: Direct Midtrans API

```bash
# Create base64 auth header
AUTH=$(echo -n "your-midtrans-server-key:" | base64)

curl -X POST https://app.sandbox.midtrans.com/snap/v1/transactions \
  -H "Content-Type: application/json" \
  -H "Authorization: Basic $AUTH" \
  -d '{
    "transaction_details": {
      "order_id": "TEST-002",
      "gross_amount": 99000
    },
    "customer_details": {
      "first_name": "Test",
      "email": "test@example.com"
    },
    "item_details": [{
      "id": "PRO-MONTHLY",
      "price": 99000,
      "quantity": 1,
      "name": "Pro Subscription"
    }]
  }'
```

### Metode 4: Testing di Aplikasi React

1. Start development server:

```bash
npm run dev
```

2. Navigate ke `/billing` page
3. Pilih subscription tier
4. Klik "Select Plan"
5. Payment popup akan muncul

## 💳 Test Cards

### Success Card (Pembayaran Berhasil)

```
Card Number: 4811 1111 1111 1114
CVV: 123
Expiry: 01/25 (atau tanggal future lainnya)
```

### Denied Card (Pembayaran Ditolak)

```
Card Number: 4911 1111 1111 1113
CVV: 123
Expiry: 01/25
```

### 3D Secure Card (Memerlukan OTP)

```
Card Number: 4611 1111 1111 1112
CVV: 123
Expiry: 01/25
OTP: 112233
```

### Bank Transfer (Virtual Account)

Pilih metode "Bank Transfer" di payment popup, akan generate VA number untuk testing.

### E-Wallet (GoPay, ShopeePay, dll)

Pilih metode e-wallet, akan redirect ke halaman simulasi.

## 🔍 Skenario Testing

### Skenario 1: Successful Payment Flow

1. **Create Transaction**
   - Call Edge Function atau klik button di test page
   - Verify snap token received

2. **Complete Payment**
   - Use success test card: 4811 1111 1111 1114
   - Enter CVV: 123
   - Click Pay

3. **Verify Webhook**
   - Check `webhook_logs` table di Supabase
   - Verify `transactions` table updated dengan status "settlement"
   - Verify `user_subscriptions` table updated dengan status "active"

4. **Check Subscription**
   - Login ke aplikasi
   - Navigate ke `/billing`
   - Verify subscription tier updated

### Skenario 2: Failed Payment

1. Create transaction
2. Use denied card: 4911 1111 1111 1113
3. Verify error handling
4. Check transaction status remains "pending" or "denied"

### Skenario 3: Pending Payment (Bank Transfer)

1. Create transaction
2. Select Bank Transfer method
3. Get Virtual Account number
4. Simulate payment via Midtrans Dashboard
5. Verify webhook updates status to "settlement"

### Skenario 4: 3D Secure Flow

1. Create transaction
2. Use 3DS card: 4611 1111 1111 1112
3. Enter OTP: 112233
4. Complete payment
5. Verify success

## 🔔 Webhook Testing

### Setup Webhook URL di Midtrans Dashboard

1. Login ke [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/)
2. Go to Settings > Configuration
3. Set Notification URL:
   ```
   https://your-project.supabase.co/functions/v1/midtrans-webhook
   ```

### Test Webhook Manually

Di Midtrans Dashboard:

1. Go to Transactions
2. Find your test transaction
3. Click "Send Notification"
4. Check Supabase logs

### Verify Webhook Processing

```sql
-- Check webhook logs
SELECT * FROM webhook_logs
ORDER BY created_at DESC
LIMIT 10;

-- Check transaction updates
SELECT * FROM transactions
WHERE order_id = 'YOUR-ORDER-ID';

-- Check subscription status
SELECT * FROM user_subscriptions
WHERE user_id = 'YOUR-USER-ID';
```

## 📊 Monitoring & Debugging

### Check Edge Function Logs

```bash
# Via CLI
supabase functions logs midtrans-create-transaction
supabase functions logs midtrans-webhook

# Or via Dashboard:
# Edge Functions > Select function > Logs
```

### Common Issues & Solutions

#### Issue 1: "Invalid signature" error

**Solution:**

- Verify MIDTRANS_SERVER_KEY is set correctly
- Check signature calculation in webhook handler
- For testing, you can temporarily disable signature verification

#### Issue 2: Snap popup not opening

**Solution:**

- Verify VITE_MIDTRANS_CLIENT_KEY is correct
- Check browser console for errors
- Ensure Snap.js is loaded (check Network tab)

#### Issue 3: Transaction not found in database

**Solution:**

- Check Edge Function logs for errors
- Verify database RLS policies
- Check Supabase service role key is set

#### Issue 4: Webhook not received

**Solution:**

- Verify webhook URL in Midtrans Dashboard
- Check Edge Function is deployed
- Test webhook manually from Dashboard
- Check firewall/CORS settings

## 🎯 Testing Checklist

### Frontend Testing

- [ ] Snap.js loads correctly
- [ ] Payment popup opens
- [ ] Success card works
- [ ] Denied card shows error
- [ ] 3DS flow works
- [ ] Payment callback page works
- [ ] Subscription status updates

### Backend Testing

- [ ] Edge Function creates transaction
- [ ] Snap token generated
- [ ] Transaction saved to database
- [ ] Webhook receives notifications
- [ ] Signature verification works
- [ ] Status updates correctly
- [ ] Subscription activated on success

### Integration Testing

- [ ] End-to-end payment flow
- [ ] Multiple payment methods
- [ ] Error handling
- [ ] Retry logic
- [ ] Subscription renewal
- [ ] Usage tracking

## 📚 Resources

- [Midtrans Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/)
- [Midtrans Documentation](https://docs.midtrans.com/)
- [Snap Integration Guide](https://docs.midtrans.com/en/snap/integration-guide)
- [Test Cards Reference](https://docs.midtrans.com/en/technical-reference/sandbox-test)
- [Webhook Documentation](https://docs.midtrans.com/en/after-payment/http-notification)

## 🆘 Support

Jika mengalami masalah:

1. Check Edge Function logs
2. Check browser console
3. Verify credentials
4. Review Midtrans Dashboard
5. Check database tables
6. Contact Midtrans support untuk API issues

## 🎉 Next Steps

Setelah testing berhasil di sandbox:

1. **Get Production Credentials**
   - Apply untuk production access di Midtrans
   - Get production Server Key dan Client Key

2. **Update Environment**

   ```env
   VITE_MIDTRANS_CLIENT_KEY=your-production-client-key
   VITE_MIDTRANS_IS_PRODUCTION=true
   ```

3. **Update Supabase Secrets**

   ```bash
   supabase secrets set MIDTRANS_SERVER_KEY=your-production-server-key
   supabase secrets set MIDTRANS_IS_PRODUCTION=true
   ```

4. **Configure Production Webhook**
   - Update notification URL di production dashboard
   - Test dengan small amount transaction

5. **Monitor Production**
   - Setup Sentry for error tracking
   - Monitor transaction success rate
   - Track webhook delivery

Happy Testing! 🚀
