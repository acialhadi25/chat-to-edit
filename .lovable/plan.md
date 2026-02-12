
# Fix: Scroll Area Terdorong ke Chat Panel

## Masalah Utama
`SidebarInset` di `Dashboard.tsx` menggunakan `min-h-svh` yang memungkinkan konten tumbuh melebihi viewport. Ketika file panjang di-upload, seluruh halaman (termasuk chat panel) ikut scroll ke bawah karena tidak ada constraint tinggi yang membatasi.

## Solusi
Perbaikan di 4 file -- mengunci tinggi viewport agar scroll hanya terjadi di area preview.

### 1. `src/pages/Dashboard.tsx`
- Ubah `SidebarInset` dari `min-h-svh` menjadi `h-svh` (bukan minimum, tapi fixed viewport height)
- Ini memastikan seluruh area konten tidak pernah melebihi viewport

### 2. `src/pages/ExcelDashboard.tsx`
- Tambahkan `overflow-hidden` pada root container `<div className="flex flex-1 flex-col h-full">` agar konten tidak bisa meluap
- Preview area (`overflow-hidden` di wrapper) sudah benar -- scroll ditangani di dalam `ExcelPreview` sendiri

### 3. `src/pages/PdfDashboard.tsx`
- Sama: tambahkan `overflow-hidden` pada root container

### 4. `src/pages/DocsDashboard.tsx`
- Sama: tambahkan `overflow-hidden` pada root container

## Detail Teknis

Perubahan CSS:

```text
Dashboard.tsx SidebarInset:
  min-h-svh  -->  h-svh

ExcelDashboard / PdfDashboard / DocsDashboard root div:
  "flex flex-1 flex-col h-full"
  -->  "flex flex-1 flex-col h-full overflow-hidden"
```

Dengan perubahan ini:
- Sidebar tetap fixed di kiri
- Chat panel tetap fixed di kanan (tidak ikut scroll)
- Hanya area preview di tengah yang bisa di-scroll (scroll internal)
- Upload file panjang tidak akan mendorong chat ke bawah
