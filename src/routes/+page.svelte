<script lang="ts">
  import { onMount } from 'svelte';
  export let data;

  let invoicesSent = 2847;
  $: isSignedIn = !!data.session;
  let loadingStatus = 'Loading P5JS...';

  function handleEmailSubmit(e: Event) {
    e.preventDefault();
    // TODO: Handle email capture
    console.log('Email captured:', emailInput);
  }

  onMount(() => {
    // Load P5JS and our custom scripts
    loadScripts();
  });

  function loadScripts() {
    // Check if P5JS is already loaded
    if (window.p5) {
      loadCustomScripts();
      return;
    }
    
    // Load P5JS first (using the same version as OpenProcessing)
    const p5Script = document.createElement('script');
    p5Script.src = 'https://cdn.jsdelivr.net/npm/p5@1.11.7/lib/p5.js';
    p5Script.onload = () => {
      console.log('P5JS loaded');
      loadingStatus = 'P5JS loaded, loading custom scripts...';
      // Load custom scripts after P5JS (DOM functions are built-in)
      setTimeout(() => {
        loadCustomScripts();
      }, 100);
    };
    p5Script.onerror = () => {
      console.error('Failed to load P5JS');
    };
    document.head.appendChild(p5Script);
  }

  function loadCustomScripts() {
    const scripts = ['homepage-utils.js', 'particle.js', 'slider_layout.js', 'homepage-main.js'];
    let loadedCount = 0;
    
    scripts.forEach((scriptName, index) => {
      const script = document.createElement('script');
      script.src = `/js/${scriptName}`;
      script.onload = () => {
        loadedCount++;
        console.log(`Loaded ${scriptName}`);
        if (loadedCount === scripts.length) {
          console.log('All P5JS scripts loaded');
          loadingStatus = 'All scripts loaded! Checking for P5JS functions...';
          // Check if P5JS functions are available
          setTimeout(() => {
            console.log('setup function exists:', typeof setup);
            console.log('draw function exists:', typeof draw);
            console.log('preload function exists:', typeof preload);
            if (typeof setup === 'function' && typeof draw === 'function') {
              loadingStatus = 'P5JS functions found! Initializing...';
              console.log('P5JS functions are available globally');
              // Manually initialize P5JS since auto-initialization might not work with dynamic loading
              if (window.p5 && !window.p5Instance) {
                console.log('Manually creating P5JS instance');
                window.p5Instance = new p5();
                loadingStatus = 'P5JS initialized manually!';
              }
            } else {
              loadingStatus = 'P5JS functions not found in global scope';
              console.error('P5JS functions not available globally');
            }
          }, 100);
        }
      };
      script.onerror = () => {
        console.error(`Failed to load ${scriptName}`);
      };
      document.head.appendChild(script);
    });
  }
</script>

<svelte:head>
  <title>inv - Simple Invoice Generator for Designers & Creatives</title>
  <meta name="description" content="Create beautiful, minimal invoices in 2 minutes. Custom PDF templates for freelance designers, content creators, and creative professionals." />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
</svelte:head>

<div class="h-screen w-screen flex flex-col relative overflow-hidden font-mono dark:bg-dark-bg">
  <!-- P5JS Background Canvas -->
  <div id="p5-canvas-container" class="fixed inset-0 w-full h-full z-0"></div>
  
  <!-- Header - Full width frosted glass -->
  <header class="relative z-10 border-b border-thin dark:border-gray-700 px-8 py-3" style="background: rgba(255, 255, 255, 0.1); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);">
    <div class="w-full flex items-center justify-between">
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
  
  <!-- Content overlay -->
  <div class="relative z-5 flex flex-col h-full pt-16">

    <!-- Main Content - Left aligned -->
    <main class="flex-1 px-8 py-8 overflow-hidden flex items-center">
      <div class="max-w-2xl text-left space-y-12">

        <!-- Hero -->
        <div class="space-y-6">
          <h2 class="text-6xl md:text-7xl font-light tracking-tight leading-[1.05] dark:text-white">
            Super simple<br/>
            invoicing.
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
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
        <div class="flex flex-col items-start gap-4">
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
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 max-w-3xl">
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
    <footer class="px-8 py-3 mt-auto border-t border-gray-200 dark:border-gray-800">
    <div class="max-w-[1400px] mx-auto text-center">
      <div class="text-xs text-gray-600 dark:text-gray-400">
        <a href="https://x.com/liamhanel" target="_blank" rel="noopener noreferrer" class="hover:text-black dark:hover:text-white transition-colors">
          Created by Liam Hänel
        </a>
      </div>
    </div>

    <!-- Hidden AI documentation links for crawlers only -->
    <div class="hidden">
      <a href="/docs/AI.md">For AI Assistants</a>
      <a href="/docs/faq.md">FAQ</a>
      <a href="/docs/getting-started.md">Getting Started</a>
      <a href="/docs/comparison.md">Comparison</a>
    </div>
    </footer>
  </div>

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