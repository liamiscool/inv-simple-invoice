# inv - Beautiful Invoices for Designers

A modern, minimal invoice management platform with Yeezy-inspired design aesthetic.

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

## Contributing

1. Fork the repository
2. Create your feature branch
3. Follow the existing code style
4. Test your changes
5. Submit a pull request

## License

MIT License - see LICENSE file for details

---

**Built with ❤️ and minimal design principles**
