<script lang="ts">
  import type { LayoutData } from './$types';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { STRIPE_MONTHLY_LINK, STRIPE_YEARLY_LINK } from '$lib/config/stripe';
  import UpgradeModal from '$lib/components/UpgradeModal.svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { Cog6Tooth, Star, ChatBubbleLeftRight, ArrowRightOnRectangle, Bell } from '@steeze-ui/heroicons';
  import ChangelogWidget from '$lib/components/ChangelogWidget.svelte';

  let { data, children }: { data: LayoutData; children: any } = $props();
  let showMobileSidebar = $state(false);
  let showUpgradeModal = $state(false);
  let subscriptionPlan = $state<'free' | 'pro'>('free');
  let showProfileMenu = $state(false);
  let showChangelogWidget = $state(false);

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
        .maybeSingle();

      if (sub && sub.plan === 'pro' && sub.status === 'active') {
        subscriptionPlan = 'pro';
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    }

    // Close profile menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.profile-menu-container')) {
        showProfileMenu = false;
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  });

  async function handleLogout() {
    await data.supabase.auth.signOut();
    window.location.href = '/';
  }

  function closeMobileSidebar() {
    showMobileSidebar = false;
  }

  function toggleProfileMenu() {
    showProfileMenu = !showProfileMenu;
  }

  function getInitials(email: string | undefined): string {
    if (!email) return 'U';
    const username = email.split('@')[0];
    return username.charAt(0).toUpperCase();
  }

  const navItems = [
    { href: '/app', label: 'Dashboard', exact: true },
    { href: '/app/invoices', label: 'Invoices' },
    { href: '/app/clients', label: 'Clients' },
    { href: '/app/templates', label: 'Templates' }
  ];
</script>

<div class="min-h-screen bg-white">
  <!-- Mobile header -->
  <div class="md:hidden border-b border-thin px-4 py-3">
    <div class="flex items-center justify-between">
      <a href="/app" class="text-lg tracking-tight font-medium">inv</a>
      <button
        onclick={() => showMobileSidebar = !showMobileSidebar}
        class="text-sm hover:text-black transition-colors"
      >
        Menu
      </button>
    </div>
  </div>

  <!-- Mobile sidebar overlay -->
  {#if showMobileSidebar}
    <div class="md:hidden fixed inset-0 z-50">
      <div class="fixed inset-0 bg-black/20" onclick={closeMobileSidebar}></div>
      <div class="fixed left-0 top-0 h-full w-56 bg-white border-r border-gray-200 flex flex-col">
        <!-- Logo -->
        <div class="px-6 py-6 border-b border-gray-200">
          <a href="/app" class="text-lg tracking-tight font-medium">inv</a>
        </div>

        <!-- Nav -->
        <div class="flex-1 overflow-y-auto flex flex-col">
          <nav class="px-3 py-4 space-y-0.5">
            {#each navItems as item}
              <a
                href={item.href}
                onclick={closeMobileSidebar}
                class="block px-3 py-2 text-sm hover:bg-gray-50 transition-colors rounded {
                  (item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href))
                    ? 'text-black font-medium bg-gray-50' : 'text-gray-600'
                }"
              >
                {item.label}
              </a>
            {/each}
          </nav>

          <!-- Spacer -->
          <div class="flex-1"></div>

          <!-- What's New Button -->
          <div
            class="px-3 pb-2 relative"
            onmouseenter={() => showChangelogWidget = true}
            onmouseleave={() => showChangelogWidget = false}
          >
            <div class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded cursor-pointer">
              <Icon src={Bell} class="w-[16px] h-[16px]" />
              <span>What's New</span>
            </div>

            {#if showChangelogWidget}
              <!-- Invisible bridge to prevent hover gap -->
              <div class="absolute left-[100%] top-0 w-4 h-full"></div>
              <ChangelogWidget onClose={() => showChangelogWidget = false} />
            {/if}
          </div>

          <!-- Feedback Button -->
          <div class="px-3 pb-4">
            <a
              href="mailto:feedback@inv.so"
              onclick={closeMobileSidebar}
              class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded"
            >
              <Icon src={ChatBubbleLeftRight} class="w-[16px] h-[16px]" />
              <span>Feedback</span>
            </a>
          </div>
        </div>

        <!-- Mobile Profile section -->
        <div class="flex-shrink-0 relative profile-menu-container border-t border-gray-200">
          <button
            onclick={toggleProfileMenu}
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div class="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              {getInitials(data.session?.user?.email)}
            </div>
            <div class="flex-1 min-w-0 text-left">
              <div class="text-sm font-medium truncate">
                {data.session?.user?.email?.split('@')[0] || 'User'}
              </div>
              <div class="text-xs text-gray-500">
                {subscriptionPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </div>
            </div>
          </button>

          {#if showProfileMenu}
            <div class="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 shadow-lg">
              <div class="px-4 py-3 border-b border-gray-200">
                <div class="text-sm font-medium truncate">
                  {data.session?.user?.email?.split('@')[0] || 'User'}
                </div>
                <div class="text-xs text-gray-500 truncate">
                  {data.session?.user?.email || ''}
                </div>
              </div>

              <div class="py-1">
                <a
                  href="/app/settings"
                  onclick={() => { showProfileMenu = false; closeMobileSidebar(); }}
                  class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                >
                  <Icon src={Cog6Tooth} class="w-[18px] h-[18px] text-gray-600" />
                  <span>Settings</span>
                </a>

                {#if subscriptionPlan === 'free'}
                  <button
                    onclick={() => { showUpgradeModal = true; showProfileMenu = false; closeMobileSidebar(); }}
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
                  >
                    <Icon src={Star} class="w-[18px] h-[18px] text-gray-600" />
                    <span>Upgrade Plan</span>
                  </button>
                {/if}

                <a
                  href="https://github.com/anthropics/claude-code/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 hover:from-purple-100 hover:via-pink-100 hover:to-orange-100 transition-colors border-y border-gray-100"
                >
                  <Icon src={ChatBubbleLeftRight} class="w-[18px] h-[18px] text-purple-600" />
                  <span class="font-medium bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                    Give Feedback
                  </span>
                </a>

                <button
                  onclick={handleLogout}
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  <Icon src={ArrowRightOnRectangle} class="w-[18px] h-[18px] text-gray-600" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Desktop sidebar -->
  <div class="hidden md:fixed md:left-0 md:top-0 md:h-full md:w-56 md:border-r md:border-gray-200 md:bg-white md:flex md:flex-col">
    <!-- Logo -->
    <div class="px-6 py-6 border-b border-gray-200">
      <a href="/app" class="text-lg tracking-tight font-medium">inv</a>
    </div>

    <!-- Nav + bottom items container (no overflow on parent) -->
    <div class="flex-1 flex flex-col">
      <!-- Scrollable nav section only -->
      <nav class="px-3 py-4 space-y-0.5 overflow-y-auto flex-1">
        {#each navItems as item}
          <a
            href={item.href}
            class="block px-3 py-2 text-sm hover:bg-gray-50 transition-colors rounded {
              (item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href))
                ? 'text-black font-medium bg-gray-50' : 'text-gray-600'
            }"
          >
            {item.label}
          </a>
        {/each}
      </nav>

      <!-- What's New Button (outside scroll, can overflow) -->
      <div
        class="px-3 pb-2 relative"
        onmouseenter={() => showChangelogWidget = true}
        onmouseleave={() => showChangelogWidget = false}
      >
        <div class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded cursor-pointer">
          <Icon src={Bell} class="w-[16px] h-[16px]" />
          <span>What's New</span>
        </div>

        {#if showChangelogWidget}
          <!-- Invisible bridge to prevent hover gap -->
          <div class="absolute left-[100%] top-0 w-2 h-full"></div>
          <ChangelogWidget onClose={() => showChangelogWidget = false} />
        {/if}
      </div>

      <!-- Feedback Button -->
      <div class="px-3 pb-4">
        <a
          href="mailto:feedback@inv.so"
          class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors rounded"
        >
          <Icon src={ChatBubbleLeftRight} class="w-[16px] h-[16px]" />
          <span>Feedback</span>
        </a>
      </div>
    </div>

    <!-- Profile section with popup -->
    <div class="flex-shrink-0 relative profile-menu-container border-t border-gray-200">
      <!-- Profile button -->
      <button
        onclick={toggleProfileMenu}
        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
      >
        <!-- Avatar circle -->
        <div class="w-8 h-8 rounded-full bg-black text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
          {getInitials(data.session?.user?.email)}
        </div>

        <!-- User info -->
        <div class="flex-1 min-w-0 text-left">
          <div class="text-sm font-medium truncate">
            {data.session?.user?.email?.split('@')[0] || 'User'}
          </div>
          <div class="text-xs text-gray-500">
            {subscriptionPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
          </div>
        </div>
      </button>

      <!-- Popup menu (appears above) -->
      {#if showProfileMenu}
        <div class="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 shadow-lg">
          <!-- User info header (non-clickable) -->
          <div class="px-4 py-3 border-b border-gray-200">
            <div class="text-sm font-medium truncate">
              {data.session?.user?.email?.split('@')[0] || 'User'}
            </div>
            <div class="text-xs text-gray-500 truncate">
              {data.session?.user?.email || ''}
            </div>
          </div>

          <!-- Menu items -->
          <div class="py-1">
            <!-- Settings -->
            <a
              href="/app/settings"
              onclick={() => showProfileMenu = false}
              class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              <Icon src={Cog6Tooth} class="w-[18px] h-[18px] text-gray-600" />
              <span>Settings</span>
            </a>

            <!-- Upgrade Plan (only show for free users) -->
            {#if subscriptionPlan === 'free'}
              <button
                onclick={() => { showUpgradeModal = true; showProfileMenu = false; }}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors"
              >
                <Icon src={Star} class="w-[18px] h-[18px] text-gray-600" />
                <span>Upgrade Plan</span>
              </button>
            {/if}

            <!-- Give Feedback (highlighted) -->
            <a
              href="https://github.com/anthropics/claude-code/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 hover:from-purple-100 hover:via-pink-100 hover:to-orange-100 transition-colors border-y border-gray-100"
            >
              <Icon src={ChatBubbleLeftRight} class="w-[18px] h-[18px] text-purple-600" />
              <span class="font-medium bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent">
                Give Feedback
              </span>
            </a>

            <!-- Sign out -->
            <button
              onclick={handleLogout}
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              <Icon src={ArrowRightOnRectangle} class="w-[18px] h-[18px] text-gray-600" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Main content -->
  <main class="md:ml-56">
    <div class="p-4 md:p-6">
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