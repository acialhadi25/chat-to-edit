# Midtrans Setup Checklist

## ✅ Completed

### 1. Edge Functions
- [x] `midtrans-create-transaction` - Create payment transaction
- [x] `midtrans-webhook` - Handle payment notifications
- [x] Edge functions deployed to Supabase

### 2. Frontend Pages
- [x] Pricing page with tax display
- [x] Checkout page with tax breakdown
- [x] Payment Success page (`/payment/success`)
- [x] Payment Pending page (`/payment/pending`)
- [x] Payment Error page (`/payment/error`)
- [x] Routes configured in App.tsx

### 3. Database
- [x] Transactions table created
- [x] Subscription tables created
- [x] Webhook logs table created
- [x] Migrations applied

### 4. Documentation
- [x] Tax regulation documentation
- [x] Implementation guides
- [x] URL configuration guide
- [x] Testing guides

## 🔄 Pending - Midtrans Dashboard Configuration

### Step 1: Login to Midtrans Dashboard

**Sandbox (Testing)**:
- URL: https://dashboard.sandbox.midtrans.com
- Login dengan akun Midtrans Anda

**Production (Live)**:
- URL: https://dashboard.midtrans.com
- Login dengan akun Midtrans Anda

### Step 2: Configure URLs

Go to **Settings** > **Configuration** dan isi:

#### 1. Payment Notification URL (Webhook) ⭐ PALING PENTING
```
https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook
```

**Fungsi**: Midtrans akan mengirim notifikasi status pembayaran ke URL ini
**Kapan**: Setiap ada perubahan status pembayaran (success, pending, failed, dll)

#### 2. Finish Redirect URL
```
https://your-app-domain.com/payment/success
```

**Contoh**:
- Vercel: `https://chat-to-edit.vercel.app/payment/success`
- Custom domain: `https://chattoedit.com/payment/success`

**Fungsi**: User akan diarahkan ke halaman ini setelah pembayaran BERHASIL

#### 3. Unfinish Redirect URL
```
https://your-app-domain.com/payment/pending
```

**Contoh**:
- Vercel: `https://chat-to-edit.vercel.app/payment/pending`
- Custom domain: `https://chattoedit.com/payment/pending`

**Fungsi**: User akan diarahkan ke halaman ini jika klik "Back to Merchant" sebelum selesai bayar

#### 4. Error Redirect URL
```
https://your-app-domain.com/payment/error
```

**Contoh**:
- Vercel: `https://chat-to-edit.vercel.app/payment/error`
- Custom domain: `https://chattoedit.com/payment/error`

**Fungsi**: User akan diarahkan ke halaman ini jika terjadi error saat pembayaran

### Step 3: Save Configuration

Klik **Save** atau **Update** untuk menyimpan konfigurasi.

## 🧪 Testing

### Test Payment Flow (Sandbox)

1. **Start Application**
   ```bash
   npm run dev
   ```

2. **Login ke aplikasi**
   - Go to http://localhost:5173/login
   - Login dengan akun test

3. **Navigate to Pricing**
   - Go to http://localhost:5173/pricing
   - Pilih plan (Pro atau Enterprise)

4. **Checkout**
   - Klik "Upgrade to Pro" atau "Upgrade to Enterprise"
   - Akan redirect ke `/checkout`
   - Klik "Pay Rp 109.890" (untuk Pro)

5. **Complete Payment (Sandbox)**
   - Midtrans Snap popup akan muncul
   - Pilih metode pembayaran (Credit Card, Bank Transfer, dll)
   
   **Untuk Credit Card (Sandbox)**:
   - Card Number: `4811 1111 1111 1114`
   - CVV: `123`
   - Exp Date: `01/25` (atau bulan/tahun di masa depan)
   - OTP: `112233`

6. **Verify Success**
   - Setelah payment success, akan redirect ke `/payment/success`
   - Check database: transaction status harus `settlement`
   - Check subscription: user_subscriptions harus ada record baru

### Test Webhook (Manual)

```bash
# Test webhook dengan curl
curl -X POST https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "ORDER-test-123",
    "transaction_id": "TXN-test-123",
    "gross_amount": "109890",
    "payment_type": "bank_transfer",
    "transaction_time": "2025-02-20 10:00:00",
    "signature_key": "test-signature"
  }'
```

### Check Logs

**Supabase Logs**:
```bash
# Check webhook logs
supabase functions logs midtrans-webhook --tail

# Check transaction creation logs
supabase functions logs midtrans-create-transaction --tail
```

**Database Logs**:
```sql
-- Check webhook logs
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check transactions
SELECT * FROM transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- Check subscriptions
SELECT * FROM user_subscriptions 
ORDER BY created_at DESC 
LIMIT 10;
```

## 🚀 Production Deployment

### 1. Deploy Frontend
```bash
# Build production
npm run build

# Deploy to Vercel
vercel --prod

# Or deploy to your hosting
```

### 2. Update Midtrans URLs (Production)

Login ke https://dashboard.midtrans.com dan update URLs dengan production domain:

```
Payment Notification URL:
https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook

Finish Redirect URL:
https://your-production-domain.com/payment/success

Unfinish Redirect URL:
https://your-production-domain.com/payment/pending

Error Redirect URL:
https://your-production-domain.com/payment/error
```

### 3. Update Environment Variables

**Frontend (.env.production)**:
```env
VITE_MIDTRANS_CLIENT_KEY=your-production-client-key
VITE_MIDTRANS_IS_PRODUCTION=true
```

**Supabase Secrets**:
```bash
supabase secrets set MIDTRANS_SERVER_KEY=your-production-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=true
```

### 4. Test Production Payment

1. Make a real payment (small amount)
2. Verify webhook is called
3. Verify subscription is created
4. Verify redirect works correctly

## 📋 Configuration Summary

### URLs to Configure in Midtrans Dashboard

| URL Type | Sandbox | Production |
|----------|---------|------------|
| Webhook | `https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook` | Same |
| Success | `https://localhost:5173/payment/success` | `https://your-domain.com/payment/success` |
| Pending | `https://localhost:5173/payment/pending` | `https://your-domain.com/payment/pending` |
| Error | `https://localhost:5173/payment/error` | `https://your-domain.com/payment/error` |

### Test Cards (Sandbox Only)

| Card Number | CVV | Exp Date | OTP | Result |
|-------------|-----|----------|-----|--------|
| 4811 1111 1111 1114 | 123 | 01/25 | 112233 | Success |
| 4911 1111 1111 1113 | 123 | 01/25 | 112233 | Challenge by FDS |
| 4411 1111 1111 1118 | 123 | 01/25 | 112233 | Denied by Bank |

## ⚠️ Important Notes

1. **Webhook URL harus HTTPS** - Midtrans tidak accept HTTP
2. **Webhook harus publicly accessible** - Tidak bisa localhost
3. **Signature verification** - Webhook sudah include signature verification
4. **Idempotency** - Webhook handler sudah handle duplicate notifications
5. **Rate limiting** - Webhook sudah include rate limiting

## 🆘 Troubleshooting

### Webhook tidak dipanggil
- [ ] Check URL di Midtrans dashboard (typo?)
- [ ] Verify edge function deployed: `supabase functions list`
- [ ] Check logs: `supabase functions logs midtrans-webhook`
- [ ] Test manual dengan curl

### Payment stuck di pending
- [ ] Check webhook logs di database
- [ ] Verify signature key correct
- [ ] Check Midtrans dashboard untuk transaction status
- [ ] Manual update jika perlu

### Redirect tidak bekerja
- [ ] Verify URLs di Midtrans dashboard
- [ ] Check routes di App.tsx
- [ ] Test dengan browser developer tools
- [ ] Check for CORS issues

## ✅ Final Checklist

### Midtrans Dashboard
- [ ] Payment Notification URL configured
- [ ] Finish Redirect URL configured
- [ ] Unfinish Redirect URL configured
- [ ] Error Redirect URL configured
- [ ] URLs saved successfully

### Application
- [ ] Payment result pages created
- [ ] Routes added to App.tsx
- [ ] Frontend deployed
- [ ] Edge functions deployed

### Testing
- [ ] Test payment flow end-to-end
- [ ] Test webhook receives notifications
- [ ] Test all redirect URLs
- [ ] Test error scenarios
- [ ] Verify database updates correctly

### Production
- [ ] Production URLs configured
- [ ] Environment variables updated
- [ ] Real payment tested
- [ ] Monitoring setup

---

**Next Step**: Configure URLs di Midtrans Dashboard
**Documentation**: See MIDTRANS_URL_CONFIGURATION.md for detailed guide
**Support**: Check TROUBLESHOOTING.md for common issues
