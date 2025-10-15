import { dev } from '$app/environment';
import {
  generateOptimizedInvoicePDF,
  testPDFGeneration,
} from '$lib/pdf/generator';
import { renderInvoiceHTML } from '$lib/pdf/renderer';
import { getTemplate } from '$lib/templates';

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
  
  // Get invoice with all related data including template
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
    .maybeSingle();
  
  if (!invoice) {
    return new Response('Invoice not found', { status: 404 });
  }
  
  // Get user's company details
  const { data: userProfile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Get the template used for this invoice
  const template = await getTemplate(supabase, invoice.template_id);
  
  if (!template) {
    return new Response('Template not found', { status: 404 });
  }
  
  // Sort items by position
  if (invoice.items) {
    invoice.items.sort((a: any, b: any) => a.position - b.position);
  }
  
  // Check if PDF generation is available and we're in production
  const pdfAvailable = !dev && await testPDFGeneration();
  
  if (pdfAvailable) {
    try {
      // Generate actual PDF using Puppeteer
      const pdfBuffer = await generateOptimizedInvoicePDF(invoice, userProfile, template.spec);
      
      return new Response(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="invoice-${invoice.number}.pdf"`
        }
      });
    } catch (error) {
      console.error('PDF generation failed, falling back to HTML:', error);
      // Fall through to HTML generation
    }
  }
  
  // Fallback: Generate HTML (for development or if PDF generation fails)
  const html = renderInvoiceHTML(invoice, userProfile, template.spec);
  
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Content-Disposition': `inline; filename="invoice-${invoice.number}.html"`
    }
  });
};