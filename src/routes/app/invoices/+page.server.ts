import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return {
      invoices: [],
      clients: [],
      stats: null
    };
  }
  
  // Get user's org_id first
  const { data: profile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single();
    
  if (!profile) {
    return {
      invoices: [],
      clients: [],
      stats: null
    };
  }
  
  // Get invoices with client information
  const { data: invoices } = await supabase
    .from('invoice')
    .select(`
      *,
      client:client_id (
        name,
        company
      )
    `)
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false });
  
  // Transform the data to include client_name
  const transformedInvoices = invoices?.map(invoice => ({
    ...invoice,
    client_name: invoice.client?.company || invoice.client?.name || 'Unknown Client'
  })) || [];
  
  // Get clients count for empty state
  const { data: clients } = await supabase
    .from('client')
    .select('id')
    .eq('org_id', profile.org_id);
  
  // Calculate stats
  const stats = transformedInvoices.reduce((acc, invoice) => {
    if (invoice.status === 'paid') {
      acc.total_paid += invoice.total;
    } else if (['sent', 'partially_paid', 'overdue'].includes(invoice.status)) {
      acc.total_outstanding += invoice.total - invoice.amount_paid;
    }
    return acc;
  }, { total_paid: 0, total_outstanding: 0 });
  
  return {
    invoices: transformedInvoices,
    clients: clients || [],
    stats
  };
};