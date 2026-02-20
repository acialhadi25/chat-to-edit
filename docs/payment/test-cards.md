# Midtrans Test Cards - Quick Reference

## 🎴 Credit Card Test Numbers

### ✅ SUCCESS Cards (Full 3DS Authentication)

| Brand | Card Number | CVV | Expiry | OTP | Result |
|-------|-------------|-----|--------|-----|--------|
| VISA | `4811 1111 1111 1114` | 123 | 01/2025 | 112233 | ✅ Success |
| Mastercard | `5211 1111 1111 1117` | 123 | 01/2025 | 112233 | ✅ Success |
| JCB | `3528 2033 2456 4357` | 123 | 01/2025 | 112233 | ✅ Success |
| AMEX | `3701 9216 9722 458` | 123 | 01/2025 | 112233 | ✅ Success |

### ❌ DENIED by Bank

| Brand | Card Number | CVV | Expiry | OTP | Result |
|-------|-------------|-----|--------|-----|--------|
| VISA | `4911 1111 1111 1113` | 123 | 01/2025 | 112233 | ❌ Denied |
| Mastercard | `5111 1111 1111 1118` | 123 | 01/2025 | 112233 | ❌ Denied |
| JCB | `3528 5129 4493 2269` | 123 | 01/2025 | 112233 | ❌ Denied |
| AMEX | `3742 9635 4400 881` | 123 | 01/2025 | 112233 | ❌ Denied |

### ⚠️ DENIED by FDS (Fraud Detection)

| Brand | Card Number | CVV | Expiry | Result |
|-------|-------------|-----|--------|--------|
| VISA | `4611 1111 1111 1116` | 123 | 01/2025 | ⚠️ Fraud |
| Mastercard | `5411 1111 1111 1115` | 123 | 01/2025 | ⚠️ Fraud |
| JCB | `3528 1852 6717 1623` | 123 | 01/2025 | ⚠️ Fraud |
| AMEX | `3780 9621 8340 018` | 123 | 01/2025 | ⚠️ Fraud |

### ✅ SUCCESS (No 3DS - Attempted Authentication)

| Brand | Card Number | CVV | Expiry | OTP | Result |
|-------|-------------|-----|--------|-----|--------|
| VISA | `4411 1111 1111 1118` | 123 | 01/2025 | No OTP | ✅ Success |
| Mastercard | `5410 1111 1111 1116` | 123 | 01/2025 | No OTP | ✅ Success |
| JCB | `3528 8680 4786 4225` | 123 | 01/2025 | No OTP | ✅ Success |
| AMEX | `3737 4772 6661 940` | 123 | 01/2025 | No OTP | ✅ Success |

---

## 🏦 Bank-Specific Cards (for Installment/Promo)

### Mandiri
- **VISA**: `4617 0069 5974 6656` (Full 3DS)
- **Mastercard**: `5573 3810 7219 6900` (Full 3DS)
- **Debit**: `4097 6611 1111 1113` (Full 3DS)

### BCA
- **VISA**: `4773 7760 5705 1650` (Full 3DS)
- **Mastercard**: `5229 9031 3685 3172` (Full 3DS)

### BNI
- **VISA**: `4105 0586 8948 1467` (Full 3DS)
- **Mastercard**: `5264 2210 3887 4659` (Full 3DS)

### BRI
- **VISA**: `4365 0263 3573 7199` (Full 3DS)
- **Mastercard**: `5520 0298 7089 9100` (Full 3DS)

### CIMB
- **VISA**: `4599 2078 8712 2414` (Full 3DS)
- **Mastercard**: `5481 1698 1883 2479` (Full 3DS)

**All bank cards**: CVV: `123`, Expiry: `01/2025`, OTP: `112233`

---

## 🔗 Payment Simulators

### Virtual Account
- **BCA**: https://simulator.sandbox.midtrans.com/bca/va/index
- **Others**: https://simulator.sandbox.midtrans.com/openapi/va/index

### E-Wallet & QRIS
- **QRIS/GoPay/ShopeePay**: https://simulator.sandbox.midtrans.com/qris/index

### Over-the-Counter
- **Indomaret**: https://simulator.sandbox.midtrans.com/indomaret/index
- **Alfamart**: https://simulator.sandbox.midtrans.com/alfamart/index

---

## 🎯 Quick Test Flow

### 1. Success Test (2 minutes)
```
Card: 4811 1111 1111 1114
CVV: 123
Expiry: 01/2025
OTP: 112233
Expected: ✅ Success → /payment/success
```

### 2. Denied Test (2 minutes)
```
Card: 4911 1111 1111 1113
CVV: 123
Expiry: 01/2025
OTP: 112233
Expected: ❌ Denied → /payment/error
```

### 3. Bank Transfer Test (3 minutes)
```
Method: BCA Virtual Account
Get VA Number → Use BCA Simulator
Expected: ⏳ Pending → ✅ Settlement
```

### 4. E-Wallet Test (3 minutes)
```
Method: GoPay/QRIS
Get QR Code URL → Use QRIS Simulator
Expected: ⏳ Pending → ✅ Settlement
```

---

## 📋 Testing Checklist

- [ ] Credit Card Success (4811...1114)
- [ ] Credit Card Denied (4911...1113)
- [ ] Bank Transfer (BCA VA)
- [ ] E-Wallet (GoPay/QRIS)
- [ ] Verify webhook called
- [ ] Check database updated
- [ ] Test all redirects
- [ ] Download PDF invoice
- [ ] Test on mobile

---

## ⚠️ Important Rules

### DO:
- ✅ Use test cards from this list
- ✅ Use payment simulators
- ✅ Test in Sandbox environment
- ✅ CVV always: `123`
- ✅ OTP always: `112233`
- ✅ Expiry: Any future date (e.g., `01/2025`)

### DON'T:
- ❌ Use real credit cards
- ❌ Use real money
- ❌ Test production in Sandbox
- ❌ Share API keys

---

## 🚀 Start Testing

1. Open: https://chat-to-edit.vercel.app/
2. Login to your account
3. Go to Pricing page
4. Select Pro Plan
5. Use test card: `4811 1111 1111 1114`
6. Complete payment
7. Verify success!

---

**Last Updated**: February 20, 2025
**Source**: [Midtrans Testing Documentation](https://docs.midtrans.com/docs/testing-payment-on-sandbox)
