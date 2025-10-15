export interface EmailTemplateData {
  invoiceNumber: string;
  clientName: string;
  companyName: string;
  userName: string;
  userEmail: string;
  dueDate?: string;
  total: string;
  currency: string;
  downloadUrl: string;
  paymentInstructions?: string;
}

/**
 * Generate invoice email HTML template
 */
export function generateInvoiceEmailHTML(data: EmailTemplateData): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Invoice ${data.invoiceNumber}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #f0f0f0;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .header h1 {
          margin: 0;
          color: #000;
          font-size: 24px;
          font-weight: 300;
        }
        .header p {
          margin: 5px 0 0 0;
          color: #666;
          font-size: 14px;
        }
        .content {
          margin-bottom: 30px;
        }
        .invoice-details {
          background: #f9f9f9;
          border: 1px solid #eee;
          border-radius: 4px;
          padding: 20px;
          margin: 20px 0;
        }
        .invoice-details h3 {
          margin: 0 0 15px 0;
          color: #000;
          font-size: 16px;
          font-weight: 600;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          padding-bottom: 8px;
          border-bottom: 1px solid #eee;
        }
        .detail-row:last-child {
          border-bottom: none;
          margin-bottom: 0;
          padding-bottom: 0;
        }
        .detail-label {
          color: #666;
          font-size: 14px;
        }
        .detail-value {
          color: #000;
          font-size: 14px;
          font-weight: 500;
        }
        .total-row {
          font-size: 16px;
          font-weight: 600;
        }
        .cta-button {
          display: inline-block;
          background: #000;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          margin: 20px 0;
          text-align: center;
        }
        .payment-instructions {
          background: #f8f9fa;
          border-left: 4px solid #000;
          padding: 15px;
          margin: 20px 0;
          font-size: 14px;
        }
        .footer {
          text-align: center;
          color: #666;
          font-size: 12px;
          border-top: 1px solid #eee;
          padding-top: 20px;
          margin-top: 40px;
        }
        .footer a {
          color: #000;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Invoice ${data.invoiceNumber}</h1>
        <p>from ${data.companyName}</p>
      </div>
      
      <div class="content">
        <p>Hi ${data.clientName},</p>

        <p>Please find attached your invoice ${data.invoiceNumber}. You can also download a copy using the link below.</p>

        <div class="invoice-details">
          <h3>Invoice Details</h3>
          <div class="detail-row">
            <span class="detail-label">From:</span>
            <span class="detail-value">${data.companyName}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">To:</span>
            <span class="detail-value">${data.clientName}</span>
          </div>
          <div class="detail-row" style="border-bottom: 2px solid #ddd; margin-bottom: 12px; padding-bottom: 12px;">
            <span class="detail-label">Invoice Number:</span>
            <span class="detail-value">${data.invoiceNumber}</span>
          </div>
          ${data.dueDate ? `
          <div class="detail-row">
            <span class="detail-label">Due Date:</span>
            <span class="detail-value">${data.dueDate}</span>
          </div>
          ` : ''}
          <div class="detail-row total-row">
            <span class="detail-label">Total Amount:</span>
            <span class="detail-value">${data.total}</span>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.downloadUrl}" class="cta-button">Download Invoice PDF</a>
        </div>

        ${data.paymentInstructions ? `
        <div class="payment-instructions" style="margin-top: 30px;">
          <strong>Payment Instructions:</strong><br>
          ${data.paymentInstructions.replace(/\n/g, '<br>')}
        </div>
        ` : ''}
        
        <p>Thank you for your business!</p>
        
        <p>Best regards,<br>
        ${data.companyName}</p>
      </div>
      
      <div class="footer">
        <p>This invoice was generated using <a href="https://inv.so">inv</a> • Beautiful invoices for designers</p>
        <p style="margin-top: 10px; font-size: 11px;">Questions? Reply to this email</p>
      </div>
    </body>
    </html>
  `;
}

/**
 * Generate plain text version of invoice email
 */
export function generateInvoiceEmailText(data: EmailTemplateData): string {
  return `
Invoice ${data.invoiceNumber}
from ${data.companyName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Hi ${data.clientName},

Please find attached your invoice ${data.invoiceNumber}.
You can also download a copy using the link below.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INVOICE DETAILS

From:           ${data.companyName}
To:             ${data.clientName}

Invoice Number: ${data.invoiceNumber}
${data.dueDate ? `Due Date:       ${data.dueDate}\n` : ''}
Total Amount:   ${data.total}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DOWNLOAD INVOICE

${data.downloadUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${data.paymentInstructions ? `
PAYMENT INSTRUCTIONS

${data.paymentInstructions}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

` : ''}
Thank you for your business!

Best regards,
${data.companyName}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This invoice was generated using inv • Beautiful invoices for designers
Questions? Reply to this email
  `.trim();
}