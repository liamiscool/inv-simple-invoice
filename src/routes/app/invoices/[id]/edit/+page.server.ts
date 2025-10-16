import {
  ensureCuratedTemplates,
  getTemplatesForOrg,
} from '$lib/templates';
import { error } from '@sveltejs/kit';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    throw error(401, 'Unauthorized');
  }

  // Get user's org_id first
  const { data: profile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single() as { data: { org_id: string } | null };

  if (!profile) {
    throw error(404, 'Profile not found');
  }

  // Get the invoice with all related data
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoice')
    .select(`
      *,
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
    .single() as { data: any | null; error: any };

  if (invoiceError || !invoice) {
    throw error(404, 'Invoice not found');
  }

  // Only allow editing draft invoices
  if (invoice.status !== 'draft') {
    throw error(403, 'Only draft invoices can be edited');
  }

  // Sort items by position
  if (invoice.items) {
    invoice.items.sort((a: any, b: any) => a.position - b.position);
  }

  // Ensure curated templates exist in the database
  await ensureCuratedTemplates(supabase);

  // Get clients for this org
  const { data: clients } = await supabase
    .from('client')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('name') as { data: any[] | null };

  // Get all available templates (curated + custom for this org)
  const templates = await getTemplatesForOrg(supabase, profile.org_id);

  return {
    invoice,
    clients: clients || [],
    templates
  };
};
