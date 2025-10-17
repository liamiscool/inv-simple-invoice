import { deleteStoredPDF } from '$lib/pdf/storage';

import { createClient } from '@supabase/supabase-js';
import { json } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals: { supabase, safeGetSession }, platform }) => {
  const { user } = await safeGetSession();

  if (!user) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Parse request body
    const { invoiceIds } = await request.json();

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return json({ error: 'Invalid invoice IDs' }, { status: 400 });
    }

    // Get user's org_id for security
    const { data: profile, error: profileError } = await supabase
      .from('app_user')
      .select('org_id')
      .eq('id', user.id)
      .single() as { data: { org_id: string } | null; error: any };

    if (profileError || !profile) {
      return json({ error: 'Profile not found' }, { status: 404 });
    }

    const orgId = profile.org_id;
    const results = [];

    // Create service role client for storage operations (bypasses RLS)
    const env = platform?.env || process.env;
    const serviceRoleClient = createClient(
      env.PUBLIC_SUPABASE_URL as string,
      env.SUPABASE_SERVICE_ROLE_KEY as string,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Process each invoice
    for (const invoiceId of invoiceIds) {
      try {
        // First, delete the PDF from storage (if it exists)
        // Use service role client to bypass RLS policies
        const pdfResult = await deleteStoredPDF(serviceRoleClient, invoiceId, orgId);

        if (!pdfResult.success) {
          console.warn(`Failed to delete PDF for invoice ${invoiceId}:`, pdfResult.error);
          // Continue with DB deletion even if PDF deletion fails
        } else {
          console.log(`✅ Successfully deleted PDF for invoice ${invoiceId}`);
        }

        // Delete the invoice from database
        const { error: deleteError } = await supabase
          .from('invoice')
          .delete()
          .eq('id', invoiceId)
          .eq('org_id', orgId); // Ensure org_id scoping

        if (deleteError) {
          console.error(`Failed to delete invoice ${invoiceId}:`, deleteError);
          results.push({
            invoiceId,
            success: false,
            error: deleteError.message
          });
        } else {
          results.push({
            invoiceId,
            success: true
          });
        }

      } catch (error) {
        console.error(`Error processing invoice ${invoiceId}:`, error);
        results.push({
          invoiceId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Check if all deletions were successful
    const failedDeletions = results.filter(r => !r.success);
    
    if (failedDeletions.length > 0) {
      return json({
        success: false,
        error: `${failedDeletions.length} of ${invoiceIds.length} invoices failed to delete`,
        results
      }, { status: 500 });
    }

    return json({
      success: true,
      message: `${invoiceIds.length} invoice(s) deleted successfully`,
      results
    });

  } catch (error) {
    console.error('Delete invoice error:', error);
    return json({ 
      error: error instanceof Error ? error.message : 'Failed to delete invoices' 
    }, { status: 500 });
  }
};
