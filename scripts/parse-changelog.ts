#!/usr/bin/env tsx

/**
 * Parses CHANGELOG.md and generates a JSON file for the changelog widget
 * This ensures single source of truth for changelog entries
 */

import fs from 'fs';
import path from 'path';

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

  let currentEntry: Partial<ChangelogEntry> | null = null;
  let currentSection: 'added' | 'changed' | 'fixed' | null = null;

  for (const line of lines) {
    // Match version headers: ## [0.2.0] - 2025-10-15 or ## [Unreleased]
    const versionMatch = line.match(/^## \[(.+?)\](?:\s*-\s*(\d{4}-\d{2}-\d{2}))?/);
    if (versionMatch) {
      // Save previous entry
      if (currentEntry && currentEntry.date) {
        entries.push(currentEntry as ChangelogEntry);
      }

      const versionLabel = versionMatch[1];
      const date = versionMatch[2] || new Date().toISOString().split('T')[0]; // Default to today for Unreleased

      currentEntry = {
        version: versionLabel !== 'Unreleased' ? versionLabel : undefined,
        date: date,
        added: [],
        changed: [],
        fixed: []
      };
      currentSection = null;
      continue;
    }

    // Match section headers: ### Added, ### Changed, ### Fixed
    if (line.match(/^### Added/i)) {
      currentSection = 'added';
      continue;
    }
    if (line.match(/^### Changed/i)) {
      currentSection = 'changed';
      continue;
    }
    if (line.match(/^### Fixed/i)) {
      currentSection = 'fixed';
      continue;
    }

    // Match list items: - Item text
    const itemMatch = line.match(/^- (.+)/);
    if (itemMatch && currentEntry && currentSection) {
      currentEntry[currentSection]!.push(itemMatch[1]);
    }
  }

  // Don't forget the last entry
  if (currentEntry && currentEntry.date) {
    entries.push(currentEntry as ChangelogEntry);
  }

  // Return only last 5 entries for widget
  return entries.slice(0, 5);
}

// Main execution
try {
  // Read CHANGELOG.md
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md');

  if (!fs.existsSync(changelogPath)) {
    console.error('❌ CHANGELOG.md not found at:', changelogPath);
    process.exit(1);
  }

  const changelogContent = fs.readFileSync(changelogPath, 'utf-8');
  const entries = parseChangelog(changelogContent);

  if (entries.length === 0) {
    console.warn('⚠️  No changelog entries found in CHANGELOG.md');
  }

  // Write to generated file
  const outputPath = path.join(process.cwd(), 'src/lib/generated/changelog.json');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));

  console.log(`✅ Generated changelog.json with ${entries.length} entries`);

  // Preview first entry
  if (entries.length > 0) {
    const first = entries[0];
    console.log(`   Latest: ${first.version ? `v${first.version}` : 'Unreleased'} (${first.date})`);
    if (first.added.length > 0) console.log(`   - ${first.added.length} additions`);
    if (first.changed.length > 0) console.log(`   - ${first.changed.length} changes`);
    if (first.fixed.length > 0) console.log(`   - ${first.fixed.length} fixes`);
  }

} catch (error) {
  console.error('❌ Error parsing CHANGELOG.md:', error);
  process.exit(1);
}
