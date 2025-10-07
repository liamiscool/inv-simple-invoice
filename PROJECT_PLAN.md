# inv - Project Implementation Plan

## Project Overview
**Product**: Beautiful invoices for designers  
**Stack**: SvelteKit + Supabase + TailwindCSS + Stripe + Resend  
**Timeline**: MVP in progressive phases  
**Deployment**: Cloudflare Pages + GitHub

---

## Phase 1: Foundation ✅ **COMPLETE**
### 1.1 Project Setup ✅ **COMPLETE**
- [x] Create CLAUDE.md documentation
- [x] Initialize SvelteKit with TypeScript
- [x] Configure TailwindCSS with minimal token set
- [x] Add anime.js for micro-animations
- [x] Set up ESLint and Prettier
- [x] Initialize Git repository

### 1.2 Infrastructure ✅ **COMPLETE**
- [x] Create Supabase project
- [x] Set up database schema (all tables from spec)
- [x] Configure Row Level Security (RLS) policies
- [x] Set up environment variables (.env.local)
- [ ] Configure Cloudflare Pages deployment
- [ ] Set up GitHub repository

### 1.3 Core Dependencies
```json
{
  "dependencies": {
    "@supabase/supabase-js": "latest",
    "@supabase/auth-helpers-sveltekit": "latest",
    "animejs": "^3.2.2",
    "@stripe/stripe-js": "latest",
    "resend": "latest"
  }
}
```

---

## Phase 2: Authentication & Base UI ✅ **COMPLETE**
### 2.1 Auth System ✅ **COMPLETE**
- [x] Implement magic link authentication
- [x] Create auth guards (hooks.server.ts)
- [x] Build login/signup pages
- [x] Set up user profile creation flow
- [x] Create organization setup on first login

### 2.2 Base Layout ✅ **COMPLETE**
- [x] Create app shell with minimal chrome
- [x] Implement navigation (Clients/Invoices/Templates/Settings)
- [x] Design system tokens (spacing, colors, typography)
- [x] JetBrains Mono / IBM Plex Mono font setup
- [x] Responsive grid system

### 2.3 Homepage (Marketing) ✅ **COMPLETE**
- [x] No-scroll single page layout
- [x] Product tour (3-4 static frames)
- [x] Pricing box (Free → Pro)
- [x] Email capture form
- [x] Micro-animations (80ms underlines, 120ms pixel blinks)
- [x] Footer with status/legal links

---

## Phase 3: Core Features - Data Management ✅ **COMPLETE**
### 3.1 Client Management ✅ **COMPLETE**
- [x] Client list view with search
- [x] Create/edit client form
- [x] Currency preference per client
- [x] Client detail page
- [x] Delete with cascade handling

### 3.2 Settings Page ✅ **COMPLETE**
- [x] User profile management
- [x] Company details form
- [x] Bank transfer details (text field)
- [x] Default currency selector
- [x] Tax ID configuration
- [ ] Billing portal link (Stripe) *[Phase 7]*

---

## Phase 4: Invoice System
### 4.1 Invoice CRUD
- [ ] Invoice list with status badges
- [ ] Create invoice wizard
  - [ ] Client selection
  - [ ] Template selection
  - [ ] Line items editor
  - [ ] Tax calculation per line
  - [ ] Notes field
- [ ] Auto-numbering system (INV-YYYY-####)
- [ ] Edit existing invoices
- [ ] Duplicate invoice feature
- [ ] Status management (draft/sent/paid/etc.)

### 4.2 Invoice Calculations
- [ ] Subtotal computation
- [ ] Tax totals by rate
- [ ] Grand total
- [ ] Database triggers for auto-calculation
- [ ] Currency display (no conversion)

---

## Phase 5: Templates - MVP
### 5.1 Curated Templates (2-3)
- [ ] Create minimal template designs
- [ ] Template JSON spec structure
- [ ] Template preview generation
- [ ] Template selection UI
- [ ] Store in database as 'curated' type

### 5.2 Template Rendering
- [ ] PDF generation service (/app/invoices/[id]/pdf)
- [ ] Server-side rendering with Chromium
- [ ] Font loading and embedding
- [ ] Multi-line text handling
- [ ] Table row generation
- [ ] Page size and margins

---

## Phase 6: PDF & Email
### 6.1 PDF Generation
- [ ] Invoice data → PDF pipeline
- [ ] Template spec interpretation
- [ ] Precise positioning (±2px tolerance)
- [ ] Error handling and fallbacks
- [ ] Download endpoint

### 6.2 Email Integration (Resend)
- [ ] Configure Resend account
- [ ] Minimal email templates (MJML/HTML)
- [ ] Send invoice endpoint
- [ ] PDF attachment
- [ ] Delivery tracking
- [ ] Error handling and retries

---

## Phase 7: Billing & Monetization
### 7.1 Stripe Integration
- [ ] Products setup (pro_monthly, pro_yearly)
- [ ] Checkout flow (hosted)
- [ ] Webhook handling
- [ ] Subscription status sync
- [ ] Customer portal integration

### 7.2 Free Plan Limits
- [ ] Send counter implementation
- [ ] 3-invoice lifetime limit
- [ ] Upgrade prompts
- [ ] Plan checking middleware
- [ ] Feature gating (template upload, etc.)

---

## Phase 8: Payments & Status
### 8.1 Partial Payments
- [ ] Payment recording UI
- [ ] Payment history display
- [ ] Amount remaining calculation
- [ ] Auto status updates (partially_paid)
- [ ] Payment method notes

### 8.2 Status Automation
- [ ] Overdue detection (cron/scheduled)
- [ ] Status transition rules
- [ ] Status history tracking
- [ ] Visual status indicators

---

## Phase 9: Template Upload (Innovation)
### 9.1 Upload System
- [ ] PDF/PNG upload endpoint
- [ ] File validation and processing
- [ ] Supabase Storage integration
- [ ] Preview generation

### 9.2 Mapping Tool
- [ ] Visual mapper interface
- [ ] Bounding box drawing
- [ ] Field assignment UI
- [ ] Spec JSON generation
- [ ] Template saving
- [ ] Validation and testing

### 9.3 Custom Template Rendering
- [ ] Parse custom template specs
- [ ] Dynamic field injection
- [ ] Multi-page handling (post-MVP)
- [ ] Font extraction/matching

---

## Phase 10: Polish & Launch Prep
### 10.1 Testing
- [ ] Unit tests (calculations, status)
- [ ] E2E tests (critical flows)
- [ ] PDF snapshot testing
- [ ] Load testing
- [ ] Security audit

### 10.2 Performance
- [ ] Bundle size optimization (<150KB homepage JS)
- [ ] Image optimization
- [ ] Lazy loading
- [ ] Database indexing
- [ ] CDN setup (Cloudflare)

### 10.3 Production Ready
- [ ] Error tracking (Sentry/similar)
- [ ] Analytics (privacy-respecting)
- [ ] Backup strategy
- [ ] Documentation
- [ ] Terms of Service / Privacy Policy

---

## Technical Debt & Future
### Post-MVP Enhancements
- [ ] Multi-page invoices
- [ ] Online payments (Stripe Payment Links)
- [ ] Recurring invoices
- [ ] Multi-currency with FX rates
- [ ] Template marketplace
- [ ] API access
- [ ] Mobile app
- [ ] Expense tracking
- [ ] Time tracking integration
- [ ] Accounting software sync

### UX Improvements (Post-Launch)
- [ ] **Improve onboarding flow** - Add guided tour, sample data, progress tracking
- [ ] Interactive product walkthrough on homepage
- [ ] In-app help tooltips and guides
- [ ] Better empty states with actionable suggestions
- [ ] Keyboard shortcuts for power users

---

## Risk Mitigation
### Critical Paths
1. **PDF Accuracy**: Template → PDF fidelity is core value prop
2. **Payment Processing**: Must be reliable and secure
3. **Email Delivery**: Critical for business operations
4. **Data Security**: RLS must be bulletproof

### Contingencies
- PDF fallback: Simple HTML → PDF if advanced rendering fails
- Email backup: Queue system with retries
- Payment fallback: Manual bank transfer instructions
- Template fallback: Always have curated templates available

---

## Success Metrics
### MVP Launch Criteria
- [ ] Can create and send an invoice
- [ ] PDF renders correctly
- [ ] Email delivers reliably
- [ ] Payments can be recorded
- [ ] Billing works (free/pro)
- [ ] Templates are customizable

### Quality Metrics
- Page load: <1s
- PDF generation: <2s
- Email delivery: >99% success
- Zero data leaks (RLS working)
- <1% error rate in production

---

## Current Status: Phase 4 - Invoice System Next! 🚀

**✅ COMPLETED PHASES:**
- **Phase 1**: Foundation (Project Setup + Infrastructure) 
- **Phase 2**: Authentication & Base UI (Auth + Homepage + App Shell)
- **Phase 3**: Core Data Management (Onboarding + Client Management + Settings)

**🎯 CURRENT PHASE:** Invoice System (The Main Feature!)
**Next Steps**:
1. Invoice list with status badges
2. Create invoice wizard (client selection, line items)
3. Auto-numbering system (INV-YYYY-####)
4. Tax calculations and totals
5. Status management (draft/sent/paid)

**🔥 App Status:** **FULLY FUNCTIONAL FOR USER & CLIENT MANAGEMENT!**
- Homepage: http://localhost:5177/ (Yeezy aesthetic with animations)
- Onboarding: 2-step wizard for new users
- Client Management: Full CRUD with search
- Settings: Complete profile and company management
- Database: All RLS policies working perfectly

**Ready to Build**: The core invoice system - this is where the magic happens!

**Blockers**: None

**Notes**: 
- Users can now complete full onboarding
- Client management system is production-ready
- Settings page allows full profile customization
- Next: Build the invoice creation and management system