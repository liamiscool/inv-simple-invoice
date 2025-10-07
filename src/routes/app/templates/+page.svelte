<script lang="ts">
  import type { PageData } from './$types';
  
  let { data }: { data: PageData } = $props();
  
  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }
</script>

<svelte:head>
  <title>Templates - inv</title>
</svelte:head>

<div class="max-w-6xl space-y-6">
  <!-- Header -->
  <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
    <div>
      <h1 class="text-sm mb-2">Templates</h1>
      <p class="text-xs text-gray-600">
        Manage your invoice templates and design layouts
      </p>
    </div>
    
    <div class="flex items-center gap-3">
      <button
        disabled
        class="px-4 py-2 border border-thin text-xs text-gray-400 cursor-not-allowed"
      >
        Upload Custom Template
      </button>
      <span class="text-xs text-gray-500">(Coming in Phase 9)</span>
    </div>
  </div>

  {#if data.templates?.length === 0}
    <!-- Empty state -->
    <div class="border border-thin rounded-sm p-8 text-center">
      <div class="space-y-3">
        <h2 class="text-xs">No templates available</h2>
        <p class="text-xs text-gray-600 max-w-sm mx-auto">
          Templates should be automatically created. Please refresh the page or contact support.
        </p>
      </div>
    </div>
  {:else}
    <!-- Templates grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {#each data.templates || [] as template}
        <div class="border border-thin rounded-sm p-6 space-y-4">
          <!-- Template header -->
          <div class="flex items-start justify-between">
            <div>
              <h3 class="text-xs font-medium mb-1">{template.title}</h3>
              <span class="inline-flex px-2 py-0.5 rounded-sm text-xs {template.kind === 'curated' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}">
                {template.kind === 'curated' ? 'Built-in' : 'Custom'}
              </span>
            </div>
          </div>
          
          <!-- Template description -->
          {#if template.spec?.meta?.description}
            <p class="text-xs text-gray-600">
              {template.spec.meta.description}
            </p>
          {/if}
          
          <!-- Template specs -->
          <div class="space-y-2 text-xs text-gray-600">
            {#if template.spec?.meta}
              <div class="flex justify-between">
                <span>Page Size:</span>
                <span>{template.spec.meta.width}×{template.spec.meta.height}mm</span>
              </div>
              <div class="flex justify-between">
                <span>Resolution:</span>
                <span>{template.spec.meta.dpi} DPI</span>
              </div>
            {/if}
            {#if template.spec?.styles?.fonts?.primary}
              <div class="flex justify-between">
                <span>Font:</span>
                <span class="truncate ml-2">{template.spec.styles.fonts.primary}</span>
              </div>
            {/if}
          </div>
          
          <!-- Template preview -->
          <div class="border border-thin rounded-sm p-4 bg-gray-50 min-h-[120px] flex items-center justify-center">
            <div class="text-center">
              <div class="text-xs text-gray-500 mb-2">Template Preview</div>
              <div class="text-xs text-gray-400">
                Preview generation coming soon
              </div>
            </div>
          </div>
          
          <!-- Actions -->
          <div class="flex items-center justify-between pt-2 border-t border-thin">
            <div class="text-xs text-gray-500">
              Created {formatDate(template.created_at)}
            </div>
            
            <div class="flex items-center gap-2">
              {#if template.kind === 'custom'}
                <button
                  disabled
                  class="px-3 py-1 text-xs text-gray-400 cursor-not-allowed"
                >
                  Edit
                </button>
                <button
                  disabled
                  class="px-3 py-1 text-xs text-gray-400 cursor-not-allowed"
                >
                  Delete
                </button>
              {:else}
                <span class="text-xs text-gray-500">Built-in template</span>
              {/if}
            </div>
          </div>
        </div>
      {/each}
    </div>
    
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