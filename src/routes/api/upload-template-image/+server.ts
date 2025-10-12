import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return json({ error: 'Missing file or path' }, { status: 400 });
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('templates')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('templates')
      .getPublicUrl(path);

    return json({ publicUrl });
  } catch (error) {
    console.error('Unexpected error:', error);
    return json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
};
