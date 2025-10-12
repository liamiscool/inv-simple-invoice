<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let deletingId: string | null = $state(null);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Templates - inv</title>
</svelte:head>

<div class="max-w-6xl space-y-8">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 class="text-base font-medium mb-1">Templates</h1>
      <p class="text-xs text-gray-500">
        Manage your invoice templates and design layouts
      </p>
    </div>

    <div class="flex items-center gap-3">
      <a
        href="/app/settings"
        class="px-4 py-1.5 border border-gray-300 text-xs hover:bg-gray-50 transition-colors duration-75"
      >
        Manage Custom Fields
      </a>
      <a
        href="/app/templates/upload"
        class="px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75"
      >
        Upload Custom Template
      </a>
    </div>
  </div>

  {#if data.templates?.length === 0}
    <!-- Empty state -->
    <div class="py-16 text-center">
      <div class="space-y-4">
        <h2 class="text-sm font-medium">No templates available</h2>
        <p class="text-xs text-gray-500 max-w-sm mx-auto">
          Templates should be automatically created. Please refresh the page or contact support.
        </p>
      </div>
    </div>
  {:else}
    <!-- Separate custom and curated templates -->
    {@const customTemplates = data.templates?.filter(t => t.kind === 'custom') || []}
    {@const curatedTemplates = data.templates?.filter(t => t.kind === 'curated') || []}

    <!-- Custom Templates Section -->
    {#if customTemplates.length > 0}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <h2 class="text-sm font-medium">My Custom Templates</h2>
          <span class="text-xs text-gray-500">{customTemplates.length} template{customTemplates.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each customTemplates as template}
            <div class="border border-gray-200 hover:border-gray-400 transition-colors p-4 group">
              <a href="/app/templates/{template.id}/map" class="block">
                <div class="flex items-start justify-between mb-2">
                  <div>
                    <h3 class="text-sm font-medium mb-0.5 group-hover:text-black transition-colors">{template.title}</h3>
                    <span class="text-xs text-green-600">Custom template</span>
                  </div>
                </div>

                {#if template.spec?.meta?.description}
                  <p class="text-xs text-gray-500 mb-3">
                    {template.spec.meta.description}
                  </p>
                {/if}
              </a>

              <div class="flex items-center gap-3 text-xs pt-3 border-t border-gray-100">
                <a
                  href="/app/templates/{template.id}/map"
                  class="text-gray-500 hover:text-black transition-colors"
                >
                  Edit Mapping
                </a>
                <form method="POST" action="?/delete" use:enhance={() => {
                  deletingId = template.id;
                  return async ({ update }) => {
                    await update();
                    deletingId = null;
                  };
                }}>
                  <input type="hidden" name="id" value={template.id} />
                  <button
                    type="submit"
                    disabled={deletingId === template.id}
                    class="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {deletingId === template.id ? 'Deleting...' : 'Delete'}
                  </button>
                </form>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}

    <!-- Built-in Templates Section -->
    {#if curatedTemplates.length > 0}
      <div class="space-y-5">
        <div class="flex items-center justify-between pb-3 border-b border-gray-200">
          <h2 class="text-sm font-medium">Built-in Templates</h2>
          <span class="text-xs text-gray-500">{curatedTemplates.length} template{curatedTemplates.length !== 1 ? 's' : ''}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each curatedTemplates as template}
            <div class="border border-gray-200 p-4">
              <div class="flex items-start justify-between mb-2">
                <div>
                  <h3 class="text-sm font-medium mb-0.5">{template.title}</h3>
                  <span class="text-xs text-blue-600">Built-in template</span>
                </div>
              </div>

              {#if template.spec?.meta?.description}
                <p class="text-xs text-gray-500">
                  {template.spec.meta.description}
                </p>
              {/if}
            </div>
          {/each}
        </div>
      </div>
    {/if}
    
    <!-- Template usage info -->
    <div class="border border-thin rounded-sm p-6 bg-gray-50">
      <h3 class="text-xs font-medium mb-3">How Templates Work</h3>
      <div class="space-y-2 text-xs text-gray-600">
        <p>• <strong>Built-in templates</strong> are curated designs optimized for professional invoices</p>
        <p>• <strong>Custom templates</strong> allow you to upload your own PDF or image designs (Phase 9)</p>
        <p>• Templates control the exact positioning of invoice elements like company info, line items, and totals</p>
        <p>• You can select different templates when creating new invoices</p>
      </div>
    </div>
  {/if}
</div>