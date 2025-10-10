import type { TemplateSpec, AreaSpec, TableSpec } from '$lib/templates';

export interface InvoiceData {
  id: string;
  number: string;
  issue_date: string;
  due_date?: string;
  currency: string;
  status: string;
  notes?: string;
  subtotal: number;
  tax_total: number;
  total: number;
  amount_paid: number;
  client: {
    id: string;
    name: string;
    company?: string;
    email?: string;
  };
  items: Array<{
    id: string;
    position: number;
    description: string;
    qty: number;
    unit_price: number;
    tax_rate: number;
    line_total: number;
  }>;
}

export interface CompanyData {
  company_name?: string;
  full_name?: string;
  company_address?: string;
  tax_id?: string;
  bank_details?: string;
}

/**
 * Render an invoice to HTML using a template specification
 */
export function renderInvoiceHTML(
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec
): string {
  const { meta, styles, areas } = template;
  
  // Helper functions
  function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString();
  }

  function getAreaStyle(area: AreaSpec): string {
    const style = [
      `position: absolute`,
      `left: ${area.x}mm`,
      `top: ${area.y}mm`
    ];

    if (area.w) style.push(`width: ${area.w}mm`);
    if (area.h) style.push(`height: ${area.h}mm`);
    if (area.align) style.push(`text-align: ${area.align}`);
    if (area.color) style.push(`color: ${area.color}`);
    if (area.font_size) style.push(`font-size: ${area.font_size}pt`);
    if (area.font_weight) style.push(`font-weight: ${area.font_weight}`);
    if (area.style) style.push(`font-style: ${area.style}`);

    return style.join('; ');
  }

  // Render individual areas
  function renderArea(key: string, area: AreaSpec, content: string): string {
    return `<div class="area area-${key}" style="${getAreaStyle(area)}">${content}</div>`;
  }

  function renderTable(table: TableSpec, items: InvoiceData['items']): string {
    const tableStyle = [
      `position: absolute`,
      `left: ${table.x}mm`,
      `top: ${table.y}mm`,
      `width: ${table.w}mm`,
      'border-collapse: collapse'
    ].join('; ');

    const headerRowHeight = table.header_height || table.row_height;

    let html = `<table style="${tableStyle}">`;
    
    // Table header
    html += `<thead>`;
    html += `<tr style="height: ${headerRowHeight}mm; ${table.header_bg ? `background: ${table.header_bg};` : ''}">`;
    
    table.columns.forEach(col => {
      const headerStyle = [
        `width: ${col.w}mm`,
        `text-align: ${col.align || 'left'}`,
        `padding: 2mm`,
        `font-size: ${table.header_font_size || styles.sizes.small}pt`,
        `font-weight: ${table.header_font_weight || 'bold'}`,
        `color: ${table.header_color || styles.colors.secondary}`,
        `border-bottom: ${table.border_width || 1}px solid ${table.border_color || '#eee'}`
      ].join('; ');
      
      html += `<th style="${headerStyle}">${col.label}</th>`;
    });
    
    html += `</tr></thead>`;
    
    // Table body
    html += `<tbody>`;
    
    items.forEach((item, index) => {
      const rowBg = table.alt_row_bg && index % 2 === 1 ? `background: ${table.alt_row_bg};` : '';
      html += `<tr style="height: ${table.row_height}mm; ${rowBg}">`;
      
      table.columns.forEach(col => {
        const cellStyle = [
          `padding: 2mm`,
          `text-align: ${col.align || 'left'}`,
          `font-size: ${col.font_size || styles.sizes.default}pt`,
          `border-bottom: ${table.border_width || 0.5}px solid ${table.border_color || '#f5f5f5'}`
        ].join('; ');
        
        let cellContent = '';
        
        switch (col.key) {
          case 'description':
            cellContent = item.description;
            break;
          case 'qty':
            cellContent = item.qty.toString();
            break;
          case 'unit_price':
            cellContent = formatCurrency(item.unit_price, invoice.currency);
            break;
          case 'tax_rate':
            cellContent = `${(item.tax_rate * 100).toFixed(1)}%`;
            break;
          case 'line_total':
            cellContent = formatCurrency(item.line_total + (item.line_total * item.tax_rate), invoice.currency);
            break;
        }
        
        html += `<td style="${cellStyle}">${cellContent}</td>`;
      });
      
      html += `</tr>`;
    });
    
    html += `</tbody></table>`;
    
    return html;
  }

  // Build CSS
  const css = `
    @page {
      size: ${meta.width}mm ${meta.height}mm;
      margin: ${meta.margins.top}mm ${meta.margins.right}mm ${meta.margins.bottom}mm ${meta.margins.left}mm;
    }

    body {
      font-family: ${styles.fonts.primary};
      font-size: ${styles.sizes.default}pt;
      line-height: 1.4;
      color: ${styles.colors.primary};
      margin: 0;
      padding: 0;
      position: relative;
      ${meta.background_image_url ? `
        background-image: url('${meta.background_image_url}');
        background-size: ${meta.width}mm ${meta.height}mm;
        background-repeat: no-repeat;
        background-position: 0 0;
      ` : ''}
    }

    .area {
      overflow: hidden;
    }

    .area-multiline {
      white-space: pre-wrap;
    }
  `;

  // Build HTML content
  let content = '';

  // Render each area
  if (areas.invoice_title) {
    content += renderArea('invoice_title', areas.invoice_title, 'INVOICE');
  }

  if (areas.invoice_number) {
    content += renderArea('invoice_number', areas.invoice_number, invoice.number);
  }

  if (areas.company_info) {
    const companyInfo = [
      company.company_name || company.full_name || 'Company Name',
      company.company_address,
      company.tax_id ? `Tax ID: ${company.tax_id}` : null
    ].filter(Boolean).join('\\n');
    
    content += renderArea('company_info', areas.company_info, companyInfo.replace(/\\n/g, '<br>'));
  }

  if (areas.issue_date) {
    content += renderArea('issue_date', areas.issue_date, `Issue Date: ${formatDate(invoice.issue_date)}`);
  }

  if (areas.due_date && invoice.due_date) {
    content += renderArea('due_date', areas.due_date, `Due Date: ${formatDate(invoice.due_date)}`);
  }

  if (areas.client_name) {
    content += renderArea('client_name', areas.client_name, invoice.client.name);
  }

  if (areas.client_company && invoice.client.company) {
    content += renderArea('client_company', areas.client_company, invoice.client.company);
  }

  if (areas.client_email && invoice.client.email) {
    content += renderArea('client_email', areas.client_email, invoice.client.email);
  }

  // Items table
  content += renderTable(areas.items_table, invoice.items);

  if (areas.subtotal) {
    content += renderArea('subtotal', areas.subtotal, `Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency)}`);
  }

  if (areas.tax_total) {
    content += renderArea('tax_total', areas.tax_total, `Tax: ${formatCurrency(invoice.tax_total, invoice.currency)}`);
  }

  if (areas.grand_total) {
    content += renderArea('grand_total', areas.grand_total, `Total: ${formatCurrency(invoice.total, invoice.currency)}`);
  }

  if (areas.notes && invoice.notes) {
    content += renderArea('notes', areas.notes, invoice.notes.replace(/\\n/g, '<br>'));
  }

  if (areas.payment_info && company.bank_details) {
    content += renderArea('payment_info', areas.payment_info, company.bank_details.replace(/\\n/g, '<br>'));
  }

  // Complete HTML document
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Invoice ${invoice.number}</title>
      <style>${css}</style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;
}