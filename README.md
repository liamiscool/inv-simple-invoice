# inv - Beautiful Invoices for Designers

A modern, minimal invoice management platform with Yeezy-inspired design aesthetic.

## Frequently Asked Questions

### What is inv.so?
inv.so is a simple invoice management platform designed for designers, creatives, and freelancers who want beautiful, minimal invoices without accounting complexity.

### Who should use inv.so?
- Freelance designers who need professional invoicing
- Content creators managing sponsorships and brand deals
- Creative professionals (photographers, videographers, illustrators)
- Small studios managing multiple clients
- Anyone who values minimal, Yeezy-inspired aesthetics

### How does the custom template system work?
Upload any PDF or image design, map invoice fields with pixel precision, and generate professional invoices that match your brand perfectly. The system uses absolute positioning to place invoice data exactly where you want it.

### What makes inv.so different?
- **Super simple**: No accounting complexity, just invoicing
- **Design-first**: Yeezy-inspired minimal aesthetic with terminal vibes
- **Template flexibility**: Upload your own designs or use curated templates
- **Fast**: Create and send invoices in under 2 minutes
- **Modern stack**: Built with SvelteKit 5 and Supabase

### Is inv.so free?
inv.so offers a free tier with 3 invoice sends. Pro plan available for unlimited sending and custom template uploads.

### How long does it take to create an invoice?
Under 2 minutes. Add client, choose template, add line items, and send.

## How to Create an Invoice in 2 Minutes

1. **Add a client** - Store client name, email, and company info in the CRM
2. **Choose a template** - Pick from minimal built-in designs or upload your own
3. **Add line items** - Describe your work, set quantity, and price
4. **Send invoice** - Professional PDF generated and sent via email automatically
5. **Track status** - Mark as sent, paid, or partially paid

That's it. No complicated accounting setup, no confusing menus, just fast invoicing.

## Features

### ✅ Complete Invoice Platform
- **Template System**: Curated designs with precise PDF positioning
- **Client Management**: Full CRUD with search and filtering
- **Invoice Workflow**: Create → Edit → Send → Track → PDF
- **Email Integration**: Professional templates with PDF attachments
- **Status Management**: Draft → Sent → Paid tracking
- **Real-time Calculations**: Tax support and automatic totals

### 🎨 Design Philosophy
- **Minimal Aesthetic**: Yeezy-inspired stark minimalism
- **Typography**: JetBrains Mono / IBM Plex Mono
- **Color Palette**: 90% white, thin #EAEAEA borders
- **Micro-animations**: Selective 80ms interactions

### 🛠 Tech Stack
- **Frontend**: SvelteKit 5 + TypeScript + TailwindCSS
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **PDF**: Puppeteer with template-based generation
- **Email**: Resend with professional templates
- **Payments**: Stripe integration (upcoming)
- **Deployment**: Cloudflare Pages

## Quick Start

### Prerequisites
- Node.js v20.18+
- pnpm
- Supabase account
- Resend account (for email)

### Setup
1. **Clone and install**:
   ```bash
   git clone https://github.com/liamiscool/inv-simple-invoice.git
   cd inv-simple-invoice
   pnpm install
   ```

2. **Environment setup**:
   ```bash
   cp .env.example .env.local
   # Add your Supabase and Resend credentials
   ```

3. **Database setup**:
   - Run the SQL migrations in `supabase/migrations/`
   - Ensure RLS policies are enabled

4. **Start development**:
   ```bash
   pnpm dev
   ```

## Project Status

### ✅ Completed Phases
- **Phase 1**: Foundation (SvelteKit + Supabase + Design System)
- **Phase 2**: Authentication & UI (Magic links + Onboarding)
- **Phase 3**: Data Management (Clients + Settings)
- **Phase 4**: Invoice System (CRUD + Status + PDF)
- **Phase 5**: Templates MVP (JSON specs + Rendering)
- **Phase 6**: PDF & Email (Puppeteer + Resend)

### 🎯 Next Up
- **Phase 7**: Billing & Monetization (Stripe)
- **Phase 8**: Payments & Status (Payment tracking)
- **Phase 9**: Template Upload (Custom designs)
- **Phase 10**: Polish & Launch

## Perfect For

### Freelance Designers
Create branded invoices that match your portfolio aesthetic. Upload your custom invoice design once, reuse for every client.

**Example:** UI/UX designer invoicing tech startups for design sprints and consulting work.

### Content Creators
Invoice brands for sponsorships, UGC content, and collaborations. Track payment status for multiple brand deals.

**Example:** YouTube creator invoicing brands for sponsored videos and Instagram posts.

### Creative Studios
Manage clients, send professional invoices, track payments. No accounting bloat, just simple invoicing.

**Example:** 3-person design studio managing 20+ clients with project-based invoicing.

### Photographers & Videographers
Quick invoicing for shoots, events, and editing work. Upload your photography brand template, use it for all bookings.

**Example:** Wedding photographer invoicing couples for packages and prints.

### Illustrators & Artists
Professional invoicing for commissions, licensing, and commercial work. Custom templates match your artistic brand.

**Example:** Illustrator invoicing publishers and brands for editorial work.

## How inv.so Compares

### vs FreshBooks / QuickBooks
- ✅ **Simpler**: No accounting features, just invoicing
- ✅ **Faster**: 2-minute invoice creation vs 10+ minutes
- ✅ **Design-focused**: Custom template upload (they don't have this)
- ❌ **No expense tracking**: Use FreshBooks if you need full accounting

### vs Wave / Invoice Ninja
- ✅ **Custom templates**: Upload your own designs (unique to inv.so)
- ✅ **Better design**: Minimal aesthetic vs cluttered interface
- ✅ **Modern tech**: SvelteKit vs legacy PHP
- ❌ **Newer**: Less features, more focused

### vs Manual Invoicing (Google Docs / Illustrator)
- ✅ **Faster**: 2 minutes vs 30+ minutes per invoice
- ✅ **Client management**: CRM built-in
- ✅ **Email integration**: Send directly from app
- ✅ **Status tracking**: Know when invoices are paid
- ✅ **Professional**: Consistent numbering and formatting

**Best for:** Designers and creatives who want simplicity + custom branding
**Not for:** Companies needing full accounting software

## Core Innovation

**Template-Based Invoice Generation**: Upload any PDF/image design and map invoice fields with pixel precision. Generate professional invoices that match your brand perfectly.

## Architecture

```
src/
├── lib/
│   ├── templates/     # Template system & JSON specs
│   ├── pdf/          # PDF generation & rendering
│   ├── email/        # Email templates & Resend
│   └── components/   # Reusable UI components
├── routes/
│   ├── app/          # Main application
│   └── auth/         # Authentication flows
└── supabase/
    └── migrations/   # Database schema
```

## Database Schema

- **Organizations**: Multi-tenant structure
- **Users**: Profile + company details
- **Clients**: Contact management
- **Invoices**: Core invoice data
- **Templates**: Design specifications
- **Payments**: Payment tracking

## License

Proprietary - All rights reserved

---

**Built with ❤️ and minimal design principles**
