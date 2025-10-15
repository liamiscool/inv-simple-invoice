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
<div class="absolute bottom-full left-0 mb-2 w-80 bg-white border border-gray-200 shadow-lg max-h-96 overflow-y-auto">
  <!-- Header -->
  <div class="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
    <div class="text-sm font-medium">What's New</div>
    <button
      onclick={onClose}
      class="text-gray-500 hover:text-black transition-colors text-xs"
    >
      Close
    </button>
  </div>

  <!-- Content -->
  <div class="p-4">
    {#if loading}
      <div class="text-center py-8 text-sm text-gray-500">
        Loading updates...
      </div>
    {:else if error}
      <div class="text-center py-8 text-sm text-red-600">
        {error}
      </div>
    {:else if changelogEntries.length === 0}
      <div class="text-center py-8 text-sm text-gray-500">
        No updates yet
      </div>
    {:else}
      <div class="space-y-6">
        {#each changelogEntries as entry}
          <div class="border-l-2 border-black pl-4">
            <!-- Version & Date -->
            <div class="flex items-baseline gap-2 mb-2">
              {#if entry.version}
                <div class="text-sm font-medium">{entry.version}</div>
              {/if}
              <div class="text-xs text-gray-500">{formatDate(entry.date)}</div>
            </div>

            <!-- Changes -->
            {#if entry.added && entry.added.length > 0}
              <div class="mb-2">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Added</div>
                <ul class="text-sm space-y-1">
                  {#each entry.added as item}
                    <li class="text-gray-700">• {item}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if entry.changed && entry.changed.length > 0}
              <div class="mb-2">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Changed</div>
                <ul class="text-sm space-y-1">
                  {#each entry.changed as item}
                    <li class="text-gray-700">• {item}</li>
                  {/each}
                </ul>
              </div>
            {/if}

            {#if entry.fixed && entry.fixed.length > 0}
              <div class="mb-2">
                <div class="text-xs text-gray-500 uppercase tracking-wider mb-1">Fixed</div>
                <ul class="text-sm space-y-1">
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

  <!-- Footer -->
  <div class="sticky bottom-0 bg-white border-t border-gray-200 px-4 py-3">
    <a
      href="https://github.com/yourusername/inv_simple_invoice/blob/main/CHANGELOG.md"
      target="_blank"
      rel="noopener noreferrer"
      class="text-sm text-gray-600 hover:text-black transition-colors"
    >
      View full changelog →
    </a>
  </div>
</div>
