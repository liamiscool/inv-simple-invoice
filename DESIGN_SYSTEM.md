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
- **text-sm** (14px) - Body text, labels, secondary info, table content
- **text-base** (16px) - Buttons, inputs, important text, section headings, data values
- **text-lg** (18px) - Page titles, main headings
- **text-2xl** (24px) - Numbers, stats only

### Weight
- **font-normal** (400) - Default for everything
- **font-medium** (500) - Page headings, section headings, active nav states, emphasized labels
- **font-light** (300) - Large numbers/stats only
- Use **font-medium** for hierarchy and emphasis, but keep it minimal

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

**Two-tier max-width system for app pages:**

#### Wide Pages (List/Dashboard views) - `max-w-6xl` (1152px)
Use for pages with tables, grids, or multiple columns:
- **Dashboard** (`/app`)
- **Invoices list** (`/app/invoices`)
- **Clients list** (`/app/clients`)
- **Templates gallery** (`/app/templates`)
- **Invoice detail** (`/app/invoices/[id]`)

#### Form Pages (Create/Edit views) - `max-w-3xl` (768px)
Use for pages with form-heavy content:
- **Invoice new/edit** (`/app/invoices/new`)
- **Client new/edit** (`/app/clients/new`, `/app/clients/[id]/edit`)
- **Client detail** (`/app/clients/[id]`)
- **Settings** (`/app/settings`)

#### Other Widths
- **Homepage**: `max-w-7xl mx-auto` (1280px)
- **Small forms/modals**: `max-w-sm` (384px)
- **Modals**: `max-w-md` (448px)

**Note**: Custom template pages use full width for canvas/mapping tools

### Padding
- **Pages**: `px-4 py-6` (mobile) / `px-6 py-8` (desktop)
- **Cards**: `p-4` (small) / `p-6` (large)
- **Buttons**: `px-5 py-2.5` (standard - increased for better touch targets)
- **Inputs**: `px-4 py-2.5` (standard - matches button height)

---

## Components

### Buttons
```html
<!-- Primary (black fill) -->
<button class="px-5 py-2.5 bg-black text-white text-sm hover:bg-gray-800 transition-colors duration-75">
  Primary action
</button>

<!-- Secondary (outline) -->
<button class="px-5 py-2.5 border border-gray-300 text-sm hover:bg-gray-50 transition-colors duration-75">
  Secondary action
</button>

<!-- Ghost (text only) -->
<button class="text-sm hover:text-black transition-colors text-gray-600">
  Ghost action
</button>
```

### Inputs
```html
<!-- Text input -->
<input class="px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors" />

<!-- Select dropdown -->
<select class="px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors">
  <option>Option</option>
</select>

<!-- Textarea -->
<textarea class="px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black transition-colors resize-none"></textarea>
```

### Labels
```html
<label class="block text-sm text-gray-500 mb-1.5">Field Label</label>
```

### Cards
```html
<div class="border border-thin rounded-sm p-6">
  <!-- Content -->
</div>
```

### Navigation Links
```html
<!-- Sidebar nav -->
<a class="text-sm hover:text-black transition-colors text-gray-500">Link</a>

<!-- Active state -->
<a class="text-sm text-black font-medium">Active Link</a>
```

### Status Badges
```html
<span class="inline-flex px-2.5 py-1 text-sm bg-green-100 text-green-600">
  Status Label
</span>
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

### Sidebar (Readable Design)
- **Width**: `w-56` (224px) - wider for better readability with larger text
- **Background**: Pure white with right border
- **Sticky**: Full height, fixed position
- **Padding**: `py-8 px-6`
- **Logo**: `text-lg font-medium` (18px)
- **Nav links**: `text-sm py-2` (14px with more vertical spacing)

### Main Content
- **Margin**: `ml-56` to account for sidebar (desktop only)
- **Padding**: `p-4 md:p-6` (reduced on mobile for more screen space)
- **Max width**: No constraint (uses available space)

### Mobile Adaptation
- **< md**: Hide sidebar, show hamburger menu with `w-56` overlay
- **≥ md**: Show sidebar always
- **Mobile padding**: Cards and containers use `p-4` instead of `p-6`

---

## Mobile-First Responsive Patterns

### Table → Card Transformation
For tables with multiple columns (invoices, clients), use hidden/block pattern:

```html
<!-- Desktop: Table -->
<div class="hidden md:block border-t border-b border-gray-200">
  <table class="w-full">
    <!-- Table content -->
  </table>
</div>

<!-- Mobile: Cards -->
<div class="block md:hidden space-y-3">
  {#each items as item}
    <div class="border border-gray-200 p-4 hover:bg-gray-50/50">
      <!-- Most important info first -->
      <div class="text-sm font-medium mb-2">{item.title}</div>
      <div class="text-base font-medium mb-3">{item.amount}</div>

      <!-- Metadata -->
      <div class="text-sm text-gray-500 mb-3">
        {item.date}
      </div>

      <!-- Actions -->
      <div class="flex gap-3 pt-3 border-t border-gray-100">
        <button class="text-sm">Action</button>
      </div>
    </div>
  {/each}
</div>
```

### Complex Table Data (Line Items)
Transform multi-column tables into key-value pairs:

```html
<!-- Desktop: Table -->
<div class="hidden md:block">
  <table class="w-full">
    <thead>
      <tr>
        <th>Description</th>
        <th>Qty</th>
        <th>Price</th>
        <th>Total</th>
      </tr>
    </thead>
    <tbody>
      <!-- rows -->
    </tbody>
  </table>
</div>

<!-- Mobile: Stacked cards -->
<div class="block md:hidden space-y-4">
  {#each items as item}
    <div class="border-b border-thin pb-4">
      <div class="text-sm font-medium mb-2">{item.description}</div>
      <div class="grid grid-cols-2 gap-2 text-sm">
        <div class="text-gray-500">Quantity:</div>
        <div class="text-right">{item.qty}</div>

        <div class="text-gray-500">Price:</div>
        <div class="text-right">{item.price}</div>

        <div class="text-gray-500 font-medium">Total:</div>
        <div class="text-right font-medium">{item.total}</div>
      </div>
    </div>
  {/each}
</div>
```

### Form Line Items (Grid Layout)
Stack fields in bordered cards on mobile:

```html
<div class="space-y-6">
  {#each items as item}
    <!-- Mobile: Bordered card with stacked fields -->
    <div class="border border-gray-200 p-4 space-y-4 md:border-0 md:p-0">
      <!-- Description full width -->
      <div>
        <label class="block text-sm text-gray-500 mb-1.5">Description</label>
        <input class="w-full px-4 py-2.5 text-sm border border-gray-300" />
      </div>

      <!-- Mobile: 2-column grid -->
      <div class="grid grid-cols-2 gap-3 md:hidden">
        <div>
          <label>Qty</label>
          <input />
        </div>
        <div>
          <label>Price</label>
          <input />
        </div>
      </div>

      <!-- Desktop: Horizontal layout -->
      <div class="hidden md:grid md:grid-cols-12 md:gap-3">
        <!-- Desktop fields -->
      </div>
    </div>
  {/each}
</div>
```

### Mobile Spacing Adjustments
- **Main padding**: `p-4 md:p-6`
- **Card padding**: `p-4 md:p-6`
- **Buttons**: Always `px-5 py-2.5` (44px touch target)
- **Space between sections**: `space-y-6 md:space-y-8`

---

## Page Patterns

### List Pages (Invoices, Clients)
```html
<div class="space-y-8">
  <!-- Header with action -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-lg font-medium mb-1">Page Title</h1>
      <p class="text-sm text-gray-500">Description</p>
    </div>
    <button class="px-5 py-2.5 bg-black text-white text-sm">Add New</button>
  </div>

  <!-- Stats row (optional) -->
  <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Stat cards with text-2xl for numbers -->
  </div>

  <!-- Table/List -->
  <div class="border-t border-b border-gray-200">
    <table class="w-full">
      <thead class="border-b border-gray-200">
        <tr>
          <th class="text-left text-sm text-gray-500 px-4 py-4 font-medium">Column</th>
        </tr>
      </thead>
      <tbody>
        <tr class="border-b border-gray-100">
          <td class="px-4 py-4 text-sm">Content</td>
        </tr>
      </tbody>
    </table>
  </div>
</div>
```

### Form Pages
```html
<div class="max-w-3xl space-y-8">
  <!-- Header -->
  <div>
    <h1 class="text-lg font-medium mb-1">Form Title</h1>
    <p class="text-sm text-gray-500">Description</p>
  </div>

  <form class="space-y-8">
    <!-- Section -->
    <div class="space-y-5">
      <h2 class="text-base font-medium pb-2 border-b border-gray-200">Section Title</h2>

      <!-- Field -->
      <div>
        <label class="block text-sm text-gray-500 mb-1.5">Label</label>
        <input class="w-full px-4 py-2.5 text-sm border border-gray-300 focus:outline-none focus:border-black" />
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center justify-between pt-4">
      <a href="/back" class="px-5 py-2.5 border border-gray-300 text-sm">Cancel</a>
      <button type="submit" class="px-5 py-2.5 bg-black text-white text-sm">Submit</button>
    </div>
  </form>
</div>
```

### Detail Pages (View Invoice, View Client)
```html
<div class="max-w-6xl space-y-8">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-lg font-medium mb-1">Item Name</h1>
      <p class="text-sm text-gray-500">Metadata</p>
    </div>
    <div class="flex items-center gap-2">
      <button class="px-5 py-2.5 text-sm text-gray-700">Action</button>
      <button class="px-5 py-2.5 bg-black text-white text-sm">Primary Action</button>
    </div>
  </div>

  <!-- Content sections -->
  <div class="border border-thin rounded-sm p-6">
    <h2 class="text-base font-medium mb-4">Section Title</h2>
    <!-- Section content -->
  </div>
</div>
```

---

## Do's and Don'ts

### ✅ DO
- Use lots of white space
- Start with text-sm (14px) as body text default
- Use text-base (16px) for interactive elements (buttons, inputs)
- Use text-lg (18px) for page titles
- Use font-medium for headings and emphasis
- Use thin borders everywhere
- Embrace the minimal aesthetic
- Use precise spacing with Tailwind scale
- Keep animations subtle and purposeful
- Ensure good touch targets (py-2.5 minimum for buttons/inputs)
- **Mobile**: Transform tables to cards using `hidden md:block` / `block md:hidden`
- **Mobile**: Use `p-4 md:p-6` for responsive padding
- **Mobile**: Stack forms in bordered cards for clarity
- Test on mobile viewports (375px, 390px, 428px)

### ❌ DON'T
- Add colors unless absolutely necessary
- Use drop shadows or gradients
- Make text too small (avoid text-xs for primary content)
- Create busy layouts
- Add unnecessary decorative elements
- Use rounded corners > rounded-sm
- Use font weights heavier than font-medium
- **Mobile**: Don't allow horizontal scrolling on tables
- **Mobile**: Don't make touch targets smaller than 44×44px

---

## Development Notes for Claude

When building components:
1. **Start with white background** and thin borders
2. **Typography hierarchy**:
   - text-sm (14px) for body text, labels, table content
   - text-base (16px) for buttons, inputs, section headings
   - text-lg (18px) for page titles
   - font-medium only for headings and emphasis
3. **Interactive elements**:
   - Buttons: `px-5 py-2.5 text-sm`
   - Inputs: `px-4 py-2.5 text-sm`
   - Match button and input heights for visual consistency
4. **Use transition-colors duration-75** for all interactive elements
5. **Embrace white space** - use `space-y-8` for major sections
6. **Test on both mobile and desktop** breakpoints
7. **Keep the monospace font** for all text
8. **No images/icons** unless absolutely necessary - use text

### Recent Updates (2025)

**Typography & Sizing (Phase 1)**
- **Font sizes increased** for better readability across all pages
- **Button/input padding increased** to `py-2.5` for better touch targets
- **Sidebar widened** from `w-48` to `w-56` to accommodate larger text
- **font-medium introduced** for headings and hierarchy (use sparingly)

**Mobile Responsiveness (Phase 2)**
- **Table → Card transformation** for invoices and clients lists on mobile
- **Line items tables** convert to key-value pairs on small screens
- **Form grids** stack in bordered cards with 2-column layouts
- **Mobile padding reduced** to `p-4` for more screen real estate
- **No horizontal scrolling** - all content fits mobile viewports
- **Touch targets** maintained at 44×44px minimum

All changes maintain the stark, minimal, Yeezy-inspired aesthetic throughout the entire application while ensuring it's functional, accessible, and beautiful on all devices.