

# Rencana Aksi: Perbaikan Build Errors dan Peningkatan Kualitas Tools

## Ringkasan Masalah

Ada 7 build errors yang harus diperbaiki terlebih dahulu, kemudian beberapa peningkatan kualitas tools yang perlu dilakukan.

---

## Bagian 1: Perbaikan Build Errors (Kritis)

### 1.1 TS2454 - Variable 'response' used before assigned (3 file edge functions)

File `chat/index.ts`, `chat-pdf/index.ts`, dan `chat-docs/index.ts` memiliki bug yang sama: variabel `response` dideklarasikan dengan `let` tapi bisa sampai ke blok pengecekan `if (!response! || !response.ok)` tanpa pernah di-assign (jika primary gagal fetch dan tidak ada fallback key).

**Perbaikan:** Tambahkan `let response: Response | undefined;` di awal, lalu ubah pengecekan menjadi `if (!response || !response.ok)` (tanpa non-null assertion `!`).

### 1.2 TS2304 - Cannot find name 'Merge' di Features.tsx

Icon `Merge` dipakai di line 139 tapi tidak di-import dari lucide-react.

**Perbaikan:** Tambahkan `Merge` ke import statement, atau ganti dengan icon `Files` yang sudah di-import.

---

## Bagian 2: Peningkatan Kualitas Chat to Excel

### 2.1 Masalah CONDITIONAL_FORMAT Operator Mismatch

Pada `ExcelDashboard.tsx`, handler `CONDITIONAL_FORMAT` menggunakan operator `greater_than`, `less_than`, `equal_to`, `contains` -- tapi system prompt AI mengirim operator `>`, `<`, `=`, `contains`. Ini menyebabkan conditional formatting tidak pernah match.

**Perbaikan:** Update switch case di handler untuk mendukung kedua format operator (`>` DAN `greater_than`, `<` DAN `less_than`, dll).

### 2.2 FILTER_DATA Target Type Flexibility

Saat ini `FILTER_DATA` hanya bekerja jika `action.target?.type === "column"`. Tapi AI kadang mengirim `target.type === "range"` atau bahkan tidak mengirim target sama sekali tapi menyertakan `sortColumn`/column letter di field lain.

**Perbaikan:** Tambahkan fallback: jika target tidak ada tapi ada `sortColumn` atau `filterColumn`, gunakan itu sebagai kolom referensi.

### 2.3 getDataAnalysis Tidak Mengembalikan uniqueValuesPerColumn

Interface `getDataAnalysis` di `ChatInterface.tsx` (line 48-54) tidak menyertakan `uniqueValuesPerColumn` dalam return type. Unique values sudah dihitung terpisah di `sendMessage`, tapi seharusnya bisa disatukan agar lebih konsisten.

**Perbaikan:** Ini sudah bekerja via field terpisah -- tidak perlu perubahan, tapi bisa di-refactor untuk kebersihan.

### 2.4 COPY_COLUMN Handler Missing Case

`copyColumn` di-import dari `excelOperations.ts` tapi tidak ada case di switch statement `handleApplyAction`.

**Perbaikan:** Tambahkan case `COPY_COLUMN` dan tambahkan ke `actionValidation.ts`.

### 2.5 REMOVE_FORMULA Tidak Ada di Validation

`REMOVE_FORMULA` digunakan di switch case handler tapi tidak ada di daftar `validTypes` di `actionValidation.ts`.

**Perbaikan:** Tambahkan `REMOVE_FORMULA` ke daftar valid types.

---

## Bagian 3: Peningkatan Robustness

### 3.1 allSheets Sync Setelah Operasi

Setelah operasi seperti FILTER_DATA, SORT_DATA, dll, data sheet aktif diubah tapi `allSheets` tidak di-update. Ini berarti jika user switch sheet lalu kembali, perubahan hilang.

**Perbaikan:** Setelah setiap operasi di `handleApplyAction`, sync `allSheets[currentSheet]` dengan data terbaru.

### 3.2 Error Handling untuk AI Response Parsing

Jika AI mengembalikan JSON yang tidak valid atau format yang tidak sesuai, user hanya melihat error generic. 

**Perbaikan:** Tambahkan fallback yang menampilkan konten mentah AI sebagai pesan teks biasa jika parsing gagal.

---

## Detail Teknis Per File

### File 1: `supabase/functions/chat/index.ts`
- Ubah `let response` menjadi `let response: Response | undefined`
- Ubah `if (!response! || !response.ok)` menjadi `if (!response || !response.ok)`

### File 2: `supabase/functions/chat-pdf/index.ts`
- Sama: fix `response` typing dan null check

### File 3: `supabase/functions/chat-docs/index.ts`
- Sama: fix `response` typing dan null check

### File 4: `src/components/landing/Features.tsx`
- Tambahkan `Merge` ke import dari `lucide-react`

### File 5: `src/utils/actionValidation.ts`
- Tambahkan `REMOVE_FORMULA`, `COPY_COLUMN` ke `validTypes`

### File 6: `src/pages/ExcelDashboard.tsx`
- Fix CONDITIONAL_FORMAT operator mapping (support `>`, `<`, `=`, `!=` selain `greater_than`, etc.)
- Tambahkan case `COPY_COLUMN`
- Sync `allSheets` setelah setiap operasi berhasil

---

## Urutan Implementasi

1. Fix build errors (3 edge functions + Features.tsx) -- **prioritas tertinggi**
2. Fix CONDITIONAL_FORMAT operator mismatch
3. Tambahkan missing action types ke validation
4. Tambahkan COPY_COLUMN handler
5. Sync allSheets setelah operasi
6. Deploy edge functions

