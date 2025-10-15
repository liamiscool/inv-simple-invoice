<script lang="ts">
  import { onMount } from 'svelte';

  let { onClose }: { onClose: () => void } = $props();

  let changelogEntries = $state<any[]>([]);
  let loading = $state(true);
  let error = $state('');

  onMount(async () => {
    try {
      const response = await fetch('/api/changelog');
      if (!response.ok) throw new Error('Failed to load changelog');

      const data = await response.json();
      changelogEntries = data.entries;

      // Mark as seen
      localStorage.setItem('lastSeenChangelog', new Date().toISOString());
    } catch (err: any) {
      error = err.message || 'Failed to load changelog';
    } finally {
      loading = false;
    }
  });

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
</script>

<!-- Dropdown -->
<div class="absolute left-full ml-2 bottom-0 w-[480px] bg-white border border-gray-200 shadow-lg max-h-[600px] overflow-y-auto z-50">
  <!-- Header -->
  <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
    <div class="text-base font-medium">What's New</div>
    <button
      onclick={onClose}
      class="text-gray-500 hover:text-black transition-colors text-sm"
    >
      ✕
    </button>
  </div>

  <!-- Content -->
  <div class="p-6">
    {#if loading}
      <div class="text-center py-12 text-sm text-gray-500">
        Loading updates...
      </div>
    {:else if error}
      <div class="text-center py-12 text-sm text-red-600">
        {error}
      </div>
    {:else if changelogEntries.length === 0}
      <div class="text-center py-12 text-sm text-gray-500">
        No updates yet
      </div>
    {:else}
      <div class="space-y-6">
        {#each changelogEntries as entry}
          <div class="pb-6 border-b border-gray-100 last:border-0">
            <!-- Version & Date -->
            <div class="flex items-baseline gap-3 mb-4">
              {#if entry.version}
                <div class="text-base font-medium text-black">v{entry.version}</div>
              {/if}
              <div class="text-sm text-gray-400">{formatDate(entry.date)}</div>
            </div>

            <!-- Changes -->
            {#if entry.added && entry.added.length > 0}
              <div class="mb-4">
                <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Added</div>
                <ul class="space-y-2">
                  {#each entry.added as item}
                    <li class="text-sm text-gray-900 leading-relaxed">• {item}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if entry.changed && entry.changed.length > 0}
              <div class="mb-4">
                <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Changed</div>
                <ul class="space-y-2">
                  {#each entry.changed as item}
                    <li class="text-sm text-gray-900 leading-relaxed">• {item}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if entry.fixed && entry.fixed.length > 0}
              <div class="mb-4">
                <div class="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Fixed</div>
                <ul class="space-y-2">
                  {#each entry.fixed as item}
                    <li class="text-sm text-gray-900 leading-relaxed">• {item}</li>
                  {/each}
                </ul>
              </div>
            {/if}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
