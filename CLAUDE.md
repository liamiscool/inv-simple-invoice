# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project: inv - Beautiful Invoices for Designers

A minimal, Yeezy-inspired invoice tool with stark minimalism and terminal vibes. Core innovation: designers can upload their own invoice designs (PDF/PNG) and convert them to reusable templates.

---

## 🚨 IMPORTANT: PDF CONVERSION ARCHITECTURE

**Current Approach**: CLIENT-SIDE PDF CONVERSION

PDFs uploaded by users are converted to PNG **in the browser** (not server-side) to avoid native dependencies like Cairo, Pango, and canvas that don't work on Cloudflare Pages.

**Location**: `src/routes/app/templates/upload/+page.svelte` (lines 6-16, 30-56)

**How it works**:
1. User uploads PDF via drag & drop
2. Browser uses pdf.js to render PDF first page at 300 DPI
3. Canvas API converts to PNG Blob
4. PNG is uploaded to Supabase Storage
5. Server only handles PNG uploads

**Future Improvements** (when scaling):
- Move conversion to Web Worker (better performance, non-blocking UI)
- Add progress indicator for large PDFs
- Consider external service (CloudConvert API) for production
- Or use Cloudflare Workers with pdf.js for server-side conversion

**Why not server-side?**
- Native dependencies (cairo, pango) don't work on Cloudflare Pages
- Serverless environment requires pre-compiled binaries
- Client-side keeps deployment simple and costs low

---

## 🔌 MCP (Model Context Protocol) Setup

**Status**: Configured for remote HTTP-based access to Supabase

The project has Supabase MCP configured for direct database access in Claude Code sessions. This allows Claude to query the database schema, inspect tables, and help with migrations.

**Configuration Location**: `~/.claude.json` (CLI) or `~/Library/Application Support/Claude/claude_desktop_config.json` (Desktop)

**Current Setup**:
```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=kaijqyzmpqzdctbjlvxf"
    }
  }
}
```

**Authentication**: Requires OAuth flow (use `/mcp` command in Claude Code to trigger authentication)

**Security**: Configured for development project only (not production). MCP allows Claude to:
- Query database schema
- Inspect table structures
- Run read-only queries (when configured)
- Help create migrations

**Note**: If MCP authentication doesn't work, Claude can still access the database via:
- Environment variables in `.env.local`
- Supabase CLI commands
- Direct TypeScript type definitions in `src/lib/types/database.types.ts`

---

## Key Commands

### Development

**Package Manager**: This project uses `pnpm` (not npm).

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Type checking
pnpm check
```

### Database
```bash
# Run Supabase migrations
npx supabase migration up

# Reset database (caution: development only)
npx supabase db reset

# Generate types from Supabase
npx supabase gen types typescript --local > src/lib/types/supabase.ts
```

## Architecture Overview

### Tech Stack
- **Frontend**: SvelteKit (latest) with TailwindCSS
- **Database**: Supabase (Postgres + Auth + Storage)
- **Email**: Resend for sending invoices
- **Payments**: Stripe (Checkout + Customer Portal)
- **PDF**: Server-side rendering via headless Chromium
- **Animations**: anime.js (selective micro-animations)
- **Deployment**: Cloudflare Pages

### Core Data Model

The application uses org-scoped multi-tenancy (single org per user for MVP):
- `app_org`: Organizations (future-proof for multi-org)
- `app_user`: User profiles with billing details
- `client`: Customer records
- `template`: Invoice templates (curated + user-uploaded)
- `invoice`: Invoice records with status tracking
- `invoice_item`: Line items
- `invoice_payment`: Partial payment tracking
- `plan_subscription`: Stripe subscription tracking
- `send_counter`: Free plan limit enforcement (3 sends)

### Template System (Core Innovation)

Templates use a JSON spec defining areas for dynamic content:
```json
{
  "meta": { "width": 1240, "height": 1754, "dpi": 300 },
  "areas": {
    "invoice_number": { "x": 900, "y": 64, "type": "text" },
    "items_table": { ... },
    "totals_block": { ... }
  }
}
```

Upload flow: PDF/PNG → mapping tool → structured template → reusable invoice design

### Key Routes

- `/` - Marketing homepage (no-scroll, minimal)
- `/app/invoices` - Invoice management
- `/app/clients` - Client CRM
- `/app/templates` - Template gallery & upload
- `/app/settings` - User & billing settings
- `/api/send-invoice` - Email dispatch endpoint
- `/app/invoices/[id]/pdf` - PDF generation

### Business Logic

1. **Invoice Status Flow**: draft → sent → partially_paid/paid/overdue/void
2. **Free Plan Limits**: 3 lifetime sends, then upgrade required
3. **Pro Features**: Unlimited sending, template upload, partial payments, branding
4. **Numbering**: Auto-generated as INV-{YYYY}-{####}
5. **Currency**: Per-client and per-invoice, static display only (no FX)

### Design System

- **Aesthetic**: Stark minimalism, light UI chrome, dense information architecture
- **Typography**: JetBrains Mono or IBM Plex Mono
- **Palette**: White-dominant, #EAEAEA borders, minimal accent colors
- **Animations**: 80-120ms micro-interactions (underlines, pixel blinks, number odometers)

#### Dark Mode Color System

**Enabled**: Class-based dark mode (Tailwind `darkMode: 'class'`)

**Core Colors** (defined in `tailwind.config.js`):
- `dark-bg`: #0A0A0A (main background - sidebar, page background)
- `dark-input`: #171717 (form inputs, dropdowns, menus)
- `dark-button`: #1A1A1A (primary buttons - closer to background tone)
- `dark-button-hover`: #242424 (button hover state)
- `dark-hover`: #0F0F0F (hover states on rows, navigation)

**Text Hierarchy**:
- Primary text: `dark:text-white` (invoice numbers, amounts, headings)
- Secondary text: `dark:text-gray-300` (client names, dates, labels)
- Tertiary text: `dark:text-gray-400` (timestamps, counts, placeholders)

**Borders**:
- Primary borders: `dark:border-gray-700` (tables, cards)
- Subtle borders: `dark:border-gray-800` (sidebar)
- Focus borders: `dark:border-white`

**Status Badge Colors**:
- Draft/Void: `dark:text-gray-300 dark:bg-gray-700`
- Sent: `dark:text-blue-400 dark:bg-blue-900/30`
- Paid: `dark:text-green-400 dark:bg-green-900/30`
- Overdue: `dark:text-red-400 dark:bg-red-900/30`
- Partial: `dark:text-orange-400 dark:bg-orange-900/30`

**Implementation Pattern** (use this for all new pages):
```svelte
<!-- Background -->
<div class="bg-white dark:bg-dark-bg">

<!-- Sidebar/Surface -->
<div class="bg-white dark:bg-dark-bg">

<!-- Inputs -->
<input class="bg-white dark:bg-dark-input border-gray-300 dark:border-gray-600 text-black dark:text-white">

<!-- Primary Buttons -->
<button class="bg-black dark:bg-dark-button hover:bg-gray-800 dark:hover:bg-dark-button-hover">

<!-- Dropdown Menus -->
<div class="bg-white dark:bg-dark-input border-gray-200 dark:border-gray-700">

<!-- Navigation Hover -->
<a class="hover:bg-gray-50 dark:hover:bg-dark-hover">

<!-- Active Navigation -->
<a class="bg-gray-50 dark:bg-dark-input">

<!-- Table Row Hover -->
<tr class="hover:bg-gray-50/50 dark:hover:bg-dark-hover">

<!-- Text Hierarchy -->
<h1 class="text-black dark:text-white">  <!-- Primary -->
<p class="text-gray-600 dark:text-gray-300">  <!-- Secondary -->
<span class="text-gray-500 dark:text-gray-400">  <!-- Tertiary -->
```

**Theme Switcher**: Located in profile menu, cycles through Light → Dark → System

### Critical Implementation Details

1. **RLS (Row-Level Security)**: All tables use org_id scoping
2. **PDF Rendering**: Must match uploaded designs within ±2px tolerance
3. **Email**: Plain design via Resend with attached PDF
4. **Payments**: Bank transfer only for MVP (no online payments)
5. **Free Tier**: Enforced via send_counter before dispatching emails

### Testing Requirements

- Unit tests for: totals calculation, status transitions, invoice numbering
- E2E tests for: create→send flow, payment recording, plan limits
- Visual regression for PDF rendering (snapshot testing)
- Email preview testing with real Resend sandbox

### Environment Variables

Required secrets (store in `.env.local`):
- `PUBLIC_SITE_URL`
- `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`

### Development Workflow

1. **Feature Development**: Create feature branch → implement → test locally
2. **Database Changes**: Create migration → test locally → apply to staging
3. **PDF Templates**: Test rendering accuracy with visual comparison
4. **Deployment**: Push to GitHub → Auto-deploy to Cloudflare Pages

### Common Tasks

**Add a new invoice template field**:
1. Update template JSON spec structure
2. Modify PDF rendering logic in `/app/invoices/[id]/pdf/+server.ts`
3. Update template mapper UI
4. Test with existing templates

**Implement a new invoice status**:
1. Add to database constraint in `invoice` table
2. Update status transition logic
3. Add UI state handling
4. Update email notifications if needed

**Debug PDF rendering issues**:
1. Check template spec JSON for coordinate accuracy
2. Verify font loading and metrics
3. Test with simplified data first
4. Use PDF comparison tools for pixel-perfect validation

### Performance Targets

- Homepage: <150KB JS (excluding fonts)
- Invoice list: <500ms load time
- PDF generation: <2s for single page
- Email send: <1s response time

---

## 🔄 Claude Code Workflow (Two-Session System)

**Last Updated:** 2025-10-16

This project uses a two-session Claude Code workflow to prevent file locking conflicts and maintain clear separation between planning and implementation.

### Session Types

#### 1. Planner Session (Read-Only) 📋
**Command:** `/issue <description>`
**Purpose:** Research, analyze, create GitHub issues

**What it can do:**
- ✅ Read all files in the repository
- ✅ Search and analyze codebase
- ✅ Run read-only bash commands (`ls`, `cat`, `grep`, `git log`, `gh issue list`)
- ✅ Draft comprehensive GitHub issues
- ✅ Multiple planner sessions can run simultaneously

**What it CANNOT do:**
- ❌ Write or edit files
- ❌ Run bash commands that modify state
- ❌ Create GitHub issues via CLI
- ❌ Use `/work` command

**File:** `commands/issue.md`

#### 2. Developer Session (Read/Write) 💻
**Command:** `/work #N`
**Purpose:** Implement GitHub issues, commit code, push changes

**What it can do:**
- ✅ Read and write any file
- ✅ Run all bash commands
- ✅ Create commits and push
- ✅ Create GitHub issues via CLI
- ✅ Update project board

**What it CANNOT do:**
- ❌ Run when another developer session is active (enforced by lock file)

**File:** `commands/work.md`

### Lock File Mechanism

**Purpose:** Prevents two developer sessions from conflicting

**How it works:**
1. Developer session creates `.claude-lock` on startup
2. Second developer session is blocked if lock exists
3. Lock file auto-deletes when session closes normally
4. Lock file is git-ignored (won't be committed)

**Manual cleanup (if session crashes):**
```bash
rm .claude-lock
```

### Typical Workflow

**1. Planning Phase (Planner Session):**
```bash
/issue Add dark mode to invoice templates
# Analyzes codebase, creates comprehensive issue
# Copy issue content to GitHub manually
```

**2. Development Phase (Developer Session):**
```bash
/work #11
# Checks for lock file
# Implements issue #11
# Commits and pushes
# Lock file auto-deleted on close
```

**3. Concurrent Planning (Optional):**
- Keep planner session open while developing
- Research next feature while current one is being implemented
- No conflicts since planner is read-only

### Best Practices

1. **One developer session at a time** - Always close previous developer session before starting new one
2. **Multiple planners OK** - Can have several planner sessions for research
3. **Check lock file** - If developer session won't start, check for stale `.claude-lock`
4. **Session crashes** - Manually remove `.claude-lock` if session terminated unexpectedly
5. **Clear separation** - Don't try to write files in planner session

### Troubleshooting

**"Another session is active" error:**
```bash
# Check for lock file
ls -la .claude-lock

# Remove if stale (previous session crashed)
rm .claude-lock
```

**File conflicts despite lock file:**
- Verify you're not writing from planner session
- Check only one developer session is open
- Consider switching to single-session workflow (see WORKFLOW_OPTIONS.md)

### Alternative: Single Session Workflow

See `WORKFLOW_OPTIONS.md` for other workflow configurations including single-session mode if two-session system becomes cumbersome.

---