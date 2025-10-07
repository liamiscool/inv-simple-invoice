# inv Design System

*Guidelines for Claude Code when building the inv project*

## Design Philosophy

**Yeezy-inspired stark minimalism** × **terminal vibe** (light mode only)
- Lots of white space
- Light UI chrome
- Dense, informative architecture
- Small type, restrained weights
- Selective micro-animations only

---

## Typography

### Font Stack
```css
font-family: 'JetBrains Mono', 'IBM Plex Mono', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'monospace'
```

### Scale (All monospace)
- **text-xs** (12px) - Body text, labels, buttons
- **text-sm** (14px) - Headings, important text  
- **text-base** (16px) - Page titles, brand
- **text-lg** (18px) - Large headings only
- **text-2xl** (24px) - Numbers, stats only

### Weight
- **font-normal** (400) - Default for everything
- **font-light** (300) - Large numbers/stats only
- **NO bold fonts** - keeps it minimal

---

## Colors

### Palette (Extremely minimal)
```css
/* Primary */
--white: #FFFFFF        /* Dominant background */
--black: #000000        /* Text, borders, accents */
--border: #EAEAEA       /* Thin neutral borders */

/* Grays (sparingly) */  
--gray-400: #9CA3AF     /* Inactive/disabled */
--gray-500: #6B7280     /* Placeholder text */
--gray-600: #4B5563     /* Secondary text */

/* Status (minimal usage) */
--green-600: #059669    /* Success/operational only */
--red-600: #DC2626      /* Errors only */
```

### Usage Rules
- **90% white backgrounds** - embrace the void
- **Thin #EAEAEA borders** everywhere (1px only)
- **Pure black** for text and active states  
- **Gray-600** for secondary/meta information
- **NO gradients, shadows, or colorful accents**

---

## Layout & Spacing

### Spacing Scale
```css
/* Use Tailwind's default scale */
gap-1 (4px)   /* Tight elements */
gap-2 (8px)   /* Form elements */  
gap-3 (12px)  /* Related items */
gap-4 (16px)  /* Sections */
gap-6 (24px)  /* Major sections */
gap-8 (32px)  /* Page sections */
gap-12 (48px) /* Major layout areas */
```

### Container Widths
- **Homepage**: `max-w-7xl mx-auto` (1280px)
- **App content**: `max-w-5xl mx-auto` (1024px) 
- **Forms**: `max-w-sm` (384px)
- **Modals**: `max-w-md` (448px)

### Padding
- **Pages**: `px-4 py-6` (mobile) / `px-6 py-8` (desktop)
- **Cards**: `p-4` (small) / `p-6` (large)
- **Buttons**: `px-4 py-2` (standard)

---

## Components

### Buttons
```html
<!-- Primary (black fill) -->
<button class="px-4 py-2 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75">
  Primary action
</button>

<!-- Secondary (outline) -->
<button class="px-4 py-2 border border-thin text-xs hover:border-black transition-colors duration-75">
  Secondary action
</button>

<!-- Ghost (text only) -->
<button class="text-xs hover:text-black transition-colors text-gray-600">
  Ghost action
</button>
```

### Inputs
```html
<input class="px-3 py-2 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors" />
```

### Cards
```html
<div class="border border-thin rounded-sm p-6">
  <!-- Content -->
</div>
```

### Navigation Links
```html
<a class="text-xs hover:text-black transition-colors text-gray-600">Link</a>
```

---

## Animations (Selective Only)

### Micro-interactions (anime.js)
- **80ms underline sweep** on nav hover
- **120ms pixel blink** on CTA focus  
- **180ms number roll** for stats on load

### Transition Rules
```css
/* Standard transitions */
transition-colors duration-75    /* Links, buttons */
transition-all duration-75       /* Hover states */

/* NO other animations */
/* NO page transitions */
/* NO loading spinners (use simple text) */
```

---

## Dashboard Layout

### Sidebar (Slim Design)
- **Width**: `w-48` (192px) - slim but functional
- **Background**: Pure white with right border
- **Sticky**: Full height, fixed position
- **Padding**: `py-6 px-4`

### Main Content
- **Margin**: `ml-48` to account for sidebar
- **Padding**: `p-6`
- **Max width**: No constraint (uses available space)

### Mobile Adaptation  
- **< md**: Hide sidebar, show hamburger menu
- **≥ md**: Show sidebar always

---

## Page Patterns

### List Pages (Invoices, Clients)
```html
<div class="space-y-6">
  <!-- Header with action -->
  <div class="flex items-center justify-between">
    <h1 class="text-sm">Page Title</h1>
    <button class="...">Add New</button>
  </div>
  
  <!-- Stats row (optional) -->
  <div class="grid grid-cols-4 gap-4">
    <!-- Stat cards -->
  </div>
  
  <!-- Table/List -->
  <div class="border border-thin rounded-sm">
    <!-- Table content -->
  </div>
</div>
```

### Form Pages
```html
<div class="max-w-md mx-auto space-y-6">
  <h1 class="text-sm">Form Title</h1>
  <form class="space-y-4">
    <!-- Form fields -->
  </form>
</div>
```

---

## Do's and Don'ts

### ✅ DO
- Use lots of white space
- Keep text small (text-xs as default)
- Use thin borders everywhere
- Embrace the minimal aesthetic
- Use precise spacing with Tailwind scale
- Keep animations subtle and purposeful

### ❌ DON'T  
- Add colors unless absolutely necessary
- Use drop shadows or gradients
- Make text bold (except for critical states)
- Create busy layouts
- Add unnecessary decorative elements
- Use rounded corners > rounded-sm

---

## Development Notes for Claude

When building components:
1. **Start with white background** and thin borders
2. **Text-xs as default**, only go larger for headings
3. **Use transition-colors duration-75** for all interactive elements
4. **Embrace white space** - don't pack things tightly
5. **Test on both mobile and desktop** breakpoints
6. **Keep the monospace font** for all text
7. **No images/icons** unless absolutely necessary - use text

This system ensures we maintain the stark, minimal, Yeezy-inspired aesthetic throughout the entire application while keeping it functional and beautiful.