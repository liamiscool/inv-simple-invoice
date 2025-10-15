You are helping update the CHANGELOG.md file for **inv** (simple invoicing software for designers and freelancers).

## Guidelines for Writing Changelog Entries

### Audience
- **Primary**: Designers and freelancers using inv to create invoices
- **Not**: Developers or technical users

### Writing Style
- **Plain English**: Avoid technical jargon (no "refactored", "migrated", "RLS policies")
- **User-focused**: Describe what users can now do, not what code changed
- **Concise**: 1 sentence per entry maximum
- **Benefit-driven**: Focus on the user benefit, not the implementation

### Good Examples ✅
- "Improved email formatting for invoices"
- "Fixed bug where PDF downloads failed on mobile"
- "Added client archive feature to hide inactive clients"
- "Made invoice status badges easier to read"
- "Faster page loads across all pages"
- "Invoice PDFs can now be viewed without logging in"
- "Better mobile experience for managing invoices"

### Bad Examples ❌
- "Refactored TypeScript interfaces for better type inference" (too technical)
- "Updated padding from px-4 to px-5 for 44px touch targets" (implementation detail)
- "Fixed RLS policy for template visibility" (developer jargon)
- "Migrated to Svelte 5 syntax" (internal change, no user benefit)
- "Added z-index to dropdown component" (too specific)

### Categories
- **Added**: New features users can interact with
- **Changed**: Improvements to existing features (UX, performance, design)
- **Fixed**: Bugs that affected user experience

### What NOT to Include
- Internal refactors with no visible user benefit
- Developer tooling changes (TypeScript, linting, etc.)
- Dependency updates (unless they directly impact users)
- Code organization changes
- Build process improvements

## Your Task

1. **Read current CHANGELOG.md** and show the `[Unreleased]` section
2. **Review recent commits** using `git log --oneline -6`
3. **Identify user-facing changes** (skip internal refactors)
4. **Write plain English descriptions** (1 sentence each)
5. **Update CHANGELOG.md** under the `## [Unreleased]` section
6. **Keep entries brief and relevant** to end users
7. **Maintain list size**: Keep only the 6 most recent user-facing entries per section (Added/Changed/Fixed)
8. **Remove oldest entries** when adding new ones to keep changelog focused

## Process

When I run this command, you should:

1. Show me the current [Unreleased] section from CHANGELOG.md
2. Show me the last 6 commits
3. Ask me which changes should be added to the changelog
4. Suggest user-friendly wording for each change
5. When adding new entries, remove the oldest ones to maintain ~6 entries per section
6. Update CHANGELOG.md with my approval

## Managing Changelog Size

**Goal**: Keep [Unreleased] section focused on recent changes only (~6 entries per section)

**When adding new entries:**
- If a section (Added/Changed/Fixed) has more than 6 entries, remove the oldest ones
- Prioritize recent, high-impact changes
- Older changes get archived when you create a new release version

**Example:**
```markdown
### Added (currently 6 entries)
- New feature from today
- Feature from yesterday
- Feature from 3 days ago
- Feature from 4 days ago
- Feature from 5 days ago
- Feature from 1 week ago

# After adding new feature:
### Added (still 6 entries)
- **NEW: Latest feature** ← added
- New feature from today
- Feature from yesterday
- Feature from 3 days ago
- Feature from 4 days ago
- Feature from 5 days ago
- ~~Feature from 1 week ago~~ ← removed (oldest)
```

## Example Workflow

```
User: /changelog