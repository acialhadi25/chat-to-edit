import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface InvoiceData {
  orderId: string;
  date: Date;
  customerEmail: string;
  customerId: string;
  tierName: string;
  amount: number;
  paymentType: string;
  status: string;
  baseAmount?: number;
  vatRate?: number;
  vatAmount?: number;
}

export async function generateInvoicePDF(data: InvoiceData) {
  // Create a new PDF document
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]); // A4 size
  const { width, height } = page.getSize();

  // Load fonts
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  // Colors
  const primaryColor = rgb(0.15, 0.39, 0.93); // #2563eb
  const darkGray = rgb(0.2, 0.2, 0.2);
  const lightGray = rgb(0.4, 0.4, 0.4);
  const borderGray = rgb(0.85, 0.85, 0.85);

  let yPosition = height - 60;

  // Header - Company Name
  page.drawText('Chat to Edit', {
    x: 50,
    y: yPosition,
    size: 28,
    font: fontBold,
    color: primaryColor,
  });

  yPosition -= 20;
  page.drawText('AI-Powered Excel Assistant', {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontRegular,
    color: lightGray,
  });

  yPosition -= 40;

  // Invoice Title
  page.drawText('INVOICE', {
    x: 50,
    y: yPosition,
    size: 24,
    font: fontBold,
    color: darkGray,
  });

  // Status Badge (right side)
  const statusText = data.status === 'settlement' ? 'PAID' : data.status.toUpperCase();
  const statusColor = data.status === 'settlement' ? rgb(0.13, 0.7, 0.51) : rgb(0.95, 0.77, 0.06);
  
  page.drawRectangle({
    x: width - 150,
    y: yPosition - 5,
    width: 80,
    height: 25,
    color: statusColor,
    opacity: 0.2,
  });
  
  page.drawText(statusText, {
    x: width - 140,
    y: yPosition + 3,
    size: 12,
    font: fontBold,
    color: statusColor,
  });

  yPosition -= 50;

  // Horizontal line
  page.drawLine({
    start: { x: 50, y: yPosition },
    end: { x: width - 50, y: yPosition },
    thickness: 2,
    color: borderGray,
  });

  yPosition -= 30;

  // Invoice Details (Left Column)
  page.drawText('Invoice Number:', {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: lightGray,
  });

  yPosition -= 15;
  page.drawText(data.orderId, {
    x: 50,
    y: yPosition,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  yPosition -= 25;
  page.drawText('Date:', {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: lightGray,
  });

  yPosition -= 15;
  page.drawText(data.date.toLocaleDateString('id-ID', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }), {
    x: 50,
    y: yPosition,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  // Customer Details (Right Column)
  let rightYPosition = height - 260;
  
  page.drawText('Bill To:', {
    x: width - 250,
    y: rightYPosition,
    size: 10,
    font: fontBold,
    color: lightGray,
  });

  rightYPosition -= 15;
  page.drawText(data.customerEmail, {
    x: width - 250,
    y: rightYPosition,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  rightYPosition -= 15;
  page.drawText(`User ID: ${data.customerId.slice(0, 8)}...`, {
    x: width - 250,
    y: rightYPosition,
    size: 9,
    font: fontRegular,
    color: lightGray,
  });

  rightYPosition -= 25;
  page.drawText('Payment Method:', {
    x: width - 250,
    y: rightYPosition,
    size: 10,
    font: fontBold,
    color: lightGray,
  });

  rightYPosition -= 15;
  page.drawText(data.paymentType, {
    x: width - 250,
    y: rightYPosition,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  yPosition -= 60;

  // Items Table Header
  const tableTop = yPosition;
  const tableLeft = 50;
  const tableWidth = width - 100;

  // Table header background
  page.drawRectangle({
    x: tableLeft,
    y: tableTop - 25,
    width: tableWidth,
    height: 25,
    color: rgb(0.96, 0.96, 0.96),
  });

  // Table headers
  page.drawText('Description', {
    x: tableLeft + 10,
    y: tableTop - 15,
    size: 11,
    font: fontBold,
    color: darkGray,
  });

  page.drawText('Amount', {
    x: tableLeft + tableWidth - 100,
    y: tableTop - 15,
    size: 11,
    font: fontBold,
    color: darkGray,
  });

  yPosition = tableTop - 40;

  // Table row
  page.drawText(`${data.tierName} Plan Subscription`, {
    x: tableLeft + 10,
    y: yPosition,
    size: 11,
    font: fontBold,
    color: darkGray,
  });

  yPosition -= 15;
  page.drawText('Monthly subscription', {
    x: tableLeft + 10,
    y: yPosition,
    size: 9,
    font: fontRegular,
    color: lightGray,
  });

  // Calculate amounts
  const baseAmount = data.baseAmount || data.amount;
  const vatRate = data.vatRate || 0.11; // 11% default
  const vatAmount = data.vatAmount || Math.round(baseAmount * vatRate);
  const totalAmount = baseAmount + vatAmount;

  // Amount (right aligned)
  page.drawText(`Rp ${baseAmount.toLocaleString('id-ID')}`, {
    x: tableLeft + tableWidth - 100,
    y: yPosition + 15,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  yPosition -= 40;

  // Table bottom border
  page.drawLine({
    start: { x: tableLeft, y: yPosition },
    end: { x: tableLeft + tableWidth, y: yPosition },
    thickness: 1,
    color: borderGray,
  });

  yPosition -= 30;

  // Totals Section (Right aligned)
  const totalsX = tableLeft + tableWidth - 200;

  // Subtotal
  page.drawText('Subtotal:', {
    x: totalsX,
    y: yPosition,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  page.drawText(`Rp ${baseAmount.toLocaleString('id-ID')}`, {
    x: totalsX + 120,
    y: yPosition,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  yPosition -= 20;

  // VAT
  page.drawText(`PPN (${(vatRate * 100).toFixed(0)}%):`, {
    x: totalsX,
    y: yPosition,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  page.drawText(`Rp ${vatAmount.toLocaleString('id-ID')}`, {
    x: totalsX + 120,
    y: yPosition,
    size: 11,
    font: fontRegular,
    color: darkGray,
  });

  yPosition -= 30;

  // Total line
  page.drawLine({
    start: { x: totalsX, y: yPosition + 5 },
    end: { x: totalsX + 180, y: yPosition + 5 },
    thickness: 2,
    color: darkGray,
  });

  yPosition -= 15;

  // Grand Total
  page.drawText('Total:', {
    x: totalsX,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: darkGray,
  });

  page.drawText(`Rp ${totalAmount.toLocaleString('id-ID')}`, {
    x: totalsX + 120,
    y: yPosition,
    size: 14,
    font: fontBold,
    color: primaryColor,
  });

  // Footer
  yPosition = 100;

  page.drawLine({
    start: { x: 50, y: yPosition + 20 },
    end: { x: width - 50, y: yPosition + 20 },
    thickness: 1,
    color: borderGray,
  });

  page.drawText('Thank you for your business!', {
    x: 50,
    y: yPosition,
    size: 10,
    font: fontBold,
    color: darkGray,
  });

  yPosition -= 20;
  page.drawText('This is a computer-generated invoice and does not require a signature.', {
    x: 50,
    y: yPosition,
    size: 9,
    font: fontRegular,
    color: lightGray,
  });

  yPosition -= 15;
  page.drawText('For questions about this invoice, please contact support@chattoedit.com', {
    x: 50,
    y: yPosition,
    size: 9,
    font: fontRegular,
    color: lightGray,
  });

  // Save and download
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes.buffer], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `invoice-${data.orderId}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
