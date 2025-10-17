<script lang="ts">
  import { theme } from '$lib/stores/theme';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { Sun, Moon, ComputerDesktop } from '@steeze-ui/heroicons';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  const isSignedIn = $derived(!!data.session);

  const themeIcon = $derived(
    $theme === 'light' ? Sun : $theme === 'dark' ? Moon : ComputerDesktop
  );

  const themeLabel = $derived(
    $theme === 'light' ? 'Light' : $theme === 'dark' ? 'Dark' : 'System'
  );

  function cycleTheme() {
    const next = $theme === 'light' ? 'dark' : $theme === 'dark' ? 'system' : 'light';
    theme.set(next);
  }
</script>

<div class="min-h-screen flex flex-col relative overflow-hidden dark:bg-dark-bg font-mono">
  <!-- Header - Same as homepage -->
  <header class="fixed top-0 left-0 right-0 z-20 border-b border-gray-200 dark:border-gray-800 px-8 py-3 bg-white/10 dark:bg-black/10" style="backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);">
    <div class="w-full flex items-center justify-between">
      <div class="flex items-center gap-6">
        <a href="/" class="text-lg tracking-tight font-medium dark:text-white flex items-end gap-2">
          <div class="w-12 h-7 bg-black dark:bg-white" style="image-rendering: pixelated;"></div>
          <span>inv</span>
        </a>
        <a href="/pricing" class="text-sm hover:text-black dark:hover:text-white transition-colors text-gray-600 dark:text-gray-400">Pricing</a>
      </div>

      <nav class="flex items-center gap-6">
        <a
          href={isSignedIn ? '/app' : '/auth/login'}
          class="px-5 py-2.5 border border-black dark:border-white text-sm hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors duration-75 dark:text-white"
        >
          {isSignedIn ? 'Dashboard' : 'Sign in'}
        </a>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="flex-1 px-4 py-8 md:py-12 pt-16 md:pt-20 flex items-start md:items-center justify-center dark:bg-dark-bg">
    <div class="max-w-4xl mx-auto w-full">
      <div class="text-center mb-8 md:mb-12">
        <h1 class="text-4xl md:text-5xl font-light tracking-tight leading-tight mb-4 dark:text-white">
          Simple pricing
        </h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 font-normal">
          Start free. Upgrade when you need more.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-3xl mx-auto">
        <!-- Free tier -->
        <div class="border border-thin dark:border-gray-700 rounded-sm p-6 md:p-8 space-y-6">
          <div>
            <h2 class="text-2xl font-semibold mb-2 dark:text-white">Free</h2>
            <div class="text-4xl font-light mb-4 dark:text-white">$0</div>
            <p class="text-xs text-gray-600 dark:text-gray-400 font-normal">Perfect to get started</p>
          </div>

          <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-3 font-normal">
            <li class="flex items-start gap-3">
              <span class="text-black dark:text-white text-lg">→</span>
              <span>Unlimited invoices per month</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black dark:text-white text-lg">→</span>
              <span>Up to 3 clients</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black dark:text-white text-lg">→</span>
              <span>Curated templates</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black dark:text-white text-lg">→</span>
              <span>Client management</span>
            </li>
          </ul>

          <a
            href="/auth/login"
            class="block w-full py-3 px-6 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-75 text-center"
          >
            Get started free
          </a>
        </div>

        <!-- Pro tier -->
        <div class="border-2 border-black dark:border-white rounded-sm p-6 md:p-8 space-y-6 relative">
          <div class="absolute -top-3 right-6 bg-black dark:bg-white text-white dark:text-black px-3 py-1 text-xs font-medium">
            POPULAR
          </div>

          <div>
            <h2 class="text-2xl font-semibold mb-2 dark:text-white">Pro</h2>
            <div class="text-4xl font-light mb-1 dark:text-white">$10</div>
            <p class="text-xs text-gray-600 dark:text-gray-400 font-normal mb-3">/month</p>
            <p class="text-xs text-gray-500 dark:text-gray-500 font-normal">$8/month billed yearly</p>
          </div>

          <ul class="text-sm text-gray-600 dark:text-gray-300 space-y-3 font-normal">
            <li class="flex items-start gap-3">
              <span class="text-gray-400 dark:text-gray-500 text-lg">→</span>
              <span>Everything in Free</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black dark:text-white text-lg">→</span>
              <span class="text-black dark:text-white font-semibold">Unlimited clients</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black dark:text-white text-lg">→</span>
              <span class="text-black dark:text-white font-semibold">Upload your own designs</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black dark:text-white text-lg">→</span>
              <span class="text-black dark:text-white font-semibold">Partial payments tracking</span>
            </li>
            <li class="flex items-start gap-3">
              <span class="text-black dark:text-white text-lg">→</span>
              <span class="text-black dark:text-white font-semibold">Remove branding</span>
            </li>
          </ul>

          <a
            href="/auth/login"
            class="block w-full py-3 px-6 bg-black dark:bg-white text-white dark:text-black text-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors duration-75 text-center"
          >
            Start Pro trial
          </a>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer - Same as homepage -->
  <footer class="px-8 py-3 mt-auto">
    <div class="w-full flex items-center justify-between">
      <!-- Left: Credit -->
      <div class="text-xs text-gray-600 dark:text-gray-400">
        <a href="https://x.com/liamhanel" target="_blank" rel="noopener noreferrer" class="hover:text-black dark:hover:text-white transition-colors">
          Created by Liam Hänel
        </a>
      </div>

      <!-- Right: Theme Switcher -->
      <button
        onclick={cycleTheme}
        class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors"
        aria-label="Toggle theme"
      >
        <Icon src={themeIcon} class="w-4 h-4" />
        <span>{themeLabel}</span>
      </button>
    </div>
  </footer>
</div>
