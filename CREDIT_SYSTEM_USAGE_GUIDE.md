# 🎯 Credit System - Developer Usage Guide

Quick reference for implementing credit checks and tracking in ChaTtoEdit.

---

## 📦 Quick Start

### 1. Import Required Modules

```typescript
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { useTrackUsage } from '@/hooks/useSubscription';
import type { CreditAction } from '@/types/credits';
```

### 2. Basic Pattern

```typescript
function MyFeature() {
  const { canPerformAction } = useSubscriptionGuard();
  const trackUsage = useTrackUsage();

  const handleAction = async () => {
    // 1. Check if user has enough credits
    const canProceed = await canPerformAction('AI_CHAT');
    if (!canProceed) return; // User will see error toast

    // 2. Perform your action
    const result = await doSomething();

    // 3. Track the usage
    await trackUsage.mutateAsync({ action: 'AI_CHAT' });

    return result;
  };

  return <button onClick={handleAction}>Do Something</button>;
}
```

---

## 💳 Credit Costs Reference

```typescript
// From src/types/credits.ts
export const CREDIT_COSTS = {
  AI_CHAT: 1,                 // Simple AI chat message
  SIMPLE_OPERATION: 1,        // Sort, filter, format
  COMPLEX_OPERATION: 2,       // Pivot, VLOOKUP, formulas
  FILE_UPLOAD: 5,             // File upload + processing
  TEMPLATE_GENERATION: 3,     // AI template creation
} as const;
```

---

## 🔍 Common Use Cases

### Use Case 1: AI Chat Message

```typescript
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { useTrackUsage } from '@/hooks/useSubscription';

function ChatInterface() {
  const { canPerformAction } = useSubscriptionGuard();
  const trackUsage = useTrackUsage();

  const sendMessage = async (message: string) => {
    // Check credits (1 credit for AI chat)
    if (!await canPerformAction('AI_CHAT')) {
      return; // Error toast shown automatically
    }

    // Send message to AI
    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });

    // Track usage
    await trackUsage.mutateAsync({ action: 'AI_CHAT' });

    return response;
  };

  return (
    <div>
      <input onSubmit={(msg) => sendMessage(msg)} />
    </div>
  );
}
```

### Use Case 2: Excel Operation

```typescript
function ExcelEditor() {
  const { canPerformAction } = useSubscriptionGuard();
  const trackUsage = useTrackUsage();

  const sortColumn = async (column: string) => {
    // Simple operation = 1 credit
    if (!await canPerformAction('SIMPLE_OPERATION')) {
      return;
    }

    // Perform sort
    await performSort(column);

    // Track usage
    await trackUsage.mutateAsync({ action: 'SIMPLE_OPERATION' });
  };

  const createPivotTable = async (config: PivotConfig) => {
    // Complex operation = 2 credits
    if (!await canPerformAction('COMPLEX_OPERATION')) {
      return;
    }

    // Create pivot table
    await createPivot(config);

    // Track usage
    await trackUsage.mutateAsync({ action: 'COMPLEX_OPERATION' });
  };

  return (
    <div>
      <button onClick={() => sortColumn('A')}>Sort (1 credit)</button>
      <button onClick={() => createPivotTable(config)}>
        Pivot Table (2 credits)
      </button>
    </div>
  );
}
```

### Use Case 3: File Upload

```typescript
function FileUploader() {
  const { canPerformAction, checkFileSize } = useSubscriptionGuard();
  const trackUsage = useTrackUsage();

  const handleFileUpload = async (file: File) => {
    // Check file size limit
    const fileSizeMB = file.size / (1024 * 1024);
    if (!checkFileSize(fileSizeMB)) {
      return; // Error toast shown
    }

    // Check credits (5 credits for file upload)
    if (!await canPerformAction('FILE_UPLOAD')) {
      return;
    }

    // Upload and process file
    const formData = new FormData();
    formData.append('file', file);
    await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    // Track usage
    await trackUsage.mutateAsync({ action: 'FILE_UPLOAD' });
  };

  return (
    <input 
      type="file" 
      onChange={(e) => handleFileUpload(e.target.files[0])} 
    />
  );
}
```

### Use Case 4: Batch Operations

```typescript
function BatchProcessor() {
  const { canPerformAction } = useSubscriptionGuard();
  const trackUsage = useTrackUsage();

  const processBatch = async (items: string[]) => {
    // Check if user can perform all operations
    // Each item = 1 credit, so check for total
    const totalCreditsNeeded = items.length;
    
    // We check for SIMPLE_OPERATION but multiply count
    if (!await canPerformAction('SIMPLE_OPERATION')) {
      return;
    }

    // Process all items
    for (const item of items) {
      await processItem(item);
    }

    // Track usage with count
    await trackUsage.mutateAsync({ 
      action: 'SIMPLE_OPERATION',
      count: items.length 
    });
  };

  return (
    <button onClick={() => processBatch(selectedItems)}>
      Process {selectedItems.length} items ({selectedItems.length} credits)
    </button>
  );
}
```

---

## 📊 Display Credit Usage

### Full Display Component

```typescript
import { CreditUsageDisplay } from '@/components/subscription/CreditUsageDisplay';

function Dashboard() {
  return (
    <div>
      <h1>Dashboard</h1>
      <CreditUsageDisplay />
    </div>
  );
}
```

### Compact Badge (for Navbar)

```typescript
import { CreditUsageBadge } from '@/components/subscription/CreditUsageDisplay';

function Navbar() {
  return (
    <nav>
      <Logo />
      <CreditUsageBadge />
      <UserMenu />
    </nav>
  );
}
```

### Custom Display

```typescript
import { useUserCreditUsage } from '@/hooks/useSubscription';
import { formatCredits, getUsagePercentage } from '@/types/credits';

function CustomDisplay() {
  const { data: usage } = useUserCreditUsage();

  if (!usage) return null;

  return (
    <div>
      <p>{formatCredits(usage.credits_remaining)} credits left</p>
      <p>{getUsagePercentage(usage)}% used this month</p>
    </div>
  );
}
```

---

## 🔧 Edge Functions (Backend)

### Supabase Edge Function Example

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
);

Deno.serve(async (req) => {
  const { userId, action } = await req.json();

  // 1. Check if user has enough credits
  const { data: canPerform } = await supabase.rpc('check_usage_limit', {
    p_user_id: userId,
    p_resource_type: 'credits'
  });

  if (!canPerform) {
    return new Response(
      JSON.stringify({ error: 'Insufficient credits' }),
      { status: 402, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 2. Perform action
  const result = await performAction(action);

  // 3. Track usage (deduct credits)
  const creditCost = getCreditCostForAction(action);
  await supabase.rpc('track_usage', {
    p_user_id: userId,
    p_resource_type: 'credits',
    p_count: creditCost
  });

  return new Response(
    JSON.stringify({ success: true, result }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});

function getCreditCostForAction(action: string): number {
  const costs: Record<string, number> = {
    'ai_chat': 1,
    'simple_operation': 1,
    'complex_operation': 2,
    'file_upload': 5,
    'template_generation': 3,
  };
  return costs[action] || 1;
}
```

---

## 🎨 UI Patterns

### Show Credit Cost Before Action

```typescript
function ActionButton({ action, label }: { action: CreditAction, label: string }) {
  const { canPerformAction } = useSubscriptionGuard();
  const creditCost = CREDIT_COSTS[action];

  return (
    <button onClick={() => canPerformAction(action)}>
      {label} ({creditCost} credit{creditCost > 1 ? 's' : ''})
    </button>
  );
}

// Usage
<ActionButton action="AI_CHAT" label="Send Message" />
<ActionButton action="COMPLEX_OPERATION" label="Create Pivot" />
```

### Disable Button When Low Credits

```typescript
function SmartButton() {
  const { creditUsage } = useSubscriptionGuard();
  const creditCost = 2;
  
  const hasEnoughCredits = (creditUsage?.credits_remaining || 0) >= creditCost;

  return (
    <button 
      disabled={!hasEnoughCredits}
      title={!hasEnoughCredits ? 'Not enough credits' : ''}
    >
      Create Pivot Table ({creditCost} credits)
    </button>
  );
}
```

### Show Upgrade Prompt

```typescript
function FeatureWithUpgrade() {
  const { canPerformAction, creditUsage } = useSubscriptionGuard();

  const handleAction = async () => {
    const canProceed = await canPerformAction('COMPLEX_OPERATION');
    if (!canProceed) {
      // Error toast already shown, optionally show upgrade modal
      showUpgradeModal();
    }
  };

  return (
    <div>
      <button onClick={handleAction}>Advanced Feature</button>
      {creditUsage && creditUsage.credits_remaining < 10 && (
        <p className="text-yellow-600">
          Low on credits! <Link to="/pricing">Upgrade now</Link>
        </p>
      )}
    </div>
  );
}
```

---

## 🧪 Testing

### Mock Credit Usage in Tests

```typescript
import { vi } from 'vitest';

vi.mock('@/hooks/useSubscription', () => ({
  useUserCreditUsage: () => ({
    data: {
      credits_used: 50,
      credits_limit: 100,
      credits_remaining: 50,
      period_start: '2026-02-01',
      period_end: '2026-03-01',
    },
    isLoading: false,
  }),
  useTrackUsage: () => ({
    mutateAsync: vi.fn(),
  }),
}));
```

---

## 📚 Helper Functions

### Check if User Has Enough Credits

```typescript
import { hasEnoughCredits } from '@/types/credits';

const usage = await getUserCreditUsage(userId);
if (hasEnoughCredits(usage, 'COMPLEX_OPERATION')) {
  // User can perform action
}
```

### Format Credits for Display

```typescript
import { formatCredits } from '@/types/credits';

formatCredits(100);    // "100"
formatCredits(1500);   // "1.5K"
formatCredits(10000);  // "10K"
```

### Get Usage Percentage

```typescript
import { getUsagePercentage } from '@/types/credits';

const percentage = getUsagePercentage(usage);
if (percentage >= 80) {
  showLowCreditsWarning();
}
```

---

## 🚨 Error Handling

### Handle Insufficient Credits

```typescript
try {
  await trackUsage.mutateAsync({ action: 'AI_CHAT' });
} catch (error) {
  if (error.message.includes('Insufficient credits')) {
    // Show upgrade prompt
    showUpgradeModal();
  }
}
```

### Handle Network Errors

```typescript
const { canPerformAction } = useSubscriptionGuard();

try {
  const canProceed = await canPerformAction('AI_CHAT');
  if (!canProceed) return;
  
  // Perform action
} catch (error) {
  console.error('Failed to check credits:', error);
  // Fallback: allow action but log error
  toast({
    title: 'Warning',
    description: 'Could not verify credits. Action may fail.',
    variant: 'warning',
  });
}
```

---

## 📖 Best Practices

1. **Always check before performing action**
   ```typescript
   // ✅ Good
   if (await canPerformAction('AI_CHAT')) {
     await sendMessage();
     await trackUsage.mutateAsync({ action: 'AI_CHAT' });
   }

   // ❌ Bad - no check
   await sendMessage();
   await trackUsage.mutateAsync({ action: 'AI_CHAT' });
   ```

2. **Track usage immediately after action**
   ```typescript
   // ✅ Good
   await performAction();
   await trackUsage.mutateAsync({ action: 'AI_CHAT' });

   // ❌ Bad - might forget to track
   await performAction();
   // ... other code ...
   // Forgot to track!
   ```

3. **Show credit cost to users**
   ```typescript
   // ✅ Good - transparent
   <button>Send Message (1 credit)</button>

   // ❌ Bad - hidden cost
   <button>Send Message</button>
   ```

4. **Handle errors gracefully**
   ```typescript
   // ✅ Good
   try {
     await trackUsage.mutateAsync({ action: 'AI_CHAT' });
   } catch (error) {
     console.error('Failed to track usage:', error);
     // Continue anyway, don't block user
   }
   ```

---

## 🔗 Related Files

- `src/types/credits.ts` - Credit types and helpers
- `src/lib/subscription.ts` - Subscription functions
- `src/hooks/useSubscription.ts` - React hooks
- `src/hooks/useSubscriptionGuard.ts` - Guard hook
- `src/components/subscription/CreditUsageDisplay.tsx` - UI component
- `supabase/migrations/20260220000001_migrate_to_credit_system.sql` - Database migration

---

**Last Updated:** February 20, 2026  
**Version:** 1.0.0
