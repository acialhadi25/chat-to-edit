# Midtrans Payment Integration Guide

This document provides a comprehensive guide to the Midtrans payment integration in ChaTtoEdit.

## Overview

ChaTtoEdit uses Midtrans as the payment gateway for subscription management. The integration supports:

- One-time payments for subscription upgrades
- Recurring subscriptions (monthly/yearly)
- Multiple payment methods (credit card, bank transfer, e-wallet, etc.)
- Webhook notifications for payment status updates
- Usage tracking and limits enforcement

## Architecture

### Components

1. **Frontend Components**
   - `src/lib/midtrans.ts` - Midtrans client library
   - `src/hooks/useMidtrans.ts` - React hook for payment integration
   - `src/components/payment/MidtransCheckout.tsx` - Checkout component
   - `src/pages/Billing.tsx` - Billing dashboard
   - `src/pages/PaymentCallback.tsx` - Payment callback handler

2. **Backend (Supabase Edge Functions)**
   - `midtrans-create-transaction` - Creates payment transactions
   - `midtrans-webhook` - Handles payment notifications
   - `midtrans-subscription` - Manages recurring subscriptions
   - `subscription-renewal` - Handles subscription renewals

3. **Database Tables**
   - `subscription_tiers` - Available subscription plans
   - `user_subscriptions` - User subscription records
   - `transactions` - Payment transactions
   - `usage_tracking` - Resource usage tracking
   - `webhook_logs` - Audit trail for webhooks

## Setup Instructions

### 1. Midtrans Account Setup

1. Sign up at [Midtrans Dashboard](https://dashboard.midtrans.com/)
2. Get your credentials:
   - **Client Key**: For frontend integration
   - **Server Key**: For backend API calls
3. Configure notification URL in Midtrans Dashboard:
   - Sandbox: `https://your-project.supabase.co/functions/v1/midtrans-webhook`
   - Production: `https://your-project.supabase.co/functions/v1/midtrans-webhook`

### 2. Environment Variables

#### Frontend (.env)

```env
VITE_MIDTRANS_CLIENT_KEY=your-midtrans-client-key
VITE_MIDTRANS_IS_PRODUCTION=false
```

#### Supabase Edge Functions

Set these in Supabase Dashboard > Edge Functions > Secrets:

```
MIDTRANS_SERVER_KEY=your-midtrans-server-key
MIDTRANS_IS_PRODUCTION=false
```

### 3. Database Migration

Run the subscription tables migration:

```bash
supabase migration up
```

This creates:

- Subscription tier tables
- User subscription tables
- Transaction tables
- Usage tracking tables
- Webhook logs

### 4. Deploy Edge Functions

```bash
# Deploy all payment-related functions
supabase functions deploy midtrans-create-transaction
supabase functions deploy midtrans-webhook
supabase functions deploy midtrans-subscription
supabase functions deploy subscription-renewal
```

## Usage

### Basic Payment Flow

```typescript
import { useMidtrans } from "@/hooks/useMidtrans";

function CheckoutButton() {
  const { pay, isLoading } = useMidtrans({
    onSuccess: (result) => {
      console.log("Payment successful:", result);
    },
    onError: (result) => {
      console.error("Payment failed:", result);
    },
  });

  const handleCheckout = async () => {
    await pay({
      orderId: "ORDER-123",
      amount: 99000,
      customerDetails: {
        firstName: "John",
        email: "john@example.com",
      },
      itemDetails: [
        {
          id: "ITEM-1",
          price: 99000,
          quantity: 1,
          name: "Pro Subscription - Monthly",
        },
      ],
    });
  };

  return (
    <button onClick={handleCheckout} disabled={isLoading}>
      Pay Now
    </button>
  );
}
```

### Subscription Management

```typescript
import { useUserSubscriptionInfo, useCancelSubscription } from "@/hooks/useSubscription";

function SubscriptionManager() {
  const { data: subscription } = useUserSubscriptionInfo();
  const cancelMutation = useCancelSubscription();

  const handleCancel = async () => {
    await cancelMutation.mutateAsync();
  };

  return (
    <div>
      <h2>Current Plan: {subscription?.tier_display_name}</h2>
      <button onClick={handleCancel}>Cancel Subscription</button>
    </div>
  );
}
```

### Usage Tracking

```typescript
import { useSubscriptionGuard } from "@/hooks/useSubscriptionGuard";

function ExcelOperation() {
  const { canPerformAction } = useSubscriptionGuard();

  const handleOperation = async () => {
    // Check if user can perform operation
    const allowed = await canPerformAction("excel_operation");

    if (!allowed) {
      // Show upgrade prompt
      return;
    }

    // Perform operation
    // Usage is automatically tracked after successful completion
  };

  return <button onClick={handleOperation}>Run Operation</button>;
}
```

## Subscription Tiers

### Free Tier

- **Price**: IDR 0 / month
- **Limits**:
  - 50 Excel operations/month
  - 10 file uploads/month
  - 20 AI messages/month
  - Max file size: 10 MB

### Pro Tier

- **Price**: IDR 99,000 / month (~$7 USD)
- **Limits**:
  - 1,000 Excel operations/month
  - 100 file uploads/month
  - 500 AI messages/month
  - Max file size: 100 MB
- **Features**:
  - Advanced Excel operations
  - Priority support
  - Custom templates

### Enterprise Tier

- **Price**: IDR 499,000 / month (~$35 USD)
- **Limits**:
  - Unlimited operations
  - Unlimited uploads
  - Unlimited AI messages
  - Max file size: 500 MB
- **Features**:
  - All Pro features
  - Team collaboration
  - API access
  - Dedicated support

## Webhook Handling

The webhook handler (`midtrans-webhook`) processes payment notifications:

1. **Signature Verification**: Validates notification authenticity
2. **Status Mapping**: Maps Midtrans status to internal status
3. **Database Update**: Updates transaction and subscription records
4. **Audit Logging**: Logs all webhook events
5. **Subscription Activation**: Activates subscription on successful payment

### Webhook Events

| Midtrans Status          | Action                      |
| ------------------------ | --------------------------- |
| `capture` / `settlement` | Activate subscription       |
| `pending`                | Wait for payment completion |
| `deny`                   | Mark as denied              |
| `expire`                 | Mark as expired             |
| `cancel`                 | Mark as cancelled           |

## Recurring Subscriptions

### Setup

1. User selects subscription plan (monthly/yearly)
2. System creates recurring subscription via `midtrans-subscription` function
3. Midtrans handles automatic billing

### Renewal Process

The `subscription-renewal` function (triggered by cron):

1. Checks for expiring subscriptions (3 days before expiry)
2. Attempts to charge saved payment method
3. On success: Extends subscription period
4. On failure: Marks subscription as `past_due`
5. Logs all renewal attempts

### Cron Setup

Configure in Supabase Dashboard > Database > Cron Jobs:

```sql
SELECT cron.schedule(
  'subscription-renewal',
  '0 2 * * *', -- Run daily at 2 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/subscription-renewal',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

## Testing

### Sandbox Testing

1. Use Midtrans sandbox credentials
2. Test cards: https://docs.midtrans.com/en/technical-reference/sandbox-test
3. Example test card:
   - Card Number: `4811 1111 1111 1114`
   - CVV: `123`
   - Expiry: Any future date

### Test Scenarios

1. **Successful Payment**
   - Complete payment flow
   - Verify subscription activation
   - Check usage limits updated

2. **Failed Payment**
   - Test with declined card
   - Verify error handling
   - Check subscription remains inactive

3. **Webhook Handling**
   - Use Midtrans Dashboard "Test Notification"
   - Verify database updates
   - Check audit logs

## Security Considerations

1. **Signature Verification**: All webhooks are verified using SHA512 signature
2. **Environment Variables**: Sensitive keys stored in Supabase secrets
3. **RLS Policies**: Database access controlled by Row Level Security
4. **HTTPS Only**: All API calls use HTTPS
5. **PII Protection**: No sensitive data in logs

## Troubleshooting

### Payment Not Processing

1. Check Midtrans credentials are correct
2. Verify webhook URL is configured in Midtrans Dashboard
3. Check Edge Function logs in Supabase Dashboard
4. Verify database RLS policies allow access

### Subscription Not Activating

1. Check webhook logs in `webhook_logs` table
2. Verify signature validation passed
3. Check transaction status in `transactions` table
4. Review Edge Function logs for errors

### Usage Limits Not Enforcing

1. Verify `check_usage_limit` function is being called
2. Check `usage_tracking` table for correct counts
3. Verify subscription tier limits are set correctly
4. Review `track_usage` function calls

## Support

For issues with:

- **Midtrans Integration**: Contact Midtrans support
- **ChaTtoEdit Implementation**: Open GitHub issue
- **Database/Supabase**: Check Supabase documentation

## References

- [Midtrans Documentation](https://docs.midtrans.com/)
- [Midtrans Snap Integration](https://docs.midtrans.com/en/snap/overview)
- [Midtrans Webhook](https://docs.midtrans.com/en/after-payment/http-notification)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
