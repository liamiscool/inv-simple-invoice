<script lang="ts">
  import { onMount } from 'svelte';

  let emailInput = $state('');
  let invoicesSent = $state(0);

  onMount(async () => {
    // Dynamically import anime.js to avoid SSR issues
    const anime = await import('animejs');

    // Animate invoice counter
    anime.default({
      targets: { value: 0 },
      value: 2847,
      duration: 1800,
      easing: 'easeOutQuart',
      update: function(anim: any) {
        invoicesSent = Math.round(anim.animations[0].currentValue);
      }
    });
  });

  function handleEmailSubmit(e: Event) {
    e.preventDefault();
    // TODO: Handle email capture
    console.log('Email captured:', emailInput);
  }
</script>

<div class="h-screen flex flex-col relative overflow-hidden font-mono">
  <!-- Header -->
  <header class="border-b border-thin px-4 py-3">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-6">
        <h1 class="text-base tracking-tight">inv</h1>
        <span class="text-xs text-gray-600">Beautiful invoices for designers</span>
      </div>

      <nav class="flex items-center gap-4">
        <a
          href="/auth/login"
          class="text-xs hover:underline-offset-2 hover:underline transition-all duration-75"
        >
          Sign in
        </a>
      </nav>
    </div>
  </header>

  <!-- Main Content - Top Left Aligned -->
  <main class="flex-1 px-4 py-6 overflow-hidden">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">

        <!-- Left: Main Content -->
        <div class="md:col-span-7 space-y-6">
          <!-- Hero -->
          <div class="space-y-4">
            <h2 class="text-3xl md:text-4xl font-light tracking-tight leading-tight">
              Upload your design.<br/>
              Send beautiful invoices.
            </h2>
            <p class="text-sm text-gray-600 max-w-lg leading-relaxed">
              inv is an invoicing tool built for designers who care about aesthetics. Upload your custom invoice designs (PDF/PNG) and convert them into reusable templates. No more wrestling with Word or InDesign every time you need to bill a client.
            </p>
          </div>

          <!-- Key Features -->
          <div class="space-y-3">
            <h3 class="text-base font-medium border-b border-thin pb-2">How it works</h3>
            <div class="grid grid-cols-1 gap-3">

              <div class="border border-thin rounded-sm p-3 hover:border-black transition-colors duration-75">
                <div class="flex items-start gap-3">
                  <div class="text-sm text-gray-400 pt-0.5 font-medium">01</div>
                  <div>
                    <h4 class="text-sm font-medium mb-1">Upload your design</h4>
                    <p class="text-xs text-gray-600 leading-relaxed">
                      Upload any PDF or PNG invoice design. Our mapping tool lets you define where dynamic content goes—invoice numbers, line items, totals, client details.
                    </p>
                  </div>
                </div>
              </div>

              <div class="border border-thin rounded-sm p-3 hover:border-black transition-colors duration-75">
                <div class="flex items-start gap-3">
                  <div class="text-sm text-gray-400 pt-0.5 font-medium">02</div>
                  <div>
                    <h4 class="text-sm font-medium mb-1">Fill in your details</h4>
                    <p class="text-xs text-gray-600 leading-relaxed">
                      Add clients, create invoices, and track payments. Automatic invoice numbering (INV-{new Date().getFullYear()}-####), status tracking (draft → sent → paid), and partial payment support.
                    </p>
                  </div>
                </div>
              </div>

              <div class="border border-thin rounded-sm p-3 hover:border-black transition-colors duration-75">
                <div class="flex items-start gap-3">
                  <div class="text-sm text-gray-400 pt-0.5 font-medium">03</div>
                  <div>
                    <h4 class="text-sm font-medium mb-1">Send with one click</h4>
                    <p class="text-xs text-gray-600 leading-relaxed">
                      Generate pixel-perfect PDFs from your design and send via email. Your custom design, your brand, zero compromise on aesthetics.
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>

          <!-- Additional Info -->
          <div class="space-y-2">
            <h3 class="text-base font-medium border-b border-thin pb-2">Why inv?</h3>
            <div class="space-y-2 text-xs text-gray-600 leading-relaxed">
              <p>
                Most invoicing tools force you into their templates. inv flips this—your design is the template. Upload once, reuse forever.
              </p>
              <p>
                Built with designers in mind: stark minimalism, terminal vibes, fast interactions. No bloat, no clutter, just invoicing that respects your aesthetic sensibility.
              </p>
            </div>
          </div>

          <!-- CTA -->
          <div class="flex items-center gap-3 pt-4">
            <a
              href="/auth/login"
              class="inline-block py-3 px-8 border border-black text-sm hover:bg-black hover:text-white transition-colors duration-75"
            >
              Get started free
            </a>
            <span class="text-xs text-gray-500">
              {invoicesSent.toLocaleString()} invoices sent
            </span>
          </div>
        </div>

        <!-- Right: Pricing Sidebar -->
        <div class="md:col-span-5 space-y-4">

          <!-- Pricing Cards -->
          <div class="border border-thin rounded-sm divide-y divide-border">

            <!-- Free tier -->
            <div class="p-5 space-y-2">
              <div class="flex items-baseline justify-between">
                <h3 class="text-base font-medium">Free</h3>
                <span class="text-2xl font-light">$0</span>
              </div>
              <ul class="text-xs text-gray-600 space-y-1.5">
                <li class="flex items-start gap-2">
                  <span class="text-gray-400">→</span>
                  <span>Unlimited invoices</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-gray-400">→</span>
                  <span>3 clients</span>
                </li>
              </ul>
            </div>

            <!-- Pro tier -->
            <div class="p-5 space-y-2 bg-gray-50">
              <div class="flex items-baseline justify-between">
                <h3 class="text-base font-medium">Pro</h3>
                <div class="text-right">
                  <div class="text-2xl font-light">$10</div>
                  <div class="text-xs text-gray-500">/month</div>
                </div>
              </div>
              <p class="text-xs text-gray-500">$8/month billed yearly</p>
              <ul class="text-xs text-gray-600 space-y-1.5">
                <li class="flex items-start gap-2">
                  <span class="text-gray-400">→</span>
                  <span>Everything in Free</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-black">→</span>
                  <span class="text-black font-medium">Unlimited clients</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-black">→</span>
                  <span class="text-black font-medium">Upload custom designs</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-black">→</span>
                  <span class="text-black font-medium">Partial payments</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-black">→</span>
                  <span class="text-black font-medium">Custom branding</span>
                </li>
              </ul>
              <a
                href="/auth/login"
                class="block w-full py-2 px-4 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75 text-center mt-3"
              >
                Start Pro trial
              </a>
            </div>
          </div>

          <!-- Feature Highlight -->
          <div class="border border-thin rounded-sm p-4 space-y-1.5">
            <h4 class="text-sm font-medium">Template System</h4>
            <p class="text-xs text-gray-600 leading-relaxed">
              Upload PDF/PNG → Map dynamic areas → Reusable template. Pixel-perfect rendering (±2px tolerance) with automatic font matching and layout preservation.
            </p>
          </div>

        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="px-4 py-3 mt-auto">
    <div class="max-w-7xl mx-auto">
      <div class="flex items-center gap-4 text-xs text-gray-600">
        <a href="/legal/terms" class="hover:text-black transition-colors">Terms</a>
        <a href="/legal/privacy" class="hover:text-black transition-colors">Privacy</a>
      </div>
    </div>
  </footer>
</div>

<style>
  :global(body) {
    font-family: 'JetBrains Mono', monospace !important;
  }

  * {
    font-family: 'JetBrains Mono', monospace !important;
  }

  @keyframes underline-sweep {
    from { width: 0; }
    to { width: 100%; }
  }

  .animate-underline-sweep {
    animation: underline-sweep 80ms ease-out forwards;
  }

  .animate-number-roll {
    animation: number-roll 180ms ease-out;
  }

  @keyframes number-roll {
    from {
      transform: translateY(10px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
</style>
