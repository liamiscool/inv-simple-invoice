<script lang="ts">
  import type { LayoutData } from './$types';
  
  let { data, children }: { data: LayoutData; children: any } = $props();
  
  async function handleLogout() {
    await data.supabase.auth.signOut();
    window.location.href = '/';
  }
</script>

<div class="min-h-screen bg-white">
  <!-- Navigation -->
  <nav class="border-b border-thin px-4 py-3">
    <div class="max-w-7xl mx-auto flex items-center justify-between">
      <div class="flex items-center gap-6">
        <a href="/app" class="text-base tracking-tight">inv</a>
        <div class="hidden md:flex items-center gap-4 text-xs">
          <a href="/app/invoices" class="hover:text-black transition-colors">Invoices</a>
          <a href="/app/clients" class="hover:text-black transition-colors">Clients</a>
          <a href="/app/templates" class="hover:text-black transition-colors">Templates</a>
        </div>
      </div>
      
      <div class="flex items-center gap-4 text-xs">
        <a href="/app/settings" class="hover:text-black transition-colors">Settings</a>
        <button 
          onclick={handleLogout}
          class="hover:text-black transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  </nav>
  
  <!-- Main content -->
  <main class="max-w-7xl mx-auto px-4 py-6">
    {@render children?.()}
  </main>
</div>