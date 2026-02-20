# Payment Flow Diagram

## Visual Flow Chart

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER JOURNEY                             │
└─────────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Landing    │
│     Page     │
└──────┬───────┘
       │
       ├─────────────────┐
       │                 │
       v                 v
┌──────────────┐   ┌──────────────┐
│   /pricing   │   │  Dashboard   │
│              │   │   Sidebar    │
│ • Free       │   │ "Upgrade"    │
│ • Pro        │   │   Button     │
│ • Enterprise │   └──────┬───────┘
└──────┬───────┘          │
       │                  │
       └────────┬─────────┘
                │
                v
         ┌──────────────┐
         │  /checkout   │
         │              │
         │ Order Summary│
         │ Pay Button   │
         └──────┬───────┘
                │
                v
         ┌──────────────┐
         │   Midtrans   │
         │  Snap Popup  │
         │              │
         │ • Credit Card│
         │ • Bank Trans │
         │ • E-Wallet   │
         └──────┬───────┘
                │
                v
         ┌──────────────┐
         │   Payment    │
         │  Processing  │
         └──────┬───────┘
                │
                v
         ┌──────────────┐
         │   Success    │
         │   Message    │
         └──────┬───────┘
                │
                v
    ┌───────────────────────┐
    │  /dashboard/          │
    │   subscription        │
    │                       │
    │ • Active Status       │
    │ • Credit Usage        │
    │ • Billing Info        │
    │ • Cancel/Reactivate   │
    └───────────────────────┘
```

## Technical Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      TECHNICAL FLOW                              │
└─────────────────────────────────────────────────────────────────┘

Frontend                  Edge Function              Midtrans API
────────                  ─────────────              ────────────

┌──────────────┐
│ User clicks  │
│ "Pay" button │
└──────┬───────┘
       │
       v
┌──────────────────────┐
│ useMidtransPayment   │
│ .initiatePayment()   │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│ createMidtrans       │
│ Transaction()        │
│                      │
│ POST /functions/v1/  │
│ midtrans-create-     │
│ transaction          │
└──────┬───────────────┘
       │
       │ {orderId, amount,
       │  userId, tier,
       │  customerDetails}
       │
       v
       ┌─────────────────────┐
       │ Edge Function       │
       │                     │
       │ 1. Validate input   │
       │ 2. Lookup tier_id   │
       │ 3. Call Midtrans    │────────────>┌──────────────┐
       │ 4. Store in DB      │             │ Midtrans API │
       │ 5. Return token     │<────────────│              │
       └─────────┬───────────┘             │ POST /snap/  │
                 │                         │ transactions │
                 │                         └──────────────┘
                 │ {token, redirectUrl}
                 │
       <─────────┘
       │
       v
┌──────────────────────┐
│ openMidtransPayment()│
│                      │
│ window.snap.pay()    │
└──────┬───────────────┘
       │
       v
┌──────────────────────┐
│   Snap Popup Opens   │
│                      │
│ User selects payment │
│ method & completes   │
└──────┬───────────────┘
       │
       │ Payment Success
       │
       v
┌──────────────────────┐
│ onSuccess callback   │
│                      │
│ Show success message │
│ Redirect to /sub     │
└──────────────────────┘


Meanwhile...

Midtrans                 Webhook Handler           Database
────────                 ───────────────           ────────

┌──────────────┐
│  Payment     │
│  Completed   │
└──────┬───────┘
       │
       │ POST webhook
       │
       v
       ┌─────────────────────┐
       │ Edge Function       │
       │ midtrans-webhook    │
       │                     │
       │ 1. Verify signature │
       │ 2. Update txn       │──────────>┌──────────────┐
       │ 3. Log event        │           │  PostgreSQL  │
       │ 4. Activate sub     │           │              │
       └─────────────────────┘           │ • transactions
                                         │ • user_subs  │
                                         │ • webhook_logs
                                         └──────────────┘
```

## Database Schema Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE UPDATES                            │
└─────────────────────────────────────────────────────────────────┘

Step 1: Transaction Created
────────────────────────────
transactions
├── order_id: "ORDER-abc123-1234567890"
├── user_id: "uuid-of-user"
├── subscription_tier_id: "uuid-of-pro-tier"
├── snap_token: "token-from-midtrans"
├── amount: 99000
├── status: "pending"
└── customer_email: "user@example.com"


Step 2: Payment Completed (via webhook)
────────────────────────────────────────
transactions (updated)
├── status: "settlement" ← Updated
├── transaction_id: "midtrans-txn-id"
├── payment_type: "credit_card"
└── settlement_time: "2026-02-20T10:30:00Z"

webhook_logs (created)
├── event_type: "midtrans_notification"
├── order_id: "ORDER-abc123-1234567890"
├── status: "settlement"
└── payload: {...}


Step 3: Subscription Activated
───────────────────────────────
user_subscriptions (created/updated)
├── user_id: "uuid-of-user"
├── subscription_tier_id: "uuid-of-pro-tier"
├── status: "active" ← Activated
├── current_period_start: "2026-02-20T10:30:00Z"
└── current_period_end: "2026-03-20T10:30:00Z"


Step 4: Credit Limit Updated
─────────────────────────────
When user queries usage:
get_user_usage(user_id) returns:
├── credits_used: 0
├── credits_limit: 2000 ← Updated from 50
├── credits_remaining: 2000
├── period_start: "2026-02-01T00:00:00Z"
└── period_end: "2026-03-01T00:00:00Z"
```

## Component Interaction

```
┌─────────────────────────────────────────────────────────────────┐
│                   COMPONENT HIERARCHY                            │
└─────────────────────────────────────────────────────────────────┘

App.tsx
├── Route: /pricing
│   └── Pricing.tsx
│       ├── useUserSubscriptionInfo() ← Get current tier
│       ├── PricingCard (Free)
│       ├── PricingCard (Pro) ← "Most Popular"
│       ├── PricingCard (Enterprise)
│       └── CreditCostReference
│
├── Route: /checkout (Protected)
│   └── Checkout.tsx
│       ├── useMidtransPayment() ← Payment logic
│       ├── useUserSubscriptionInfo() ← Validate upgrade
│       ├── OrderSummary
│       └── PaymentButton
│           └── onClick → initiatePayment()
│
└── Route: /dashboard/subscription (Protected)
    └── Subscription.tsx
        ├── useUserSubscriptionInfo() ← Plan details
        ├── useUserCreditUsage() ← Usage stats
        ├── useCancelSubscription() ← Cancel logic
        ├── useReactivateSubscription() ← Reactivate logic
        ├── CurrentPlanCard
        ├── CreditUsageCard
        └── CreditCostReference


Dashboard Sidebar
├── UsageTracker
│   ├── Progress bar
│   └── "Upgrade to Pro" button → /pricing
│
└── Menu
    ├── Subscription → /dashboard/subscription
    └── Settings → /dashboard/settings
```

## State Management

```
┌─────────────────────────────────────────────────────────────────┐
│                    REACT QUERY CACHE                             │
└─────────────────────────────────────────────────────────────────┘

Query Keys:
├── ['subscription-tiers']
│   └── All available tiers (Free, Pro, Enterprise)
│
├── ['user-subscription', userId]
│   └── User's current subscription record
│
├── ['user-subscription-info', userId]
│   └── Enriched subscription data with tier details
│
└── ['user-credit-usage', userId]
    └── Current period credit usage
    └── Refetches every 30 seconds


Mutations:
├── cancelSubscription
│   └── Invalidates: user-subscription, user-subscription-info
│
└── reactivateSubscription
    └── Invalidates: user-subscription, user-subscription-info
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ERROR SCENARIOS                              │
└─────────────────────────────────────────────────────────────────┘

Scenario 1: Midtrans Script Fails to Load
──────────────────────────────────────────
useMidtransPayment
├── loadMidtransScript() fails
├── setError("Failed to load payment system")
└── UI shows error alert


Scenario 2: Transaction Creation Fails
───────────────────────────────────────
createMidtransTransaction()
├── Edge function returns error
├── Catch block: setError(errorMessage)
└── UI shows error alert


Scenario 3: Payment Declined
─────────────────────────────
Midtrans Snap
├── User payment declined
├── onError callback triggered
├── setPaymentStatus('error')
└── UI shows error message


Scenario 4: Webhook Signature Invalid
──────────────────────────────────────
Webhook Handler
├── verifySignature() returns false
├── Return 401 Unauthorized
├── Log error
└── Transaction remains "pending"


Scenario 5: Subscription Activation Fails
──────────────────────────────────────────
Webhook Handler
├── Payment successful
├── Database update fails
├── Log error
└── Manual intervention required
```

## Security Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    SECURITY MEASURES                             │
└─────────────────────────────────────────────────────────────────┘

Frontend
├── Client Key only (public)
├── Server Key NEVER exposed
├── Protected routes (auth required)
└── User ID from authenticated session


Edge Function
├── Server Key from environment
├── Supabase Service Role Key
├── CORS headers configured
└── Input validation


Webhook
├── Signature verification
│   └── SHA512(orderId + statusCode + amount + serverKey)
├── Compare with Midtrans signature
├── Reject if mismatch
└── Log all webhook events


Database
├── Row Level Security (RLS)
├── User can only see own data
├── Service role bypasses RLS
└── Audit trail in webhook_logs
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────────┐
│                   PERFORMANCE FEATURES                           │
└─────────────────────────────────────────────────────────────────┘

Code Splitting
├── Pricing page: Lazy loaded
├── Checkout page: Lazy loaded
└── Subscription page: Lazy loaded


Caching
├── React Query cache (30s)
├── Subscription data cached
├── Credit usage cached
└── Automatic refetch on mutation


Script Loading
├── Midtrans script loaded async
├── Only loaded when needed
└── Cached by browser


Database
├── Indexed queries
├── Efficient joins
└── Materialized views (future)
```

---

This diagram provides a comprehensive visual understanding of the entire payment and subscription system implementation.
