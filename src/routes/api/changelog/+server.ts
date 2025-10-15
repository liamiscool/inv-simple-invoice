import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Static changelog data (will be updated manually or via build process)
const CHANGELOG_ENTRIES = [
  {
    date: '2025-10-15',
    added: ['Email template improvements with better formatting'],
    changed: ['Improved invoice page UX flow'],
    fixed: ['Duplicate invoice creation bug', 'PDF generation on Cloudflare Pages']
  }
];

export const GET: RequestHandler = async () => {
  return json({
    entries: CHANGELOG_ENTRIES
  });
};
