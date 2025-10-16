import {
  ensureCuratedTemplates,
  getTemplatesForOrg,
} from '$lib/templates';

import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return {
      clients: [],
      templates: []
    };
  }
  
  // Get user's org_id first
  const { data: profile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single() as { data: { org_id: string } | null };

  if (!profile) {
    return {
      clients: [],
      templates: []
    };
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
    clients: clients || [],
    templates
  };
};