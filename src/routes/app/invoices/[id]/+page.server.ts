import type { PageServerLoad } from './$types';
import { getTemplate } from '$lib/templates';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return {
      invoice: null
    };
  }
  
  // Get user's profile (including company name for email)
  const { data: profile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single() as { data: any | null };

  if (!profile) {
    return {
      invoice: null,
      userProfile: null
    };
  }

  // Get invoice with all related data
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
      ),
      payments:invoice_payment (
        id,
        date,
        amount,
        method,
        notes
      )
    `)
    .eq('id', params.id)
    .eq('org_id', profile.org_id)
    .maybeSingle() as { data: any | null };
  
  if (!invoice) {
    return {
      invoice: null,
      userProfile: null
    };
  }

  // Sort items by position and payments by date
  if (invoice.items) {
    invoice.items.sort((a: any, b: any) => a.position - b.position);
  }

  if (invoice.payments) {
    invoice.payments.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // Get template for rendering
  const template = await getTemplate(supabase, invoice.template_id);

  return {
    invoice,
    userProfile: profile,
    template
  };
};