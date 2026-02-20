# Pricing Update with Tax Implementation

## Summary
Updated all subscription pricing across the application to properly display and charge prices including PPN (VAT) 11%.

## Changes Made

### 1. Pricing Page (`src/pages/Pricing.tsx`)

**Before:**
```
Pro: Rp 99.000/month
Enterprise: Rp 499.000/month
```

**After:**
```
Pro: Rp 99.000/month
     + PPN 11% = Rp 109.890

Enterprise: Rp 499.000/month
            + PPN 11% = Rp 553.890
```

**Implementation:**
- Added `priceWithTax` field to tier objects
- Display shows base price prominently with tax calculation below
- Total price with tax shown in smaller text

### 2. Checkout Page (`src/pages/Checkout.tsx`)

**Updated TIER_INFO:**
```typescript
const TIER_INFO = {
  pro: {
    name: 'Pro Plan',
    price: 99000,              // Base price
    priceDisplay: 'Rp 99.000',
    vatRate: 0.11,             // 11% PPN
    vatAmount: 10890,          // Calculated PPN
    totalPrice: 109890,        // Total with PPN
    totalPriceDisplay: 'Rp 109.890',
    credits: 2000,
    features: [...]
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 499000,
    priceDisplay: 'Rp 499.000',
    vatRate: 0.11,
    vatAmount: 54890,
    totalPrice: 553890,
    totalPriceDisplay: 'Rp 553.890',
    credits: 10000,
    features: [...]
  },
};
```

**Order Summary Now Shows:**
```
Subtotal:     Rp 99.000
PPN (11%):    Rp 10.890
─────────────────────────
Total:        Rp 109.890
```

**Payment Button:**
- Changed from "Pay Rp 99.000" to "Pay Rp 109.890"
- Shows total amount including tax

### 3. Subscription Page (`src/pages/Subscription.tsx`)

**Updated Display:**
```
Pro Plan
Rp 99.000/month (+ PPN 11%)

Enterprise Plan
Rp 499.000/month (+ PPN 11%)
```

### 4. Payment Hook (`src/hooks/useMidtransPayment.ts`)

**Updated TIER_PRICES:**
```typescript
const TIER_PRICES = {
  pro: 109890,      // Was: 99000
  enterprise: 553890, // Was: 499000
};
```

**Impact:**
- Midtrans transactions now created with correct total amount
- Customer charged the full amount including PPN
- Database records store gross amount (with tax)

## Price Breakdown

### Free Plan
```
Base Price:    Rp 0
PPN 11%:       Rp 0
Total:         Rp 0
Credits:       50/month
```

### Pro Plan
```
Base Price:    Rp 99.000
PPN 11%:       Rp 10.890
─────────────────────────
Total:         Rp 109.890
Credits:       2.000/month

Midtrans Fee (Bank Transfer):
Fee:           Rp 4.000
PPN on Fee:    Rp 440
Total Fee:     Rp 4.440

Net Revenue:   Rp 105.450
```

### Enterprise Plan
```
Base Price:    Rp 499.000
PPN 11%:       Rp 54.890
─────────────────────────
Total:         Rp 553.890
Credits:       10.000/month

Midtrans Fee (Bank Transfer):
Fee:           Rp 4.000
PPN on Fee:    Rp 440
Total Fee:     Rp 4.440

Net Revenue:   Rp 549.450
```

## Database Considerations

### Current Transaction Table
The `transactions` table currently stores:
- `amount`: Gross amount (with PPN)

### Recommended Enhancement
Add these fields for better tracking:
```sql
ALTER TABLE transactions 
ADD COLUMN base_amount INTEGER,
ADD COLUMN vat_rate DECIMAL(5,4) DEFAULT 0.11,
ADD COLUMN vat_amount INTEGER,
ADD COLUMN payment_fee INTEGER,
ADD COLUMN payment_fee_vat INTEGER,
ADD COLUMN net_amount INTEGER;
```

### Migration for Existing Records
```sql
-- Calculate base amount from gross (reverse VAT)
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

## Edge Function Updates Needed

### midtrans-create-transaction
The edge function should be updated to:
1. Accept base amount from client
2. Calculate PPN (11%)
3. Create transaction with gross amount
4. Store both base and gross amounts

**Current:**
```typescript
// Client sends: amount = 109890
// Function creates transaction with: gross_amount = 109890
```

**Recommended:**
```typescript
// Client sends: baseAmount = 99000, vatRate = 0.11
// Function calculates: vatAmount = 10890, grossAmount = 109890
// Function stores: base_amount, vat_amount, gross_amount
```

## Invoice Updates

The invoice generator already supports tax breakdown:
```typescript
await generateInvoicePDF({
  orderId: 'ORDER-123',
  baseAmount: 99000,
  vatRate: 0.11,
  vatAmount: 10890,
  amount: 109890, // Total
  // ... other fields
});
```

Invoice displays:
```
Subtotal:     Rp 99.000
PPN (11%):    Rp 10.890
─────────────────────────
Total:        Rp 109.890
```

## Testing Checklist

### Frontend Display
- [x] Pricing page shows base price + tax note
- [x] Checkout page shows tax breakdown
- [x] Subscription page shows price with tax note
- [x] Payment button shows correct total

### Payment Flow
- [ ] Test Pro plan payment (Rp 109.890)
- [ ] Test Enterprise plan payment (Rp 553.890)
- [ ] Verify Midtrans receives correct amount
- [ ] Verify transaction record has correct amount
- [ ] Verify invoice shows correct breakdown

### Invoice
- [ ] Download invoice PDF
- [ ] Verify base amount shown
- [ ] Verify PPN 11% calculated correctly
- [ ] Verify total matches payment

## Compliance

### Tax Regulations Met
✅ PPN 11% applied (PMK 131/2024)
✅ Tax breakdown shown to customer
✅ Invoice includes tax details
✅ Gross amount charged to customer

### Still Needed for Full Compliance
- [ ] NPWP registration
- [ ] PKP registration (if revenue > Rp 4.8M/year)
- [ ] Faktur Pajak generation
- [ ] Monthly PPN reporting
- [ ] Tax payment to government

## Migration Path

### Phase 1: Frontend Only (DONE ✅)
- Update pricing display
- Update checkout flow
- Update payment amounts
- Update invoices

### Phase 2: Database Enhancement (TODO)
- Add tax fields to transactions table
- Migrate existing records
- Update queries to use new fields

### Phase 3: Edge Function Update (TODO)
- Update midtrans-create-transaction
- Calculate and store tax breakdown
- Update webhook handler

### Phase 4: Reporting (TODO)
- Tax report dashboard
- Monthly PPN calculation
- Revenue analytics with tax breakdown

## Files Modified

1. ✅ `src/pages/Pricing.tsx` - Added priceWithTax, tax display
2. ✅ `src/pages/Checkout.tsx` - Added tax breakdown in order summary
3. ✅ `src/pages/Subscription.tsx` - Added tax note to prices
4. ✅ `src/hooks/useMidtransPayment.ts` - Updated TIER_PRICES with tax

## Next Steps

### Immediate
1. Test payment flow with new prices
2. Verify Midtrans sandbox transactions
3. Check invoice generation

### Short Term
1. Update database schema
2. Update edge functions
3. Migrate existing transaction records

### Long Term
1. Implement tax reporting
2. Add admin dashboard for tax analytics
3. Integrate with accounting system

---

**Updated**: 20 Februari 2025
**Status**: Frontend Complete ✅ | Backend Pending
**Version**: 1.0.0
