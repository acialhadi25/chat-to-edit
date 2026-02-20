# Session Persistence Fix Guide

## Problem
User session tidak persist setelah navigation atau page refresh, menyebabkan:
- User harus login ulang setelah klik logo/navigate
- Payment gagal dengan 401 Unauthorized error
- Session hilang saat pindah halaman

## Root Cause
1. Supabase client menggunakan `VITE_SUPABASE_PUBLISHABLE_KEY` (bukan JWT token)
2. Session storage tidak dikonfigurasi dengan benar
3. Auth state tidak di-track dengan baik

## Fixes Applied

### 1. Update Supabase Client Configuration ✅
**File:** `src/integrations/supabase/client.ts`

**Changed:**
```typescript
// BEFORE
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});

// AFTER
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,  // Added
  }
});
```

**Why:** 
- ANON_KEY adalah JWT token yang proper untuk Supabase auth
- `detectSessionInUrl: true` membantu handle OAuth redirects
- Publishable key bukan untuk authentication

### 2. Fix Payment Authentication ✅
**File:** `src/lib/midtrans.ts`

**Changed:**
```typescript
// BEFORE
export async function createMidtransTransaction(data: {...}): Promise<...> {
  const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const response = await fetch(`${supabaseUrl}/functions/v1/midtrans-create-transaction`, {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${supabaseKey}`,
    },
    ...
  });
}

// AFTER
export async function createMidtransTransaction(
  data: {...},
  accessToken: string  // Added parameter
): Promise<...> {
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const response = await fetch(`${supabaseUrl}/functions/v1/midtrans-create-transaction`, {
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseAnonKey,  // Added
      Authorization: `Bearer ${accessToken}`,  // Use user token
    },
    ...
  });
}
```

**Why:**
- Edge functions dengan `verify_jwt: true` membutuhkan user access token
- Anon key diperlukan sebagai apikey header
- User access token memvalidasi user identity

### 3. Update Payment Hook ✅
**File:** `src/hooks/useMidtransPayment.ts`

**Changed:**
```typescript
// BEFORE
const { user } = useAuth();
const { token } = await createMidtransTransaction({...});

// AFTER
const { user, session } = useAuth();
if (!user || !session || !session.access_token) {
  setError('User not authenticated. Please log in again.');
  return;
}
const { token } = await createMidtransTransaction({...}, session.access_token);
```

**Why:**
- Memastikan session dan access token tersedia
- Memberikan error message yang jelas
- Pass access token ke API call

### 4. Add Debug Logging ✅
**Files:** `src/hooks/useAuth.ts`, `src/hooks/useMidtransPayment.ts`

Added console.log untuk tracking:
- Session load status
- Auth state changes
- Payment initiation details
- Token availability

## Testing Steps

### 1. Clear Browser Storage
```javascript
// Open browser console (F12)
localStorage.clear();
sessionStorage.clear();
// Refresh page (Ctrl+R)
```

### 2. Login Fresh
1. Go to `/login`
2. Login dengan credentials
3. Check console untuk "Session loaded" log
4. Verify `hasSession: true`, `hasAccessToken: true`

### 3. Test Navigation
1. Navigate ke `/pricing`
2. Check console - session should persist
3. Click logo to go back to `/`
4. Navigate to `/pricing` again
5. Session should still be there

### 4. Test Payment
1. Go to `/pricing`
2. Click "Upgrade to Pro"
3. Check console untuk "Initiating payment" log
4. Verify `hasAccessToken: true`
5. Click "Pay" button
6. Should NOT get 401 error

### 5. Test Page Refresh
1. While logged in, refresh page (F5)
2. Check console - session should reload
3. User should stay logged in

## Expected Console Output

### On Login Success:
```
Session loaded: {
  hasSession: true,
  hasUser: true,
  hasAccessToken: true,
  userId: "1b9fbb3c-9cc2-4ee6-8aa1-9c364e2622b3"
}
```

### On Payment Initiation:
```
Initiating payment: {
  orderId: "ORDER-1b9fbb3c-1771548500000",
  amount: 99000,
  tier: "pro",
  userId: "1b9fbb3c-9cc2-4ee6-8aa1-9c364e2622b3",
  hasAccessToken: true
}
```

### On Auth State Change:
```
Auth state changed: {
  event: "SIGNED_IN",
  hasSession: true,
  hasUser: true,
  hasAccessToken: true
}
```

## Common Issues & Solutions

### Issue 1: Still Getting 401 Error
**Solution:**
1. Clear browser storage completely
2. Logout and login again
3. Check console logs for session details
4. Verify VITE_SUPABASE_ANON_KEY in .env

### Issue 2: Session Lost on Navigation
**Solution:**
1. Check browser console for errors
2. Verify localStorage is not blocked
3. Check if auth state change listener is working
4. Try incognito mode to rule out extensions

### Issue 3: "User not authenticated" Error
**Solution:**
1. Check if user is actually logged in
2. Verify session.access_token exists
3. Check console logs for auth state
4. Try logout and login again

### Issue 4: Payment Still Fails
**Solution:**
1. Check edge function logs:
   ```bash
   npx supabase functions logs midtrans-create-transaction --project-ref iatfkqwwmjohrvdfnmwm
   ```
2. Verify secrets are set correctly
3. Check if JWT verification is enabled on function
4. Test with curl to isolate frontend issues

## Environment Variables Check

Ensure these are set in `.env`:
```env
VITE_SUPABASE_URL=https://iatfkqwwmjohrvdfnmwm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...  # Not used for auth anymore
```

## Verification Checklist

- [ ] Browser storage cleared
- [ ] Logged in successfully
- [ ] Console shows "Session loaded" with hasAccessToken: true
- [ ] Navigation doesn't lose session
- [ ] Page refresh keeps user logged in
- [ ] Payment initiation shows hasAccessToken: true
- [ ] No 401 errors on payment
- [ ] Midtrans popup opens successfully

## Next Steps

If all fixes are applied and tested:
1. Test complete payment flow end-to-end
2. Test with different browsers
3. Test on mobile devices
4. Monitor for any session-related errors
5. Consider adding session refresh logic if needed

## Additional Notes

- Session expires after 1 hour by default (Supabase)
- Auto-refresh should handle token renewal
- If issues persist, check Supabase Auth settings in dashboard
- Consider implementing session timeout warning for UX

---

**Last Updated:** 2026-02-20
**Status:** Fixes applied, ready for testing
