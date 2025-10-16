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
    company_address?: string;
    tax_id?: string;
    legal_name?: string;
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
 * Calculate the actual height of the items table based on number of items
 */
function calculateTableHeight(table: TableSpec, itemCount: number): number {
  const headerHeight = table.header_height || table.row_height;
  const totalRowsHeight = itemCount * table.row_height;
  return headerHeight + totalRowsHeight;
}

/**
 * Calculate the expected/default table height from template
 * (used to determine if we need to adjust positions)
 */
function calculateDefaultTableHeight(table: TableSpec): number {
  // Assume template was designed for ~10 items as a baseline
  const defaultItemCount = 10;
  return calculateTableHeight(table, defaultItemCount);
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

  // Calculate dynamic table height and position adjustments
  const actualTableHeight = calculateTableHeight(areas.items_table, invoice.items.length);
  const defaultTableHeight = calculateDefaultTableHeight(areas.items_table);
  const heightDifference = actualTableHeight - defaultTableHeight;

  // Create adjusted areas with dynamic positioning for elements below the table
  const adjustedAreas = { ...areas };

  if (heightDifference > 0) {
    // Adjust positions of elements that come after the items table
    if (adjustedAreas.subtotal) {
      adjustedAreas.subtotal = { ...adjustedAreas.subtotal, y: adjustedAreas.subtotal.y + heightDifference };
    }
    if (adjustedAreas.tax_total) {
      adjustedAreas.tax_total = { ...adjustedAreas.tax_total, y: adjustedAreas.tax_total.y + heightDifference };
    }
    if (adjustedAreas.grand_total) {
      adjustedAreas.grand_total = { ...adjustedAreas.grand_total, y: adjustedAreas.grand_total.y + heightDifference };
    }
    if (adjustedAreas.notes) {
      adjustedAreas.notes = { ...adjustedAreas.notes, y: adjustedAreas.notes.y + heightDifference };
    }
    if (adjustedAreas.payment_info) {
      adjustedAreas.payment_info = { ...adjustedAreas.payment_info, y: adjustedAreas.payment_info.y + heightDifference };
    }
    if (adjustedAreas.footer) {
      adjustedAreas.footer = { ...adjustedAreas.footer, y: adjustedAreas.footer.y + heightDifference };
    }
  }

  // Create adjusted meta with dynamic page height
  const adjustedMeta = { ...meta };
  if (heightDifference > 0) {
    adjustedMeta.height = meta.height + heightDifference;
  }
  
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

  // Build CSS (use adjusted meta for dynamic page height)
  const css = `
    @page {
      size: ${adjustedMeta.width}mm ${adjustedMeta.height}mm;
      margin: ${adjustedMeta.margins.top}mm ${adjustedMeta.margins.right}mm ${adjustedMeta.margins.bottom}mm ${adjustedMeta.margins.left}mm;
    }

    body {
      font-family: ${styles.fonts.primary};
      font-size: ${styles.sizes.default}pt;
      line-height: 1.4;
      color: ${styles.colors.primary};
      margin: 0;
      padding: 0;
      position: relative;
      ${adjustedMeta.background_pdf_url || adjustedMeta.background_image_url ? `
        background-image: url('${adjustedMeta.background_pdf_url || adjustedMeta.background_image_url}');
        background-size: ${adjustedMeta.width}mm ${adjustedMeta.height}mm;
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

  // Build HTML content (use adjusted areas for dynamic positioning)
  let content = '';

  // Render each area
  if (adjustedAreas.invoice_title) {
    content += renderArea('invoice_title', adjustedAreas.invoice_title, 'INVOICE');
  }

  if (adjustedAreas.invoice_number) {
    content += renderArea('invoice_number', adjustedAreas.invoice_number, invoice.number);
  }

  if (adjustedAreas.company_info) {
    const companyInfo = [
      company.company_name || company.full_name || 'Company Name',
      company.company_address,
      company.tax_id ? `Tax ID: ${company.tax_id}` : null
    ].filter(Boolean).join('\\n');

    content += renderArea('company_info', adjustedAreas.company_info, companyInfo.replace(/\\n/g, '<br>'));
  }

  if (adjustedAreas.issue_date) {
    content += renderArea('issue_date', adjustedAreas.issue_date, `Issue Date: ${formatDate(invoice.issue_date)}`);
  }

  if (adjustedAreas.due_date && invoice.due_date) {
    content += renderArea('due_date', adjustedAreas.due_date, `Due Date: ${formatDate(invoice.due_date)}`);
  }

  if (adjustedAreas.client_name) {
    content += renderArea('client_name', adjustedAreas.client_name, invoice.client.name);
  }

  if (adjustedAreas.client_company && invoice.client.company) {
    content += renderArea('client_company', adjustedAreas.client_company, invoice.client.company);
  }

  if (adjustedAreas.client_email && invoice.client.email) {
    content += renderArea('client_email', adjustedAreas.client_email, invoice.client.email);
  }

  if (adjustedAreas.client_address && invoice.client.company_address) {
    content += renderArea('client_address', adjustedAreas.client_address, invoice.client.company_address.replace(/\\n/g, '<br>'));
  }

  if (adjustedAreas.client_tax_id && invoice.client.tax_id) {
    content += renderArea('client_tax_id', adjustedAreas.client_tax_id, `Tax ID: ${invoice.client.tax_id}`);
  }

  // Items table (uses original table spec, but positions are adjusted)
  content += renderTable(adjustedAreas.items_table, invoice.items);

  if (adjustedAreas.subtotal) {
    content += renderArea('subtotal', adjustedAreas.subtotal, `Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency)}`);
  }

  if (adjustedAreas.tax_total) {
    content += renderArea('tax_total', adjustedAreas.tax_total, `Tax: ${formatCurrency(invoice.tax_total, invoice.currency)}`);
  }

  if (adjustedAreas.grand_total) {
    content += renderArea('grand_total', adjustedAreas.grand_total, `Total: ${formatCurrency(invoice.total, invoice.currency)}`);
  }

  if (adjustedAreas.notes && invoice.notes) {
    content += renderArea('notes', adjustedAreas.notes, invoice.notes.replace(/\\n/g, '<br>'));
  }

  if (adjustedAreas.payment_info && company.bank_details) {
    content += renderArea('payment_info', adjustedAreas.payment_info, company.bank_details.replace(/\\n/g, '<br>'));
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