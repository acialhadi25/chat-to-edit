# Tax & Invoice Implementation Guide

## Overview
Implementasi sistem pajak Indonesia dan invoice PDF untuk aplikasi Chat to Edit.

## 1. Regulasi Pajak yang Diterapkan

### PPN (Pajak Pertambahan Nilai)
- **Tarif**: 11% (berlaku 2025)
- **Dasar Hukum**: PMK 131/2024
- **Penerapan**: Semua transaksi subscription (B2C dan B2B)

### PPh 23 (Pajak Penghasilan Pasal 23)
- **Tarif**: 2% untuk jasa teknik/konsultan
- **Penerapan**: Hanya untuk transaksi B2B (badan usaha)
- **Catatan**: Dipotong oleh customer, bukan merchant

### Biaya Midtrans
- **Bank Transfer**: Rp 4.000 + PPN 11% = Rp 4.440
- **Credit Card**: 2.9% + PPN 11%
- **E-Wallet**: 2% + PPN 11%
- **QRIS**: 0.7% + PPN 11%

## 2. Struktur Harga

### Harga Saat Ini (Tax Exclusive - RECOMMENDED)

#### Free Plan
```
Base: Rp 0
PPN 11%: Rp 0
Total: Rp 0
Credits: 50/month
```

#### Pro Plan
```
Base: Rp 99.000
PPN 11%: Rp 10.890
Total: Rp 109.890
Credits: 2.000/month
```

#### Enterprise Plan
```
Base: Rp 499.000
PPN 11%: Rp 54.890
Total: Rp 553.890
Credits: 10.000/month
```

## 3. Perhitungan Net Revenue

### Pro Plan (Bank Transfer)
```
Customer pays: Rp 109.890
├─ Base amount: Rp 99.000
└─ PPN 11%: Rp 10.890 (disetor ke negara)

Midtrans fee:
├─ Fee: Rp 4.000
└─ PPN fee: Rp 440
Total fee: Rp 4.440

Net revenue: Rp 109.890 - Rp 10.890 - Rp 4.440 = Rp 94.560
```

### Enterprise Plan (Bank Transfer)
```
Customer pays: Rp 553.890
├─ Base amount: Rp 499.000
└─ PPN 11%: Rp 54.890

Midtrans fee: Rp 4.440

Net revenue: Rp 553.890 - Rp 54.890 - Rp 4.440 = Rp 494.560
```

### Pro Plan (Credit Card)
```
Customer pays: Rp 109.890
Base: Rp 99.000
PPN: Rp 10.890

Midtrans MDR:
├─ 2.9% of Rp 109.890 = Rp 3.187
└─ PPN 11%: Rp 351
Total fee: Rp 3.538

Net revenue: Rp 109.890 - Rp 10.890 - Rp 3.538 = Rp 95.462
```

## 4. Files Implemented

### Tax Calculator (`src/utils/taxCalculator.ts`)
Utility untuk menghitung semua pajak dan biaya:

```typescript
import { calculateTaxes, formatIDR } from '@/utils/taxCalculator';

// Calculate for Pro Plan with Bank Transfer
const result = calculateTaxes(99000, 'bank_transfer');

console.log({
  baseAmount: formatIDR(result.baseAmount),      // Rp 99.000
  vatAmount: formatIDR(result.vatAmount),        // Rp 10.890
  grossAmount: formatIDR(result.grossAmount),    // Rp 109.890
  paymentFee: formatIDR(result.paymentFee),      // Rp 4.000
  paymentFeeVat: formatIDR(result.paymentFeeVat), // Rp 440
  netAmount: formatIDR(result.netAmount),        // Rp 105.450
});
```

### Invoice Generator (`src/utils/invoiceGenerator.ts`)
Generate PDF invoice menggunakan pdf-lib:

```typescript
import { generateInvoicePDF } from '@/utils/invoiceGenerator';

await generateInvoicePDF({
  orderId: 'ORDER-123',
  date: new Date(),
  customerEmail: 'customer@example.com',
  customerId: 'user-id-123',
  tierName: 'Pro',
  amount: 109890,
  paymentType: 'Bank Transfer',
  status: 'settlement',
  baseAmount: 99000,
  vatRate: 0.11,
  vatAmount: 10890,
});
```

### Billing History Component
Updated untuk menggunakan PDF generator:
- Download invoice dalam format PDF (bukan HTML)
- Menampilkan breakdown pajak yang benar
- Integrasi dengan tax calculator

## 5. Database Schema

### Recommended Fields untuk Transactions Table

```sql
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS base_amount INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS vat_rate DECIMAL(5,4) DEFAULT 0.11;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS vat_amount INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_fee INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS payment_fee_vat INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS net_amount INTEGER;

-- Update existing records
UPDATE transactions 
SET 
  base_amount = ROUND(amount / 1.11),
  vat_rate = 0.11,
  vat_amount = amount - ROUND(amount / 1.11),
  payment_fee = 4000,
  payment_fee_vat = 440,
  net_amount = amount - 4440
WHERE base_amount IS NULL;
```

## 6. Invoice Format

### PDF Invoice Includes:
- ✅ Company header (Chat to Edit)
- ✅ Invoice number (order_id)
- ✅ Date
- ✅ Customer information
- ✅ Payment method
- ✅ Status badge (PAID/PENDING)
- ✅ Item description (Plan name)
- ✅ Base amount
- ✅ PPN 11% breakdown
- ✅ Total amount
- ✅ Professional footer

### Sample Invoice Structure:
```
┌─────────────────────────────────────┐
│ Chat to Edit                        │
│ AI-Powered Excel Assistant          │
│                                     │
│ INVOICE                    [PAID]   │
├─────────────────────────────────────┤
│ Invoice: ORDER-123                  │
│ Date: 20 Februari 2025              │
│                                     │
│ Bill To: customer@example.com       │
│ Payment: Bank Transfer              │
├─────────────────────────────────────┤
│ Description              Amount     │
├─────────────────────────────────────┤
│ Pro Plan Subscription              │
│ Monthly subscription   Rp 99.000   │
├─────────────────────────────────────┤
│                                     │
│              Subtotal: Rp 99.000    │
│              PPN (11%): Rp 10.890   │
│              ─────────────────────   │
│              Total: Rp 109.890      │
├─────────────────────────────────────┤
│ Thank you for your business!        │
│ support@chattoedit.com              │
└─────────────────────────────────────┘
```

## 7. Testing

### Test Tax Calculator
```typescript
import { TAX_EXAMPLES } from '@/utils/taxCalculator';

console.log('Pro B2C:', TAX_EXAMPLES.proB2C);
console.log('Pro B2B:', TAX_EXAMPLES.proB2B);
console.log('Enterprise B2C:', TAX_EXAMPLES.enterpriseB2C);
```

### Test Invoice Generation
1. Login ke aplikasi
2. Buka menu "Subscription & Billing"
3. Scroll ke "Billing History"
4. Klik tombol "PDF" pada transaksi yang sudah PAID
5. PDF invoice akan otomatis terdownload

## 8. Next Steps

### Immediate (Required)
- [ ] Update pricing page untuk menampilkan harga + PPN
- [ ] Update checkout page untuk breakdown pajak
- [ ] Update database schema untuk menyimpan tax breakdown
- [ ] Update Midtrans transaction handler untuk calculate tax

### Short Term (Recommended)
- [ ] Tambah tax settings di admin panel
- [ ] Implementasi B2B mode (dengan PPh 23)
- [ ] Tambah NPWP field untuk customer B2B
- [ ] Generate faktur pajak untuk PKP

### Long Term (Optional)
- [ ] Integrasi dengan sistem akuntansi
- [ ] Auto-generate laporan pajak bulanan
- [ ] Dashboard analytics untuk tax reporting
- [ ] Multi-currency support

## 9. Compliance Checklist

### Untuk Merchant (Penyedia Layanan)
- [ ] Daftar NPWP
- [ ] Daftar PKP (jika omzet > Rp 4.8M/tahun)
- [ ] Setup sistem faktur pajak elektronik
- [ ] Lapor SPT Masa PPN setiap bulan
- [ ] Setor PPN yang dipungut
- [ ] Simpan bukti potong PPh 23 (untuk B2B)

### Untuk Customer B2B
- [ ] Potong PPh 23 (2%) saat bayar
- [ ] Buat bukti potong PPh 23
- [ ] Setor PPh 23 ke kas negara
- [ ] Lapor SPT Masa PPh 23

## 10. Support & Resources

### Documentation
- [Tax Regulation Indonesia](./TAX_REGULATION_INDONESIA.md)
- [Midtrans Pricing](https://docs.midtrans.com/docs/how-much-does-midtrans-charge-for-its-payment-service)
- [PMK 131/2024](https://www.pajak.go.id/id/artikel/pmk-1312024-tarif-ppn-sebelas-dua-belas)

### Contact
- Tax Consultant: [Konsultan Pajak]
- Midtrans Support: support@midtrans.com
- App Support: support@chattoedit.com

---

**Last Updated**: 20 Februari 2025
**Version**: 1.0.0
