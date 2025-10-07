import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { supabase, safeGetSession }, url }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    redirect(303, '/auth/login');
  }
  
  // Check if user has completed onboarding (unless they're already on the onboarding page)
  if (url.pathname !== '/app/onboarding') {
    const { data: profile } = await supabase
      .from('app_user')
      .select('id')
      .eq('id', user.id)
      .single();
    
    if (!profile) {
      redirect(303, '/app/onboarding');
    }
  }
  
  return {};
};