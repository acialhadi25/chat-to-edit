# Regulasi Pajak Indonesia untuk SaaS

## 1. PPN (Pajak Pertambahan Nilai / VAT)

### Tarif PPN 2025
Berdasarkan [PMK 131/2024](https://www.pajak.go.id/id/artikel/pmk-1312024-tarif-ppn-sebelas-dua-belas):

- **Tarif Standar**: 11% (untuk sebagian besar barang dan jasa)
- **Tarif Barang Mewah**: 12% (mulai 1 Januari 2025)
- **Ekspor**: 0%

Untuk layanan SaaS/software subscription di Indonesia:
- **Tarif yang berlaku: 11%** (bukan barang mewah)

### Penerapan PPN pada Transaksi
PPN dikenakan pada nilai transaksi dan harus dicantumkan dalam invoice.

**Contoh Perhitungan:**
```
Harga Langganan Pro: Rp 99.000
PPN 11%: Rp 10.890
Total yang dibayar: Rp 109.890
```

## 2. PPh 23 (Pajak Penghasilan Pasal 23)

### Tarif PPh 23
Berdasarkan regulasi perpajakan Indonesia:

- **Jasa Teknik, Manajemen, Konsultan**: 2%
- **Sewa (selain tanah/bangunan)**: 2%
- **Dividen, Bunga, Royalti**: 15%

Untuk layanan software/aplikasi SaaS:
- **Tarif yang berlaku: 2%** (kategori jasa teknik/konsultan)

### Kewajiban Pemotongan
- PPh 23 dipotong oleh **pemberi penghasilan** (payer/customer)
- Berlaku untuk transaksi B2B dengan badan usaha Indonesia
- Tidak berlaku untuk konsumen individu (B2C)

**Catatan Penting:**
- Untuk transaksi B2C (konsumen individu), PPh 23 tidak dipotong
- Untuk transaksi B2B, customer yang memotong dan melaporkan PPh 23

## 3. Midtrans Payment Gateway Fees

### Struktur Biaya Midtrans
Berdasarkan [dokumentasi resmi Midtrans](https://docs.midtrans.com/docs/how-much-does-midtrans-charge-for-its-payment-service):

#### Biaya per Metode Pembayaran:

1. **Credit Card (Kartu Kredit)**
   - MDR: 2.9% dari nilai transaksi
   - Contoh: Transaksi Rp 100.000 → Fee Rp 2.900

2. **Bank Transfer**
   - Fee: Rp 4.000 per transaksi
   - Flat fee, tidak tergantung nilai transaksi

3. **E-Wallet (GoPay, OVO, dll)**
   - Bervariasi, umumnya 2% - 2.5%

4. **QRIS**
   - MDR sesuai ketentuan Bank Indonesia: 0.7%

### PPN atas Biaya Midtrans
Midtrans mengenakan PPN 11% atas biaya layanan mereka.

**Contoh Perhitungan:**
```
Transaksi: Rp 100.000
Metode: Bank Transfer
Fee Midtrans: Rp 4.000
PPN 11% dari fee: Rp 440
Total fee: Rp 4.440
Yang diterima merchant: Rp 95.560
```

**Untuk Credit Card:**
```
Transaksi: Rp 100.000
MDR 2.9%: Rp 2.900
PPN 11% dari MDR: Rp 319
Total fee: Rp 3.219
Yang diterima merchant: Rp 96.781
```

## 4. Implementasi untuk Aplikasi

### Rekomendasi Struktur Harga

#### Opsi 1: Harga Sudah Termasuk PPN (Tax Inclusive)
```
Pro Plan: Rp 99.000 (sudah termasuk PPN)
- Harga dasar: Rp 89.189
- PPN 11%: Rp 9.811
- Total: Rp 99.000
```

#### Opsi 2: Harga Belum Termasuk PPN (Tax Exclusive) - RECOMMENDED
```
Pro Plan: Rp 99.000 + PPN
- Harga dasar: Rp 99.000
- PPN 11%: Rp 10.890
- Total yang dibayar: Rp 109.890
```

### Perhitungan Nett Revenue

**Untuk Pro Plan (Rp 99.000 + PPN):**
```
Total dibayar customer: Rp 109.890
PPN 11% (disetor ke negara): Rp 10.890
Gross revenue: Rp 99.000

Midtrans fee (Bank Transfer):
- Fee: Rp 4.000
- PPN fee: Rp 440
- Total fee: Rp 4.440

Net revenue: Rp 99.000 - Rp 4.440 = Rp 94.560
```

**Untuk Enterprise Plan (Rp 499.000 + PPN):**
```
Total dibayar customer: Rp 553.890
PPN 11%: Rp 54.890
Gross revenue: Rp 499.000

Midtrans fee (Bank Transfer):
- Fee: Rp 4.000
- PPN fee: Rp 440
- Total fee: Rp 4.440

Net revenue: Rp 499.000 - Rp 4.440 = Rp 494.560
```

## 5. Kewajiban Pelaporan

### Untuk Merchant (Penyedia Layanan SaaS)

1. **Pelaporan PPN**
   - Wajib lapor SPT Masa PPN setiap bulan
   - Setor PPN yang dipungut ke kas negara
   - Buat faktur pajak untuk setiap transaksi

2. **Pelaporan PPh Badan**
   - Lapor penghasilan dari subscription dalam SPT Tahunan
   - Bayar PPh Badan sesuai ketentuan

3. **Bukti Potong PPh 23** (untuk transaksi B2B)
   - Terima bukti potong dari customer yang memotong PPh 23
   - Gunakan sebagai kredit pajak

## 6. Rekomendasi Implementasi

### Database Schema
Tambahkan field untuk tracking pajak:
```sql
- base_amount (harga dasar)
- vat_rate (tarif PPN, default 11%)
- vat_amount (nilai PPN)
- gross_amount (base + VAT)
- payment_fee (biaya payment gateway)
- payment_fee_vat (PPN atas biaya gateway)
- net_amount (yang diterima merchant)
```

### Invoice
Invoice harus mencantumkan:
- Harga dasar (base amount)
- PPN 11% (VAT)
- Total yang dibayar (gross amount)
- Nomor NPWP merchant (jika PKP)
- Nomor faktur pajak (jika PKP)

### Catatan Penting
- Jika omzet di bawah Rp 4.8 miliar/tahun, bisa tidak PKP (tidak wajib pungut PPN)
- Jika sudah PKP, wajib pungut PPN dan buat faktur pajak
- Konsultasikan dengan konsultan pajak untuk implementasi yang tepat

## Referensi
- [PMK 131/2024 - Tarif PPN](https://www.pajak.go.id/id/artikel/pmk-1312024-tarif-ppn-sebelas-dua-belas)
- [Midtrans Pricing Documentation](https://docs.midtrans.com/docs/how-much-does-midtrans-charge-for-its-payment-service)
- Peraturan PPh 23 untuk jasa teknik dan konsultan

---
**Disclaimer:** Informasi ini bersifat umum dan dapat berubah. Konsultasikan dengan konsultan pajak profesional untuk implementasi yang sesuai dengan kondisi bisnis Anda.
