import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, user } }) => {
  // User is already authenticated by /app layout, just get their org
  const { data: userProfile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user!.id)
    .single();

  if (!userProfile?.org_id) {
    redirect(303, '/app/settings');
  }

  return {
    orgId: userProfile.org_id
  };
};

export const actions = {
  upload: async ({ request, locals: { supabase, user } }) => {
    if (!user) {
      return fail(401, { error: 'Unauthorized' });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const templateName = formData.get('name') as string;

    if (!file || !templateName) {
      return fail(400, { error: 'Missing file or template name' });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return fail(400, { error: 'Invalid file type. Allowed: PNG, JPEG, SVG, PDF' });
    }

    // Validate file size (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return fail(400, { error: 'File too large. Max 10MB' });
    }

    // Get user's org
    const { data: userProfile } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', user.id)
      .single();

    if (!userProfile?.org_id) {
      return fail(400, { error: 'No organization found' });
    }

    try {
      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${timestamp}_${templateName.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`;

      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('templates')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        return fail(500, { error: `Upload failed: ${uploadError.message}` });
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('templates')
        .getPublicUrl(fileName);

      // Create draft template record
      const { data: templateData, error: templateError } = await supabase
        .from('template')
        .insert({
          org_id: userProfile.org_id,
          title: templateName,
          kind: 'custom',
          spec: {
            meta: {
              name: templateName,
              description: 'Custom uploaded template',
              width: 210, // A4 default
              height: 297,
              dpi: 300,
              margins: { top: 20, right: 20, bottom: 20, left: 20 },
              background_image_url: publicUrl
            },
            styles: {
              fonts: { primary: 'Arial, sans-serif' },
              colors: { primary: '#000000', secondary: '#666666' },
              sizes: { default: 10, small: 8, large: 12, title: 18 }
            },
            areas: {
              // Empty areas - will be mapped by user
              items_table: {
                x: 20,
                y: 110,
                w: 170,
                row_height: 8,
                columns: [
                  { key: 'description', label: 'Description', w: 85, align: 'left' },
                  { key: 'qty', label: 'Qty', w: 20, align: 'center' },
                  { key: 'unit_price', label: 'Price', w: 25, align: 'right' },
                  { key: 'line_total', label: 'Total', w: 25, align: 'right' }
                ]
              },
              grand_total: { x: 140, y: 212, w: 50, align: 'right', font_weight: 'bold' }
            }
          }
        })
        .select()
        .single();

      if (templateError) {
        console.error('Template creation error:', templateError);
        // Clean up uploaded file
        await supabase.storage.from('templates').remove([fileName]);
        return fail(500, { error: `Template creation failed: ${templateError.message}` });
      }

      // Redirect to mapping interface
      redirect(303, `/app/templates/${templateData.id}/map`);
    } catch (error) {
      console.error('Unexpected error:', error);
      return fail(500, { error: 'An unexpected error occurred' });
    }
  }
} satisfies Actions;
