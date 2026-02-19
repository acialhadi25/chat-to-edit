# Perbaikan Fitur AI - Tombol Fix & Error Handling

## Masalah yang Diperbaiki

### 1. Profile Fetch Error - Column Not Found (✅ FIXED)
**Masalah:** Query Supabase mencari kolom yang tidak ada
```
column profiles.plan does not exist
column profiles.files_used_this_month does not exist
```

**Root Cause:** 
Struktur tabel `profiles` di database menggunakan nama kolom yang berbeda:
- Database: `subscription_tier`, `credits_remaining`
- Code: `plan`, `files_used_this_month`

**Perbaikan:** 
- Mengubah interface Profile untuk match dengan struktur database
- Update query dari `select('plan, files_used_this_month, email')` ke `select('subscription_tier, credits_remaining, email')`
- Update semua referensi di komponen:
  - `profile.plan` → `profile.subscription_tier`
  - `profile.files_used_this_month` → `profile.credits_remaining`

**Files Updated:**
- `src/hooks/useProfile.ts` - Interface dan query
- `src/pages/Settings.tsx` - Display plan info
- `src/components/dashboard/DashboardSidebar.tsx` - Usage tracker

### 2. Tombol Fix/Apply Tidak Muncul (✅ IMPROVED)
**Masalah:** Tombol "Apply" dan "Reject" ada tapi tidak terlihat jelas

**Perbaikan:**
- Menambahkan deskripsi action yang lebih jelas
- Tombol "Apply Changes" dengan warna hijau yang lebih mencolok
- Menampilkan jumlah perubahan yang akan diterapkan
- Menambahkan tipe action yang tidak perlu tombol: `INSIGHTS`

**File:** `src/components/dashboard/ChatInterface.tsx`

### 3. Response Format AI
**Status:** Edge function sudah benar, format response sesuai dengan yang diharapkan

## Implementasi Tombol Fix

### Kondisi Tombol Muncul:
```typescript
// Tombol muncul jika:
1. message.action exists
2. message.action.status === 'pending'
3. action.type BUKAN salah satu dari:
   - 'CLARIFY' (butuh klarifikasi)
   - 'INFO' (hanya informasi)
   - 'DATA_AUDIT' (hanya audit)
   - 'INSIGHTS' (hanya insight)
```

### Tampilan Tombol:
```tsx
<Button
  size="sm"
  onClick={() => onApplyAction(message.action!)}
  disabled={isProcessing}
  className="gap-1 bg-green-600 hover:bg-green-700"
>
  <Check className="h-3 w-3" /> Apply Changes
</Button>

<Button
  size="sm"
  variant="outline"
  onClick={() => onRejectAction(message.action!.id!)}
  disabled={isProcessing}
  className="gap-1"
>
  <X className="h-3 w-3" /> Reject
</Button>
```

## Format Response AI yang Benar

Edge function mengirim response dalam format:
```json
{
  "content": "Penjelasan untuk user (markdown)",
  "action": {
    "type": "ACTION_TYPE",
    "target": { "type": "cell|range|column|row", "ref": "A1" },
    "changes": [
      { "cellRef": "A2", "before": "old", "after": "new", "type": "value" }
    ],
    "formula": "=SUM(A:A)",
    "description": "Deskripsi action"
  },
  "quickOptions": [
    { "id": "1", "label": "Label", "value": "message" }
  ]
}
```

## Parsing Response

File `src/utils/jsonParser.ts` menangani parsing dengan 4 strategi fallback:
1. Direct JSON parsing
2. Extract JSON from text (handles AI commentary)
3. Regex-based extraction
4. Fallback object

## Testing

### Test Manual:
1. Upload file Excel
2. Kirim perintah: "Tambahkan kolom Total"
3. Verifikasi:
   - ✅ Response AI muncul
   - ✅ Tombol "Apply Changes" (hijau) muncul
   - ✅ Tombol "Reject" muncul
   - ✅ Deskripsi action terlihat
   - ✅ Jumlah perubahan ditampilkan

### Test Error Handling:
1. Cek console - tidak ada error profile fetch
2. Cek network tab - request ke `/rest/v1/profiles` berhasil (200)

## Database Schema

### Tabel Profiles
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

### Interface TypeScript
```typescript
interface Profile {
  subscription_tier: string; // 'free' | 'pro' | 'enterprise'
  credits_remaining: number; // Default: 100
  email: string | null;
}
```

## Environment Variables yang Diperlukan

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key
```

Edge function memerlukan:
```env
LOVABLE_API_KEY=your_lovable_key
DEEPSEEK_API_KEY=your_deepseek_key (fallback)
```

## Troubleshooting

### Jika tombol tidak muncul:
1. Cek console untuk error parsing
2. Verifikasi `message.action` ada dan valid
3. Cek `message.action.status === 'pending'`
4. Pastikan `action.type` bukan CLARIFY/INFO/DATA_AUDIT/INSIGHTS

### Jika profile error masih muncul:
1. Cek struktur tabel `profiles` di Supabase
2. Pastikan kolom yang ada: `id`, `subscription_tier`, `credits_remaining`, `email`
3. Verifikasi RLS policies mengizinkan read
4. Jalankan migration terbaru: `20260219062613_initial_schema_complete.sql`

### Jika AI tidak merespon:
1. Cek environment variables
2. Cek edge function logs di Supabase
3. Verifikasi API keys valid
4. Cek network tab untuk error 402/429/500

## Next Steps

1. ✅ Test di browser dengan file Excel nyata
2. ✅ Verifikasi tombol Apply berfungsi
3. ✅ Test berbagai jenis action (INSERT_FORMULA, EDIT_CELL, dll)
4. ✅ Pastikan error handling bekerja dengan baik
