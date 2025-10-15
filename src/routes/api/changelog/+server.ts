import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFileSync } from 'fs';
import { join } from 'path';

export const GET: RequestHandler = async () => {
  try {
    // Read CHANGELOG.md from project root
    const changelogPath = join(process.cwd(), 'CHANGELOG.md');
    const content = readFileSync(changelogPath, 'utf-8');

    // Parse the changelog
    const entries = parseChangelog(content);

    return json({
      entries: entries.slice(0, 10) // Return last 10 entries
    });
  } catch (error) {
    console.error('Error reading changelog:', error);
    return json({ error: 'Failed to load changelog' }, { status: 500 });
  }
};

interface ChangelogEntry {
  version?: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
}

function parseChangelog(content: string): ChangelogEntry[] {
  const entries: ChangelogEntry[] = [];
  const lines = content.split('\n');

  let currentEntry: ChangelogEntry | null = null;
  let currentSection: 'added' | 'changed' | 'fixed' | null = null;

  for (const line of lines) {
    // Match version header: ## [0.2.0] - 2025-10-15 or ## [Unreleased]
    const versionMatch = line.match(/^##\s+\[([^\]]+)\](?:\s+-\s+(\d{4}-\d{2}-\d{2}))?/);
    if (versionMatch) {
      // Save previous entry
      if (currentEntry) {
        entries.push(currentEntry);
      }

      // Start new entry
      const version = versionMatch[1];
      const date = versionMatch[2] || new Date().toISOString().split('T')[0];

      currentEntry = {
        version: version !== 'Unreleased' ? version : undefined,
        date,
        added: [],
        changed: [],
        fixed: []
      };
      currentSection = null;
      continue;
    }

    // Match section headers: ### Added, ### Changed, ### Fixed
    const sectionMatch = line.match(/^###\s+(Added|Changed|Fixed)/i);
    if (sectionMatch && currentEntry) {
      const section = sectionMatch[1].toLowerCase();
      currentSection = section as 'added' | 'changed' | 'fixed';
      continue;
    }

    // Match list items: - Item text
    const itemMatch = line.match(/^-\s+(.+)$/);
    if (itemMatch && currentEntry && currentSection) {
      currentEntry[currentSection].push(itemMatch[1]);
    }
  }

  // Add the last entry
  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries;
}
