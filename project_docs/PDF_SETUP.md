# PDF Generation Setup Guide

This document explains how to set up PDF generation for the invoice system.

## Overview

The application now stores generated PDFs in Supabase Storage instead of generating them on-demand. This solves the Puppeteer/Chromium compatibility issues on Cloudflare Pages.

## Architecture

1. **PDF Generation**: PDFs are generated using Puppeteer when an invoice is sent or first accessed
2. **Storage**: PDFs are stored in Supabase Storage bucket `invoice-pdfs`
3. **Access**: Email links point directly to Supabase Storage URLs (public, fast downloads)
4. **Caching**: PDFs are regenerated only when invoice data changes

## Setup Steps

### 1. Install Dependencies

Already done - Puppeteer has been added to `package.json`:

```bash
pnpm install
```

### 2. Run Database Migration

Apply the migration to create the storage bucket and add PDF tracking columns:

```bash
# Option A: Using Supabase CLI (if linked to project)
supabase db push

# Option B: Manual via Supabase Dashboard
# 1. Go to https://supabase.com/dashboard/project/kaijqyzmpqzdctbjlvxf/sql/new
# 2. Copy contents of supabase/migrations/20251015163948_invoice_pdf_storage.sql
# 3. Run the SQL query
```

### 3. Verify Storage Bucket

After running the migration, verify the bucket was created:

1. Go to Supabase Dashboard → Storage
2. You should see a bucket named `invoice-pdfs`
3. The bucket should be marked as **Public**
4. RLS policies should allow:
   - Authenticated users to upload PDFs for their org
   - Public access to read PDFs (for client downloads)

## How It Works

### When Sending an Invoice

1. User clicks "Send Invoice"
2. System generates PDF using Puppeteer (locally or in dev)
3. PDF is uploaded to `invoice-pdfs/{org_id}/{invoice_id}.pdf`
4. Public URL is stored in `invoice.pdf_url` column
5. Email is sent with direct link to Supabase Storage URL
6. PDF is also attached to email

### When Accessing PDF via `/pdf` Endpoint

1. User clicks PDF link in app or email
2. System checks if PDF exists in storage
3. If exists → redirects to Supabase Storage URL (fast!)
4. If not exists → generates, stores, then redirects

### When Invoice is Updated

The system tracks `pdf_generated_at` timestamp. If invoice is updated after PDF was generated, the PDF will be regenerated on next access.

## Environment Requirements

### Development (Local)

- Puppeteer will run locally
- Requires Chrome/Chromium (installed automatically by Puppeteer)
- PDFs generated and uploaded to Supabase Storage

### Production (Cloudflare Pages)

**Important**: Puppeteer won't work on Cloudflare Pages. You have two options:

#### Option 1: Generate PDFs Before Deployment (Recommended for MVP)

- Generate PDFs in development/local environment
- PDFs are stored in Supabase Storage
- Production just serves the stored PDFs
- No server-side generation needed

#### Option 2: Cloudflare Browser Rendering API (For Scale)

When you need server-side PDF generation in production:

1. Enable Cloudflare Browser Rendering API
2. Update `src/lib/pdf/generator.ts` to use Cloudflare's API instead of Puppeteer
3. Add binding in `wrangler.toml`:
   ```toml
   [[browser]]
   binding = "MYBROWSER"
   ```

See: https://developers.cloudflare.com/browser-rendering/

## File Structure

```
src/lib/pdf/
├── generator.ts      # Puppeteer-based PDF generation
├── renderer.ts       # HTML template rendering
└── storage.ts        # NEW: Supabase Storage integration

src/routes/app/invoices/[id]/
├── pdf/+server.ts    # UPDATED: Redirects to stored PDF
└── send/+server.ts   # UPDATED: Generates & stores PDF before sending
```

## Testing

### 1. Test PDF Generation Locally

```bash
pnpm dev
```

1. Create a test invoice
2. Send the invoice
3. Check Supabase Storage → `invoice-pdfs` bucket
4. You should see `{org_id}/{invoice_id}.pdf`

### 2. Test Email Link

1. Send invoice to test email
2. Click "Download Invoice PDF" link in email
3. Should download actual PDF (not HTML)

### 3. Test PDF Endpoint

Visit: `http://localhost:5173/app/invoices/{id}/pdf`

Should redirect to Supabase Storage URL and display PDF.

## Troubleshooting

### Puppeteer Fails to Install

```bash
# Approve Puppeteer build script
pnpm approve-builds puppeteer
pnpm install
```

### PDF Generation Times Out

Increase timeout in PDF endpoint if needed. Large invoices or slow machines may need more time.

### Storage Bucket RLS Issues

If uploads fail with permission errors:

1. Check Supabase Dashboard → Storage → invoice-pdfs → Policies
2. Ensure "Users can upload invoice PDFs for their org" policy exists
3. Check `app_user` table has correct `org_id` values

### PDF Not Regenerating After Update

The system compares `invoice.updated_at` with `invoice.pdf_generated_at`. Make sure your invoice updates actually update the `updated_at` timestamp (should be automatic if using Supabase triggers).

## Migration Path to Cloudflare Browser Rendering

When ready to enable server-side PDF generation in production:

1. **Update `src/lib/pdf/generator.ts`**:
   ```typescript
   // Detect environment
   if (typeof MYBROWSER !== 'undefined') {
     // Use Cloudflare Browser Rendering API
     const browser = await MYBROWSER.launch();
   } else {
     // Use Puppeteer (local dev)
     const browser = await puppeteer.launch();
   }
   ```

2. **Add Cloudflare binding** in `wrangler.toml`

3. **Update deployment** to use Cloudflare Workers/Pages with bindings

4. **Keep storage logic** - still store PDFs, just generate them server-side too

## Cost Estimates

### Supabase Storage
- Free tier: 1GB storage
- Paid: $0.021/GB/month
- Typical invoice PDF: 100-500KB
- **1000 PDFs ≈ 500MB ≈ $0.01/month**

### Cloudflare Browser Rendering (if needed)
- $5/million requests
- Free tier available
- **1000 PDF generations ≈ $0.005**

**Total cost for MVP: Essentially free** ✨
