<script lang="ts">
  import type { LayoutData } from './$types';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { STRIPE_MONTHLY_LINK, STRIPE_YEARLY_LINK } from '$lib/config/stripe';
  import UpgradeModal from '$lib/components/UpgradeModal.svelte';
  import { Icon } from '@steeze-ui/svelte-icon';
  import { Cog6Tooth, Star, ChatBubbleLeftRight, ArrowRightOnRectangle, Bell, Sun, Moon, ComputerDesktop } from '@steeze-ui/heroicons';
  import ChangelogWidget from '$lib/components/ChangelogWidget.svelte';
  import { theme } from '$lib/stores/theme';

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
      const target: any = e.target;
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

  function cycleTheme() {
    const next = $theme === 'light' ? 'dark' : $theme === 'dark' ? 'system' : 'light';
    theme.set(next);
  }

  const themeIcon = $derived(
    $theme === 'light' ? Sun : $theme === 'dark' ? Moon : ComputerDesktop
  );

  const themeLabel = $derived(
    $theme === 'light' ? 'Light Mode' : $theme === 'dark' ? 'Dark Mode' : 'System Theme'
  );
</script>

<div class="min-h-screen bg-white dark:bg-dark-bg">
  <!-- Mobile header -->
  <div class="md:hidden border-b border-thin dark:border-gray-700 px-4 py-3 dark:bg-dark-bg">
    <div class="flex items-center justify-between">
      <a href="/app" class="text-lg tracking-tight font-medium dark:text-white flex items-end gap-2">
        <div class="w-12 h-7" style="background: #F58121; image-rendering: pixelated;"></div>
        <span>inv</span>
      </a>
      <button
        onclick={() => showMobileSidebar = !showMobileSidebar}
        class="text-sm hover:text-black dark:hover:text-white transition-colors dark:text-gray-300"
      >
        Menu
      </button>
    </div>
  </div>

  <!-- Mobile sidebar overlay -->
  {#if showMobileSidebar}
    <div class="md:hidden fixed inset-0 z-50">
      <div class="fixed inset-0 bg-black/20 dark:bg-black/70" onclick={closeMobileSidebar}></div>
      <div class="fixed left-0 top-0 h-full w-56 bg-white dark:bg-dark-bg border-r border-gray-200 dark:border-gray-800 flex flex-col">
        <!-- Logo -->
        <div class="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
          <a href="/app" class="text-lg tracking-tight font-medium dark:text-white flex items-end gap-2">
            <div class="w-12 h-7" style="background: #F58121; image-rendering: pixelated;"></div>
            <span>inv</span>
          </a>
        </div>

        <!-- Nav -->
        <div class="flex-1 overflow-y-auto flex flex-col">
          <nav class="px-3 py-4 space-y-0.5">
            {#each navItems as item}
              <a
                href={item.href}
                onclick={closeMobileSidebar}
                class="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded {
                  (item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href))
                    ? 'text-black dark:text-white font-medium bg-gray-50 dark:bg-gray-700/50' : 'text-gray-600 dark:text-gray-300'
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
            <div class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded cursor-pointer">
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
              class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors rounded"
            >
              <Icon src={ChatBubbleLeftRight} class="w-[16px] h-[16px]" />
              <span>Feedback</span>
            </a>
          </div>
        </div>

        <!-- Mobile Profile section -->
        <div class="flex-shrink-0 relative profile-menu-container border-t border-gray-200 dark:border-gray-700">
          <button
            onclick={toggleProfileMenu}
            class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div class="w-8 h-8 rounded-full bg-black dark:bg-gray-700 text-white dark:text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              {getInitials(data.session?.user?.email)}
            </div>
            <div class="flex-1 min-w-0 text-left">
              <div class="text-sm font-medium truncate dark:text-white">
                {data.session?.user?.email?.split('@')[0] || 'User'}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {subscriptionPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
              </div>
            </div>
          </button>

          {#if showProfileMenu}
            <div class="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-dark-input border border-gray-200 dark:border-gray-700 shadow-lg">
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <div class="text-sm font-medium truncate dark:text-white">
                  {data.session?.user?.email?.split('@')[0] || 'User'}
                </div>
                <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {data.session?.user?.email || ''}
                </div>
              </div>

              <div class="py-1">
                <a
                  href="/app/settings"
                  onclick={() => { showProfileMenu = false; closeMobileSidebar(); }}
                  class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
                >
                  <Icon src={Cog6Tooth} class="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
                  <span>Settings</span>
                </a>

                <button
                  onclick={() => { cycleTheme(); }}
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
                >
                  <Icon src={themeIcon} class="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
                  <span>{themeLabel}</span>
                </button>

                {#if subscriptionPlan === 'free'}
                  <button
                    onclick={() => { showUpgradeModal = true; showProfileMenu = false; closeMobileSidebar(); }}
                    class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
                  >
                    <Icon src={Star} class="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
                    <span>Upgrade Plan</span>
                  </button>
                {/if}

                <a
                  href="https://github.com/anthropics/claude-code/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center gap-3 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 hover:from-purple-100 hover:via-pink-100 hover:to-orange-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 dark:hover:from-purple-900/30 dark:hover:via-pink-900/30 dark:hover:to-orange-900/30 transition-colors border-y border-gray-100 dark:border-gray-700"
                >
                  <Icon src={ChatBubbleLeftRight} class="w-[18px] h-[18px] text-purple-600 dark:text-purple-400" />
                  <span class="font-medium bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
                    Give Feedback
                  </span>
                </a>

                <button
                  onclick={handleLogout}
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <Icon src={ArrowRightOnRectangle} class="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
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
  <div class="hidden md:fixed md:left-0 md:top-0 md:h-full md:w-56 md:border-r md:border-gray-200 dark:md:border-gray-800 md:bg-white dark:md:bg-dark-bg md:flex md:flex-col">
    <!-- Logo -->
    <div class="px-6 py-6 border-b border-gray-200 dark:border-gray-700">
      <a href="/app" class="text-lg tracking-tight font-medium dark:text-white flex items-end gap-2">
        <div class="w-12 h-7" style="background: #F58121; image-rendering: pixelated;"></div>
        <span>inv</span>
      </a>
    </div>

    <!-- Nav + bottom items container (no overflow on parent) -->
    <div class="flex-1 flex flex-col">
      <!-- Scrollable nav section only -->
      <nav class="px-3 py-4 space-y-0.5 overflow-y-auto flex-1">
        {#each navItems as item}
          <a
            href={item.href}
            class="block px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors rounded {
              (item.exact ? $page.url.pathname === item.href : $page.url.pathname.startsWith(item.href))
                ? 'text-black dark:text-white font-medium bg-gray-50 dark:bg-dark-input' : 'text-gray-600 dark:text-gray-300'
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
        <div class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors rounded cursor-pointer">
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
          class="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors rounded"
        >
          <Icon src={ChatBubbleLeftRight} class="w-[16px] h-[16px]" />
          <span>Feedback</span>
        </a>
      </div>
    </div>

    <!-- Profile section with popup -->
    <div class="flex-shrink-0 relative profile-menu-container border-t border-gray-200 dark:border-gray-700">
      <!-- Profile button -->
      <button
        onclick={toggleProfileMenu}
        class="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-dark-hover transition-colors"
      >
        <!-- Avatar circle -->
        <div class="w-8 h-8 rounded-full bg-black dark:bg-gray-700 text-white dark:text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
          {getInitials(data.session?.user?.email)}
        </div>

        <!-- User info -->
        <div class="flex-1 min-w-0 text-left">
          <div class="text-sm font-medium truncate dark:text-white">
            {data.session?.user?.email?.split('@')[0] || 'User'}
          </div>
          <div class="text-xs text-gray-500 dark:text-gray-400">
            {subscriptionPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
          </div>
        </div>
      </button>

      <!-- Popup menu (appears above) -->
      {#if showProfileMenu}
        <div class="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-dark-input border border-gray-200 dark:border-gray-700 shadow-lg">
          <!-- User info header (non-clickable) -->
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div class="text-sm font-medium truncate dark:text-white">
              {data.session?.user?.email?.split('@')[0] || 'User'}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {data.session?.user?.email || ''}
            </div>
          </div>

          <!-- Menu items -->
          <div class="py-1">
            <!-- Settings -->
            <a
              href="/app/settings"
              onclick={() => showProfileMenu = false}
              class="flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
            >
              <Icon src={Cog6Tooth} class="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
              <span>Settings</span>
            </a>

            <!-- Theme Switcher -->
            <button
              onclick={() => { cycleTheme(); }}
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
            >
              <Icon src={themeIcon} class="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
              <span>{themeLabel}</span>
            </button>

            <!-- Upgrade Plan (only show for free users) -->
            {#if subscriptionPlan === 'free'}
              <button
                onclick={() => { showUpgradeModal = true; showProfileMenu = false; }}
                class="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white"
              >
                <Icon src={Star} class="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
                <span>Upgrade Plan</span>
              </button>
            {/if}

            <!-- Give Feedback (highlighted) -->
            <a
              href="https://github.com/anthropics/claude-code/issues"
              target="_blank"
              rel="noopener noreferrer"
              class="flex items-center gap-3 px-4 py-2.5 text-sm bg-gradient-to-r from-purple-50 via-pink-50 to-orange-50 hover:from-purple-100 hover:via-pink-100 hover:to-orange-100 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20 dark:hover:from-purple-900/30 dark:hover:via-pink-900/30 dark:hover:to-orange-900/30 transition-colors border-y border-gray-100 dark:border-gray-700"
            >
              <Icon src={ChatBubbleLeftRight} class="w-[18px] h-[18px] text-purple-600 dark:text-purple-400" />
              <span class="font-medium bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 bg-clip-text text-transparent">
                Give Feedback
              </span>
            </a>

            <!-- Sign out -->
            <button
              onclick={handleLogout}
              class="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              <Icon src={ArrowRightOnRectangle} class="w-[18px] h-[18px] text-gray-600 dark:text-gray-400" />
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