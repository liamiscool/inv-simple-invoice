<script lang="ts">
  import { onMount } from 'svelte';
  import anime from 'animejs';

  let currentTab = $state(0);
  let emailInput = $state('');
  let invoicesSent = $state(0);

  const tourFrames = [
    {
      title: 'Design',
      description: 'Upload your custom invoice design or use curated templates'
    },
    {
      title: 'Send',
      description: 'One-click sending with automatic PDF generation'
    },
    {
      title: 'Track',
      description: 'Monitor payments and manage client relationships'
    }
  ];

  onMount(() => {
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

<div class="min-h-screen flex flex-col">
  <!-- Header -->
  <header class="border-b border-thin px-4 py-3">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <!-- Logo/Title -->
      <div class="flex items-center gap-6">
        <h1 class="text-base tracking-tight">inv</h1>
        <span class="text-xs text-gray-600">Beautiful invoices for designers</span>
      </div>
      
      <!-- Sign in -->
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

  <!-- Main Content -->
  <main class="flex-1 px-4 py-8">
    <div class="max-w-7xl mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
        
        <!-- Left: Product Tour -->
        <div class="md:col-span-2">
          <div class="space-y-4">
            <!-- Tour tabs -->
            <div class="flex gap-1 border-b border-thin">
              {#each tourFrames as frame, i}
                <button
                  onclick={() => currentTab = i}
                  class="px-3 py-2 text-xs transition-all duration-75 relative {currentTab === i ? 'text-black' : 'text-gray-400'}"
                >
                  {frame.title}
                  {#if currentTab === i}
                    <div class="absolute bottom-0 left-0 w-full h-px bg-black animate-underline-sweep"></div>
                  {/if}
                </button>
              {/each}
            </div>
            
            <!-- Tour content -->
            <div class="h-64 border border-thin rounded-sm p-8 flex items-center justify-center bg-gray-50">
              <div class="text-center space-y-2">
                <h2 class="text-sm font-normal">{tourFrames[currentTab].title}</h2>
                <p class="text-xs text-gray-600 max-w-sm">{tourFrames[currentTab].description}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Right: Pricing -->
        <div class="space-y-6">
          <!-- Pricing box -->
          <div class="border border-thin rounded-sm p-6 space-y-4">
            <div class="space-y-3">
              <!-- Free tier -->
              <div class="pb-3 border-b border-thin">
                <h3 class="text-sm mb-2">Free</h3>
                <ul class="text-xs text-gray-600 space-y-1">
                  <li>Draft unlimited invoices</li>
                  <li>3 sends lifetime</li>
                  <li>Curated templates</li>
                </ul>
              </div>
              
              <!-- Pro tier -->
              <div>
                <h3 class="text-sm mb-2">Pro</h3>
                <div class="flex items-baseline gap-2 mb-2">
                  <span class="text-lg">$10</span>
                  <span class="text-xs text-gray-600">/month</span>
                </div>
                <p class="text-xs text-gray-500 mb-3">$8/month billed yearly</p>
                <ul class="text-xs text-gray-600 space-y-1">
                  <li>Unlimited sending</li>
                  <li>Upload custom designs</li>
                  <li>Partial payments</li>
                  <li>Custom branding</li>
                </ul>
              </div>
            </div>
            
            <a 
              href="/auth/login"
              class="block w-full py-2 px-4 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75 text-center"
            >
              Get started
            </a>
          </div>
          
          <!-- Stats -->
          <div class="text-center py-4">
            <div class="text-2xl font-light animate-number-roll">{invoicesSent.toLocaleString()}</div>
            <div class="text-xs text-gray-600">invoices sent</div>
          </div>
        </div>
      </div>
    </div>
  </main>

  <!-- Footer -->
  <footer class="border-t border-thin px-4 py-4 mt-auto">
    <div class="max-w-7xl mx-auto">
      <div class="flex flex-col md:flex-row items-center justify-between gap-4">
        <!-- Email capture -->
        <form onsubmit={handleEmailSubmit} class="flex gap-2 flex-1 max-w-sm">
          <input
            type="email"
            bind:value={emailInput}
            placeholder="Updates via email"
            class="flex-1 px-3 py-1.5 text-xs border border-thin rounded-sm focus:outline-none focus:border-black transition-colors"
            required
          />
          <button 
            type="submit"
            class="px-4 py-1.5 text-xs border border-thin hover:border-black transition-colors rounded-sm"
          >
            Subscribe
          </button>
        </form>
        
        <!-- Links -->
        <div class="flex items-center gap-4 text-xs text-gray-600">
          <a href="/legal/terms" class="hover:text-black transition-colors">Terms</a>
          <a href="/legal/privacy" class="hover:text-black transition-colors">Privacy</a>
          <span class="text-gray-400">•</span>
          <span class="text-green-600">All systems operational</span>
        </div>
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