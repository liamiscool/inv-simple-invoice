import { getOrGeneratePDF, getStoredPDFUrl } from '$lib/pdf/storage';
import { getTemplate } from '$lib/templates';
import { redirect } from '@sveltejs/kit';
import { checkRateLimit } from '$lib/utils/rateLimiter';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase, safeGetSession }, getClientAddress }) => {
  const { user } = await safeGetSession();

  let orgId: string;

  if (!user) {
    // Public access - apply rate limiting
    const clientIp = getClientAddress();
    const rateLimitOk = checkRateLimit(clientIp, 'invoice-pdf', 10, 60);

    if (!rateLimitOk) {
      return new Response('Too many requests. Please try again later.', {
        status: 429,
        headers: {
          'Retry-After': '60'
        }
      });
    }

    // Get org_id from invoice record (public access)
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoice')
      .select('org_id')
      .eq('id', params.id)
      .single();

    if (invoiceError || !invoice) {
      return new Response('Invoice not found', { status: 404 });
    }

    orgId = invoice.org_id;
  } else {
    // Authenticated access - no rate limiting
    // Get user's org_id
    const { data: profile, error: profileError } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return new Response('Profile not found', { status: 404 });
    }

    orgId = profile.org_id;
  }

  // Check if PDF already exists in storage
  const existingPdfUrl = await getStoredPDFUrl(supabase, params.id, orgId);

  if (existingPdfUrl) {
    // Redirect to the stored PDF
    throw redirect(302, existingPdfUrl);
  }

  // PDF doesn't exist yet - generate it
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
    .eq('org_id', orgId)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return new Response('Invoice not found', { status: 404 });
  }

  // Get company details from the org
  const { data: userProfile, error: userProfileError } = await supabase
    .from('app_user')
    .select('*')
    .eq('org_id', orgId)
    .single();

  if (userProfileError || !userProfile) {
    return new Response('Organization profile not found', { status: 404 });
  }

  // Get the template used for this invoice
  const template = await getTemplate(supabase, invoice.template_id);

  if (!template) {
    return new Response('Template not found', { status: 404 });
  }

  // Sort items by position
  if (invoice.items) {
    invoice.items.sort((a: any, b: any) => a.position - b.position);
  }

  // Generate and store PDF
  const result = await getOrGeneratePDF(
    supabase,
    invoice,
    userProfile,
    template.spec,
    orgId
  );

  if (!result.success || !result.url) {
    return new Response(
      `PDF generation failed: ${result.error || 'Unknown error'}`,
      { status: 500 }
    );
  }

  // Redirect to the stored PDF
  throw redirect(302, result.url);
};