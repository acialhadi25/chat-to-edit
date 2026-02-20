# Midtrans Payment Testing Guide

## 🎯 Testing Overview

Website: https://chat-to-edit.vercel.app/
Environment: Sandbox (Testing)
Midtrans Dashboard: https://dashboard.sandbox.midtrans.com

---

## 📋 Pre-Testing Checklist

Pastikan sudah dikonfigurasi di Midtrans Dashboard:

- [x] Payment Notification URL: `https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook`
- [x] Finish Redirect URL: `https://chat-to-edit.vercel.app/payment/success`
- [x] Unfinish Redirect URL: `https://chat-to-edit.vercel.app/payment/pending`
- [x] Error Redirect URL: `https://chat-to-edit.vercel.app/payment/error`

---

## 🧪 Test Scenarios

### Test 1: Credit Card - Successful Payment (3DS 2) ✅

**Objective**: Test successful payment flow with 3DS 2 credit card

**Steps**:
1. Buka https://chat-to-edit.vercel.app/
2. Login ke akun Anda
3. Klik menu **Pricing** atau navigasi ke `/pricing`
4. Pilih **Pro Plan** (Rp 109.890)
5. Klik tombol **Upgrade to Pro**
6. Anda akan diarahkan ke halaman Checkout
7. Klik tombol **Pay Rp 109.890**
8. Popup Midtrans Snap akan muncul
9. Pilih metode pembayaran: **Credit Card**
10. Masukkan data kartu test:
    - Card Number: `4811 1111 1111 1114` (VISA - Full Authentication)
    - CVV: `123`
    - Expiry Month: `01` (atau bulan apapun)
    - Expiry Year: `2025` (atau tahun di masa depan)
11. Klik **Pay**
12. Masukkan OTP: `112233`
13. Klik **OK**

**Expected Result**:
- ✅ Payment berhasil
- ✅ Redirect ke `/payment/success`
- ✅ Muncul pesan "Payment Successful"
- ✅ Order ID dan Transaction ID ditampilkan
- ✅ Checklist aktivasi (Account Upgraded, Credits Added, Premium Features)

**Alternative Success Cards**:
- VISA: `4811 1111 1111 1114`
- Mastercard: `5211 1111 1111 1117`
- JCB: `3528 2033 2456 4357`
- AMEX: `3701 9216 9722 458`

**Database Verification**:
```sql
-- Check transaction
SELECT * FROM transactions 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC LIMIT 1;

-- Check subscription
SELECT * FROM user_subscriptions 
WHERE user_id = 'YOUR_USER_ID';

-- Check webhook log
SELECT * FROM webhook_logs 
ORDER BY created_at DESC LIMIT 1;
```

---

### Test 2: Credit Card - Denied by Bank ❌

**Objective**: Test payment rejection by bank

**Steps**:
1. Ulangi langkah 1-9 dari Test 1
2. Gunakan kartu test berbeda:
    - Card Number: `4911 1111 1111 1113` (VISA - Denied by Bank)
    - CVV: `123`
    - Expiry: `01/2025`
3. Klik **Pay**
4. Masukkan OTP: `112233`

**Expected Result**:
- ❌ Payment ditolak oleh bank
- ❌ Redirect ke `/payment/error`
- ❌ Muncul pesan error
- ❌ Tombol "Try Again" tersedia

**Alternative Denied Cards**:
- VISA: `4911 1111 1111 1113`
- Mastercard: `5111 1111 1111 1118`
- JCB: `3528 5129 4493 2269`
- AMEX: `3742 9635 4400 881`

---

### Test 3: Credit Card - Denied by FDS (Fraud Detection) ⚠️

**Objective**: Test payment blocked by fraud detection system

**Steps**:
1. Ulangi langkah 1-9 dari Test 1
2. Gunakan kartu test berbeda:
    - Card Number: `4611 1111 1111 1116` (VISA - Denied by FDS)
    - CVV: `123`
    - Expiry: `01/2025`
3. Klik **Pay**

**Expected Result**:
- ⚠️ Payment di-block oleh Fraud Detection System
- ⚠️ Status: Denied/Failed
- ⚠️ Redirect ke `/payment/error`
- ⚠️ Muncul pesan fraud detection

**Alternative FDS Denied Cards**:
- VISA: `4611 1111 1111 1116`
- Mastercard: `5411 1111 1111 1115`
- JCB: `3528 1852 6717 1623`
- AMEX: `3780 9621 8340 018`

---

### Test 4: Credit Card - Attempted Authentication (No 3DS) ✅

**Objective**: Test card without 3DS enrollment

**Steps**:
1. Ulangi langkah 1-9 dari Test 1
2. Gunakan kartu test:
    - Card Number: `4411 1111 1111 1118` (VISA - Attempted Auth)
    - CVV: `123`
    - Expiry: `01/2025`
3. Klik **Pay**
4. **Tidak ada OTP prompt** (karena tidak enrolled 3DS)

**Expected Result**:
- ✅ Payment berhasil tanpa 3DS
- ✅ Redirect ke `/payment/success`
- ✅ Transaction status: settlement

**Alternative Attempted Auth Cards**:
- VISA: `4411 1111 1111 1118`
- Mastercard: `5410 1111 1111 1116`
- JCB: `3528 8680 4786 4225`
- AMEX: `3737 4772 6661 940`

---

### Test 5: Bank Transfer - BCA Virtual Account 🏦

**Objective**: Test bank transfer payment method

**Steps**:
1. Ulangi langkah 1-8 dari Test 1
2. Pilih metode pembayaran: **BCA Virtual Account**
3. Klik **Continue**
4. Catat nomor Virtual Account yang diberikan (contoh: 12345678901234)
5. Buka BCA VA Simulator: https://simulator.sandbox.midtrans.com/bca/va/index
6. Masukkan nomor VA yang diberikan
7. Klik **Inquiry** untuk cek tagihan
8. Klik **Pay** untuk simulasi pembayaran

**Expected Result**:
- ⏳ Status awal: Pending
- ⏳ Redirect ke `/payment/pending`
- ⏳ Nomor VA ditampilkan
- ⏳ Instruksi pembayaran ditampilkan
- ✅ Setelah simulasi payment: Status berubah jadi Settlement
- ✅ Webhook dipanggil otomatis
- ✅ Credits ditambahkan ke akun

**Alternative Bank VA**:
- BNI VA: https://simulator.sandbox.midtrans.com/openapi/va/index (pilih BNI)
- BRI VA: https://simulator.sandbox.midtrans.com/openapi/va/index (pilih BRI)
- Permata VA: https://simulator.sandbox.midtrans.com/openapi/va/index (pilih Permata)
- Mandiri Bill: https://simulator.sandbox.midtrans.com/openapi/va/index (pilih Mandiri)

---

### Test 6: GoPay E-Wallet 📱

**Objective**: Test e-wallet payment

**Steps**:
1. Ulangi langkah 1-8 dari Test 1
2. Pilih metode pembayaran: **GoPay**
3. Klik **Continue**
4. QR Code akan ditampilkan (atau deeplink di mobile)
5. **Desktop**: Copy QR Code image URL
6. Buka QRIS Simulator: https://simulator.sandbox.midtrans.com/qris/index
7. Paste QR Code URL
8. Klik **Pay**

**Expected Result**:
- ⏳ Status awal: Pending
- ⏳ QR Code ditampilkan
- ⏳ Instruksi scan QR code
- ✅ Setelah simulasi: Payment berhasil
- ✅ Webhook dipanggil
- ✅ Redirect ke `/payment/success`

**Mobile Testing**:
- Di mobile, akan auto-redirect ke GoPay Simulator
- Klik **Pay** di simulator
- Auto-redirect kembali ke app

**Alternative E-Wallets**:
- ShopeePay: Sama seperti GoPay (gunakan QRIS Simulator)
- QRIS: Gunakan QRIS Simulator yang sama

---

### Test 7: Indomaret/Alfamart (Over-the-Counter) 🏪

**Objective**: Test convenience store payment

**Steps**:
1. Ulangi langkah 1-8 dari Test 1
2. Pilih metode pembayaran: **Indomaret** atau **Alfamart**
3. Klik **Continue**
4. Payment Code akan ditampilkan (contoh: 1234567890123)
5. Buka Simulator:
   - Indomaret: https://simulator.sandbox.midtrans.com/indomaret/index
   - Alfamart: https://simulator.sandbox.midtrans.com/alfamart/index
6. Masukkan Payment Code
7. Klik **Inquiry** untuk cek tagihan
8. Klik **Pay** untuk simulasi pembayaran

**Expected Result**:
- ⏳ Status awal: Pending
- ⏳ Payment code ditampilkan
- ⏳ Instruksi pembayaran di toko
- ✅ Setelah simulasi: Payment berhasil
- ✅ Webhook dipanggil
- ✅ Status berubah jadi Settlement

---

### Test 8: User Closes Popup (Cancel) 🚫

**Objective**: Test when user cancels payment

**Steps**:
1. Ulangi langkah 1-8 dari Test 1
2. Pilih metode pembayaran apapun
3. Klik tombol **X** atau **Close** pada popup Midtrans
4. Popup akan tertutup

**Expected Result**:
- 🚫 Kembali ke halaman Checkout
- 🚫 Tidak ada redirect
- 🚫 Tombol "Pay" masih aktif
- 🚫 User bisa mencoba lagi

---

### Test 9: Enterprise Plan Payment 💼

**Objective**: Test higher tier payment

**Steps**:
1. Buka https://chat-to-edit.vercel.app/pricing
2. Pilih **Enterprise Plan** (Rp 553.890)
3. Klik **Upgrade to Enterprise**
4. Klik **Pay Rp 553.890**
5. Gunakan kartu test sukses: `4811 1111 1111 1114`
6. Complete payment dengan OTP: `112233`

**Expected Result**:
- ✅ Payment berhasil dengan amount Rp 553.890
- ✅ Subscription tier: Enterprise
- ✅ Credits: 10,000 ditambahkan

---

### Test 10: Bank-Specific Cards (Installment Testing) 🏦

**Objective**: Test bank-specific cards for installment features

**Bank Cards Available**:
- **Mandiri**: `4617 0069 5974 6656` (Full 3DS) atau `5573 3810 7219 6900`
- **BCA**: `4773 7760 5705 1650` (Full 3DS) atau `5229 9031 3685 3172`
- **BNI**: `4105 0586 8948 1467` (Full 3DS) atau `5264 2210 3887 4659`
- **BRI**: `4365 0263 3573 7199` (Full 3DS) atau `5520 0298 7089 9100`
- **CIMB**: `4599 2078 8712 2414` (Full 3DS) atau `5481 1698 1883 2479`

**Steps**:
1. Gunakan salah satu kartu bank di atas
2. CVV: `123`, Expiry: `01/2025`, OTP: `112233`
3. Complete payment

**Expected Result**:
- ✅ Payment berhasil
- ✅ Dapat test installment features (jika diaktifkan)

---

## 🔍 Verification Steps

### 1. Check Midtrans Dashboard
1. Login ke https://dashboard.sandbox.midtrans.com
2. Go to **Transactions**
3. Cari transaction berdasarkan Order ID
4. Verify status: Settlement/Success

### 2. Check Database

```sql
-- 1. Check latest transaction
SELECT 
  order_id,
  transaction_id,
  amount,
  status,
  payment_type,
  created_at
FROM transactions 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check user subscription
SELECT 
  user_id,
  tier_name,
  status,
  start_date,
  end_date,
  credits_remaining
FROM user_subscriptions 
WHERE user_id = 'YOUR_USER_ID';

-- 3. Check webhook logs
SELECT 
  event_type,
  order_id,
  transaction_status,
  response_status,
  created_at
FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

### 3. Check Application

1. **Dashboard**: Verify subscription badge shows "Pro" or "Enterprise"
2. **Subscription Page**: Check credits balance updated
3. **Billing History**: Verify transaction appears in history
4. **Invoice**: Download PDF invoice and verify details

---

## 📊 Test Results Template

| Test # | Scenario | Payment Method | Card/Account | Status | Result | Notes |
|--------|----------|----------------|--------------|--------|--------|-------|
| 1 | Success (3DS 2) | Credit Card | 4811...1114 | ✅ | | Redirected to success |
| 2 | Denied by Bank | Credit Card | 4911...1113 | ❌ | | Error page shown |
| 3 | Denied by FDS | Credit Card | 4611...1116 | ⚠️ | | Fraud detection |
| 4 | No 3DS | Credit Card | 4411...1118 | ✅ | | Success without OTP |
| 5 | Bank Transfer | BCA VA | - | ⏳→✅ | | VA simulator used |
| 6 | E-Wallet | GoPay/QRIS | - | ⏳→✅ | | QR simulator used |
| 7 | Over-the-Counter | Indomaret | - | ⏳→✅ | | Payment code used |
| 8 | Cancel | Any | - | 🚫 | | Back to checkout |
| 9 | Enterprise | Credit Card | 4811...1114 | ✅ | | Higher amount paid |
| 10 | Bank-Specific | Mandiri/BCA | 4617...6656 | ✅ | | Installment ready |

---

## 🐛 Common Issues & Solutions

### Issue 1: Popup tidak muncul
**Solution**:
- Check browser console untuk error
- Pastikan Midtrans Snap script loaded
- Disable popup blocker
- Clear browser cache

### Issue 2: Webhook tidak dipanggil
**Solution**:
```bash
# Check edge function logs
npx supabase functions logs midtrans-webhook --tail

# Verify webhook URL di Midtrans dashboard
# Test manual webhook:
curl -X POST https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "ORDER-test-123",
    "transaction_id": "TXN-test-123",
    "gross_amount": "109890"
  }'
```

### Issue 3: Redirect tidak bekerja
**Solution**:
- Verify URLs di Midtrans dashboard (no typo)
- Check routes di `App.tsx`
- Test dengan browser developer tools
- Pastikan HTTPS (bukan HTTP)

### Issue 4: Credits tidak bertambah
**Solution**:
```sql
-- Check webhook execution
SELECT * FROM webhook_logs 
WHERE order_id = 'YOUR_ORDER_ID';

-- Manual credit update (if needed)
UPDATE user_subscriptions 
SET credits_remaining = credits_remaining + 2000
WHERE user_id = 'YOUR_USER_ID';
```

---

## 📱 Mobile Testing

Test juga di mobile devices:
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Responsive layout
- [ ] Touch interactions
- [ ] QR code scanning (GoPay)

---

## 🔐 Security Testing

Verify security measures:
- [ ] Webhook signature verification
- [ ] HTTPS only
- [ ] No API keys exposed in frontend
- [ ] Transaction idempotency
- [ ] Rate limiting

---

## 📈 Performance Testing

Monitor performance:
- [ ] Snap popup load time < 2s
- [ ] Webhook response time < 1s
- [ ] Database query performance
- [ ] Page load times

---

## ✅ Final Checklist

Before going to production:

- [ ] All 7 test scenarios passed
- [ ] Database updates correctly
- [ ] Webhook receives notifications
- [ ] All redirects work
- [ ] PDF invoices generate correctly
- [ ] Tax calculations correct
- [ ] Mobile responsive
- [ ] Error handling works
- [ ] Logs are clean
- [ ] Documentation updated

---

## 🚀 Next Steps

After all tests pass:

1. **Switch to Production**:
   - Update environment variables
   - Configure production URLs in Midtrans
   - Use production API keys

2. **Monitor**:
   - Set up error alerts
   - Monitor webhook logs
   - Track conversion rates
   - Monitor failed payments

3. **Optimize**:
   - A/B test checkout flow
   - Optimize payment success rate
   - Reduce cart abandonment

---

## 📞 Support

Jika ada masalah:
1. Check `TROUBLESHOOTING.md`
2. Check Midtrans docs: https://docs.midtrans.com
3. Check Supabase logs
4. Contact Midtrans support

---

**Last Updated**: February 20, 2025
**Version**: 1.0.0
**Status**: Ready for Testing


---

## 🔗 Quick Links - Payment Simulators

### Credit Card
- No simulator needed - use test cards directly in Snap popup

### E-Wallet & QRIS
- **QRIS Simulator**: https://simulator.sandbox.midtrans.com/qris/index
- **GoPay Simulator** (mobile): Auto-redirect
- **ShopeePay Simulator** (mobile): Auto-redirect

### Bank Transfer (Virtual Account)
- **BCA VA**: https://simulator.sandbox.midtrans.com/bca/va/index
- **BNI/BRI/Permata/CIMB/Mandiri**: https://simulator.sandbox.midtrans.com/openapi/va/index

### Over-the-Counter
- **Indomaret**: https://simulator.sandbox.midtrans.com/indomaret/index
- **Alfamart**: https://simulator.sandbox.midtrans.com/alfamart/index

### Dashboard
- **Sandbox Dashboard**: https://dashboard.sandbox.midtrans.com
- **Production Dashboard**: https://dashboard.midtrans.com

---

## 📝 Testing Workflow

### Quick Test (5 minutes)
1. Test 1: Credit Card Success ✅
2. Check database for transaction
3. Verify credits added
4. Done!

### Standard Test (15 minutes)
1. Test 1: Credit Card Success ✅
2. Test 2: Credit Card Denied ❌
3. Test 5: Bank Transfer (BCA VA) 🏦
4. Test 6: E-Wallet (GoPay) 📱
5. Verify all database updates
6. Check webhook logs
7. Done!

### Complete Test (30 minutes)
1. Run all 10 test scenarios
2. Verify each result in database
3. Check webhook logs for each
4. Test mobile responsiveness
5. Download and verify PDF invoice
6. Check all redirect URLs
7. Monitor edge function logs
8. Done!

---

## 🎯 Success Criteria

Payment integration dianggap berhasil jika:

- [x] URLs configured di Midtrans Dashboard
- [ ] Test 1 (Success) passed - Payment berhasil
- [ ] Test 2 (Denied) passed - Error handling works
- [ ] Test 5 (Bank Transfer) passed - VA payment works
- [ ] Test 6 (E-Wallet) passed - QRIS payment works
- [ ] Webhook receives all notifications
- [ ] Database updates correctly (transactions, subscriptions, credits)
- [ ] All redirects work (success, pending, error)
- [ ] PDF invoice generates correctly
- [ ] Tax calculations correct (11% PPN)
- [ ] Mobile responsive

---

## 🚨 Important Notes

### DO NOT:
- ❌ Use real credit cards in Sandbox
- ❌ Use real money in Sandbox
- ❌ Test production in Sandbox environment
- ❌ Commit API keys to git

### DO:
- ✅ Use test cards from this guide
- ✅ Use payment simulators
- ✅ Test all scenarios before production
- ✅ Monitor webhook logs
- ✅ Keep API keys secure

### Warning from Midtrans:
> "Do not attempt to pay with a real-world payment-provider/bank to a transaction created in the Sandbox environment. Midtrans will not be responsible and may not be able to help you recover any real-world payment funds if you do such an action."

---

## 📞 Support Resources

- **Midtrans Docs**: https://docs.midtrans.com
- **Testing Guide**: https://docs.midtrans.com/docs/testing-payment-on-sandbox
- **Simulator**: https://simulator.sandbox.midtrans.com
- **Dashboard**: https://dashboard.sandbox.midtrans.com
- **Support**: support@midtrans.com

---

**Ready to Test?** 🚀

1. Pastikan URLs sudah dikonfigurasi di Midtrans Dashboard
2. Buka https://chat-to-edit.vercel.app/
3. Login dan mulai Test 1
4. Follow the guide step by step
5. Report any issues

Good luck! 🎉
