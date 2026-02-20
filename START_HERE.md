# 🚀 START HERE - Fix & Test Payment System

## Current Status

✅ **Code Implementation:** Complete
❌ **Database Setup:** Not applied yet
❌ **Edge Functions:** Not deployed yet

## What You Need to Do

The console errors show that the database migrations and edge functions haven't been deployed yet. Follow these steps to fix:

---

## Step 1: Run Setup Script (5 minutes)

### Windows (PowerShell)
```powershell
cd chat-to-edit
.\deploy-setup.ps1
```

### Linux/Mac
```bash
cd chat-to-edit
chmod +x deploy-setup.sh
./deploy-setup.sh
```

This script will:
- ✅ Link to your Supabase project
- ✅ Apply database migrations
- ✅ Deploy edge functions
- ✅ Set environment variables

---

## Step 2: Verify Setup (2 minutes)

### Check Database Functions

Go to: https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/sql

Run this query:
```sql
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_user_usage',
  'get_user_subscription_tier',
  'track_usage',
  'check_usage_limit'
);
```

**Expected:** 4 rows returned

### Check Edge Functions

```bash
supabase functions list
```

**Expected:**
- midtrans-create-transaction
- midtrans-webhook
- chat-with-credits

---

## Step 3: Test Payment Flow (3 minutes)

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **Open browser:**
   ```
   http://localhost:8080/pricing
   ```

3. **Check console (F12):**
   - ✅ NO 404 errors for `get_user_usage`
   - ✅ NO 404 errors for `get_user_subscription_tier`
   - ✅ NO CORS errors

4. **Test checkout:**
   - Click "Upgrade to Pro"
   - Click "Pay Rp 99.000"
   - ✅ Midtrans popup opens
   - Enter test card: `4811 1111 1111 1114`
   - CVV: `123`, Exp: `12/25`
   - ✅ Payment succeeds
   - ✅ Redirects to subscription page
   - ✅ Shows "Pro" plan with 2,000 credits

---

## If Setup Script Fails

### Manual Setup

#### 1. Install Supabase CLI
```bash
npm install -g supabase
```

#### 2. Login
```bash
supabase login
```

#### 3. Link Project
```bash
supabase link --project-ref iatfkqwwmjohrvdfnmwm
```

#### 4. Apply Migrations
```bash
supabase db push
```

#### 5. Deploy Functions
```bash
supabase functions deploy midtrans-create-transaction
supabase functions deploy midtrans-webhook
supabase functions deploy chat-with-credits
```

#### 6. Set Secrets
```bash
supabase secrets set MIDTRANS_SERVER_KEY=your-midtrans-server-key
supabase secrets set MIDTRANS_IS_PRODUCTION=false
supabase secrets set DEEPSEEK_API_KEY=your-deepseek-api-key
```

---

## Troubleshooting

### Issue: "Supabase CLI not found"
```bash
npm install -g supabase
```

### Issue: "Not authenticated"
```bash
supabase login
```

### Issue: "Project not linked"
```bash
supabase link --project-ref iatfkqwwmjohrvdfnmwm
```

### Issue: Still getting 404 errors
See: `TROUBLESHOOTING.md`

### Issue: CORS errors persist
```bash
# Redeploy functions
supabase functions deploy midtrans-create-transaction
```

---

## Quick Reference

### Test Cards (Sandbox)
- **Success:** `4811 1111 1111 1114`
- **Failure:** `4911 1111 1111 1113`

### Pricing Tiers
- **Free:** 50 credits/month
- **Pro:** 2,000 credits/month (Rp 99,000)
- **Enterprise:** 10,000 credits/month (Rp 499,000)

### Credit Costs
- AI Chat: 1 credit
- Simple Operation: 1 credit
- Complex Operation: 2 credits
- Template Generation: 3 credits
- File Upload: 5 credits

---

## Documentation

### Quick Guides
- 📖 **This file** - Start here
- 🔧 `FIX_DATABASE_SETUP.md` - Database setup details
- 🐛 `TROUBLESHOOTING.md` - Common issues & solutions
- ⚡ `QUICK_START_PAYMENT.md` - 5-minute testing guide

### Complete Guides
- 📚 `PAYMENT_IMPLEMENTATION_GUIDE.md` - Full technical guide
- 🧪 `test-payment-flow.md` - Detailed testing procedures
- 📊 `PAYMENT_FLOW_DIAGRAM.md` - Visual flow diagrams
- ✅ `IMPLEMENTATION_COMPLETE_PAYMENT.md` - Implementation summary

### Business Docs
- 💰 `PRICING_COST_ANALYSIS.md` - Cost breakdown
- 📈 `FREE_TO_PAID_RATIO_ANALYSIS.md` - Business model
- 📊 `BUSINESS_METRICS_DASHBOARD.md` - Growth projections

---

## Success Criteria

After setup, you should be able to:

✅ Visit `/pricing` without console errors
✅ Click "Upgrade to Pro" and see checkout page
✅ Click "Pay" and see Midtrans popup
✅ Complete payment with test card
✅ See subscription activated with 2,000 credits
✅ Navigate to `/dashboard/subscription` and see Pro plan

---

## Next Steps After Testing

1. **Review Documentation**
   - Read `PAYMENT_IMPLEMENTATION_GUIDE.md`
   - Understand the complete flow

2. **Test All Scenarios**
   - Follow `test-payment-flow.md`
   - Test cancel/reactivate
   - Test credit tracking

3. **Prepare for Production**
   - Switch to production Midtrans credentials
   - Configure production webhook URL
   - Test with real payment (small amount)

---

## Need Help?

1. Check `TROUBLESHOOTING.md` first
2. Review console errors
3. Check Supabase logs:
   ```bash
   supabase functions logs midtrans-create-transaction
   ```
4. Verify database:
   ```sql
   SELECT * FROM transactions ORDER BY created_at DESC LIMIT 5;
   ```

---

**Ready?** Run the setup script now! 🚀

```bash
# Windows
.\deploy-setup.ps1

# Linux/Mac
./deploy-setup.sh
```
