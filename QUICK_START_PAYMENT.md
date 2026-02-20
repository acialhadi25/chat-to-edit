# Quick Start - Payment System Testing

## 🚀 Start Testing in 5 Minutes

### Step 1: Verify Environment (30 seconds)

Check `.env` file has these variables:
```bash
VITE_MIDTRANS_CLIENT_KEY=Mid-client-Lpyk1mcchaNy5Wib
VITE_MIDTRANS_IS_PRODUCTION=false
```

### Step 2: Start Dev Server (30 seconds)

```bash
npm run dev
```

Wait for: `Local: http://localhost:5173/`

### Step 3: Login (1 minute)

1. Go to `http://localhost:5173/login`
2. Login with your test account
3. Or register a new account

### Step 4: Test Pricing Page (1 minute)

1. Navigate to `http://localhost:5173/pricing`
2. ✅ See 3 pricing tiers
3. ✅ Pro tier has "Most Popular" badge
4. ✅ Free tier shows "Current Plan"
5. Click "Upgrade to Pro"

### Step 5: Test Checkout (2 minutes)

1. ✅ Redirected to `/checkout`
2. ✅ Order summary shows Pro plan
3. ✅ Total shows Rp 99.000
4. Click "Pay Rp 99.000"
5. ✅ Midtrans popup opens

### Step 6: Complete Payment (1 minute)

In Midtrans popup:
1. Select "Credit Card"
2. Enter: `4811 1111 1111 1114`
3. CVV: `123`
4. Exp: `12/25`
5. Click "Pay"
6. ✅ Success message
7. ✅ Auto-redirect to subscription page

### Step 7: Verify Subscription (30 seconds)

On subscription page:
1. ✅ Current Plan shows "Pro"
2. ✅ Status badge shows "Active"
3. ✅ Credit limit shows 2,000 credits

## ✅ Success Criteria

If all checkmarks (✅) are green, implementation is working!

## 🐛 Quick Troubleshooting

### Popup doesn't open?
```bash
# Check console (F12)
# Look for: "Midtrans Snap not loaded"
# Solution: Restart dev server
```

### Payment successful but subscription not activated?
```sql
-- Check Supabase Dashboard > SQL Editor
SELECT * FROM transactions 
WHERE customer_email = 'your-email@example.com'
ORDER BY created_at DESC LIMIT 1;

-- Should show: status = 'settlement'
```

### Credit limit not updated?
```bash
# Solution: Refresh page (Ctrl+R)
# React Query cache needs refresh
```

## 📚 Full Documentation

- **Complete Guide**: `PAYMENT_IMPLEMENTATION_GUIDE.md`
- **Testing Guide**: `test-payment-flow.md`
- **Flow Diagram**: `PAYMENT_FLOW_DIAGRAM.md`
- **Implementation Summary**: `IMPLEMENTATION_COMPLETE_PAYMENT.md`

## 🎯 Next Steps

After successful testing:
1. Review `PAYMENT_IMPLEMENTATION_GUIDE.md` for production deployment
2. Configure production Midtrans credentials
3. Deploy edge functions
4. Set up webhook URL in Midtrans dashboard

## 💡 Test Cards

**Success**: `4811 1111 1111 1114`
**Failure**: `4911 1111 1111 1113`

## 🆘 Need Help?

Check these files in order:
1. `QUICK_START_PAYMENT.md` (this file)
2. `test-payment-flow.md`
3. `PAYMENT_IMPLEMENTATION_GUIDE.md`
4. `PAYMENT_FLOW_DIAGRAM.md`

---

**Ready?** Start with Step 1! 🚀
