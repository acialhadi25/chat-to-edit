# Midtrans URL Configuration Guide

## Overview
Midtrans memerlukan beberapa URL untuk mengirim notifikasi dan redirect user setelah pembayaran. Dokumen ini menjelaskan semua URL yang perlu dikonfigurasi.

## URLs yang Diperlukan

### 1. Payment Notification URL (Webhook) ⭐ PALING PENTING
**Fungsi**: Midtrans mengirim notifikasi status pembayaran ke URL ini
**URL**: `https://your-project.supabase.co/functions/v1/midtrans-webhook`

**Contoh untuk project Anda**:
```
https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook
```

**Kapan dipanggil**:
- Saat pembayaran berhasil (settlement)
- Saat pembayaran pending
- Saat pembayaran gagal (deny, cancel, expire)
- Saat refund

**Status yang dikirim**:
- `capture` - Kartu kredit berhasil di-capture
- `settlement` - Pembayaran berhasil
- `pending` - Pembayaran pending
- `deny` - Pembayaran ditolak
- `cancel` - Pembayaran dibatalkan
- `expire` - Pembayaran expired
- `refund` - Pembayaran di-refund

### 2. Recurring Notification URL
**Fungsi**: Untuk subscription recurring (pembayaran berulang)
**URL**: `https://your-project.supabase.co/functions/v1/midtrans-recurring`

**Status**: OPTIONAL (untuk future implementation)
**Catatan**: Saat ini kita belum implement recurring subscription, jadi bisa dikosongkan dulu atau gunakan webhook yang sama.

### 3. Pay Account Notification URL
**Fungsi**: Notifikasi untuk Pay Account (GoPay, ShopeePay linking)
**URL**: `https://your-project.supabase.co/functions/v1/midtrans-pay-account`

**Status**: OPTIONAL
**Catatan**: Hanya diperlukan jika menggunakan fitur Pay Account linking.

### 4. Finish Redirect URL ✅ PENTING
**Fungsi**: User diarahkan ke URL ini setelah pembayaran BERHASIL
**URL**: `https://your-domain.com/payment/success`

**Contoh untuk project Anda**:
```
https://your-app.vercel.app/payment/success
atau
https://chattoedit.com/payment/success
```

**Implementasi**: Halaman sukses yang menampilkan:
- Konfirmasi pembayaran berhasil
- Detail transaksi
- Link ke dashboard/subscription page

### 5. Unfinish Redirect URL ✅ PENTING
**Fungsi**: User diarahkan ke URL ini jika klik "Back to Merchant" sebelum selesai bayar
**URL**: `https://your-domain.com/payment/pending`

**Contoh**:
```
https://your-app.vercel.app/payment/pending
```

**Implementasi**: Halaman yang menampilkan:
- Status pembayaran pending
- Instruksi untuk menyelesaikan pembayaran
- Link untuk cek status pembayaran

### 6. Error Redirect URL ✅ PENTING
**Fungsi**: User diarahkan ke URL ini jika terjadi error saat pembayaran
**URL**: `https://your-domain.com/payment/error`

**Contoh**:
```
https://your-app.vercel.app/payment/error
```

**Implementasi**: Halaman error yang menampilkan:
- Pesan error
- Saran untuk mencoba lagi
- Link ke pricing/checkout page

## Konfigurasi di Midtrans Dashboard

### Sandbox Environment
1. Login ke https://dashboard.sandbox.midtrans.com
2. Go to **Settings** > **Configuration**
3. Isi URL-URL berikut:

```
Payment Notification URL:
https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook

Finish Redirect URL:
https://your-app.vercel.app/payment/success

Unfinish Redirect URL:
https://your-app.vercel.app/payment/pending

Error Redirect URL:
https://your-app.vercel.app/payment/error
```

### Production Environment
1. Login ke https://dashboard.midtrans.com
2. Go to **Settings** > **Configuration**
3. Gunakan URL production yang sama

## Implementasi URL Handler

### 1. Webhook Handler (Sudah Ada ✅)
File: `supabase/functions/midtrans-webhook/index.ts`

Sudah diimplementasikan untuk handle:
- Verifikasi signature
- Update transaction status
- Create/update subscription
- Send email notification (optional)

### 2. Payment Success Page (Perlu Dibuat)
File: `src/pages/PaymentSuccess.tsx`

```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id');
  const transactionStatus = searchParams.get('transaction_status');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
        <p className="text-muted-foreground mb-6">
          Your subscription has been activated.
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-6">
            Order ID: {orderId}
          </p>
        )}
        <Button onClick={() => navigate('/dashboard/subscription')} className="w-full">
          Go to Dashboard
        </Button>
      </Card>
    </div>
  );
}
```

### 3. Payment Pending Page (Perlu Dibuat)
File: `src/pages/PaymentPending.tsx`

```typescript
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentPending() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Pending</h1>
        <p className="text-muted-foreground mb-6">
          Your payment is being processed. Please complete the payment to activate your subscription.
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-6">
            Order ID: {orderId}
          </p>
        )}
        <div className="space-y-2">
          <Button onClick={() => navigate('/dashboard/subscription')} className="w-full">
            Check Payment Status
          </Button>
          <Button onClick={() => navigate('/pricing')} variant="outline" className="w-full">
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

### 4. Payment Error Page (Perlu Dibuat)
File: `src/pages/PaymentError.tsx`

```typescript
import { useNavigate, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function PaymentError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const orderId = searchParams.get('order_id');
  const statusMessage = searchParams.get('status_message');

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Payment Failed</h1>
        <p className="text-muted-foreground mb-6">
          {statusMessage || 'There was an error processing your payment. Please try again.'}
        </p>
        {orderId && (
          <p className="text-sm text-muted-foreground mb-6">
            Order ID: {orderId}
          </p>
        )}
        <div className="space-y-2">
          <Button onClick={() => navigate('/pricing')} className="w-full">
            Try Again
          </Button>
          <Button onClick={() => navigate('/dashboard')} variant="outline" className="w-full">
            Back to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

## Routing Configuration

Update `src/App.tsx` untuk menambahkan routes:

```typescript
import PaymentSuccess from '@/pages/PaymentSuccess';
import PaymentPending from '@/pages/PaymentPending';
import PaymentError from '@/pages/PaymentError';

// Add to routes
<Route path="/payment/success" element={<PaymentSuccess />} />
<Route path="/payment/pending" element={<PaymentPending />} />
<Route path="/payment/error" element={<PaymentError />} />
```

## Testing URLs

### Sandbox Testing
1. Buat transaksi di sandbox
2. Selesaikan pembayaran
3. Verifikasi redirect ke success page
4. Check webhook dipanggil dengan benar

### Webhook Testing
Gunakan Midtrans webhook simulator:
```bash
curl -X POST https://iatfkqwwmjohrvdfnmwm.supabase.co/functions/v1/midtrans-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_status": "settlement",
    "order_id": "ORDER-test-123",
    "gross_amount": "109890",
    "payment_type": "bank_transfer"
  }'
```

## Security Considerations

### 1. Webhook Signature Verification ✅
Sudah diimplementasikan di webhook handler untuk memverifikasi request dari Midtrans.

### 2. HTTPS Only
Semua URL harus menggunakan HTTPS (Supabase dan Vercel sudah support).

### 3. Rate Limiting
Webhook handler sudah include rate limiting untuk prevent abuse.

### 4. Idempotency
Webhook handler sudah handle duplicate notifications dengan check order_id.

## Monitoring & Logging

### Webhook Logs
Check di Supabase:
```sql
SELECT * FROM webhook_logs 
ORDER BY created_at DESC 
LIMIT 50;
```

### Transaction Status
```sql
SELECT order_id, status, payment_type, amount, created_at 
FROM transactions 
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC;
```

## Troubleshooting

### Webhook tidak dipanggil
1. Check URL di Midtrans dashboard
2. Verifikasi edge function deployed
3. Check Supabase logs: `supabase functions logs midtrans-webhook`

### Redirect tidak bekerja
1. Verifikasi URL di Midtrans dashboard
2. Check routes di App.tsx
3. Test dengan browser developer tools

### Payment stuck di pending
1. Check webhook logs
2. Verifikasi signature
3. Manual update via SQL jika perlu

## Checklist Konfigurasi

### Midtrans Dashboard
- [ ] Payment Notification URL configured
- [ ] Finish Redirect URL configured
- [ ] Unfinish Redirect URL configured
- [ ] Error Redirect URL configured
- [ ] Test dengan sandbox transaction

### Application
- [ ] PaymentSuccess page created
- [ ] PaymentPending page created
- [ ] PaymentError page created
- [ ] Routes added to App.tsx
- [ ] Test all redirect flows

### Deployment
- [ ] Edge functions deployed
- [ ] Frontend deployed
- [ ] URLs updated di Midtrans dashboard
- [ ] End-to-end testing completed

## Next Steps

1. **Immediate**: Buat payment result pages (Success, Pending, Error)
2. **Short Term**: Configure URLs di Midtrans dashboard
3. **Testing**: Test complete payment flow
4. **Production**: Update URLs untuk production environment

---

**Last Updated**: February 20, 2025
**Status**: Configuration Guide Complete
**Next**: Implement Payment Result Pages
