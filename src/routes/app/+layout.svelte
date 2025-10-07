<script lang="ts">
  import type { LayoutData } from './$types';
  import { page } from '$app/stores';
  
  let { data, children }: { data: LayoutData; children: any } = $props();
  let showMobileSidebar = $state(false);
  
  async function handleLogout() {
    await data.supabase.auth.signOut();
    window.location.href = '/';
  }
  
  function closeMobileSidebar() {
    showMobileSidebar = false;
  }
  
  const navItems = [
    { href: '/app', label: 'Dashboard', exact: true },
    { href: '/app/invoices', label: 'Invoices' },
    { href: '/app/clients', label: 'Clients' },
    { href: '/app/templates', label: 'Templates' },
    { href: '/app/settings', label: 'Settings' }
  ];
</script>

<div class="min-h-screen bg-white">
  <!-- Mobile header -->
  <div class="md:hidden border-b border-thin px-4 py-3">
    <div class="flex items-center justify-between">
      <a href="/app" class="text-base tracking-tight">inv</a>
      <button 
        onclick={() => showMobileSidebar = !showMobileSidebar}
        class="text-xs hover:text-black transition-colors"
      >
        Menu
      </button>
    </div>
  </div>

  <!-- Mobile sidebar overlay -->
  {#if showMobileSidebar}
    <div class="md:hidden fixed inset-0 z-50">
      <div class="fixed inset-0 bg-black/20" onclick={closeMobileSidebar}></div>
      <div class="fixed left-0 top-0 h-full w-48 bg-white border-r border-thin">
        <div class="py-6 px-4">
          <a href="/app" class="text-base tracking-tight block mb-6">inv</a>
          <nav class="space-y-3">
            {#each navItems as item}
              <a 
                href={item.href}
                onclick={closeMobileSidebar}
                class="block text-xs hover:text-black transition-colors {
                  (item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href)) 
                    ? 'text-black' : 'text-gray-600'
                }"
              >
                {item.label}
              </a>
            {/each}
            <button 
              onclick={handleLogout}
              class="block text-xs text-gray-600 hover:text-black transition-colors mt-6 pt-3 border-t border-thin"
            >
              Sign out
            </button>
          </nav>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Desktop sidebar -->
  <div class="hidden md:fixed md:left-0 md:top-0 md:h-full md:w-48 md:border-r md:border-thin md:bg-white md:block">
    <div class="py-6 px-4">
      <a href="/app" class="text-base tracking-tight block mb-6">inv</a>
      <nav class="space-y-3">
        {#each navItems as item}
          <a 
            href={item.href}
            class="block text-xs hover:text-black transition-colors {
              (item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href)) 
                ? 'text-black' : 'text-gray-600'
            }"
          >
            {item.label}
          </a>
        {/each}
      </nav>
      
      <!-- User section -->
      <div class="mt-8 pt-6 border-t border-thin">
        <div class="text-xs text-gray-600 mb-2">
          {data.session?.user?.email?.split('@')[0] || 'User'}
        </div>
        <button 
          onclick={handleLogout}
          class="text-xs text-gray-600 hover:text-black transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  </div>
  
  <!-- Main content -->
  <main class="md:ml-48">
    <div class="p-6">
      {@render children?.()}
    </div>
  </main>
</div>