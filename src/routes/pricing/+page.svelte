<script lang="ts">
  export let data;

  $: isSignedIn = !!data.session;
</script>

<div class="h-screen flex flex-col relative overflow-hidden">
  <!-- Header -->
  <header class="border-b border-thin px-4 py-3">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-6">
        <a href="/" class="text-base tracking-tight font-semibold hover:opacity-70 transition-opacity">inv</a>
        <a href="/pricing" class="text-xs hover:opacity-70 transition-opacity">Pricing</a>
      </div>

      <nav class="flex items-center gap-6">
        <a
          href={isSignedIn ? '/app' : '/auth/login'}
          class="text-xs border border-black px-4 py-2 hover:bg-black hover:text-white transition-colors duration-75"
        >
          {isSignedIn ? 'Dashboard' : 'Sign in'}
        </a>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 px-4 py-12 overflow-hidden flex items-center justify-center">
    <div class="max-w-4xl mx-auto w-full">
      <div class="text-center mb-12">
        <h1 class="text-4xl md:text-5xl font-light tracking-tight leading-tight mb-4">
          Simple pricing
        </h1>
        <p class="text-sm text-gray-600 font-normal">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
        <!-- Free tier -->
        <div class="border border-thin rounded-sm p-8 space-y-6">
          <div>
            <h2 class="text-2xl font-semibold mb-2">Free</h2>
            <div class="text-4xl font-light mb-4">$0</div>
            <p class="text-xs text-gray-600 font-normal">Perfect to get started</p>
          </div>

          <ul class="text-sm text-gray-600 space-y-3 font-normal">
            <li class="flex items-start gap-3">
              <span class="text-black text-lg">→</span>
              <span>Unlimited invoices per month</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black text-lg">→</span>
              <span>Up to 3 clients</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black text-lg">→</span>
              <span>Curated templates</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black text-lg">→</span>
              <span>Client management</span>
            </li>
          </ul>

          <a
            href="/auth/login"
            class="block w-full py-3 px-6 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors duration-75 text-center"
          >
            Get started free
          </a>
        </div>

        <!-- Pro tier -->
        <div class="border-2 border-black rounded-sm p-8 space-y-6 relative">
          <div class="absolute -top-3 right-6 bg-black text-white px-3 py-1 text-xs font-medium">
            POPULAR
          </div>

          <div>
            <h2 class="text-2xl font-semibold mb-2">Pro</h2>
            <div class="text-4xl font-light mb-1">$10</div>
            <p class="text-xs text-gray-600 font-normal mb-3">/month</p>
            <p class="text-xs text-gray-500 font-normal">$8/month billed yearly</p>
          </div>

          <ul class="text-sm text-gray-600 space-y-3 font-normal">
            <li class="flex items-start gap-3">
              <span class="text-gray-400 text-lg">→</span>
              <span>Everything in Free</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black text-lg">→</span>
              <span class="text-black font-semibold">Unlimited clients</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black text-lg">→</span>
              <span class="text-black font-semibold">Upload your own designs</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black text-lg">→</span>
              <span class="text-black font-semibold">Partial payments tracking</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black text-lg">→</span>
              <span class="text-black font-semibold">Remove branding</span>
            </li>
          </ul>

          <a
            href="/auth/login"
            class="block w-full py-3 px-6 bg-black text-white text-sm font-medium hover:bg-gray-800 transition-colors duration-75 text-center"
          >
            Start Pro trial
          </a>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="px-4 py-3 mt-auto">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-4 text-xs text-gray-600">
        <a href="https://x.com/liamhanel" target="_blank" rel="noopener noreferrer" class="hover:text-black transition-colors">
          Created by Liam Hänel
        </a>
      </div>
      <div class="flex items-center gap-4 text-xs text-gray-600">
        <a href="/legal/terms" class="hover:text-black transition-colors">Terms</a>
        <a href="/legal/privacy" class="hover:text-black transition-colors">Privacy</a>
      </div>
    </div>
  </footer>
</div>
