<script lang="ts">
  export let data;

  let invoicesSent = 2847;
  $: isSignedIn = !!data.session;

  function handleEmailSubmit(e: Event) {
    e.preventDefault();
    // TODO: Handle email capture
    console.log('Email captured:', emailInput);
  }
</script>

<div class="h-screen flex flex-col relative overflow-hidden font-mono dark:bg-dark-bg">
  <!-- Header -->
  <header class="border-b border-thin dark:border-gray-700 px-4 py-3">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-6">
        <a href="/" class="text-lg tracking-tight font-medium dark:text-white flex items-end gap-2">
          <div class="w-12 h-7" style="background: #F58121; image-rendering: pixelated;"></div>
          <span>inv</span>
        </a>
        <a href="/pricing" class="text-sm hover:text-black dark:hover:text-white transition-colors text-gray-600 dark:text-gray-400">Pricing</a>
      </div>

      <nav class="flex items-center gap-6">
        <a
          href={isSignedIn ? '/app' : '/auth/login'}
          class="px-5 py-2.5 border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-75 dark:text-white"
        >
          {isSignedIn ? 'Dashboard' : 'Sign in'}
        </a>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 px-8 py-8 overflow-hidden flex items-center justify-center">
    <div class="max-w-4xl mx-auto text-center space-y-12">

      <!-- Hero -->
      <div class="space-y-6">
        <h2 class="text-6xl md:text-7xl font-light tracking-tight leading-[1.05] dark:text-white">
          Super simple<br/>
          invoicing.
        </h2>
        <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">
          For creatives, designers, and creators. No frills. Manage your templates. Send and manage clients and invoices in one place. Upload your own designs or use templates. Free to use.
        </p>
      </div>

      <!-- Free tier highlight -->
      <div class="space-y-2">
        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-500">
          Free forever · Unlimited invoices · 3 clients
        </p>
      </div>

      <!-- CTA -->
      <div class="flex flex-col items-center gap-4">
        <a
          href={isSignedIn ? '/app' : '/auth/login'}
          class="px-8 py-3.5 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-75 inline-flex items-center gap-2"
        >
          <span>{isSignedIn ? 'Go to Dashboard' : 'Get started free'}</span>
          <span>→</span>
        </a>
        <span class="text-sm text-gray-500 dark:text-gray-500">
          {invoicesSent.toLocaleString()} invoices sent
        </span>
      </div>

      <!-- Features grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 max-w-3xl mx-auto">
        <div class="space-y-2">
          <div class="text-2xl" style="color: #F58121;">↑</div>
          <h3 class="text-sm font-medium dark:text-white">Upload custom designs</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Your invoice templates. PDF or PNG.
          </p>
        </div>

        <div class="space-y-2">
          <div class="text-2xl" style="color: #F58121;">◼</div>
          <h3 class="text-sm font-medium dark:text-white">Manage invoices</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Track clients, payments, and status.
          </p>
        </div>

        <div class="space-y-2">
          <div class="text-2xl" style="color: #F58121;">→</div>
          <h3 class="text-sm font-medium dark:text-white">Send & get paid</h3>
          <p class="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
            Email pixel-perfect PDFs. Simple.
          </p>
        </div>
      </div>

    </div>
  </main>

  <!-- Footer -->
  <footer class="px-8 py-3 mt-auto">
    <div class="max-w-[1400px] mx-auto text-center">
      <div class="text-xs text-gray-600 dark:text-gray-400">
        <a href="https://x.com/liamhanel" target="_blank" rel="noopener noreferrer" class="hover:text-black dark:hover:text-white transition-colors">
          Created by Liam Hänel
        </a>
      </div>
    </div>
  </footer>
</div>

<style>
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
