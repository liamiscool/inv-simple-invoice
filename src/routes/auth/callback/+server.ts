import { redirect } from '@sveltejs/kit';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get('code');
  const next = url.searchParams.get('next') ?? '/app';

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // For email verification, redirect to settings with a success flag
      if (!next || next === '/app') {
        redirect(303, '/app/settings?email_verified=true');
      } else {
        redirect(303, `/${next.slice(1)}`);
      }
    }
  }

  // Return the user to an error page with instructions
  redirect(303, '/auth/auth-code-error');
};