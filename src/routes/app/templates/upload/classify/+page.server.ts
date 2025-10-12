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

  // Get user's org_id and operates_as_company setting
  const { data: userProfile } = await supabase
    .from('app_user')
    .select('org_id, operates_as_company')
    .eq('id', user.id)
    .single();

  // Get org-wide custom fields
  let customFields = [];
  if (userProfile?.org_id) {
    const { data } = await supabase
      .from('custom_field')
      .select('*')
      .eq('org_id', userProfile.org_id)
      .order('created_at', { ascending: false });

    customFields = data || [];
  }

  // Load saved classification state if it exists
  const savedState = template.metadata as any;

  return {
    template,
    pdfUrl,
    userId: user.id,
    savedClassifiedItems: savedState?.classified_items || null,
    savedCustomAreas: savedState?.custom_areas || null,
    customFields,
    operatesAsCompany: userProfile?.operates_as_company || false
  };
};

export const actions = {
  autosave: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const templateId = formData.get('template_id') as string;
    const classifiedItemsJson = formData.get('classified_items') as string;
    const customAreasJson = formData.get('custom_areas') as string;

    if (!templateId) {
      return fail(400, { error: 'Missing template ID' });
    }

    try {
      // Store the classification state in template metadata
      const classificationState = {
        classified_items: classifiedItemsJson ? JSON.parse(classifiedItemsJson) : {},
        custom_areas: customAreasJson ? JSON.parse(customAreasJson) : []
      };

      const { error } = await supabase
        .from('template')
        .update({
          metadata: classificationState
        })
        .eq('id', templateId);

      if (error) {
        console.error('Auto-save error:', error);
        return fail(500, { error: `Auto-save failed: ${error.message}` });
      }

      return { success: true };
    } catch (error) {
      console.error('Auto-save parse error:', error);
      return fail(400, { error: 'Invalid data' });
    }
  },

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
