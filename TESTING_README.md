# Testing Midtrans Integration

Selamat datang di panduan testing untuk integrasi Midtrans di ChaTtoEdit! 🎉

## 📁 File Testing yang Tersedia

### 1. **test-midtrans.html** - Frontend Testing

File HTML standalone untuk testing Snap.js integration.

- ✅ Tidak perlu setup server
- ✅ Langsung buka di browser
- ✅ Real-time console logging
- ✅ Multiple test scenarios

**Cara Pakai:**

```bash
# Buka langsung di browser
open src/test-midtrans.html
# atau
start src/test-midtrans.html  # Windows
```

### 2. **test-midtrans-api.sh** - API Testing Script

Bash script untuk testing Edge Functions via cURL.

- ✅ Test create transaction
- ✅ Test webhook handler
- ✅ Test direct Midtrans API
- ✅ Automated testing

**Cara Pakai:**

```bash
# Edit dulu dengan credentials Anda
nano test-midtrans-api.sh

# Update:
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"

# Jalankan
chmod +x test-midtrans-api.sh
./test-midtrans-api.sh
```

### 3. **setup-midtrans-sandbox.sh** - Quick Setup

Script untuk setup environment secara otomatis.

- ✅ Setup .env file
- ✅ Set Supabase secrets
- ✅ Deploy Edge Functions
- ✅ Run migrations

**Cara Pakai:**

```bash
chmod +x setup-midtrans-sandbox.sh
./setup-midtrans-sandbox.sh
```

### 4. **midtrans-api-collection.json** - Postman Collection

Import ke Postman/Insomnia untuk testing API.

- ✅ Pre-configured requests
- ✅ Environment variables
- ✅ Multiple scenarios

**Cara Pakai:**

```
1. Buka Postman
2. Import > Upload Files
3. Pilih midtrans-api-collection.json
4. Update environment variables
5. Run requests
```

## 📚 Dokumentasi

### Lengkap

- **MIDTRANS_INTEGRATION.md** - Dokumentasi lengkap integrasi
- **MIDTRANS_TESTING_GUIDE.md** - Panduan testing detail

### Quick Reference

- **MIDTRANS_QUICK_REFERENCE.md** - Cheat sheet untuk development

## 🚀 Quick Start (3 Langkah)

### Langkah 1: Setup Environment

```bash
./setup-midtrans-sandbox.sh
```

### Langkah 2: Test Frontend

```bash
open src/test-midtrans.html
```

### Langkah 3: Test API

```bash
./test-midtrans-api.sh
```

## 💳 Test Cards (Hafalkan Ini!)

```
✅ Success: 4811 1111 1111 1114
❌ Denied:  4911 1111 1111 1113
⏳ 3DS:     4611 1111 1111 1112 (OTP: 112233)
```

Semua card: CVV 123, Expiry: 01/25

## 🎯 Testing Flow

```
1. Setup
   └─> ./setup-midtrans-sandbox.sh

2. Test Frontend
   └─> open test-midtrans.html
   └─> Klik "Test Basic Payment"
   └─> Gunakan success card
   └─> Verify payment berhasil

3. Test Backend
   └─> ./test-midtrans-api.sh
   └─> Check response
   └─> Verify database updated

4. Test Webhook
   └─> Simulate dari Midtrans Dashboard
   └─> Check webhook_logs table
   └─> Verify subscription activated

5. Test di Aplikasi
   └─> npm run dev
   └─> Navigate ke /billing
   └─> Select subscription tier
   └─> Complete payment
```

## 🔍 Troubleshooting

### Problem: Snap popup tidak muncul

**Solution:**

```javascript
// Check di browser console
console.log(window.snap);
console.log(import.meta.env.VITE_MIDTRANS_CLIENT_KEY);
```

### Problem: Transaction tidak tersimpan

**Solution:**

```bash
# Check Edge Function logs
supabase functions logs midtrans-create-transaction

# Check database
psql -c "SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;"
```

### Problem: Webhook tidak diterima

**Solution:**

1. Verify webhook URL di Midtrans Dashboard
2. Check Edge Function deployed: `supabase functions list`
3. Test manual dari Dashboard: Transactions > Send Notification

## 📊 Monitoring

### Check Logs

```bash
# Edge Function logs
supabase functions logs midtrans-create-transaction --tail
supabase functions logs midtrans-webhook --tail

# Database logs
supabase db logs
```

### Check Database

```sql
-- Recent transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;

-- Active subscriptions
SELECT * FROM user_subscriptions WHERE status = 'active';

-- Webhook logs
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;

-- Usage tracking
SELECT * FROM usage_tracking WHERE user_id = 'YOUR-USER-ID';
```

## 🎓 Learning Path

### Beginner

1. Baca MIDTRANS_QUICK_REFERENCE.md
2. Run setup-midtrans-sandbox.sh
3. Test dengan test-midtrans.html
4. Coba semua test cards

### Intermediate

1. Baca MIDTRANS_TESTING_GUIDE.md
2. Test dengan test-midtrans-api.sh
3. Import Postman collection
4. Test semua scenarios

### Advanced

1. Baca MIDTRANS_INTEGRATION.md
2. Customize Edge Functions
3. Add custom validation
4. Implement recurring subscriptions
5. Setup production environment

## 🆘 Need Help?

### Resources

- 📖 [Midtrans Docs](https://docs.midtrans.com/)
- 🎮 [Sandbox Dashboard](https://dashboard.sandbox.midtrans.com/)
- 💬 [Midtrans Support](https://midtrans.com/contact-us)

### Common Questions

**Q: Apakah test cards bisa dipakai di production?**
A: Tidak! Test cards hanya untuk sandbox. Di production gunakan real cards.

**Q: Berapa lama webhook dikirim?**
A: Biasanya instant, tapi bisa sampai 5 menit untuk bank transfer.

**Q: Apakah bisa test tanpa Supabase?**
A: Bisa! Gunakan test-midtrans.html untuk test frontend saja.

**Q: Bagaimana cara test recurring subscription?**
A: Lihat MIDTRANS_INTEGRATION.md section "Recurring Subscriptions".

## ✅ Testing Checklist

Sebelum deploy ke production:

- [ ] Semua test cards berhasil
- [ ] Webhook diterima dan diproses
- [ ] Database updated correctly
- [ ] Subscription activated
- [ ] Usage tracking works
- [ ] Error handling works
- [ ] Payment callback works
- [ ] All Edge Functions deployed
- [ ] All secrets configured
- [ ] Documentation updated

## 🎉 Ready for Production?

Setelah semua test passed:

1. Get production credentials dari Midtrans
2. Update environment variables
3. Deploy Edge Functions ke production
4. Configure production webhook URL
5. Test dengan small amount
6. Monitor closely
7. Setup error tracking (Sentry)

---

**Happy Testing!** 🚀

Jika ada pertanyaan, buka issue di GitHub atau hubungi tim development.

**Last Updated:** 2024-02-18
