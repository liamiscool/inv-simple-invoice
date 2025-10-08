<script lang="ts">
  import type { LayoutData } from './$types';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { STRIPE_MONTHLY_LINK, STRIPE_YEARLY_LINK } from '$lib/config/stripe';
  import UpgradeModal from '$lib/components/UpgradeModal.svelte';

  let { data, children }: { data: LayoutData; children: any } = $props();
  let showMobileSidebar = $state(false);
  let showUpgradeModal = $state(false);
  let subscriptionPlan = $state<'free' | 'pro'>('free');

  onMount(async () => {
    try {
      const { data: user } = await data.supabase.auth.getUser();
      if (!user.user) return;

      const { data: profile } = await data.supabase
        .from('app_user')
        .select('org_id')
        .eq('id', user.user.id)
        .single();

      if (!profile) return;

      const { data: sub } = await data.supabase
        .from('plan_subscription')
        .select('plan, status')
        .eq('org_id', profile.org_id)
        .single();

      if (sub && sub.plan === 'pro' && sub.status === 'active') {
        subscriptionPlan = 'pro';
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }
  });

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

            <!-- Mobile Upgrade button -->
            {#if subscriptionPlan === 'free'}
              <button
                onclick={() => { showUpgradeModal = true; closeMobileSidebar(); }}
                class="block w-full px-3 py-2 border border-black text-xs hover:bg-black hover:text-white transition-colors mt-4"
              >
                Upgrade to Pro
              </button>
            {:else}
              <div class="mt-4 px-3 py-2 bg-black text-white text-xs text-center">
                Pro Plan
              </div>
            {/if}

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
      
      <!-- Upgrade button -->
      {#if subscriptionPlan === 'free'}
        <div class="mt-6 pt-6 border-t border-thin">
          <button
            onclick={() => showUpgradeModal = true}
            class="w-full px-3 py-2 border border-black text-xs hover:bg-black hover:text-white transition-colors duration-75"
          >
            Upgrade to Pro
          </button>
        </div>
      {:else}
        <div class="mt-6 pt-6 border-t border-thin">
          <div class="px-3 py-2 bg-black text-white text-xs text-center">
            Pro Plan
          </div>
        </div>
      {/if}

      <!-- User section -->
      <div class="mt-4 pt-4 border-t border-thin">
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

<!-- Upgrade Modal -->
<UpgradeModal
  bind:show={showUpgradeModal}
  reason="general"
  onClose={() => showUpgradeModal = false}
  monthlyLink={STRIPE_MONTHLY_LINK}
  yearlyLink={STRIPE_YEARLY_LINK}
/>