# ⚡ Credit System - Quick Reference Card

One-page reference for developers working with the credit system.

---

## 💳 Credit Costs

```typescript
AI_CHAT: 1              // Simple AI message
SIMPLE_OPERATION: 1     // Sort, filter, format
COMPLEX_OPERATION: 2    // Pivot, VLOOKUP, formulas
FILE_UPLOAD: 5          // Upload + processing
TEMPLATE_GENERATION: 3  // AI template creation
```

---

## 📦 Imports

```typescript
// Hooks
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { useTrackUsage, useUserCreditUsage } from '@/hooks/useSubscription';

// Types
import type { CreditAction } from '@/types/credits';
import { CREDIT_COSTS, formatCredits, hasEnoughCredits } from '@/types/credits';

// Components
import { CreditUsageDisplay, CreditUsageBadge } from '@/components/subscription/CreditUsageDisplay';
```

---

## 🔍 Basic Pattern

```typescript
function MyFeature() {
  const { canPerformAction } = useSubscriptionGuard();
  const trackUsage = useTrackUsage();

  const handleAction = async () => {
    // 1. Check
    if (!await canPerformAction('AI_CHAT')) return;
    
    // 2. Do
    await doSomething();
    
    // 3. Track
    await trackUsage.mutateAsync({ action: 'AI_CHAT' });
  };

  return <button onClick={handleAction}>Action (1 credit)</button>;
}
```

---

## 📊 Display Usage

```typescript
// Full display
<CreditUsageDisplay />

// Compact badge
<CreditUsageBadge />

// Custom
const { data: usage } = useUserCreditUsage();
<p>{usage?.credits_remaining} credits left</p>
```

---

## 🔧 Backend (Edge Functions)

```typescript
// Check
const { data: canPerform } = await supabase.rpc('check_usage_limit', {
  p_user_id: userId,
  p_resource_type: 'credits'
});

if (!canPerform) {
  return new Response('Insufficient credits', { status: 402 });
}

// Track
await supabase.rpc('track_usage', {
  p_user_id: userId,
  p_resource_type: 'credits',
  p_count: 2
});
```

---

## 🎨 UI Patterns

```typescript
// Show cost
<button>Send Message (1 credit)</button>

// Disable when low
const hasEnough = (usage?.credits_remaining || 0) >= 2;
<button disabled={!hasEnough}>Create Pivot (2 credits)</button>

// Warning
{usage && usage.credits_remaining < 10 && (
  <p>Low on credits! <Link to="/pricing">Upgrade</Link></p>
)}
```

---

## 🧪 Testing

```typescript
vi.mock('@/hooks/useSubscription', () => ({
  useUserCreditUsage: () => ({
    data: {
      credits_used: 50,
      credits_limit: 100,
      credits_remaining: 50,
      period_start: '2026-02-01',
      period_end: '2026-03-01',
    },
  }),
}));
```

---

## 📚 Helper Functions

```typescript
// Format for display
formatCredits(1500) // "1.5K"

// Check if enough
hasEnoughCredits(usage, 'COMPLEX_OPERATION') // boolean

// Get percentage
getUsagePercentage(usage) // 0-100
```

---

## 🚨 Error Handling

```typescript
try {
  await trackUsage.mutateAsync({ action: 'AI_CHAT' });
} catch (error) {
  console.error('Failed to track:', error);
  // Don't block user
}
```

---

## 📖 Best Practices

✅ **DO:**
- Check before action
- Track immediately after
- Show credit cost to users
- Handle errors gracefully

❌ **DON'T:**
- Skip credit check
- Forget to track
- Hide costs from users
- Block on tracking errors

---

## 🔗 Full Documentation

- `CREDIT_SYSTEM_MIGRATION.md` - Migration guide
- `CREDIT_SYSTEM_USAGE_GUIDE.md` - Detailed examples
- `CREDIT_SYSTEM_IMPLEMENTATION_SUMMARY.md` - Overview

---

**Version:** 1.0.0 | **Updated:** Feb 20, 2026
