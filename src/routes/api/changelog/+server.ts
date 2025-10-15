import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import changelogEntries from '$lib/generated/changelog.json';

/**
 * Changelog API endpoint
 *
 * This endpoint serves changelog data parsed from CHANGELOG.md
 * The JSON file is auto-generated at build time by scripts/parse-changelog.ts
 *
 * Single source of truth: CHANGELOG.md
 */

export const GET: RequestHandler = async () => {
  return json({
    entries: changelogEntries
  });
};
