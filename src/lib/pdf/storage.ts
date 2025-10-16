import type { TemplateSpec } from '$lib/templates';

import type { SupabaseClient } from '@supabase/supabase-js';

import { generateOptimizedInvoicePDF } from './generator';
import type {
  CompanyData,
  InvoiceData,
} from './renderer';

const BUCKET_NAME = 'invoice-pdfs';

export interface PDFStorageResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Generate a storage path for an invoice PDF
 * Format: {org_id}/{invoice_id}.pdf
 */
function getInvoicePDFPath(orgId: string, invoiceId: string): string {
  return `${orgId}/${invoiceId}.pdf`;
}

/**
 * Generate PDF and upload to Supabase Storage
 * Returns the public URL to the stored PDF
 */
export async function generateAndStorePDF(
  supabase: SupabaseClient,
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec,
  orgId: string,
  options: { includeContactName?: boolean; hideTaxColumn?: boolean } = {},
  browserBinding?: Fetcher
): Promise<PDFStorageResult> {
  try {
    // Generate PDF buffer
    const pdfBuffer = await generateOptimizedInvoicePDF(invoice, company, template, options, browserBinding);

    // Define storage path
    const filePath = getInvoicePDFPath(orgId, invoice.id);

    // Check if file already exists and delete it
    const { data: existingFiles } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(orgId, {
        search: `${invoice.id}.pdf`
      });

    if (existingFiles && existingFiles.length > 0) {
      // Delete existing file
      await supabase
        .storage
        .from(BUCKET_NAME)
        .remove([filePath]);
    }

    // Upload new PDF
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .upload(filePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true, // Replace if exists
        cacheControl: '3600' // Cache for 1 hour
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      return {
        success: false,
        error: `Failed to upload PDF: ${uploadError.message}`
      };
    }

    // Get public URL
    const { data: urlData } = supabase
      .storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    if (!urlData?.publicUrl) {
      return {
        success: false,
        error: 'Failed to get public URL for uploaded PDF'
      };
    }

    // Update invoice record with PDF URL and timestamp
    const { error: updateError } = await supabase
      .from('invoice')
      .update({
        pdf_url: urlData.publicUrl,
        pdf_generated_at: new Date().toISOString()
      })
      .eq('id', invoice.id)
      .eq('org_id', orgId);

    if (updateError) {
      console.error('Failed to update invoice with PDF URL:', updateError);
      // Not critical - PDF is uploaded successfully
    }

    return {
      success: true,
      url: urlData.publicUrl,
      path: filePath
    };

  } catch (error) {
    console.error('PDF generation and storage error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during PDF generation'
    };
  }
}

/**
 * Get the stored PDF URL for an invoice
 * Returns null if no PDF has been generated yet
 */
export async function getStoredPDFUrl(
  supabase: SupabaseClient,
  invoiceId: string,
  orgId: string
): Promise<string | null> {
  // First check the invoice record for cached URL
  const { data: invoice } = await supabase
    .from('invoice')
    .select('pdf_url, pdf_generated_at')
    .eq('id', invoiceId)
    .eq('org_id', orgId)
    .single();

  if (invoice?.pdf_url) {
    // Verify the file still exists in storage
    const filePath = getInvoicePDFPath(orgId, invoiceId);
    const { data: fileData, error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .list(orgId, {
        search: `${invoiceId}.pdf`
      });

    if (!error && fileData && fileData.length > 0) {
      return invoice.pdf_url;
    }
  }

  return null;
}

/**
 * Delete stored PDF for an invoice
 */
export async function deleteStoredPDF(
  supabase: SupabaseClient,
  invoiceId: string,
  orgId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const filePath = getInvoicePDFPath(orgId, invoiceId);

    const { error } = await supabase
      .storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    // Clear PDF URL from invoice record
    await supabase
      .from('invoice')
      .update({
        pdf_url: null,
        pdf_generated_at: null
      })
      .eq('id', invoiceId)
      .eq('org_id', orgId);

    return { success: true };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Check if invoice needs PDF regeneration
 * Returns true if invoice was updated after PDF was generated
 */
export async function needsPDFRegeneration(
  supabase: SupabaseClient,
  invoiceId: string,
  orgId: string
): Promise<boolean> {
  const { data: invoice } = await supabase
    .from('invoice')
    .select('updated_at, pdf_generated_at')
    .eq('id', invoiceId)
    .eq('org_id', orgId)
    .single();

  if (!invoice?.pdf_generated_at) {
    return true; // No PDF exists
  }

  if (!invoice.updated_at) {
    return false; // Can't determine, assume PDF is current
  }

  const updatedAt = new Date(invoice.updated_at);
  const pdfGeneratedAt = new Date(invoice.pdf_generated_at);

  return updatedAt > pdfGeneratedAt;
}

/**
 * Get or generate PDF for an invoice
 * Returns existing PDF if available and current, otherwise generates new one
 */
export async function getOrGeneratePDF(
  supabase: SupabaseClient,
  invoice: InvoiceData,
  company: CompanyData,
  template: TemplateSpec,
  orgId: string,
  options: { includeContactName?: boolean; hideTaxColumn?: boolean } = {},
  browserBinding?: Fetcher
): Promise<PDFStorageResult> {
  // Check if PDF exists and is current
  const existingUrl = await getStoredPDFUrl(supabase, invoice.id, orgId);
  const needsRegen = await needsPDFRegeneration(supabase, invoice.id, orgId);

  if (existingUrl && !needsRegen) {
    return {
      success: true,
      url: existingUrl
    };
  }

  // Generate new PDF
  return generateAndStorePDF(supabase, invoice, company, template, orgId, options, browserBinding);
}
