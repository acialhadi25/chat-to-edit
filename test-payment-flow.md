# Payment Flow Testing Guide

## Quick Test Checklist

### Prerequisites
- [ ] Logged in as a user with free tier
- [ ] Browser console open (F12)
- [ ] Network tab monitoring enabled

### Test 1: Pricing Page Access

1. Navigate to `http://localhost:5173/pricing`
2. **Expected**:
   - See 3 pricing cards (Free, Pro, Enterprise)
   - Pro card has "Most Popular" badge
   - Free tier shows "Current Plan" (if logged in as free user)
   - Credit costs table at bottom

### Test 2: Checkout Navigation

1. From pricing page, click "Upgrade to Pro"
2. **Expected**:
   - Redirected to `/checkout`
   - URL has state with tier info
   - Order summary shows Pro plan details
   - Total shows Rp 99.000

### Test 3: Payment Initiation

1. On checkout page, click "Pay Rp 99.000" button
2. **Expected**:
   - Button shows "Processing..." with spinner
   - Midtrans Snap popup opens
   - Popup shows payment options

**If popup doesn't open**:
- Check console for errors
- Verify `VITE_MIDTRANS_CLIENT_KEY` in `.env`
- Check Network tab for Midtrans script load

### Test 4: Complete Payment (Sandbox)

1. In Midtrans popup, select "Credit Card"
2. Enter test card:
   - Card: `4811 1111 1111 1114`
   - CVV: `123`
   - Exp: `12/25`
3. Click "Pay"
4. **Expected**:
   - Payment processes
   - Success message appears
   - Popup closes
   - Checkout page shows "Payment Complete"
   - Auto-redirect to `/dashboard/subscription` after 2 seconds

### Test 5: Verify Subscription Activation

1. On subscription page, check:
   - [ ] Current Plan shows "Pro"
   - [ ] Status badge shows "Active"
   - [ ] Credit limit shows 2,000 credits
   - [ ] Next billing date displayed

2. Check database (Supabase Dashboard):
   ```sql
   -- Check transaction
   SELECT * FROM transactions 
   WHERE customer_email = 'your-email@example.com'
   ORDER BY created_at DESC LIMIT 1;
   
   -- Check subscription
   SELECT * FROM user_subscriptions 
   WHERE user_id = 'your-user-id';
   
   -- Check credit usage
   SELECT * FROM usage_tracking 
   WHERE user_id = 'your-user-id'
   ORDER BY created_at DESC LIMIT 1;
   ```

### Test 6: Subscription Management

1. Navigate to `/dashboard/subscription`
2. Click "Cancel Subscription"
3. **Expected**:
   - Confirmation dialog appears
   - Warning message displayed

4. Click "Confirm Cancel"
5. **Expected**:
   - Status changes to "Cancelled"
   - End date shown
   - "Reactivate Subscription" button appears

6. Click "Reactivate Subscription"
7. **Expected**:
   - Status changes back to "Active"
   - Cancel button reappears

### Test 7: Navigation Integration

1. Go to `/dashboard`
2. Check sidebar:
   - [ ] "Subscription" menu item visible
   - [ ] Click "Subscription" → navigates to subscription page

3. If credits < 10:
   - [ ] "Upgrade to Pro" button visible in usage card
   - [ ] Click button → navigates to pricing page

### Test 8: Webhook Verification

1. Complete a payment
2. Check Supabase logs:
   ```bash
   # In terminal
   supabase functions logs midtrans-webhook
   ```

3. **Expected log entries**:
   - "Received Midtrans notification"
   - "Successfully processed webhook"
   - No error messages

4. Check webhook_logs table:
   ```sql
   SELECT * FROM webhook_logs 
   ORDER BY created_at DESC LIMIT 5;
   ```

## Common Issues & Solutions

### Issue: Midtrans popup not opening

**Check**:
```javascript
// In browser console
console.log(import.meta.env.VITE_MIDTRANS_CLIENT_KEY)
console.log(window.snap)
```

**Solution**:
- Verify `.env` has `VITE_MIDTRANS_CLIENT_KEY`
- Restart dev server after adding env vars
- Check Network tab for script load errors

### Issue: Payment successful but subscription not activated

**Check**:
1. Supabase edge function logs
2. Transaction table has `user_id` and `subscription_tier_id`
3. Webhook URL configured in Midtrans dashboard

**Solution**:
```sql
-- Manually activate subscription (temporary fix)
INSERT INTO user_subscriptions (
  user_id, 
  subscription_tier_id, 
  status, 
  current_period_start, 
  current_period_end
)
SELECT 
  'your-user-id',
  id,
  'active',
  NOW(),
  NOW() + INTERVAL '30 days'
FROM subscription_tiers 
WHERE name = 'pro';
```

### Issue: Credit limit not updating

**Check**:
```sql
-- Verify subscription tier
SELECT 
  us.status,
  st.name,
  st.limits
FROM user_subscriptions us
JOIN subscription_tiers st ON st.id = us.subscription_tier_id
WHERE us.user_id = 'your-user-id';
```

**Solution**:
- Refresh page (React Query cache)
- Check subscription status is 'active'
- Verify tier limits in subscription_tiers table

## Test Data

### Midtrans Test Cards

**Success**:
- `4811 1111 1111 1114` (Visa)
- `5211 1111 1111 1117` (Mastercard)

**Failure**:
- `4911 1111 1111 1113` (Declined)

**3DS Authentication**:
- `4811 1111 1111 1114` (requires OTP)
- OTP: `112233`

### Test User Accounts

Create test users for each tier:
```
free-user@test.com
pro-user@test.com
enterprise-user@test.com
```

## Performance Checks

### Page Load Times
- [ ] Pricing page loads < 2s
- [ ] Checkout page loads < 2s
- [ ] Subscription page loads < 2s

### API Response Times
- [ ] Create transaction < 3s
- [ ] Webhook processing < 1s
- [ ] Subscription query < 500ms

## Accessibility Checks

- [ ] All buttons have proper labels
- [ ] Forms are keyboard navigable
- [ ] Error messages are announced
- [ ] Loading states are indicated
- [ ] Color contrast meets WCAG AA

## Browser Compatibility

Test in:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

## Security Checks

- [ ] Server key not exposed in frontend
- [ ] Webhook signature verified
- [ ] CORS headers properly configured
- [ ] User authentication required for checkout
- [ ] Transaction tied to authenticated user

## Ready for Production?

Before switching to production:
- [ ] All tests pass
- [ ] No console errors
- [ ] Webhook receives notifications reliably
- [ ] Subscription activation works consistently
- [ ] Credit limits update correctly
- [ ] Cancel/reactivate works
- [ ] Navigation flows smoothly
- [ ] Mobile responsive
- [ ] Accessible
- [ ] Performance acceptable

## Next: Switch to Production

See `PAYMENT_IMPLEMENTATION_GUIDE.md` section "Production Checklist"
