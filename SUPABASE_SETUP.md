# 🚀 Supabase Setup Guide

## 📋 Overview

Panduan lengkap untuk setup Supabase project baru untuk aplikasi Chat to Excel.

## 🔑 Credentials

**Project Details:**
- Project ID: `iatfkqwwmjohrvdfnmwm`
- Project URL: `https://iatfkqwwmjohrvdfnmwm.supabase.co`

**API Keys:**
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (sudah di .env)
- Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` (untuk backend)
- Access Token: `sbp_9506ffb4dd76c26954024aa9a40fff1bed95d2e0` (untuk CLI)

## 🛠️ Setup Steps

### 1. Environment Variables

File `.env` sudah dibuat dengan konfigurasi:

```env
VITE_SUPABASE_URL=https://iatfkqwwmjohrvdfnmwm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_PROJECT_ID=iatfkqwwmjohrvdfnmwm
```

### 2. Database Setup

#### Option A: Manual Setup (Recommended)

1. **Buka Supabase Dashboard**
   ```
   https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm
   ```

2. **Jalankan SQL Migration**
   - Go to: SQL Editor
   - Copy isi file `supabase/migrations/00_initial_schema.sql`
   - Paste dan Run

3. **Verify Tables Created**
   - Go to: Table Editor
   - Check tables: profiles, file_history, chat_history, templates, payments

#### Option B: Using CLI

```powershell
# Install Supabase CLI locally
npm install --save-dev supabase

# Login
$env:SUPABASE_ACCESS_TOKEN = "sbp_9506ffb4dd76c26954024aa9a40fff1bed95d2e0"
npx supabase link --project-ref iatfkqwwmjohrvdfnmwm

# Push migrations
npx supabase db push
```

### 3. Deploy Edge Functions

#### Option A: Using Deploy Script (Easiest)

```powershell
.\deploy-supabase.ps1
```

#### Option B: Manual Deploy

```powershell
# Deploy each function
npx supabase functions deploy chat --no-verify-jwt
npx supabase functions deploy chat-docs --no-verify-jwt
npx supabase functions deploy chat-pdf --no-verify-jwt
```

#### Option C: Via Supabase Dashboard

1. Go to: Edge Functions
2. Create new function untuk setiap function:
   - `chat` - Copy dari `supabase/functions/chat/index.ts`
   - `chat-docs` - Copy dari `supabase/functions/chat-docs/index.ts`
   - `chat-pdf` - Copy dari `supabase/functions/chat-pdf/index.ts`

### 4. Set Environment Secrets

**Di Supabase Dashboard:**

1. Go to: Project Settings → Edge Functions
2. Add secrets:

```
DEEPSEEK_API_KEY=sk-your-deepseek-api-key
LOVABLE_API_KEY=your-lovable-api-key (optional)
MIDTRANS_SERVER_KEY=your-midtrans-server-key
```

**Cara mendapatkan API Keys:**

- **DeepSeek API Key**: https://platform.deepseek.com/api_keys
- **Lovable API Key**: https://lovable.dev/dashboard (optional, untuk fallback)
- **Midtrans Server Key**: https://dashboard.midtrans.com/ atau https://dashboard.sandbox.midtrans.com/

### 5. Configure Authentication

1. **Go to: Authentication → Providers**
2. **Enable Email Provider**
   - Enable email sign-up
   - Disable email confirmations (untuk development)
   - Set site URL: `http://localhost:5173`

3. **Add Redirect URLs**
   - `http://localhost:5173`
   - `https://your-production-domain.com` (nanti)

4. **Configure Email Templates** (Optional)
   - Customize confirmation email
   - Customize reset password email

### 6. Setup Storage (Optional)

Jika aplikasi perlu upload file:

1. **Go to: Storage**
2. **Create bucket**: `excel-files`
3. **Set policies**:
   ```sql
   -- Allow authenticated users to upload
   CREATE POLICY "Users can upload own files"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'excel-files' AND auth.uid()::text = (storage.foldername(name))[1]);
   
   -- Allow users to read own files
   CREATE POLICY "Users can read own files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'excel-files' AND auth.uid()::text = (storage.foldername(name))[1]);
   ```

## 🧪 Testing

### 1. Test Database Connection

```typescript
// Test di browser console
const { data, error } = await supabase.from('profiles').select('*');
console.log(data, error);
```

### 2. Test Authentication

```bash
npm run dev
# Go to http://localhost:5173
# Try register/login
```

### 3. Test Edge Functions

```bash
# Test chat function
curl -X POST https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## 📊 Database Schema

### Tables

1. **profiles** - User profiles
   - id (UUID, PK)
   - email (TEXT)
   - full_name (TEXT)
   - subscription_tier (TEXT)
   - credits_remaining (INTEGER)

2. **file_history** - Uploaded files history
   - id (UUID, PK)
   - user_id (UUID, FK)
   - file_name (TEXT)
   - row_count (INTEGER)

3. **chat_history** - Chat messages
   - id (UUID, PK)
   - user_id (UUID, FK)
   - role (TEXT)
   - content (TEXT)

4. **templates** - Excel templates
   - id (UUID, PK)
   - user_id (UUID, FK)
   - name (TEXT)
   - headers (TEXT[])
   - sample_data (JSONB)

5. **payments** - Payment transactions
   - id (UUID, PK)
   - user_id (UUID, FK)
   - order_id (TEXT)
   - gross_amount (DECIMAL)

## 🔒 Security

### Row Level Security (RLS)

Semua tables sudah dilindungi dengan RLS:
- Users hanya bisa akses data mereka sendiri
- Templates bisa public atau private
- Payments hanya bisa dilihat oleh owner

### API Keys

- **Anon Key**: Untuk frontend (public)
- **Service Role Key**: Untuk backend/admin (JANGAN expose ke frontend!)
- **Access Token**: Untuk CLI deployment

## 🚨 Troubleshooting

### Error: "Invalid API key"

**Solution:**
- Check `.env` file
- Verify anon key di Supabase Dashboard
- Restart dev server

### Error: "relation does not exist"

**Solution:**
- Run database migrations
- Check SQL Editor untuk errors
- Verify tables created

### Error: "Function not found"

**Solution:**
- Deploy edge functions
- Check function logs di Dashboard
- Verify function names

### Error: "JWT expired"

**Solution:**
- Refresh page
- Re-login
- Check auth configuration

## 📝 Next Steps

1. ✅ Setup environment variables
2. ✅ Create database schema
3. ✅ Deploy edge functions
4. ✅ Configure authentication
5. ⏳ Set API keys (DeepSeek, Midtrans)
6. ⏳ Test application
7. ⏳ Deploy to production

## 🔗 Useful Links

- **Supabase Dashboard**: https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm
- **SQL Editor**: https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/sql
- **Edge Functions**: https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/functions
- **Authentication**: https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/auth/users
- **Storage**: https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/storage/buckets
- **Logs**: https://supabase.com/dashboard/project/iatfkqwwmjohrvdfnmwm/logs/explorer

## 💡 Tips

1. **Development**: Gunakan anon key di `.env`
2. **Production**: Set environment variables di hosting platform
3. **Security**: Jangan commit `.env` ke git (sudah di `.gitignore`)
4. **Backup**: Export database regularly
5. **Monitoring**: Check logs di Dashboard untuk errors

---

**Setup by:** Kiro AI Assistant  
**Date:** 2026-02-19  
**Status:** ✅ Ready for deployment
