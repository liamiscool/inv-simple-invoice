import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return {
      clients: []
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
      clients: []
    };
  }
  
  // Get active clients for this org (not deleted)
  const { data: clients } = await supabase
    .from('client')
    .select('*')
    .eq('org_id', profile.org_id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });
  
  return {
    clients: clients || []
  };
};