# 🎯 Credit System Migration Guide

**Date:** February 20, 2026  
**Status:** ✅ COMPLETED  
**Impact:** Simplified pricing, better UX, easier to understand

---

## 📊 Overview

We've migrated from a complex multi-metric usage system to a simple, unified credit-based system. This makes pricing clearer and more flexible for users.

### Before (Old System) ❌
```
User has:
- 50 Excel operations/month
- 10 File uploads/month  
- 20 AI messages/month

Problem: Confusing, inflexible, hard to predict
```

### After (New System) ✅
```
User has:
- 100 credits/month

Simple: 1 action ≈ 1-5 credits depending on complexity
```

---

## 💰 New Pricing Structure

### Credit Costs

| Action | Credits | Example |
|--------|---------|---------|
| AI Chat Message | 1 | "Sort column A" |
| Simple Excel Operation | 1 | Sort, filter, format |
| Complex Excel Operation | 2 | Pivot table, VLOOKUP, formulas |
| File Upload & Processing | 5 | Upload + parse Excel file |
| Template Generation | 3 | AI-generated template |

### Subscription Tiers

#### Free Tier - IDR 0/month
- 100 credits/month (~50-100 actions)
- Max file size: 10 MB
- Basic Excel operations
- Community support

#### Pro Tier - IDR 99,000/month (~$7 USD)
- 2,000 credits/month (~1,000-2,000 actions)
- Max file size: 100 MB
- All Excel operations
- Priority support
- Custom templates

#### Enterprise Tier - IDR 499,000/month (~$35 USD)
- 10,000 credits/month (~5,000-10,000 actions)
- Max file size: 500 MB
- Everything in Pro
- Team collaboration
- API access
- Dedicated support

---

## 🔄 Migration Details

### Database Changes

**Migration File:** `20260220000001_migrate_to_credit_system.sql`

1. **Updated `subscription_tiers` table**
   - Changed limits from 3 separate metrics to single `credits_per_month`
   - Kept `max_file_size_mb` as separate limit

2. **Migrated `usage_tracking` data**
   - Converted old metrics to credits:
     - `excel_operation` × 1.5 = credits
     - `file_upload` × 5 = credits
     - `ai_message` × 1 = credits
   - Changed `resource_type` to only accept `'credits'`

3. **Updated database functions**
   - `track_usage()` - Now only accepts 'credits'
   - `check_usage_limit()` - Simplified for credits
   - `get_user_usage()` - New function for credit usage info

### Code Changes

**New Files:**
- `src/types/credits.ts` - Credit system types and helpers
- `supabase/migrations/20260220000001_migrate_to_credit_system.sql`

**Updated Files:**
- `src/types/subscription.ts` - Updated limits interface
- `src/lib/subscription.ts` - New credit-based functions
- `src/hooks/useSubscription.ts` - New hooks for credits
- `src/hooks/useSubscriptionGuard.ts` - Updated to use credits

---

## 🚀 Usage Examples

### Frontend Usage

```typescript
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { useTrackUsage } from '@/hooks/useSubscription';

function MyComponent() {
  const { canPerformAction, creditUsage } = useSubscriptionGuard();
  const trackUsage = useTrackUsage();

  const handleAIChat = async () => {
    // Check if user has enough credits
    const canChat = await canPerformAction('AI_CHAT');
    if (!canChat) return;

    // Perform action
    await sendChatMessage();

    // Track usage
    await trackUsage.mutateAsync({ action: 'AI_CHAT' });
  };

  return (
    <div>
      <p>Credits: {creditUsage?.credits_remaining} / {creditUsage?.credits_limit}</p>
      <button onClick={handleAIChat}>Send Message (1 credit)</button>
    </div>
  );
}
```

### Backend Usage (Edge Functions)

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(url, key);

// Check if user can perform action
const { data: canPerform } = await supabase.rpc('check_usage_limit', {
  p_user_id: userId,
  p_resource_type: 'credits'
});

if (!canPerform) {
  return new Response('Insufficient credits', { status: 402 });
}

// Perform action...

// Track usage
await supabase.rpc('track_usage', {
  p_user_id: userId,
  p_resource_type: 'credits',
  p_count: 2 // For complex operation
});
```

---

## 📈 Benefits

### For Users
- ✅ **Simpler to understand** - One number instead of three
- ✅ **More flexible** - Use credits however you want
- ✅ **Better value perception** - "2,000 credits" sounds generous
- ✅ **Easier to track** - Single progress bar

### For Business
- ✅ **Higher conversion** - Simpler pricing = less friction
- ✅ **Lower support burden** - Fewer "how does this work?" questions
- ✅ **Easier upsell** - "Running low on credits? Upgrade!"
- ✅ **Better analytics** - Track credit usage patterns

### For Development
- ✅ **Simpler codebase** - 1 counter instead of 3
- ✅ **Easier to add features** - Just assign credit cost
- ✅ **Better maintainability** - Less complexity

---

## 🔍 Testing Checklist

### Database Migration
- [x] Migration runs successfully
- [x] Old data converted correctly
- [x] Functions work with new schema
- [ ] Test on staging environment
- [ ] Backup production data before migration

### Frontend
- [ ] Credit display shows correctly
- [ ] Usage tracking works
- [ ] Limit checking works
- [ ] Error messages are clear
- [ ] Upgrade prompts work

### Backend
- [ ] Edge functions use new system
- [ ] Webhook handlers updated
- [ ] Subscription renewal works
- [ ] Payment flow works

### User Experience
- [ ] Pricing page updated
- [ ] Dashboard shows credits
- [ ] Notifications mention credits
- [ ] Help docs updated

---

## 🚨 Rollback Plan

If issues occur, rollback steps:

1. **Revert migration**
   ```sql
   -- Restore old limits structure
   UPDATE subscription_tiers SET limits = old_limits;
   
   -- Restore old resource types
   ALTER TABLE usage_tracking DROP CONSTRAINT usage_tracking_resource_type_check;
   ALTER TABLE usage_tracking ADD CONSTRAINT usage_tracking_resource_type_check 
     CHECK (resource_type IN ('excel_operation', 'file_upload', 'ai_message'));
   ```

2. **Revert code changes**
   ```bash
   git revert <commit-hash>
   ```

3. **Redeploy old version**

---

## 📝 Next Steps

### Immediate (Week 1)
1. Deploy migration to staging
2. Test thoroughly
3. Update pricing page
4. Update help documentation
5. Deploy to production

### Short-term (Month 1)
1. Monitor credit usage patterns
2. Adjust credit costs if needed
3. Add credit purchase option (top-up)
4. Add usage analytics dashboard

### Long-term (Month 3)
1. Credit gifting/referrals
2. Credit rollover option
3. Team credit pooling
4. API credit tracking

---

## 🎓 Training Materials

### For Support Team
- Credits are the new unified metric
- 1 credit ≈ 1 simple action
- Complex actions cost more credits
- Users can see remaining credits in dashboard
- Upgrade to get more credits

### For Marketing
- Emphasize simplicity: "One number to track"
- Highlight flexibility: "Use credits your way"
- Show value: "2,000 credits = ~1,000 actions"
- Compare to competitors: "Simpler than others"

---

## 📞 Support

For questions or issues:
- Technical: Check code comments and types
- Business: Review pricing analysis in PRODUCTION_READINESS_AUDIT.md
- Migration: This document

---

**Migration completed by:** Kiro AI Assistant  
**Date:** February 20, 2026  
**Version:** 1.0.0
