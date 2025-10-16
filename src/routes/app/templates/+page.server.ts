import {
  ensureCuratedTemplates,
  getTemplatesForOrg,
} from '$lib/templates';

import { fail } from '@sveltejs/kit';

import type {
  Actions,
  PageServerLoad,
} from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();
  
  if (!user) {
    return {
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
      templates: []
    };
  }
  
  // Ensure curated templates exist in the database
  // First try to create as curated templates (may fail due to RLS)
  await ensureCuratedTemplates(supabase);
  
  // As a fallback, create them as user templates if no templates exist
  const { data: existingTemplates } = await supabase
    .from('template')
    .select('id')
    .or(`org_id.is.null,org_id.eq.${profile.org_id}`)
    .limit(1) as { data: any[] | null };
    
  if (!existingTemplates || existingTemplates.length === 0) {
    // Create minimal template as user template if none exist
    const { error: createError } = await supabase
      .from('template')
      .insert({
        org_id: profile.org_id,
        title: 'Minimal',
        kind: 'curated',
        spec: {
          meta: {
            name: 'Minimal',
            description: 'Clean, minimal invoice template',
            width: 210,
            height: 297,
            dpi: 300,
            margins: { top: 20, right: 20, bottom: 20, left: 20 }
          },
          styles: {
            fonts: { primary: 'JetBrains Mono, monospace' },
            colors: { primary: '#000000', secondary: '#666666' },
            sizes: { default: 10, small: 8, large: 12, title: 18 }
          },
          areas: {
            invoice_title: { x: 20, y: 20, font_size: 18, font_weight: 'bold' },
            invoice_number: { x: 150, y: 20, w: 40, align: 'right', font_weight: 'bold' },
            company_info: { x: 20, y: 40, w: 80, h: 30, font_size: 9 },
            issue_date: { x: 120, y: 40, font_size: 9 },
            due_date: { x: 120, y: 45, font_size: 9 },
            client_name: { x: 20, y: 75, font_weight: 'bold', font_size: 11 },
            client_company: { x: 20, y: 80, font_size: 9, color: '#666666' },
            client_email: { x: 20, y: 85, font_size: 9, color: '#666666' },
            items_table: {
              x: 20, y: 110, w: 170, row_height: 8, header_height: 10,
              border_color: '#EAEAEA', border_width: 0.5,
              columns: [
                { key: 'description', label: 'Description', w: 85, align: 'left' },
                { key: 'qty', label: 'Qty', w: 20, align: 'center' },
                { key: 'unit_price', label: 'Price', w: 25, align: 'right' },
                { key: 'tax_rate', label: 'Tax', w: 15, align: 'right' },
                { key: 'line_total', label: 'Total', w: 25, align: 'right' }
              ]
            },
            subtotal: { x: 140, y: 200, w: 50, align: 'right', font_size: 9 },
            tax_total: { x: 140, y: 205, w: 50, align: 'right', font_size: 9 },
            grand_total: { x: 140, y: 212, w: 50, align: 'right', font_weight: 'bold', font_size: 11 },
            notes: { x: 20, y: 235, w: 170, h: 30, font_size: 8, color: '#666666' },
            payment_info: { x: 20, y: 270, w: 170, h: 20, font_size: 8, color: '#666666' }
          }
        }
      } as any);
      
    if (createError) {
      console.error('Error creating fallback template:', createError);
    }
  }
  
  // Get all available templates (curated + custom for this org)
  const templates = await getTemplatesForOrg(supabase, profile.org_id);
  
  return {
    templates
  };
};

export const actions = {
  delete: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const templateId = formData.get('id') as string;

    if (!templateId) {
      return fail(400, { error: 'Template ID required' });
    }

    // Get user's org_id
    const { data: userProfile } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', user.id)
      .single() as { data: { org_id: string } | null };

    if (!userProfile?.org_id) {
      return fail(400, { error: 'No organization found' });
    }

    // Get template to verify ownership and get background image URL
    const { data: template } = await supabase
      .from('template')
      .select('*')
      .eq('id', templateId)
      .maybeSingle() as { data: any | null };

    if (!template) {
      return fail(404, { error: 'Template not found' });
    }

    // Only allow deleting custom templates that belong to this org
    if (template.kind !== 'custom' || template.org_id !== userProfile.org_id) {
      return fail(403, { error: 'Cannot delete this template' });
    }

    // Delete the template from database
    const { error: deleteError } = await supabase
      .from('template')
      .delete()
      .eq('id', templateId);

    if (deleteError) {
      console.error('Delete template error:', deleteError);
      return fail(500, { error: 'Failed to delete template' });
    }

    // Delete the file from storage if it exists
    if (template.spec?.meta?.background_image_url) {
      const urlParts = template.spec.meta.background_image_url.split('/');
      const fileName = `${user.id}/${urlParts[urlParts.length - 1]}`;

      await supabase.storage
        .from('templates')
        .remove([fileName]);
    }

    return { success: true };
  }
} satisfies Actions;