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