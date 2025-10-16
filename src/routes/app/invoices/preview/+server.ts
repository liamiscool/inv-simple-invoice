import { renderInvoiceHTML } from '$lib/pdf/renderer';
import { getTemplate } from '$lib/templates';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Get user's profile for company data
  const { data: userProfile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!userProfile) {
    return new Response('Profile not found', { status: 404 });
  }

  // Parse query parameters
  const templateId = url.searchParams.get('template_id');
  const clientId = url.searchParams.get('client_id');
  const issueDate = url.searchParams.get('issue_date') || new Date().toISOString().split('T')[0];
  const dueDate = url.searchParams.get('due_date') || '';
  const currency = url.searchParams.get('currency') || 'EUR';
  const notes = url.searchParams.get('notes') || '';
  const itemsJson = url.searchParams.get('items') || '[]';
  const subtotal = parseFloat(url.searchParams.get('subtotal') || '0');
  const taxTotal = parseFloat(url.searchParams.get('tax_total') || '0');
  const total = parseFloat(url.searchParams.get('total') || '0');
  const includeContactName = url.searchParams.get('include_contact_name') === 'true';

  if (!templateId || !clientId) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // Get client data
  const { data: client } = await supabase
    .from('client')
    .select('id, name, company, email, company_address, tax_id, legal_name')
    .eq('id', clientId)
    .eq('org_id', (userProfile as any).org_id)
    .single();

  if (!client) {
    return new Response('Client not found', { status: 404 });
  }

  // Get template
  const template = await getTemplate(supabase, templateId);

  if (!template) {
    return new Response('Template not found', { status: 404 });
  }


  // Parse items
  let items;
  try {
    items = JSON.parse(itemsJson);
  } catch (e) {
    items = [];
  }

  // Create mock invoice data for preview
  const mockInvoice = {
    id: 'preview',
    number: 'INV-PREVIEW',
    issue_date: issueDate,
    due_date: dueDate || undefined,
    currency,
    status: 'draft',
    notes: notes || undefined,
    subtotal,
    tax_total: taxTotal,
    total,
    amount_paid: 0,
    client,
    items
  };

  // Render HTML
  const html = renderInvoiceHTML(mockInvoice, userProfile, template.spec, { includeContactName });

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
};
