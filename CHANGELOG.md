# Changelog

All notable changes to **inv** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Added
- Bulk selection and actions for invoices (select multiple, mark as paid, duplicate, delete)
- Dark mode support across entire application with system preference detection
- Quick actions dropdown menu on invoice list (duplicate, change status, delete)
- Edit button for draft invoices
- Breadcrumb navigation across all sub-pages (invoices, clients)
- Bell icon "What's New" changelog widget in sidebar

### Changed
- Invoice PDFs now automatically adjust table height based on number of items
- Invoice line items now display on single line when creating invoices
- Invoice PDFs can now be viewed by anyone with the link (no account required)
- "What's New" widget now displays properly when hovering
- Cleaner invoice detail page with more whitespace and fewer boxes
- Improved sidebar design with better spacing and visual hierarchy

### Fixed
- PDF files now properly deleted from storage when invoices are deleted
- Dashboard earnings now correctly displays total from paid invoices
- Invoice PDFs now generate on live site (Cloudflare deployment fixed)
- PDF generation with Supabase Storage integration
- Email subject line pre-fill bug
- Clients can now view invoice PDFs from email links without creating an account

---

## [0.2.0] - 2025-10-15

### Added
- Mobile-responsive designs for all dashboard pages
- Table-to-card transformation for mobile views (invoices, clients, line items)
- Max-width standardization: 1152px for lists, 768px for forms
- Profile menu with Settings, Upgrade Plan, Give Feedback, Sign out options
- Feedback email link (feedback@inv.so)

### Changed
- Font sizes increased across all pages for better readability
- Button sizing: px-5 py-2.5 for 44px touch targets
- Input sizing: px-4 py-2.5 to match button heights
- Navigation: rounded corners on nav items with bg-gray-50 active state
- Removed emojis, replaced with Heroicons

### Fixed
- Mobile horizontal scrolling on all viewports
- Svelte Material Icons compatibility issues
- Closing div tag in mobile sidebar structure

---

## [0.1.0] - 2025-10-10

### Added
- Invoice detail page UX improvements
- Loading state for PDF download button
- Client legal fields and soft delete functionality
- 3 new invoice templates with preview functionality
- Template privacy with RLS policies
- Comprehensive template mapping features
- Area-based template mapping with enhanced UX
- Advanced PDF template classification system

### Changed
- Invoice email formatting and personalization improvements
- Reorganized invoice detail page layout

### Fixed
- Critical TypeScript errors in API routes
- Duplicate invoice creation bug
- Performance optimization for template operations
