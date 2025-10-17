import type { TemplateSpec } from '$lib/templates';

import {
  type CompanyData,
  type InvoiceData,
  renderInvoiceHTML,
} from './renderer';

// Puppeteer - dual environment support:
// - Development: Uses standard 'puppeteer' with local Chromium
// - Production: Uses '@cloudflare/puppeteer' with Browser Rendering API

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
 * Launch browser with environment-specific Puppeteer
 * - Development: Local Puppeteer with Chromium binary
 * - Production: Cloudflare Browser Rendering API
 */
async function launchBrowser(browserBinding?: Fetcher) {
  if (browserBinding) {
    // Production: Use Cloudflare Browser Rendering API
    console.log('📄 Using Cloudflare Browser Rendering API (production)');
    const cloudflare = await import('@cloudflare/puppeteer');
    return await cloudflare.default.launch(browserBinding);
  } else {
    // Development: Use local Puppeteer
    console.log('📄 Using local Puppeteer (development)');
    const puppeteer = await import('puppeteer');
    return await puppeteer.default.launch({
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
  }
}

/**
 * Generate a PDF from invoice data using a template
 * @param browserBinding - Optional Cloudflare Browser binding (only present in production)
 */
export async function generateInvoicePDF(
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec,
  options: PDFGenerationOptions = {},
  renderOptions: { includeContactName?: boolean; hideTaxColumn?: boolean; dateFormat?: string } = {},
  browserBinding?: Fetcher
): Promise<Buffer> {
  let browser = null;

  try {
    // Launch browser (environment-specific)
    browser = await launchBrowser(browserBinding);

    const page = await browser.newPage();

    console.log('=== generateInvoicePDF - renderOptions ===');
    console.log('renderOptions:', renderOptions);

    // Generate HTML content using our template renderer
    const html = renderInvoiceHTML(invoice, company, template, renderOptions);

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
 * @param browserBinding - Optional Cloudflare Browser binding (only present in production)
 */
export async function generateOptimizedInvoicePDF(
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec,
  options: { includeContactName?: boolean; hideTaxColumn?: boolean; dateFormat?: string } = {},
  browserBinding?: Fetcher
): Promise<Buffer> {
  const { meta } = template;

  console.log('=== generateOptimizedInvoicePDF - options received ===');
  console.log('options:', options);

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

  return generateInvoicePDF(invoice, company, template, customOptions, options, browserBinding);
}

/**
 * Generate a preview PNG image of the invoice (for template previews)
 * @param browserBinding - Optional Cloudflare Browser binding (only present in production)
 */
export async function generateInvoicePreview(
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec,
  options: { width?: number; height?: number; quality?: number; includeContactName?: boolean; hideTaxColumn?: boolean } = {},
  browserBinding?: Fetcher
): Promise<Buffer> {
  let browser = null;

  try {
    // Launch browser (environment-specific)
    browser = await launchBrowser(browserBinding);

    const page = await browser.newPage();

    // Set viewport for consistent preview generation
    await page.setViewport({
      width: options.width || 800,
      height: options.height || 1200,
      deviceScaleFactor: 2 // Higher DPI for better quality
    });

    // Extract render options (separate from image generation options)
    const renderOptions = {
      includeContactName: options.includeContactName,
      hideTaxColumn: options.hideTaxColumn
    };

    const html = renderInvoiceHTML(invoice, company, template, renderOptions);
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
 * @param browserBinding - Optional Cloudflare Browser binding
 */
export async function testPDFGeneration(browserBinding?: Fetcher): Promise<boolean> {
  try {
    const browser = await launchBrowser(browserBinding);
    await browser.close();
    return true;
  } catch (error) {
    console.error('PDF generation service unavailable:', error);
    return false;
  }
}
