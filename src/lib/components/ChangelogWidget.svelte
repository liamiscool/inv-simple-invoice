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

<!-- Backdrop -->
<div class="fixed inset-0 bg-black/20 z-40" onclick={onClose}></div>

<!-- Dropdown -->
<div class="fixed left-[280px] bottom-[120px] w-[480px] bg-white border border-gray-200 shadow-xl max-h-[600px] overflow-y-auto z-50">
  <!-- Header -->
  <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
    <div class="text-base font-medium">What's New</div>
    <button
      onclick={onClose}
      class="text-gray-500 hover:text-black transition-colors text-sm"
    >
      Close
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
      <div class="space-y-8">
        {#each changelogEntries as entry}
          <div class="border-l-2 border-black pl-6">
            <!-- Version & Date -->
            <div class="flex items-baseline gap-3 mb-3">
              {#if entry.version}
                <div class="text-base font-medium">{entry.version}</div>
              {/if}
              <div class="text-sm text-gray-500">{formatDate(entry.date)}</div>
            </div>

            <!-- Changes -->
            {#if entry.added && entry.added.length > 0}
              <div class="mb-3">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Added</div>
                <ul class="text-sm space-y-1.5">
                  {#each entry.added as item}
                    <li class="text-gray-700">• {item}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if entry.changed && entry.changed.length > 0}
              <div class="mb-3">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Changed</div>
                <ul class="text-sm space-y-1.5">
                  {#each entry.changed as item}
                    <li class="text-gray-700">• {item}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if entry.fixed && entry.fixed.length > 0}
              <div class="mb-3">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-2">Fixed</div>
                <ul class="text-sm space-y-1.5">
                  {#each entry.fixed as item}
                    <li class="text-gray-700">• {item}</li>
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
