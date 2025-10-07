import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return {
      profile: null,
      subscription: null
    };
  }
  
  // Get user profile
  const { data: profile } = await supabase
    .from('app_user')
    .select('*')
    .eq('id', user.id)
    .single();
  
  // Get subscription info
  const { data: subscription } = await supabase
    .from('plan_subscription')
    .select('plan, status')
    .eq('org_id', profile?.org_id)
    .single();
  
  return {
    profile,
    subscription
  };
};