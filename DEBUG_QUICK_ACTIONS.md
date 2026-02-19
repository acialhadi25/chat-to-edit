# Debug Quick Actions - Step by Step

## Masalah

Quick Actions masih mengirim message ke AI instead of applying action directly.

## Root Cause Analysis

Ada 3 kemungkinan:

### 1. Edge Function Belum Di-Deploy
Edge function `chat` belum di-update dengan perubahan terbaru yang mengirim `action` object di dalam `quickOptions`.

### 2. AI Tidak Mengikuti Format
AI tidak mengirim `action` object di dalam `quickOptions`, hanya mengirim `label` dan `value`.

### 3. Parsing Error
Frontend tidak bisa parse `action` object dari AI response.

## Debugging Steps

### Step 1: Check Console Logs

Buka browser console (F12) dan lihat logs saat Quick Actions di-render:

```javascript
// Saat message diterima
"Parsed AI response:" { content: "...", action: {...}, quickOptions: [...] }
"Quick options:" [{ id: "...", label: "...", action: {...} }]

// Saat Quick Actions di-render
"Quick option:" { 
  id: "fix-total", 
  label: "✓ Isi Kolom Total",
  hasAction: true,  // ← HARUS TRUE!
  action: { type: "INSERT_FORMULA", ... },
  isApplyAction: true
}
```

**Expected:** `hasAction: true`
**If `hasAction: false`:** AI tidak mengirim action object!

### Step 2: Check Button Click

Klik Quick Action dan lihat logs:

```javascript
// Saat button diklik
"Button clicked for option:" "✓ Isi Kolom Total"
"Option has action?" true  // ← HARUS TRUE!
"Full option:" { id: "...", label: "...", action: {...} }

// Jika hasAction = true
"Applying quick action:" { type: "INSERT_FORMULA", ... }
"handleApplyAction called with:" { type: "INSERT_FORMULA", ... }

// Jika hasAction = false
"No action found, sending message:" "..."  // ← INI MASALAHNYA!
```

### Step 3: Check AI Response

Lihat raw AI response di Network tab:

1. Buka DevTools → Network tab
2. Filter: `chat`
3. Klik request terakhir
4. Lihat Response

**Expected format:**
```json
{
  "content": "Saya akan menerapkan formula...",
  "action": {
    "type": "INSERT_FORMULA",
    "formula": "=SUM(D2:D13)",
    "target": { "type": "range", "ref": "D14" }
  },
  "quickOptions": [
    {
      "id": "apply-sum",
      "label": "Ya, terapkan SUM",
      "value": "Applied SUM formula",
      "variant": "success",
      "isApplyAction": true,
      "action": {
        "type": "INSERT_FORMULA",
        "formula": "=SUM(D2:D13)",
        "target": { "type": "range", "ref": "D14" },
        "description": "Apply SUM formula"
      }
    },
    {
      "id": "cancel",
      "label": "Batal",
      "value": "Cancelled",
      "variant": "outline"
    }
  ]
}
```

**If quickOptions[0].action is missing:** Edge function belum di-deploy atau AI tidak mengikuti format!

## Solutions

### Solution 1: Deploy Edge Function

```bash
# Navigate to project root
cd chat-to-edit

# Deploy chat function
supabase functions deploy chat

# Verify deployment
supabase functions list
```

**Expected output:**
```
┌────────┬─────────────────────┬─────────┬────────────────────┐
│ NAME   │ VERSION             │ STATUS  │ CREATED AT         │
├────────┼─────────────────────┼─────────┼────────────────────┤
│ chat   │ v1.2.3 (latest)     │ ACTIVE  │ 2024-02-19 10:30   │
└────────┴─────────────────────┴─────────┴────────────────────┘
```

### Solution 2: Fallback to Main Action

Jika quickOption tidak punya action tapi `isApplyAction: true`, gunakan main message action:

```typescript
// Priority 1: Use quickOption.action
if (option.action) {
  onApplyAction(option.action);
}
// Priority 2: Use main message.action if isApplyAction
else if (option.isApplyAction && message.action) {
  onApplyAction(message.action);
}
// Priority 3: Send message
else {
  sendMessage(option.value);
}
```

**This is already implemented!**

### Solution 3: Force AI to Include Action

Update system prompt di edge function untuk ALWAYS include action in quickOptions:

```typescript
## CRITICAL RULE FOR QUICKOPTIONS:
EVERY quickOption with isApplyAction: true MUST include a complete action object.

Example:
{
  "id": "fix-total",
  "label": "✓ Isi Kolom Total",
  "value": "Applied formula",
  "variant": "success",
  "isApplyAction": true,
  "action": {  // ← REQUIRED!
    "type": "INSERT_FORMULA",
    "formula": "=D{row}*E{row}",
    "target": { "type": "range", "ref": "F2:F12" },
    "params": {
      "target": { "type": "range", "ref": "F2:F12" },
      "formula": "=D{row}*E{row}"
    },
    "description": "Insert Total formula"
  }
}
```

## Testing After Fix

### Test 1: Check Logs
```bash
1. Open Console (F12)
2. Upload Excel
3. Send command: "Jumlahkan kolom Harga"
4. Check logs:
   - "Quick option:" { hasAction: true }  ✅
   - "Button clicked"
   - "Applying quick action"  ✅
   - "handleApplyAction called"  ✅
   - NOT "sending message"  ❌
```

### Test 2: Verify Apply
```bash
1. Click Quick Action
2. Verify:
   - Spreadsheet updates  ✅
   - Toast "Action Applied!"  ✅
   - No new AI request  ✅
   - Instant (<100ms)  ✅
```

### Test 3: Check Network
```bash
1. Open Network tab
2. Click Quick Action
3. Verify:
   - NO new request to /functions/v1/chat  ✅
   - Only local processing  ✅
```

## Common Issues

### Issue 1: "No action found, sending message"

**Cause:** quickOption.action is undefined

**Check:**
```javascript
console.log('Quick option:', option);
// Output: { id: "...", label: "...", action: undefined }
```

**Solution:**
1. Deploy edge function
2. Or use fallback to message.action

### Issue 2: "Action validation failed"

**Cause:** action object incomplete

**Check:**
```javascript
console.log('Action:', option.action);
// Output: { type: "INSERT_FORMULA" }  // Missing params!
```

**Solution:**
Update edge function to include all required fields:
- type
- params (with target)
- formula (for INSERT_FORMULA)
- description

### Issue 3: Still sending to AI

**Cause:** Multiple possible causes

**Debug:**
```javascript
// Add breakpoint in onClick handler
onClick={(e) => {
  debugger;  // ← Execution stops here
  if (option.action) {
    // Should enter here!
  }
}}
```

**Check:**
- Is onClick firing?
- Is option.action defined?
- Is onApplyAction being called?

## Edge Function Deployment

### Prerequisites
```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref iatfkqwwmjohrvdfnmwm
```

### Deploy
```bash
# Deploy single function
supabase functions deploy chat

# Deploy with environment variables
supabase secrets set LOVABLE_API_KEY=your_key
supabase secrets set DEEPSEEK_API_KEY=your_key

# Verify
supabase functions list
```

### Test Edge Function
```bash
# Test locally
supabase functions serve chat

# Test deployed
curl -X POST https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [{"role": "user", "content": "Jumlahkan kolom Harga"}],
    "excelContext": {...}
  }'
```

## Monitoring

### Check Edge Function Logs
```bash
# View logs
supabase functions logs chat

# Follow logs
supabase functions logs chat --follow
```

### Check for Errors
```bash
# Look for:
- "AI gateway error"
- "Parse error"
- "Missing action in quickOptions"
```

## Summary

**Current Implementation:**
1. ✅ Frontend checks for option.action
2. ✅ Fallback to message.action if isApplyAction
3. ✅ Comprehensive logging
4. ✅ Prevent event bubbling

**Next Steps:**
1. Check console logs untuk hasAction
2. Deploy edge function jika belum
3. Verify AI response format
4. Test dengan berbagai commands

**Expected Result:**
- Quick Action → Apply instantly
- No AI request
- Spreadsheet updates
- Toast notification
