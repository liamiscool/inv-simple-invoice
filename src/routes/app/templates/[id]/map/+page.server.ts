import type { TemplateSpec } from '$lib/templates';

import {
  fail,
  redirect,
} from '@sveltejs/kit';

import type {
  Actions,
  PageServerLoad,
} from './$types';

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
    .maybeSingle() as { data: any | null; error: any };

  if (error || !template) {
    redirect(303, '/app/templates');
  }

  // Check if user owns this template
  const { data: userProfile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single() as { data: { org_id: string } | null };

  if (template.kind === 'custom' && template.org_id !== userProfile?.org_id) {
    redirect(303, '/app/templates');
  }

  // Check if template has been processed (has a spec with background_image_url that's not a PDF)
  const spec = template.spec as TemplateSpec | null;
  const bgUrl = spec?.meta?.background_image_url;

  // If background is a PDF or missing, redirect back to classify to generate template
  if (!bgUrl || bgUrl.endsWith('.pdf')) {
    // Check if we have the original PDF URL in metadata or reconstruct it
    const pdfUrl = bgUrl || `https://kaijqyzmpqzdctbjlvxf.supabase.co/storage/v1/object/public/templates/${template.org_id || userProfile?.org_id}/${template.id}.pdf`;
    redirect(303, `/app/templates/upload/classify?id=${template.id}&pdf=${encodeURIComponent(pdfUrl)}`);
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
