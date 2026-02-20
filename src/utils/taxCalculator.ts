/**
 * Tax Calculator for Indonesian Tax Regulations
 * 
 * Based on:
 * - PPN (VAT): 11% for standard goods/services (PMK 131/2024)
 * - PPh 23: 2% for technical/consulting services (B2B only)
 * - Midtrans fees: Varies by payment method + 11% VAT on fees
 */

export interface TaxConfig {
  vatRate: number; // PPN rate (default 11% = 0.11)
  pph23Rate: number; // PPh 23 rate (default 2% = 0.02)
  includePph23: boolean; // Whether to include PPh 23 (B2B transactions only)
}

export interface PaymentFeeConfig {
  type: 'bank_transfer' | 'credit_card' | 'ewallet' | 'qris';
  flatFee?: number; // For bank transfer (Rp 4,000)
  percentageFee?: number; // For credit card (2.9%), ewallet, qris
}

export interface TaxCalculationResult {
  baseAmount: number; // Harga dasar sebelum pajak
  vatRate: number; // Tarif PPN (11%)
  vatAmount: number; // Nilai PPN
  grossAmount: number; // Total yang dibayar customer (base + VAT)
  pph23Rate: number; // Tarif PPh 23 (2%)
  pph23Amount: number; // Nilai PPh 23 (jika B2B)
  paymentFee: number; // Biaya payment gateway
  paymentFeeVat: number; // PPN atas biaya gateway
  totalPaymentFee: number; // Total biaya gateway (fee + VAT)
  netAmount: number; // Yang diterima merchant (gross - payment fees)
  netAfterPph23: number; // Yang diterima merchant setelah PPh 23 (jika B2B)
}

const DEFAULT_TAX_CONFIG: TaxConfig = {
  vatRate: 0.11, // 11% PPN
  pph23Rate: 0.02, // 2% PPh 23
  includePph23: false, // Default B2C (no PPh 23)
};

const PAYMENT_FEE_CONFIGS: Record<string, PaymentFeeConfig> = {
  bank_transfer: {
    type: 'bank_transfer',
    flatFee: 4000, // Rp 4,000
  },
  credit_card: {
    type: 'credit_card',
    percentageFee: 0.029, // 2.9%
  },
  gopay: {
    type: 'ewallet',
    percentageFee: 0.02, // 2%
  },
  qris: {
    type: 'qris',
    percentageFee: 0.007, // 0.7% (Bank Indonesia regulation)
  },
};

/**
 * Calculate all taxes and fees for a transaction
 * 
 * @param baseAmount - Base price before tax (e.g., Rp 99,000)
 * @param paymentMethod - Payment method type
 * @param taxConfig - Tax configuration (optional)
 * @returns Complete tax calculation breakdown
 */
export function calculateTaxes(
  baseAmount: number,
  paymentMethod: string = 'bank_transfer',
  taxConfig: Partial<TaxConfig> = {}
): TaxCalculationResult {
  const config = { ...DEFAULT_TAX_CONFIG, ...taxConfig };
  
  // Calculate VAT (PPN)
  const vatAmount = Math.round(baseAmount * config.vatRate);
  const grossAmount = baseAmount + vatAmount;
  
  // Calculate PPh 23 (only for B2B)
  const pph23Amount = config.includePph23 ? Math.round(baseAmount * config.pph23Rate) : 0;
  
  // Calculate payment gateway fees
  const feeConfig = PAYMENT_FEE_CONFIGS[paymentMethod] || PAYMENT_FEE_CONFIGS.bank_transfer;
  let paymentFee = 0;
  
  if (feeConfig.flatFee) {
    paymentFee = feeConfig.flatFee;
  } else if (feeConfig.percentageFee) {
    paymentFee = Math.round(grossAmount * feeConfig.percentageFee);
  }
  
  // VAT on payment fee (11%)
  const paymentFeeVat = Math.round(paymentFee * config.vatRate);
  const totalPaymentFee = paymentFee + paymentFeeVat;
  
  // Net amount received by merchant
  const netAmount = grossAmount - totalPaymentFee;
  const netAfterPph23 = netAmount - pph23Amount;
  
  return {
    baseAmount,
    vatRate: config.vatRate,
    vatAmount,
    grossAmount,
    pph23Rate: config.pph23Rate,
    pph23Amount,
    paymentFee,
    paymentFeeVat,
    totalPaymentFee,
    netAmount,
    netAfterPph23,
  };
}

/**
 * Format currency in Indonesian Rupiah
 */
export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calculate reverse tax (from gross amount to base amount)
 * Useful when you have the total amount and need to extract the base
 */
export function calculateReverseVAT(grossAmount: number, vatRate: number = 0.11): {
  baseAmount: number;
  vatAmount: number;
} {
  const baseAmount = Math.round(grossAmount / (1 + vatRate));
  const vatAmount = grossAmount - baseAmount;
  
  return {
    baseAmount,
    vatAmount,
  };
}

/**
 * Get payment fee configuration for a payment method
 */
export function getPaymentFeeConfig(paymentMethod: string): PaymentFeeConfig {
  return PAYMENT_FEE_CONFIGS[paymentMethod] || PAYMENT_FEE_CONFIGS.bank_transfer;
}

/**
 * Example usage and test cases
 */
export const TAX_EXAMPLES = {
  // Pro Plan - B2C (Consumer)
  proB2C: calculateTaxes(99000, 'bank_transfer', { includePph23: false }),
  
  // Pro Plan - B2B (Business)
  proB2B: calculateTaxes(99000, 'bank_transfer', { includePph23: true }),
  
  // Enterprise Plan - B2C
  enterpriseB2C: calculateTaxes(499000, 'bank_transfer', { includePph23: false }),
  
  // Enterprise Plan - B2B
  enterpriseB2B: calculateTaxes(499000, 'bank_transfer', { includePph23: true }),
  
  // Pro Plan with Credit Card
  proCreditCard: calculateTaxes(99000, 'credit_card', { includePph23: false }),
};

// Log examples for reference
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  console.log('Tax Calculation Examples:', TAX_EXAMPLES);
}
