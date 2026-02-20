# Quick Start: Midtrans Configuration

## 🎯 What You Need to Do (3 Simple Steps)

### Step 1: Deploy Your App (5 minutes)

```bash
# Build production
npm run build

# Deploy to Vercel
vercel --prod
```

You'll get a URL like: `https://chat-to-edit.vercel.app`

---

### Step 2: Configure Midtrans Dashboard (5 minutes)

#### For Testing (Sandbox)
1. Go to: https://dashboard.sandbox.midtrans.com
2. Login with your Midtrans account
3. Click **Settings** > **Configuration**
4. Fill in these URLs:

```
Payment Notification URL:
https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook

Finish Redirect URL:
https://chat-to-edit.vercel.app/payment/success

Unfinish Redirect URL:
https://chat-to-edit.vercel.app/payment/pending

Error Redirect URL:
https://chat-to-edit.vercel.app/payment/error
```

5. Click **Save**

#### For Production (Live)
1. Go to: https://dashboard.midtrans.com
2. Repeat the same steps with your production domain

---

### Step 3: Test Payment (5 minutes)

1. Open your app: `https://chat-to-edit.vercel.app`
2. Login to your account
3. Go to **Pricing** page
4. Click **Upgrade to Pro**
5. Click **Pay Rp 109.890**
6. Use test card:
   - Card: `4811 1111 1111 1114`
   - CVV: `123`
   - Exp: `01/25`
   - OTP: `112233`
7. Complete payment
8. You should be redirected to success page ✅

---

## 🎨 Visual Flow

```
User clicks "Upgrade to Pro"
         ↓
Checkout Page (Rp 109.890)
         ↓
Click "Pay Now"
         ↓
Midtrans Snap Popup
         ↓
Enter payment details
         ↓
Payment processed
         ↓
    ┌────┴────┐
    ↓         ↓
SUCCESS    ERROR
    ↓         ↓
/payment/  /payment/
success    error
```

---

## 📱 What Each URL Does

### 1. Payment Notification URL (Webhook)
**URL**: `https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook`

**What it does**:
- Midtrans sends payment status here
- Updates your database
- Creates subscription
- Adds credits to user

**When it's called**:
- Payment success ✅
- Payment pending ⏳
- Payment failed ❌

---

### 2. Finish Redirect URL
**URL**: `https://your-domain.com/payment/success`

**What it does**:
- Shows success message
- Displays order details
- Links to dashboard

**When it's called**:
- After successful payment ✅

---

### 3. Unfinish Redirect URL
**URL**: `https://your-domain.com/payment/pending`

**What it does**:
- Shows pending status
- Payment instructions
- Check status button

**When it's called**:
- User clicks "Back to Merchant" before completing payment
- Payment is pending (bank transfer, etc.)

---

### 4. Error Redirect URL
**URL**: `https://your-domain.com/payment/error`

**What it does**:
- Shows error message
- Troubleshooting tips
- Try again button

**When it's called**:
- Payment failed ❌
- Card declined
- Insufficient balance

---

## 🧪 Test Cards (Sandbox Only)

| Card Number | CVV | Exp | OTP | Result |
|-------------|-----|-----|-----|--------|
| 4811 1111 1111 1114 | 123 | 01/2025 | 112233 | ✅ Success |
| 4911 1111 1111 1113 | 123 | 01/2025 | 112233 | ❌ Denied by Bank |
| 4611 1111 1111 1116 | 123 | 01/2025 | - | ⚠️ Denied by FDS |
| 4411 1111 1111 1118 | 123 | 01/2025 | No OTP | ✅ Success (No 3DS) |

**More test cards**: See `MIDTRANS_TEST_CARDS_REFERENCE.md`

---

## ✅ Verification Checklist

After testing, verify:

- [ ] Payment creates transaction in database
- [ ] Webhook is called (check logs)
- [ ] Subscription is created
- [ ] Credits are added
- [ ] User redirected to success page
- [ ] Invoice can be downloaded
- [ ] Tax shows correctly (Rp 99.000 + Rp 10.890 = Rp 109.890)

---

## 🔍 How to Check Logs

### Webhook Logs
```bash
npx supabase functions logs midtrans-webhook --tail
```

### Database Logs
```sql
-- Check webhook logs
SELECT * FROM webhook_logs ORDER BY created_at DESC LIMIT 10;

-- Check transactions
SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;

-- Check subscriptions
SELECT * FROM user_subscriptions ORDER BY created_at DESC LIMIT 10;
```

---

## 🆘 Common Issues

### Issue: Webhook not called
**Solution**:
1. Check URL in Midtrans dashboard (no typo?)
2. Verify edge function deployed: `npx supabase functions list`
3. Check logs: `npx supabase functions logs midtrans-webhook`

### Issue: Redirect not working
**Solution**:
1. Verify URLs in Midtrans dashboard
2. Check your domain is correct
3. Test with browser developer tools

### Issue: Payment stuck in pending
**Solution**:
1. Check webhook logs in database
2. Check Midtrans dashboard for transaction status
3. Wait 1-5 minutes for confirmation

---

## 💡 Pro Tips

1. **Test in Sandbox first** - Always test before production
2. **Use HTTPS** - Midtrans requires HTTPS for webhook
3. **Monitor logs** - Check webhook logs regularly
4. **Keep keys secure** - Never commit API keys to git
5. **Test all scenarios** - Success, pending, and error flows

---

## 📞 Need Help?

1. **Start Testing**: See `START_TESTING_NOW.md` - Quick 5-minute guide
2. **Complete Testing Guide**: See `MIDTRANS_TESTING_GUIDE.md` - All test scenarios
3. **Test Cards**: See `MIDTRANS_TEST_CARDS_REFERENCE.md` - All test cards
4. **Testing Script**: Run `.\test-midtrans-payment.ps1` - Interactive menu
5. **Integration Details**: See `MIDTRANS_INTEGRATION_COMPLETE.md`
6. **Troubleshooting**: See `TROUBLESHOOTING.md`
7. **Midtrans Docs**: https://docs.midtrans.com
8. **Supabase Logs**: `npx supabase functions logs midtrans-webhook --tail`

---

## 🎉 That's It!

You're ready to accept payments! 

**Total time**: ~15 minutes
**Difficulty**: Easy
**Status**: ✅ Configuration Complete - Ready for Testing

---

## 🚀 Next Step: START TESTING!

**Quick Start**: See `START_TESTING_NOW.md` for 5-minute testing guide

Or run the interactive testing script:
```powershell
.\test-midtrans-payment.ps1
```

---

## 📚 Complete Documentation

1. **START_TESTING_NOW.md** - Quick 5-minute testing guide ⭐
2. **MIDTRANS_TESTING_GUIDE.md** - Complete testing scenarios (10 tests)
3. **MIDTRANS_TEST_CARDS_REFERENCE.md** - All test cards reference
4. **test-midtrans-payment.ps1** - Interactive testing script
5. **MIDTRANS_INTEGRATION_COMPLETE.md** - Technical integration details
6. **MIDTRANS_URL_CONFIGURATION.md** - URL configuration guide
7. **TROUBLESHOOTING.md** - Common issues and solutions

---

**Last Updated**: February 20, 2025
**Version**: 1.1.0
**Status**: Ready for Testing 🚀
