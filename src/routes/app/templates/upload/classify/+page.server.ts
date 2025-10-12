import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { TemplateSpec } from '$lib/templates';

export const load: PageServerLoad = async ({ url, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    redirect(303, '/auth/login');
  }

  // Get template ID from query params (created in upload step)
  const templateId = url.searchParams.get('id');
  const pdfUrl = url.searchParams.get('pdf');

  if (!templateId || !pdfUrl) {
    redirect(303, '/app/templates/upload');
  }

  // Get the template that was just created
  const { data: template, error } = await supabase
    .from('template')
    .select('*')
    .eq('id', templateId)
    .single();

  if (error || !template) {
    console.error('Failed to load template:', error);
    redirect(303, '/app/templates/upload');
  }

  return {
    template,
    pdfUrl
  };
};

export const actions = {
  save: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const templateId = formData.get('template_id') as string;
    const specJson = formData.get('spec') as string;
    const blankTemplateUrl = formData.get('blank_template_url') as string;

    if (!templateId || !specJson || !blankTemplateUrl) {
      return fail(400, { error: 'Missing required fields' });
    }

    try {
      const spec: TemplateSpec = JSON.parse(specJson);

      // Update template with blank background and generated spec
      spec.meta.background_image_url = blankTemplateUrl;

      const { error } = await supabase
        .from('template')
        .update({ spec })
        .eq('id', templateId);

      if (error) {
        console.error('Update error:', error);
        return fail(500, { error: `Failed to save template: ${error.message}` });
      }

      // Redirect to mapping page for fine-tuning (or templates list to skip)
      redirect(303, `/app/templates/${templateId}/map`);
    } catch (error) {
      console.error('Parse error:', error);
      return fail(400, { error: 'Invalid template specification' });
    }
  }
} satisfies Actions;
