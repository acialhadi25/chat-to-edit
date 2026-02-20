# Payment & Subscription Implementation Guide

## Overview

Complete implementation of Midtrans payment integration with credit-based subscription system for ChaTtoEdit.

## What's Been Implemented

### 1. Pages

#### `/pricing` - Pricing Page
- **Location**: `src/pages/Pricing.tsx`
- **Features**:
  - Three-tier pricing display (Free, Pro, Enterprise)
  - Credit allocation per tier
  - Feature comparison
  - Credit cost reference table
  - Current tier highlighting
  - Upgrade buttons with proper routing

#### `/checkout` - Checkout Page
- **Location**: `src/pages/Checkout.tsx`
- **Features**:
  - Order summary with tier details
  - Midtrans Snap popup integration
  - Payment status tracking
  - Secure payment badge
  - Auto-redirect after successful payment
  - Upgrade validation (prevents invalid upgrades)

#### `/dashboard/subscription` - Subscription Management
- **Location**: `src/pages/Subscription.tsx`
- **Features**:
  - Current plan display with status badges
  - Credit usage visualization with progress bar
  - Cancel/reactivate subscription
  - Billing period information
  - Upgrade options
  - Credit cost reference

### 2. Hooks

#### `useMidtransPayment`
- **Location**: `src/hooks/useMidtransPayment.ts`
- **Features**:
  - Automatic Midtrans script loading
  - Payment initiation with callbacks
  - Error handling
  - Loading states
  - Script ready detection

### 3. Backend Updates

#### Midtrans Transaction Creation
- **Location**: `supabase/functions/midtrans-create-transaction/index.ts`
- **Updates**:
  - Added `userId` and `tier` parameters
  - Automatic subscription tier ID lookup
  - Store user and tier info in transaction for webhook processing

#### Midtrans Webhook Handler
- **Location**: `supabase/functions/midtrans-webhook/index.ts`
- **Features** (already implemented):
  - Signature verification
  - Transaction status updates
  - Automatic subscription activation on successful payment
  - Webhook logging for audit trail

### 4. UI Updates

#### Dashboard Sidebar
- **Location**: `src/components/dashboard/DashboardSidebar.tsx`
- **Updates**:
  - Added "Subscription" menu item with CreditCard icon
  - Made "Upgrade to Pro" button functional (navigates to /pricing)

#### App Routing
- **Location**: `src/App.tsx`
- **Updates**:
  - Added `/pricing` route (public)
  - Added `/checkout` route (protected)
  - Added `/dashboard/subscription` route (protected)

## Pricing Structure

### Free Tier (Rp 0/month)
- 50 credits/month
- Basic features
- Max file size: 5MB

### Pro Tier (Rp 99,000/month)
- 2,000 credits/month
- Advanced features
- Max file size: 100MB
- Priority support

### Enterprise Tier (Rp 499,000/month)
- 10,000 credits/month
- All features
- Max file size: 500MB
- Team collaboration
- API access
- Dedicated support

## Credit Costs

| Action | Credits |
|--------|---------|
| AI Chat | 1 |
| Simple Operation | 1 |
| Complex Operation | 2 |
| Template Generation | 3 |
| File Upload | 5 |

## Payment Flow

### User Journey

1. **Browse Pricing**
   - User visits `/pricing`
   - Compares Free, Pro, and Enterprise tiers
   - Clicks "Upgrade to Pro" or "Upgrade to Enterprise"

2. **Checkout**
   - Redirected to `/checkout` with selected tier
   - Reviews order summary
   - Clicks "Pay Rp XX.XXX" button
   - Midtrans Snap popup opens

3. **Payment**
   - User selects payment method in Midtrans popup
   - Completes payment
   - Popup closes automatically

4. **Confirmation**
   - Success message displayed
   - Auto-redirect to `/dashboard/subscription` after 2 seconds
   - Webhook processes payment in background

5. **Subscription Activated**
   - User sees updated subscription status
   - Credit limit increased
   - Premium features unlocked

### Technical Flow

```
User clicks "Upgrade"
    ↓
Navigate to /checkout
    ↓
Click "Pay" button
    ↓
useMidtransPayment.initiatePayment()
    ↓
createMidtransTransaction() API call
    ↓
Edge Function: midtrans-create-transaction
    ↓
Lookup subscription_tier_id
    ↓
Call Midtrans API
    ↓
Store transaction in DB (with user_id, tier_id)
    ↓
Return Snap token
    ↓
Open Midtrans Snap popup
    ↓
User completes payment
    ↓
Midtrans sends webhook notification
    ↓
Edge Function: midtrans-webhook
    ↓
Verify signature
    ↓
Update transaction status
    ↓
If settlement: Create/update user_subscription
    ↓
User subscription activated
```

## Environment Variables Required

```env
# Midtrans Configuration
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_CLIENT_KEY=your-midtrans-client-key
MIDTRANS_MERCHANT_ID=your-merchant-id
MIDTRANS_IS_PRODUCTION=false

# Frontend (Vite)
VITE_MIDTRANS_CLIENT_KEY=Mid-client-Lpyk1mcchaNy5Wib
VITE_MIDTRANS_IS_PRODUCTION=false
```

## Database Schema

### Tables Used

1. **subscription_tiers**
   - Stores tier information (Free, Pro, Enterprise)
   - Credit limits and features

2. **user_subscriptions**
   - Links users to their subscription tier
   - Tracks status, billing periods, cancellation

3. **transactions**
   - Stores payment transactions
   - Links to user_id and subscription_tier_id
   - Tracks Midtrans order_id, snap_token, status

4. **usage_tracking**
   - Tracks credit usage per user per period
   - Monthly reset

## Testing Checklist

### Before Testing

- [ ] Environment variables configured in `.env`
- [ ] Supabase edge functions deployed
- [ ] Database migrations applied
- [ ] Midtrans sandbox credentials active

### Test Scenarios

#### 1. Pricing Page
- [ ] Visit `/pricing` as guest
- [ ] Visit `/pricing` as logged-in free user
- [ ] Visit `/pricing` as logged-in pro user
- [ ] Verify tier highlighting
- [ ] Click "Get Started" on Free tier → redirects to `/register`
- [ ] Click "Upgrade to Pro" → redirects to `/checkout`

#### 2. Checkout Flow
- [ ] Login as free user
- [ ] Navigate to `/pricing`
- [ ] Click "Upgrade to Pro"
- [ ] Verify order summary shows correct tier and price
- [ ] Click "Pay" button
- [ ] Midtrans popup opens
- [ ] Complete test payment (use Midtrans test cards)
- [ ] Verify success message
- [ ] Auto-redirect to subscription page

#### 3. Subscription Management
- [ ] Navigate to `/dashboard/subscription`
- [ ] Verify current plan displayed correctly
- [ ] Verify credit usage shows accurate data
- [ ] Click "Upgrade Plan" → redirects to `/pricing`
- [ ] Click "Cancel Subscription" → shows confirmation
- [ ] Confirm cancellation → status changes to "Cancelled"
- [ ] Click "Reactivate Subscription" → status changes back to "Active"

#### 4. Webhook Processing
- [ ] Complete a payment
- [ ] Check Supabase logs for webhook call
- [ ] Verify transaction status updated to "settlement"
- [ ] Verify user_subscription created/updated
- [ ] Verify credit limit increased
- [ ] Verify webhook_logs entry created

#### 5. Navigation
- [ ] Verify "Subscription" link in dashboard sidebar
- [ ] Verify "Upgrade to Pro" button in sidebar (when credits low)
- [ ] Click sidebar "Subscription" → navigates to subscription page
- [ ] Click "Upgrade to Pro" in sidebar → navigates to pricing page

### Midtrans Test Cards

**Credit Card (Success)**
- Card Number: `4811 1111 1111 1114`
- CVV: `123`
- Exp: Any future date

**Credit Card (Failure)**
- Card Number: `4911 1111 1111 1113`
- CVV: `123`
- Exp: Any future date

**Other Payment Methods**
- Use Midtrans sandbox test credentials
- See: https://docs.midtrans.com/docs/testing-payment

## Deployment Steps

### 1. Update Environment Variables

**Supabase Dashboard**:
```bash
# Go to Project Settings > Edge Functions > Environment Variables
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_IS_PRODUCTION=false
```

**Vercel/Hosting Platform**:
```bash
VITE_MIDTRANS_CLIENT_KEY=Mid-client-Lpyk1mcchaNy5Wib
VITE_MIDTRANS_IS_PRODUCTION=false
```

### 2. Deploy Edge Functions

```bash
# Deploy transaction creation function
supabase functions deploy midtrans-create-transaction

# Deploy webhook handler
supabase functions deploy midtrans-webhook
```

### 3. Configure Midtrans Webhook

1. Login to Midtrans Dashboard
2. Go to Settings > Configuration > Notification URL
3. Set webhook URL:
   ```
   https://[your-project].supabase.co/functions/v1/midtrans-webhook
   ```
4. Save configuration

### 4. Deploy Frontend

```bash
# Build and deploy frontend
npm run build
# Deploy to your hosting platform
```

### 5. Verify Deployment

- [ ] Visit production `/pricing` page
- [ ] Test complete payment flow
- [ ] Verify webhook receives notifications
- [ ] Check Supabase logs for errors

## Production Checklist

### Before Going Live

- [ ] Switch to Midtrans production credentials
- [ ] Update `MIDTRANS_IS_PRODUCTION=true`
- [ ] Update `VITE_MIDTRANS_IS_PRODUCTION=true`
- [ ] Configure production webhook URL in Midtrans
- [ ] Test with real payment (small amount)
- [ ] Verify subscription activation
- [ ] Set up monitoring/alerts for webhook failures
- [ ] Document customer support procedures
- [ ] Prepare refund process documentation

### Security Considerations

- [ ] Webhook signature verification enabled
- [ ] Server key never exposed to frontend
- [ ] HTTPS enforced on all endpoints
- [ ] Rate limiting on payment endpoints
- [ ] Audit logging enabled
- [ ] PCI compliance reviewed (if storing card data)

## Troubleshooting

### Payment Popup Not Opening

**Symptoms**: Click "Pay" button, nothing happens

**Solutions**:
1. Check browser console for errors
2. Verify `VITE_MIDTRANS_CLIENT_KEY` is set
3. Check if Midtrans script loaded (Network tab)
4. Verify `isReady` state in `useMidtransPayment`

### Webhook Not Received

**Symptoms**: Payment successful but subscription not activated

**Solutions**:
1. Check Midtrans dashboard for webhook delivery status
2. Verify webhook URL configured correctly
3. Check Supabase edge function logs
4. Verify signature verification not failing
5. Check if `MIDTRANS_SERVER_KEY` matches

### Subscription Not Activated

**Symptoms**: Payment successful, webhook received, but subscription still free

**Solutions**:
1. Check `transactions` table for correct `user_id` and `subscription_tier_id`
2. Verify webhook handler updates `user_subscriptions` table
3. Check Supabase logs for database errors
4. Verify subscription tier exists in `subscription_tiers` table

### Credit Limit Not Updated

**Symptoms**: Subscription activated but credit limit still shows free tier

**Solutions**:
1. Refresh the page (React Query cache)
2. Check `user_subscriptions` table for correct `subscription_tier_id`
3. Verify `get_user_usage()` function returns correct tier limits
4. Check if subscription status is "active"

## Support & Maintenance

### Monitoring

- Monitor webhook delivery success rate
- Track payment conversion rates
- Alert on failed transactions
- Monitor credit usage patterns

### Regular Tasks

- Review failed transactions weekly
- Process refund requests
- Update pricing as needed
- Monitor API costs vs revenue

## Next Steps

### Recommended Enhancements

1. **Email Notifications**
   - Payment confirmation
   - Subscription renewal reminder
   - Low credit warning
   - Cancellation confirmation

2. **Billing History**
   - Transaction list in subscription page
   - Download invoices
   - Payment receipts

3. **Team Features** (Enterprise)
   - Multi-user support
   - Role-based access
   - Shared credit pool

4. **Analytics Dashboard**
   - Revenue metrics
   - Conversion funnel
   - Churn analysis
   - Credit usage patterns

5. **Promotional Features**
   - Discount codes
   - Referral program
   - Free trial extension
   - Seasonal promotions

## Resources

- [Midtrans Documentation](https://docs.midtrans.com/)
- [Midtrans Snap Integration](https://docs.midtrans.com/docs/snap-integration-guide)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Credit System Documentation](./CREDIT_SYSTEM_README.md)
- [Pricing Analysis](./PRICING_COST_ANALYSIS.md)

## Contact

For questions or issues with this implementation, refer to:
- Credit system docs: `CREDIT_SYSTEM_README.md`
- Sandbox testing: `SANDBOX_TESTING_GUIDE.md`
- Cost analysis: `PRICING_COST_ANALYSIS.md`
