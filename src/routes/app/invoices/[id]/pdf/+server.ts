import { getOrGeneratePDF, getStoredPDFUrl } from '$lib/pdf/storage';
import { getTemplate } from '$lib/templates';
import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's org_id first
  const { data: profile, error: profileError } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return new Response('Profile not found', { status: 404 });
  }

  // Check if PDF already exists in storage
  const existingPdfUrl = await getStoredPDFUrl(supabase, params.id, profile.org_id);

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
    .eq('org_id', profile.org_id)
    .maybeSingle();

  if (invoiceError || !invoice) {
    return new Response('Invoice not found', { status: 404 });
  }

  // Get user's company details
  const { data: userProfile, error: userProfileError } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single();

  if (userProfileError || !userProfile) {
    return new Response('User profile not found', { status: 404 });
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
    profile.org_id
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