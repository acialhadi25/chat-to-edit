# Perbaikan Schema Profile - Database Mismatch

## Masalah
Error: `column profiles.plan does not exist`

Kode TypeScript mencari kolom yang tidak ada di database:
- ❌ `plan` → ✅ `subscription_tier`
- ❌ `files_used_this_month` → ✅ `credits_remaining`

## Struktur Database yang Benar

```sql
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  subscription_end_date TIMESTAMPTZ,
  credits_remaining INTEGER DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Perubahan yang Dilakukan

### 1. Interface TypeScript (`src/hooks/useProfile.ts`)
```typescript
// BEFORE
interface Profile {
  plan: string;
  files_used_this_month: number;
  email: string | null;
}

// AFTER
interface Profile {
  subscription_tier: string;
  credits_remaining: number;
  email: string | null;
}
```

### 2. Query Supabase (`src/hooks/useProfile.ts`)
```typescript
// BEFORE
.select('plan, files_used_this_month, email')

// AFTER
.select('subscription_tier, credits_remaining, email')
```

### 3. Default Values (`src/hooks/useProfile.ts`)
```typescript
// BEFORE
{
  plan: 'free',
  files_used_this_month: 0,
  email: user.email || null,
}

// AFTER
{
  subscription_tier: 'free',
  credits_remaining: 100,
  email: user.email || null,
}
```

### 4. Settings Page (`src/pages/Settings.tsx`)
```typescript
// BEFORE
{profile?.files_used_this_month ?? 0} files used this month
<Badge variant={profile?.plan === "pro" ? "default" : "secondary"}>
  {profile?.plan === "pro" ? "Pro" : "Free"}
</Badge>
{profile?.plan !== "pro" && (

// AFTER
{profile?.credits_remaining ?? 100} credits remaining
<Badge variant={profile?.subscription_tier === "pro" ? "default" : "secondary"}>
  {profile?.subscription_tier === "pro" ? "Pro" : 
   profile?.subscription_tier === "enterprise" ? "Enterprise" : "Free"}
</Badge>
{profile?.subscription_tier !== "pro" && profile?.subscription_tier !== "enterprise" && (
```

### 5. Dashboard Sidebar (`src/components/dashboard/DashboardSidebar.tsx`)
```typescript
// BEFORE
const maxFiles = profile?.plan === "pro" ? 50 : 5;
const usedFiles = profile?.files_used_this_month ?? 0;
const usagePercent = Math.min((usedFiles / maxFiles) * 100, 100);
const planLabel = profile?.plan === "pro" ? "Pro Plan" : "Free Plan";

// Display
{usedFiles} of {maxFiles} files
{usedFiles >= maxFiles && (

// AFTER
const maxFiles = profile?.subscription_tier === "pro" ? 50 : 
                 profile?.subscription_tier === "enterprise" ? 100 : 5;
const creditsRemaining = profile?.credits_remaining ?? 100;
const usagePercent = Math.max(0, Math.min(((100 - creditsRemaining) / 100) * 100, 100));
const planLabel = profile?.subscription_tier === "pro" ? "Pro Plan" : 
                  profile?.subscription_tier === "enterprise" ? "Enterprise Plan" : "Free Plan";

// Display
{creditsRemaining} credits left
{creditsRemaining <= 10 && (
```

## Subscription Tiers

### Free Tier
- Credits: 100 (default)
- Max files: 5
- Features: Basic

### Pro Tier
- Credits: Unlimited (or higher limit)
- Max files: 50
- Features: Advanced

### Enterprise Tier
- Credits: Unlimited
- Max files: 100
- Features: All features + priority support

## Usage Tracking

### Old System (Files)
- Tracked: `files_used_this_month`
- Limit: Based on plan (5 for free, 50 for pro)
- Reset: Monthly

### New System (Credits)
- Tracked: `credits_remaining`
- Starting: 100 credits
- Consumption: Per AI request or operation
- Refill: Based on subscription

## Migration Notes

Jika ada data lama dengan kolom `plan` dan `files_used_this_month`, perlu migration:

```sql
-- Add new columns if not exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'free',
ADD COLUMN IF NOT EXISTS credits_remaining INTEGER DEFAULT 100;

-- Migrate old data (if columns exist)
UPDATE public.profiles 
SET subscription_tier = plan 
WHERE plan IS NOT NULL;

-- Drop old columns (optional, after verification)
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS plan;
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS files_used_this_month;
```

## Testing Checklist

- [x] Profile query tidak error (200 OK)
- [x] Console tidak ada error "column does not exist"
- [x] Settings page menampilkan credits dengan benar
- [x] Sidebar menampilkan usage dengan benar
- [x] Badge menampilkan tier dengan benar (Free/Pro/Enterprise)
- [x] Upgrade button muncul saat credits <= 10
- [x] TypeScript tidak ada error

## Verifikasi Database

Jalankan query ini di Supabase SQL Editor:

```sql
-- Check table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles'
ORDER BY ordinal_position;

-- Check sample data
SELECT id, email, subscription_tier, credits_remaining, subscription_status
FROM public.profiles
LIMIT 5;

-- Check if old columns exist
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('plan', 'files_used_this_month');
```

## Expected Result

Setelah perbaikan:
1. ✅ Tidak ada error di console
2. ✅ Profile data ter-load dengan benar
3. ✅ UI menampilkan subscription tier dan credits
4. ✅ Usage tracker berfungsi
5. ✅ Upgrade button logic bekerja

## Files Changed

1. `src/hooks/useProfile.ts` - Interface dan query
2. `src/pages/Settings.tsx` - Display logic
3. `src/components/dashboard/DashboardSidebar.tsx` - Usage tracker
4. `AI_FIX_IMPLEMENTATION.md` - Documentation update
