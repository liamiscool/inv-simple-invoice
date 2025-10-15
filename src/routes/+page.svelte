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
  <main class="flex-1 px-8 py-8 overflow-hidden">
    <div class="max-w-[1400px] mx-auto h-full">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-16 h-full">

        <!-- Left: Story & Content -->
        <div class="space-y-8 flex flex-col justify-center">
          <!-- Hero -->
          <div class="space-y-6">
            <h2 class="text-5xl md:text-6xl font-light tracking-tight leading-[1.1] dark:text-white">
              Send beautiful invoices.<br/>
              Get paid.
            </h2>
            <p class="text-base text-gray-700 dark:text-gray-300 leading-relaxed max-w-xl">
              I created this to make it easy for designers, creators, and creatives to manage and send invoices. With beautiful templates—or upload your own designs instead of using boring ones.
            </p>
          </div>

          <!-- The Story -->
          <div class="space-y-4 max-w-xl">
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              I personally wanted a way to do this for myself. All the software had too much stuff or just wasn't right. I wanted beautiful invoices that <em>I</em> designed. So now you can upload your own invoice designs and send those.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              It's free to get started. Send unlimited invoices each month, up to 3 clients. Built to help creatives, creators, and designers get paid.
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              In fact, anyone can use it—contractors, teams, anyone who sends invoices. But it's mainly for people who care about these things.
            </p>
          </div>

          <!-- CTA -->
          <div class="flex items-center gap-4 pt-4">
            <a
              href={isSignedIn ? '/app' : '/auth/login'}
              class="px-5 py-2.5 bg-black dark:bg-gray-700 text-white dark:text-white text-sm hover:bg-gray-800 dark:hover:bg-gray-600 transition-colors duration-75"
            >
              {isSignedIn ? 'Go to Dashboard' : 'Get started free'}
            </a>
            <span class="text-sm text-gray-500 dark:text-gray-400">
              {invoicesSent.toLocaleString()} invoices sent
            </span>
          </div>
        </div>

        <!-- Right: How it works -->
        <div class="space-y-8 flex flex-col justify-center">

          <div class="space-y-6">
            <h3 class="text-lg font-medium dark:text-white">How it works</h3>

            <div class="space-y-6">
              <div class="space-y-2">
                <div class="flex items-start gap-4">
                  <div class="text-base text-gray-400 font-medium pt-1">01</div>
                  <div class="flex-1">
                    <h4 class="text-base font-medium mb-2 dark:text-white">Upload your design</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Upload any PDF or PNG invoice design you've created. Define where dynamic content goes—invoice numbers, line items, totals, client details.
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-start gap-4">
                  <div class="text-base text-gray-400 font-medium pt-1">02</div>
                  <div class="flex-1">
                    <h4 class="text-base font-medium mb-2 dark:text-white">Add your clients</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Manage clients, create invoices, track payments. Automatic invoice numbering, status tracking (draft → sent → paid), partial payment support.
                    </p>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-start gap-4">
                  <div class="text-base text-gray-400 font-medium pt-1">03</div>
                  <div class="flex-1">
                    <h4 class="text-base font-medium mb-2 dark:text-white">Send & get paid</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                      Generate pixel-perfect PDFs from your design and send via email. Your design, your brand, zero compromise.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Feedback CTA -->
          <div class="bg-gray-50 dark:bg-dark-input border border-thin dark:border-gray-700 p-6 space-y-3">
            <p class="text-sm font-medium dark:text-white">Open to feedback</p>
            <p class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Keen to hear ideas, thoughts, and feedback to make this better. This is a work in progress.
            </p>
          </div>

        </div>

      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="px-8 py-3 mt-auto border-t border-thin dark:border-gray-700">
    <div class="max-w-[1400px] mx-auto flex items-center justify-between">
      <div class="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <a href="https://x.com/liamhanel" target="_blank" rel="noopener noreferrer" class="hover:text-black dark:hover:text-white transition-colors">
          Created by Liam Hänel
        </a>
      </div>
      <div class="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
        <a href="/legal/terms" class="hover:text-black dark:hover:text-white transition-colors">Terms</a>
        <a href="/legal/privacy" class="hover:text-black dark:hover:text-white transition-colors">Privacy</a>
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
