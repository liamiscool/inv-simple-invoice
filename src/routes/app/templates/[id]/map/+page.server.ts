import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TemplateSpec } from '$lib/templates';

export const load: PageServerLoad = async ({ params, locals: { supabase, safeGetSession } }) => {
  // User is already authenticated by /app layout
  const { user } = await safeGetSession();

  if (!user) {
    redirect(303, '/auth/login');
  }

  const { data: template, error } = await supabase
    .from('template')
    .select('*')
    .eq('id', params.id)
    .single();

  if (error || !template) {
    redirect(303, '/app/templates');
  }

  // Check if user owns this template
  const { data: userProfile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (template.kind === 'custom' && template.org_id !== userProfile?.org_id) {
    redirect(303, '/app/templates');
  }

  return {
    template
  };
};

export const actions = {
  save: async ({ request, params, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const specJson = formData.get('spec') as string;

    if (!specJson) {
      return fail(400, { error: 'Missing template specification' });
    }

    try {
      const spec: TemplateSpec = JSON.parse(specJson);

      // Validate required fields
      if (!spec.areas?.items_table || !spec.areas?.grand_total) {
        return fail(400, { error: 'Missing required areas: items_table and grand_total' });
      }

      // Update template
      const { error } = await supabase
        .from('template')
        .update({ spec })
        .eq('id', params.id);

      if (error) {
        console.error('Update error:', error);
        return fail(500, { error: `Failed to save template: ${error.message}` });
      }

      redirect(303, '/app/templates');
    } catch (error) {
      console.error('Parse error:', error);
      return fail(400, { error: 'Invalid template specification' });
    }
  }
} satisfies Actions;
