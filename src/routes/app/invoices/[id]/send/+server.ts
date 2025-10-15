import {
  isEmailServiceConfigured,
  sendInvoiceEmail,
} from '$lib/email/service';
import { getOrGeneratePDF } from '$lib/pdf/storage';
import { getTemplate } from '$lib/templates';

import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, params, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if email service is configured
  if (!isEmailServiceConfigured()) {
    return json({ 
      error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' 
    }, { status: 500 });
  }

  try {
    // Parse request body
    const { to, subject, message, include_pdf = true } = await request.json();

    if (!to) {
      return json({ error: 'Recipient email is required' }, { status: 400 });
    }

    // Get user's org_id first
    const { data: profile, error: profileError } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return json({ error: 'Profile not found' }, { status: 404 });
    }

    // Get invoice with all related data
    const { data: invoice, error: invoiceError } = await supabase
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

    if (invoiceError || !invoice) {
      return json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get user's company details
    const { data: userProfile, error: userProfileError } = await supabase
      .from('app_user')
      .select('*')
      .eq('id', user.id)
      .single();

    if (userProfileError || !userProfile) {
      return json({ error: 'User profile not found' }, { status: 404 });
    }

    // Get template
    const template = await getTemplate(supabase, invoice.template_id);
    
    if (!template) {
      return json({ error: 'Template not found' }, { status: 404 });
    }

    // Sort items by position
    if (invoice.items) {
      invoice.items.sort((a: any, b: any) => a.position - b.position);
    }

    // Format currency for email
    function formatCurrency(amount: number, currency: string): string {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    }

    function formatDate(dateString: string): string {
      return new Date(dateString).toLocaleDateString();
    }

    // Generate and store PDF (regardless of include_pdf setting, we need the URL)
    const pdfResult = await getOrGeneratePDF(
      supabase,
      invoice,
      userProfile,
      template.spec,
      profile.org_id
    );

    if (!pdfResult.success) {
      console.error('PDF generation failed:', pdfResult.error);
      // Continue anyway - we'll send email without PDF
    }

    // Use the Supabase Storage URL for downloads (not the /pdf endpoint)
    const downloadUrl = pdfResult.url || `${request.url.split('/send')[0]}/pdf`;

    // Prepare email template data
    const templateData = {
      invoiceNumber: invoice.number,
      clientName: invoice.client.name,
      companyName: userProfile?.company_name || userProfile?.full_name || 'Your Company',
      dueDate: invoice.due_date ? formatDate(invoice.due_date) : undefined,
      total: formatCurrency(invoice.total, invoice.currency),
      currency: invoice.currency,
      downloadUrl, // Direct link to Supabase Storage PDF
      paymentInstructions: userProfile?.bank_details || undefined
    };

    // Prepare email options
    const emailOptions = {
      to,
      from: userProfile?.email ? `${userProfile.company_name || userProfile.full_name} <invoices@send.inv.so>` : undefined,
      replyTo: userProfile?.email || 'invoices@send.inv.so',
      subject: subject || undefined,
      attachmentBuffer: undefined as Buffer | undefined,
      attachmentFilename: undefined as string | undefined
    };

    // Fetch PDF from storage for email attachment if requested
    if (include_pdf && pdfResult.success && pdfResult.url) {
      try {
        // Download the PDF from Supabase Storage
        const response = await fetch(pdfResult.url);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          emailOptions.attachmentBuffer = Buffer.from(arrayBuffer);
          emailOptions.attachmentFilename = `invoice-${invoice.number}.pdf`;
        }
      } catch (error) {
        console.error('Failed to fetch PDF for email attachment:', error);
        // Continue without PDF attachment
      }
    }

    // Send email
    const result = await sendInvoiceEmail(templateData, emailOptions);

    if (!result.success) {
      return json({ error: result.error || 'Failed to send email' }, { status: 500 });
    }

    // Update invoice status to 'sent' if it was 'draft'
    if (invoice.status === 'draft') {
      await supabase
        .from('invoice')
        .update({ status: 'sent' })
        .eq('id', invoice.id);
    }

    // Log the email send (you could add this to a sends table for tracking)
    console.log(`Invoice ${invoice.number} sent to ${to}, messageId: ${result.messageId}`);

    return json({ 
      success: true, 
      messageId: result.messageId,
      message: 'Invoice sent successfully'
    });

  } catch (error) {
    console.error('Send invoice error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Failed to send invoice' 
    }, { status: 500 });
  }
};