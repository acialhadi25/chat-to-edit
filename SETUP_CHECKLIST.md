# 📋 Midtrans Setup & Testing Checklist

Gunakan checklist ini untuk memastikan setup Midtrans berjalan dengan sempurna.

## Phase 1: Initial Setup ⚙️

### Environment Setup

- [ ] File `.env` sudah dibuat dari `.env.example`
- [ ] `VITE_MIDTRANS_CLIENT_KEY` ter-set ke `Mid-client-Lpyk1mcchaNy5Wib`
- [ ] `VITE_MIDTRANS_IS_PRODUCTION` ter-set ke `false`
- [ ] Supabase CLI ter-install (`supabase --version`)
- [ ] Project ter-link ke Supabase (`supabase link`)

### Supabase Configuration

- [ ] Secret `MIDTRANS_SERVER_KEY` ter-set di Supabase
- [ ] Secret `MIDTRANS_IS_PRODUCTION` ter-set ke `false`
- [ ] Database migration berhasil dijalankan
- [ ] Tables ter-create (subscription_tiers, user_subscriptions, transactions, dll)

### Edge Functions Deployment

- [ ] `midtrans-create-transaction` ter-deploy
- [ ] `midtrans-webhook` ter-deploy
- [ ] `midtrans-subscription` ter-deploy
- [ ] `subscription-renewal` ter-deploy
- [ ] Semua functions bisa diakses (test dengan curl)

## Phase 2: Midtrans Dashboard Configuration 🎛️

### Dashboard Setup

- [ ] Login ke [Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/)
- [ ] Verify Merchant ID: `G183260451`
- [ ] Verify credentials aktif
- [ ] Notification URL ter-configure:
  ```
  https://YOUR-PROJECT.supabase.co/functions/v1/midtrans-webhook
  ```

### Settings Verification

- [ ] Payment methods enabled (Credit Card, Bank Transfer, E-Wallet)
- [ ] Notification settings configured
- [ ] Test mode active

## Phase 3: Frontend Testing 🖥️

### HTML Test Page

- [ ] File `src/test-midtrans.html` bisa dibuka di browser
- [ ] Snap.js ter-load (check console: `window.snap`)
- [ ] Test 1: Basic Payment button berfungsi
- [ ] Test 2: Enterprise Payment button berfungsi
- [ ] Test 3: Custom Amount berfungsi
- [ ] Console log menampilkan output

### Success Card Test (4811 1111 1111 1114)

- [ ] Payment popup terbuka
- [ ] Card details bisa diinput
- [ ] Payment berhasil (status: settlement)
- [ ] Success message ditampilkan
- [ ] Transaction ID diterima

### Denied Card Test (4911 1111 1111 1113)

- [ ] Payment popup terbuka
- [ ] Card details bisa diinput
- [ ] Payment ditolak (status: deny)
- [ ] Error message ditampilkan

### 3DS Card Test (4611 1111 1111 1112)

- [ ] Payment popup terbuka
- [ ] Card details bisa diinput
- [ ] OTP page muncul
- [ ] OTP 112233 diterima
- [ ] Payment berhasil setelah OTP

## Phase 4: Backend Testing 🔧

### API Testing

- [ ] Script `test-midtrans-api.sh` ter-update dengan credentials
- [ ] Script bisa dijalankan (`chmod +x`)
- [ ] Test 1: Create Transaction berhasil
- [ ] Test 2: Webhook simulation berhasil
- [ ] Test 3: Direct Midtrans API berhasil
- [ ] Response JSON valid

### Edge Function Logs

- [ ] `midtrans-create-transaction` logs accessible
- [ ] `midtrans-webhook` logs accessible
- [ ] No error messages in logs
- [ ] Transaction creation logged
- [ ] Webhook processing logged

## Phase 5: Database Verification 💾

### Check Tables

```sql
-- Run these queries in Supabase SQL Editor
```

- [ ] `subscription_tiers` memiliki 3 rows (Free, Pro, Enterprise)

  ```sql
  SELECT * FROM subscription_tiers;
  ```

- [ ] `transactions` table menerima data

  ```sql
  SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;
  ```

- [ ] `webhook_logs` mencatat events

  ```sql
  SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 5;
  ```

- [ ] `user_subscriptions` ter-update setelah payment
  ```sql
  SELECT * FROM user_subscriptions WHERE status = 'active';
  ```

### Data Integrity

- [ ] Transaction order_id unique
- [ ] Subscription status correct
- [ ] Webhook signature verified
- [ ] Timestamps accurate

## Phase 6: Application Testing 🚀

### Development Server

- [ ] `npm run dev` berjalan tanpa error
- [ ] Application accessible di `http://localhost:5173`
- [ ] No console errors

### Billing Page

- [ ] Navigate ke `/billing` berhasil
- [ ] Subscription tiers ditampilkan
- [ ] Current subscription info correct
- [ ] Usage statistics ditampilkan

### Payment Flow

- [ ] Select tier button berfungsi
- [ ] Payment popup terbuka
- [ ] Payment bisa diselesaikan
- [ ] Redirect ke callback page
- [ ] Success/error message ditampilkan
- [ ] Subscription status ter-update

### Usage Tracking

- [ ] Usage counter ter-update setelah operasi
- [ ] Limits ter-enforce
- [ ] Warning muncul saat mendekati limit
- [ ] Error muncul saat exceed limit

## Phase 7: Webhook Testing 📨

### Manual Webhook Test

- [ ] Login ke Midtrans Dashboard
- [ ] Find test transaction
- [ ] Click "Send Notification"
- [ ] Webhook received di Edge Function
- [ ] Database ter-update
- [ ] Webhook log ter-create

### Webhook Scenarios

- [ ] Settlement notification processed
- [ ] Pending notification processed
- [ ] Denied notification processed
- [ ] Expired notification processed
- [ ] Cancel notification processed

## Phase 8: Integration Testing 🔄

### End-to-End Flow

- [ ] User signup/login
- [ ] Navigate to billing
- [ ] Select Pro tier
- [ ] Complete payment (success card)
- [ ] Verify subscription active
- [ ] Verify usage limits updated
- [ ] Perform Excel operation
- [ ] Verify usage tracked
- [ ] Check billing dashboard

### Error Scenarios

- [ ] Payment failure handled gracefully
- [ ] Network error handled
- [ ] Invalid card handled
- [ ] Expired card handled
- [ ] Insufficient funds handled

## Phase 9: Performance & Security 🔒

### Performance

- [ ] Payment popup loads < 2s
- [ ] Transaction creation < 1s
- [ ] Webhook processing < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks

### Security

- [ ] Webhook signature verified
- [ ] Server key not exposed
- [ ] Client key correct
- [ ] RLS policies active
- [ ] No sensitive data in logs
- [ ] HTTPS enforced

## Phase 10: Documentation 📚

### Documentation Review

- [ ] `MIDTRANS_INTEGRATION.md` reviewed
- [ ] `MIDTRANS_TESTING_GUIDE.md` reviewed
- [ ] `MIDTRANS_QUICK_REFERENCE.md` reviewed
- [ ] `TESTING_README.md` reviewed
- [ ] All READMEs in Edge Functions reviewed

### Code Documentation

- [ ] Functions have JSDoc comments
- [ ] Complex logic explained
- [ ] Edge cases documented
- [ ] Error handling documented

## Phase 11: Production Readiness 🎯

### Pre-Production Checklist

- [ ] All sandbox tests passed
- [ ] Production credentials obtained
- [ ] Production environment configured
- [ ] Production webhook URL set
- [ ] Monitoring setup (Sentry)
- [ ] Error alerting configured
- [ ] Backup strategy defined
- [ ] Rollback plan documented

### Production Testing

- [ ] Small amount test transaction
- [ ] Verify production webhook
- [ ] Monitor for 24 hours
- [ ] Check error rates
- [ ] Verify all features work

## 🎉 Completion

Jika semua checklist di atas ter-check (✅), maka:

**🎊 CONGRATULATIONS! 🎊**

Integrasi Midtrans Anda sudah siap untuk production!

### Next Steps:

1. ✅ Deploy to production
2. ✅ Monitor closely for first week
3. ✅ Gather user feedback
4. ✅ Optimize based on metrics
5. ✅ Scale as needed

---

**Checklist Version:** 1.0.0
**Last Updated:** 2024-02-18

**Notes:**

- Simpan checklist ini untuk reference
- Update sesuai kebutuhan project
- Share dengan team members
- Review regularly

**Need Help?**

- Check documentation files
- Review Edge Function logs
- Contact Midtrans support
- Open GitHub issue
