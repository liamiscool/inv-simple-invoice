import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Get user's org_id first
  const { data: profile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single();
    
  if (!profile) {
    return new Response('Profile not found', { status: 404 });
  }
  
  // Get invoice with all related data
  const { data: invoice } = await supabase
    .from('invoice')
    .select(`
      *,
      client:client_id (
        id,
        name,
        company,
        email
      ),
      items:invoice_item (
        id,
        position,
        description,
        qty,
        unit_price,
        tax_rate,
        line_total
      )
    `)
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .single();
  
  if (!invoice) {
    return new Response('Invoice not found', { status: 404 });
  }
  
  // Get user's company details
  const { data: userProfile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Sort items by position
  if (invoice.items) {
    invoice.items.sort((a: any, b: any) => a.position - b.position);
  }
  
  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
  
  // Generate HTML content for the invoice
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.number}</title>
      <style>
        body {
          font-family: 'Courier New', monospace;
          font-size: 12px;
          line-height: 1.4;
          color: #000;
          margin: 0;
          padding: 40px;
        }
        
        .header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 1px solid #eaeaea;
        }
        
        .company-info h1 {
          margin: 0 0 5px 0;
          font-size: 18px;
          font-weight: normal;
        }
        
        .company-info p {
          margin: 2px 0;
          color: #666;
        }
        
        .invoice-info {
          text-align: right;
        }
        
        .invoice-info h2 {
          margin: 0 0 10px 0;
          font-size: 24px;
          font-weight: normal;
        }
        
        .invoice-details {
          display: flex;
          justify-content: space-between;
          margin-bottom: 40px;
        }
        
        .bill-to h3, .invoice-meta h3 {
          margin: 0 0 10px 0;
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .bill-to p, .invoice-meta p {
          margin: 2px 0;
        }
        
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 40px;
        }
        
        .items-table th {
          text-align: left;
          padding: 10px 0;
          border-bottom: 1px solid #eaeaea;
          font-weight: normal;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .items-table th.right {
          text-align: right;
        }
        
        .items-table td {
          padding: 15px 0;
          border-bottom: 1px solid #f5f5f5;
        }
        
        .items-table td.right {
          text-align: right;
        }
        
        .totals {
          width: 300px;
          margin-left: auto;
        }
        
        .totals-row {
          display: flex;
          justify-content: space-between;
          padding: 5px 0;
        }
        
        .totals-row.total {
          border-top: 1px solid #eaeaea;
          padding-top: 10px;
          margin-top: 10px;
          font-weight: bold;
        }
        
        .notes {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eaeaea;
        }
        
        .notes h3 {
          margin: 0 0 10px 0;
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .bank-details {
          margin-top: 40px;
          padding: 20px;
          background: #f9f9f9;
          border: 1px solid #eaeaea;
        }
        
        .bank-details h3 {
          margin: 0 0 10px 0;
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        .footer {
          margin-top: 60px;
          text-align: center;
          color: #666;
          font-size: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-info">
          <h1>${userProfile?.company_name || userProfile?.full_name || 'Company Name'}</h1>
          ${userProfile?.company_address ? `<p>${userProfile.company_address.replace(/\n/g, '<br>')}</p>` : ''}
          ${userProfile?.tax_id ? `<p>Tax ID: ${userProfile.tax_id}</p>` : ''}
        </div>
        <div class="invoice-info">
          <h2>INVOICE</h2>
          <p><strong>${invoice.number}</strong></p>
        </div>
      </div>
      
      <div class="invoice-details">
        <div class="bill-to">
          <h3>Bill To</h3>
          <p><strong>${invoice.client.name}</strong></p>
          ${invoice.client.company ? `<p>${invoice.client.company}</p>` : ''}
          ${invoice.client.email ? `<p>${invoice.client.email}</p>` : ''}
        </div>
        
        <div class="invoice-meta">
          <h3>Invoice Details</h3>
          <p><strong>Issue Date:</strong> ${formatDate(invoice.issue_date)}</p>
          ${invoice.due_date ? `<p><strong>Due Date:</strong> ${formatDate(invoice.due_date)}</p>` : ''}
          <p><strong>Currency:</strong> ${invoice.currency}</p>
          <p><strong>Status:</strong> ${invoice.status.replace('_', ' ').toUpperCase()}</p>
        </div>
      </div>
      
      <table class="items-table">
        <thead>
          <tr>
            <th>Description</th>
            <th class="right">Qty</th>
            <th class="right">Unit Price</th>
            <th class="right">Tax</th>
            <th class="right">Total</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item: any) => `
            <tr>
              <td>${item.description}</td>
              <td class="right">${item.qty}</td>
              <td class="right">${formatCurrency(item.unit_price, invoice.currency)}</td>
              <td class="right">${(item.tax_rate * 100).toFixed(1)}%</td>
              <td class="right">${formatCurrency(item.line_total + (item.line_total * item.tax_rate), invoice.currency)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-row">
          <span>Subtotal:</span>
          <span>${formatCurrency(invoice.subtotal, invoice.currency)}</span>
        </div>
        <div class="totals-row">
          <span>Tax:</span>
          <span>${formatCurrency(invoice.tax_total, invoice.currency)}</span>
        </div>
        <div class="totals-row total">
          <span>Total:</span>
          <span>${formatCurrency(invoice.total, invoice.currency)}</span>
        </div>
        ${invoice.amount_paid > 0 ? `
          <div class="totals-row">
            <span>Amount Paid:</span>
            <span>${formatCurrency(invoice.amount_paid, invoice.currency)}</span>
          </div>
          <div class="totals-row">
            <span>Amount Due:</span>
            <span>${formatCurrency(invoice.total - invoice.amount_paid, invoice.currency)}</span>
          </div>
        ` : ''}
      </div>
      
      ${invoice.notes ? `
        <div class="notes">
          <h3>Notes</h3>
          <p>${invoice.notes.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}
      
      ${userProfile?.bank_details ? `
        <div class="bank-details">
          <h3>Payment Information</h3>
          <p>${userProfile.bank_details.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}
      
      <div class="footer">
        <p>Generated by inv • Beautiful invoices for designers</p>
      </div>
    </body>
    </html>
  `;
  
  // For now, return HTML (in production, we'd convert to PDF)
  // TODO: Implement proper PDF generation with Puppeteer or similar
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="invoice-${invoice.number}.html"`
    }
  });
};