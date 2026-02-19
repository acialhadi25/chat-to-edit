# Panduan Testing Fitur AI

## Persiapan Testing

### 1. Verifikasi Environment Variables
```bash
# Cek file .env
cat .env

# Pastikan ada:
VITE_SUPABASE_URL=https://iatfkqwwmjohrvdfnmwm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJ...
```

### 2. Verifikasi Edge Function
```bash
# Cek apakah edge function sudah di-deploy
# Di Supabase Dashboard > Edge Functions > chat
# Atau test dengan curl:

curl -X POST https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/chat \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}],"excelContext":null}'
```

### 3. Start Development Server
```bash
npm run dev
# atau
bun dev
```

## Test Cases

### Test 1: Profile Loading (✅ Fixed)
**Tujuan:** Memastikan profile fetch tidak error

**Steps:**
1. Login ke aplikasi
2. Buka Developer Console (F12)
3. Cek Network tab
4. Refresh halaman

**Expected Result:**
- ✅ Request ke `/rest/v1/profiles?select=plan,files_used_this_month,email&id=eq.USER_ID` berhasil (200)
- ✅ Tidak ada error "Profile fetch error" di console
- ✅ Profile data ter-load dengan benar

**Jika Gagal:**
- Cek struktur tabel `profiles` di Supabase
- Pastikan kolom `id` ada (bukan `user_id`)
- Verifikasi RLS policies

---

### Test 2: AI Response dengan Tombol Fix
**Tujuan:** Memastikan AI merespon dan tombol Apply/Reject muncul

**Steps:**
1. Upload file Excel (contoh: data penjualan)
2. Kirim perintah: "Tambahkan kolom Total yang menjumlahkan kolom Harga dan Jumlah"
3. Tunggu response AI

**Expected Result:**
- ✅ AI merespon dengan penjelasan
- ✅ Tombol "Apply Changes" (hijau) muncul
- ✅ Tombol "Reject" muncul
- ✅ Deskripsi action terlihat (contoh: "Insert formula =SUM(B2:C2)")
- ✅ Jumlah perubahan ditampilkan (contoh: "5 changes will be applied")

**Screenshot Expected:**
```
┌─────────────────────────────────────────┐
│ 🤖 AI Assistant                         │
│                                         │
│ Saya akan menambahkan kolom Total      │
│ dengan formula =B{row}+C{row}          │
│                                         │
│ ┌─────────────────────────────────┐   │
│ │ Insert formula into column D    │   │
│ └─────────────────────────────────┘   │
│                                         │
│ 5 changes will be applied              │
│                                         │
│ [✓ Apply Changes] [✗ Reject]          │
└─────────────────────────────────────────┘
```

**Jika Gagal:**
- Cek console untuk error parsing
- Verifikasi response AI di Network tab
- Cek apakah `action.status === 'pending'`

---

### Test 3: Apply Action
**Tujuan:** Memastikan tombol Apply berfungsi

**Steps:**
1. Lanjutkan dari Test 2
2. Klik tombol "Apply Changes"
3. Lihat perubahan di spreadsheet

**Expected Result:**
- ✅ Tombol berubah menjadi disabled saat processing
- ✅ Perubahan diterapkan ke spreadsheet
- ✅ Status action berubah dari 'pending' ke 'applied'
- ✅ Tombol hilang setelah applied
- ✅ Toast notification muncul (success)

---

### Test 4: Reject Action
**Tujuan:** Memastikan tombol Reject berfungsi

**Steps:**
1. Kirim perintah AI lagi: "Hapus kolom A"
2. Tunggu response
3. Klik tombol "Reject"

**Expected Result:**
- ✅ Status action berubah ke 'rejected'
- ✅ Tombol hilang
- ✅ Tidak ada perubahan di spreadsheet
- ✅ Toast notification muncul (info)

---

### Test 5: Action Tanpa Tombol (INFO/CLARIFY)
**Tujuan:** Memastikan action tipe INFO tidak menampilkan tombol

**Steps:**
1. Kirim perintah: "Apa itu Excel?"
2. Tunggu response

**Expected Result:**
- ✅ AI merespon dengan informasi
- ✅ TIDAK ada tombol Apply/Reject
- ✅ Hanya menampilkan konten text

---

### Test 6: Error Handling - Rate Limit
**Tujuan:** Memastikan error handling bekerja

**Steps:**
1. Kirim banyak request berturut-turut (spam)
2. Tunggu response

**Expected Result:**
- ✅ Toast error muncul dengan pesan rate limit
- ✅ Tidak ada crash
- ✅ User bisa retry setelah beberapa detik

---

### Test 7: Error Handling - Network Error
**Tujuan:** Memastikan error handling untuk network issues

**Steps:**
1. Matikan internet / block request di DevTools
2. Kirim perintah AI
3. Tunggu response

**Expected Result:**
- ✅ Toast error muncul: "Network Connection Error"
- ✅ Suggestions ditampilkan
- ✅ Tidak ada crash

---

### Test 8: Streaming Response
**Tujuan:** Memastikan streaming berfungsi dengan baik

**Steps:**
1. Kirim perintah yang memerlukan response panjang
2. Perhatikan response muncul

**Expected Result:**
- ✅ Response muncul secara bertahap (streaming)
- ✅ Cursor animasi muncul saat streaming
- ✅ Tidak ada lag atau freeze
- ✅ Response lengkap setelah streaming selesai

---

### Test 9: Multiple Actions
**Tujuan:** Memastikan multiple actions bisa di-handle

**Steps:**
1. Kirim perintah: "Tambahkan kolom Total"
2. Apply action
3. Kirim perintah lagi: "Urutkan berdasarkan Total descending"
4. Apply action

**Expected Result:**
- ✅ Kedua action berhasil diterapkan
- ✅ History chat tersimpan
- ✅ Spreadsheet ter-update dengan benar

---

### Test 10: Formula Preview
**Tujuan:** Memastikan formula ditampilkan dengan benar

**Steps:**
1. Kirim perintah: "Buat formula SUM untuk kolom A"
2. Tunggu response

**Expected Result:**
- ✅ Formula ditampilkan dalam code block
- ✅ Tombol copy formula muncul
- ✅ Klik copy berhasil copy formula ke clipboard
- ✅ Toast "Formula Copied!" muncul

---

## Checklist Lengkap

### UI/UX
- [ ] Tombol Apply berwarna hijau dan jelas
- [ ] Tombol Reject terlihat
- [ ] Deskripsi action informatif
- [ ] Jumlah perubahan ditampilkan
- [ ] Loading state terlihat saat processing
- [ ] Toast notifications muncul dengan benar

### Functionality
- [ ] Profile loading tanpa error
- [ ] AI response streaming berfungsi
- [ ] Parsing JSON response berhasil
- [ ] Apply action bekerja
- [ ] Reject action bekerja
- [ ] Formula copy bekerja
- [ ] Error handling bekerja

### Performance
- [ ] Response time < 5 detik
- [ ] Tidak ada memory leak
- [ ] Streaming smooth tanpa lag
- [ ] UI tidak freeze saat processing

### Error Handling
- [ ] Rate limit error handled
- [ ] Network error handled
- [ ] Parse error handled
- [ ] API error handled
- [ ] Timeout handled

## Debugging Tips

### Jika AI tidak merespon:
```javascript
// Cek di console:
console.log('Messages:', messages);
console.log('Excel Context:', excelContext);

// Cek Network tab:
// - Request ke /functions/v1/chat
// - Status code (200, 429, 402, 500)
// - Response body
```

### Jika tombol tidak muncul:
```javascript
// Cek di console:
console.log('Message action:', message.action);
console.log('Action status:', message.action?.status);
console.log('Action type:', message.action?.type);

// Verifikasi kondisi:
// 1. action exists
// 2. status === 'pending'
// 3. type NOT IN ['CLARIFY', 'INFO', 'DATA_AUDIT', 'INSIGHTS']
```

### Jika parsing error:
```javascript
// Cek di console:
console.log('Parse result:', parseResult);
console.log('Parse method:', parseResult.parseMethod);
console.log('Warnings:', parseResult.warnings);
```

## Performance Monitoring

### Metrics to Track:
1. **Response Time:** Waktu dari kirim request sampai response lengkap
2. **Parse Success Rate:** Berapa persen response berhasil di-parse
3. **Action Success Rate:** Berapa persen action berhasil diterapkan
4. **Error Rate:** Berapa persen request mengalami error

### Tools:
- Chrome DevTools Performance tab
- Network tab untuk timing
- Console untuk logs
- Sentry (jika sudah setup) untuk error tracking

## Kesimpulan

Setelah semua test case di atas berhasil, fitur AI sudah siap untuk production. Pastikan:
1. ✅ Semua test case passed
2. ✅ Tidak ada error di console
3. ✅ Performance acceptable
4. ✅ Error handling robust
5. ✅ UI/UX user-friendly
