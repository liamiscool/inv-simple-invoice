import type { TemplateSpec } from '$lib/templates';
import { renderInvoiceHTML, type InvoiceData, type CompanyData } from './renderer';

// Dynamic import for Puppeteer (optional for Cloudflare deployment)
let puppeteer: typeof import('puppeteer') | null = null;
try {
  puppeteer = await import('puppeteer');
} catch (e) {
  console.warn('Puppeteer not available - PDF generation will use fallback method');
}

export interface PDFGenerationOptions {
  format?: 'A4' | 'Letter';
  margin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
}

/**
 * Generate a PDF from invoice data using a template
 */
export async function generateInvoicePDF(
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec,
  options: PDFGenerationOptions = {}
): Promise<Buffer> {
  // If Puppeteer is not available, throw a helpful error
  if (!puppeteer) {
    throw new Error(
      'PDF generation requires Puppeteer which is not available in this environment. ' +
      'Please use an external PDF service or Cloudflare Browser Rendering API.'
    );
  }

  let browser = null;

  try {
    // Launch Puppeteer browser
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process'
      ]
    });

    const page = await browser.newPage();

    // Generate HTML content using our template renderer
    const html = renderInvoiceHTML(invoice, company, template);

    // Set content and wait for any fonts/images to load
    await page.setContent(html, {
      waitUntil: ['networkidle0', 'domcontentloaded']
    });

    // Configure PDF options based on template metadata
    const pdfOptions: Parameters<typeof page.pdf>[0] = {
      format: options.format || 'A4',
      printBackground: options.printBackground ?? true,
      preferCSSPageSize: options.preferCSSPageSize ?? true,
      displayHeaderFooter: options.displayHeaderFooter ?? false,
      margin: options.margin || {
        top: '0mm',
        right: '0mm',
        bottom: '0mm',
        left: '0mm'
      },
      ...options
    };

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    return Buffer.from(pdfBuffer);

  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error(`PDF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Generate PDF with optimized settings for invoice templates
 */
export async function generateOptimizedInvoicePDF(
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec
): Promise<Buffer> {
  const { meta } = template;
  
  // Use template dimensions if available
  const customOptions: PDFGenerationOptions = {
    format: meta.width === 210 && meta.height === 297 ? 'A4' : 'A4', // Default to A4 for now
    margin: {
      top: `${meta.margins.top}mm`,
      right: `${meta.margins.right}mm`, 
      bottom: `${meta.margins.bottom}mm`,
      left: `${meta.margins.left}mm`
    },
    printBackground: true,
    preferCSSPageSize: true
  };
  
  return generateInvoicePDF(invoice, company, template, customOptions);
}

/**
 * Generate a preview PNG image of the invoice (for template previews)
 */
export async function generateInvoicePreview(
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec,
  options: { width?: number; height?: number; quality?: number } = {}
): Promise<Buffer> {
  if (!puppeteer) {
    throw new Error('Preview generation requires Puppeteer which is not available in this environment.');
  }

  let browser = null;

  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    // Set viewport for consistent preview generation
    await page.setViewport({
      width: options.width || 800,
      height: options.height || 1200,
      deviceScaleFactor: 2 // Higher DPI for better quality
    });

    const html = renderInvoiceHTML(invoice, company, template);
    await page.setContent(html, { waitUntil: 'networkidle0' });

    // Take screenshot
    const screenshot = await page.screenshot({
      type: 'png',
      quality: options.quality || 90,
      fullPage: true
    });

    return Buffer.from(screenshot);

  } catch (error) {
    console.error('Error generating preview:', error);
    throw new Error(`Preview generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Health check for PDF generation service
 */
export async function testPDFGeneration(): Promise<boolean> {
  if (!puppeteer) {
    return false;
  }
  try {
    const browser = await puppeteer.launch({ headless: true });
    await browser.close();
    return true;
  } catch (error) {
    console.error('PDF generation service unavailable:', error);
    return false;
  }
}