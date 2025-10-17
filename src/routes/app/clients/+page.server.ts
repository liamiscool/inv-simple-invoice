import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return {
      clients: []
    };
  }
  
  // Get user's org_id and profile data
  const { data: profile } = await supabase
    .from('app_user')
    .select('org_id, date_format')
    .eq('id', user.id)
    .single() as { data: { org_id: string; date_format: string | null } | null };

  if (!profile) {
    return {
      clients: []
    };
  }

  // Get all clients for this org
  const { data: clients } = await supabase
    .from('client')
    .select('*')
    .eq('org_id', profile.org_id)
    .order('created_at', { ascending: false }) as { data: any[] | null };
  
  return {
    clients: clients || [],
    profile
  };
};