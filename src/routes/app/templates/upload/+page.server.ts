import { redirect, fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  // User is already authenticated by /app layout
  const { user } = await safeGetSession();

  if (!user) {
    redirect(303, '/auth/login');
  }

  // Get their org
  const { data: userProfile } = await supabase
    .from('app_user')
    .select('org_id')
    .eq('id', user.id)
    .single();

  if (!userProfile?.org_id) {
    redirect(303, '/app/settings');
  }

  return {
    orgId: userProfile.org_id
  };
};

export const actions = {
  upload: async ({ request, locals: { supabase, safeGetSession } }) => {
    console.log('=== SERVER: Upload action started ===');
    const { user } = await safeGetSession();

    if (!user) {
      console.log('SERVER: No user found');
      return fail(401, { error: 'Unauthorized' });
    }

    console.log('SERVER: User authenticated:', user.id);

    const formData = await request.formData();
    console.log('SERVER: FormData entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}: File(name=${value.name}, size=${value.size}, type=${value.type})`);
      } else {
        console.log(`  ${key}: ${value}`);
      }
    }

    const file = formData.get('file') as File;
    const templateName = formData.get('name') as string;

    console.log('SERVER: Extracted file:', file);
    console.log('SERVER: Extracted templateName:', templateName);

    if (!file || !templateName) {
      console.log('SERVER: Missing file or template name');
      console.log('  file:', file);
      console.log('  templateName:', templateName);
      return fail(400, { error: 'Missing file or template name' });
    }

    // Validate file type (accept PDF for text extraction, or images for manual mapping)
    const allowedTypes = ['image/png', 'image/jpeg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return fail(400, { error: 'Invalid file type. Only PNG, JPEG, and PDF are supported.' });
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
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/${timestamp}_${templateName.replace(/[^a-z0-9]/gi, '_')}.${fileExt}`;

      // Upload image file
      const { error: uploadError } = await supabase.storage
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
              background_image_url: publicUrl // PNG/JPEG - PDFs converted client-side
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

      // If PDF, redirect to classification page to extract text and create blank template
      // If image (PNG/JPEG), skip directly to manual mapping
      if (file.type === 'application/pdf') {
        throw redirect(303, `/app/templates/upload/classify?id=${templateData.id}&pdf=${encodeURIComponent(publicUrl)}`);
      } else {
        throw redirect(303, `/app/templates/${templateData.id}/map`);
      }
    } catch (error) {
      // Re-throw redirect errors (they're not actual errors)
      if (error instanceof Response || (error && typeof error === 'object' && 'status' in error && 'location' in error)) {
        throw error;
      }
      console.error('Unexpected error:', error);
      return fail(500, { error: 'An unexpected error occurred' });
    }
  }
} satisfies Actions;
