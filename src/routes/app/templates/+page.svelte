<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();
  let deletingId: string | null = $state(null);
  let previewingTemplate: any | null = $state(null);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  function openPreview(template: any) {
    previewingTemplate = template;
  }

  function closePreview() {
    previewingTemplate = null;
  }

  function getPreviewFont(template: any): string {
    const fontFamily = template.spec?.styles?.fonts?.primary || 'JetBrains Mono, monospace';
    return fontFamily;
  }

  function getPreviewColors(template: any) {
    return {
      primary: template.spec?.styles?.colors?.primary || '#000000',
      secondary: template.spec?.styles?.colors?.secondary || '#666666',
      accent: template.spec?.styles?.colors?.accent || '#000000'
    };
  }

  function getTitleSize(template: any): number {
    return template.spec?.styles?.sizes?.title || 18;
  }

  function getDefaultSize(template: any): number {
    return template.spec?.styles?.sizes?.default || 10;
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
      {#if import.meta.env.DEV}
        <a
          href="/app/templates/upload"
          class="px-4 py-1.5 bg-black text-white text-xs hover:bg-gray-800 transition-colors duration-75"
        >
          Upload Custom Template
        </a>
      {:else}
        <div
          class="px-4 py-1.5 bg-gray-400 text-white text-xs cursor-not-allowed relative group"
          title="Coming soon"
        >
          Upload Custom Template
          <div class="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
            Coming soon
          </div>
        </div>
      {/if}
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
            {@const colors = getPreviewColors(template)}
            {@const titleSize = getTitleSize(template)}
            {@const borderWidth = template.spec?.areas?.items_table?.border_width || 0.5}
            {@const hasHeaderBg = template.spec?.areas?.items_table?.header_bg}
            {@const margins = template.spec?.meta?.margins || { top: 20, right: 20, bottom: 20, left: 20 }}
            <div class="border border-gray-200 hover:border-gray-400 transition-colors group cursor-pointer">
              <!-- Preview Card -->
              <button
                onclick={() => openPreview(template)}
                class="w-full text-left"
              >
                <!-- Mini preview visualization -->
                <div class="h-56 bg-white border-b border-gray-200 flex flex-col justify-between overflow-hidden"
                     style="font-family: {getPreviewFont(template)}; padding: {margins.top * 0.15}px {margins.right * 0.15}px {margins.bottom * 0.15}px {margins.left * 0.15}px;">
                  <div>
                    <!-- Invoice title - scaled based on template -->
                    <div class="font-bold mb-0.5"
                         style="color: {colors.primary}; font-size: {titleSize * 0.35}px; font-weight: {template.title === 'Bold' ? '700' : '600'}">
                      INVOICE
                    </div>
                    <div class="mb-2" style="color: {colors.secondary}; font-size: {getDefaultSize(template) * 0.6}px">
                      INV-2025-0001
                    </div>
                    <div class="space-y-0.5" style="color: {colors.secondary}; font-size: {getDefaultSize(template) * 0.55}px">
                      <div style="font-weight: {template.title === 'Elegant' ? '500' : '400'}">Your Company Inc.</div>
                      <div>123 Main Street</div>
                    </div>
                  </div>

                  <!-- Items table preview -->
                  <div class="space-y-0.5 my-2">
                    <!-- Table header -->
                    <div class="flex text-[6px] py-0.5 {hasHeaderBg ? 'px-1' : ''}"
                         style="border-bottom-width: {borderWidth}px; border-color: {colors.secondary}{borderWidth > 1 ? '50' : '30'}; {hasHeaderBg ? `background-color: ${hasHeaderBg}` : ''}; font-weight: {template.title === 'Bold' ? '600' : '500'}; color: {colors.primary}">
                      <div class="flex-1">Item</div>
                      <div class="w-8 text-center">Qty</div>
                      <div class="w-14 text-right">Total</div>
                    </div>
                    <!-- Rows -->
                    <div class="flex text-[6px] py-0.5" style="color: {colors.secondary}; border-bottom-width: {borderWidth * 0.8}px; border-color: {colors.secondary}20">
                      <div class="flex-1">Design Services</div>
                      <div class="w-8 text-center">1</div>
                      <div class="w-14 text-right" style="color: {colors.primary}">$5,000</div>
                    </div>
                    <div class="flex text-[6px] py-0.5" style="color: {colors.secondary}; border-bottom-width: {borderWidth * 0.8}px; border-color: {colors.secondary}20">
                      <div class="flex-1">Development</div>
                      <div class="w-8 text-center">40</div>
                      <div class="w-14 text-right" style="color: {colors.primary}">$6,000</div>
                    </div>
                  </div>

                  <!-- Total -->
                  <div class="flex justify-end pt-1"
                       style="border-top-width: {borderWidth * 1.5}px; border-color: {colors.secondary}{borderWidth > 1 ? '60' : '40'}">
                    <div class="text-right">
                      <div class="text-[6px] mb-0.5" style="color: {colors.secondary}">
                        <div class="flex justify-between gap-4">
                          <span>Subtotal</span>
                          <span>$11,000</span>
                        </div>
                      </div>
                      <div class="font-bold" style="color: {colors.primary}; font-size: {(titleSize * 0.45)}px">
                        $12,100
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Template info -->
                <div class="p-4">
                  <div class="flex items-start justify-between mb-2">
                    <div>
                      <h3 class="text-sm font-medium mb-0.5 group-hover:text-black transition-colors">{template.title}</h3>
                      <span class="text-xs text-blue-600">Built-in template</span>
                    </div>
                  </div>

                  {#if template.spec?.meta?.description}
                    <p class="text-xs text-gray-500">
                      {template.spec.meta.description}
                    </p>
                  {/if}
                </div>
              </button>
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

<!-- Preview Modal -->
{#if previewingTemplate}
  {@const colors = getPreviewColors(previewingTemplate)}
  {@const titleSize = getTitleSize(previewingTemplate)}
  {@const defaultSize = getDefaultSize(previewingTemplate)}
  {@const borderWidth = previewingTemplate.spec?.areas?.items_table?.border_width || 0.5}
  {@const hasHeaderBg = previewingTemplate.spec?.areas?.items_table?.header_bg}
  {@const margins = previewingTemplate.spec?.meta?.margins || { top: 20, right: 20, bottom: 20, left: 20 }}
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
    onclick={closePreview}
  >
    <div
      class="bg-white border border-gray-300 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Modal Header -->
      <div class="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div>
          <h2 class="text-base font-medium">{previewingTemplate.title}</h2>
          <p class="text-xs text-gray-500 mt-0.5">
            {previewingTemplate.spec?.meta?.description || 'Template preview'}
          </p>
        </div>
        <button
          onclick={closePreview}
          class="text-gray-500 hover:text-black text-xl leading-none w-6 h-6"
        >
          ×
        </button>
      </div>

      <!-- Template Preview -->
      <div class="p-8 bg-gray-50">
        <div
          class="bg-white shadow-lg mx-auto aspect-[210/297]"
          style="font-family: {getPreviewFont(previewingTemplate)}; max-width: 600px; padding: {margins.top * 1.5}px {margins.right * 1.5}px {margins.bottom * 1.5}px {margins.left * 1.5}px;"
        >
          <!-- Invoice Header -->
          <div class="flex justify-between items-start mb-8">
            <div>
              <h1 class="font-bold mb-1" style="color: {colors.primary}; font-size: {titleSize * 1.2}px; font-weight: {previewingTemplate.title === 'Bold' ? '700' : '600'}">INVOICE</h1>
              <p style="color: {colors.secondary}; font-size: {defaultSize * 1.1}px">INV-2025-0001</p>
            </div>
            <div class="text-right" style="color: {colors.secondary}; font-size: {defaultSize * 0.9}px">
              <p>Issue: Jan 15, 2025</p>
              <p>Due: Feb 15, 2025</p>
            </div>
          </div>

          <!-- Company & Client Info -->
          <div class="grid grid-cols-2 gap-8 mb-10">
            <div style="color: {colors.secondary}; font-size: {defaultSize * 0.9}px">
              <p class="mb-1" style="color: {colors.primary}; font-weight: {previewingTemplate.title === 'Elegant' ? '600' : '500'}">From</p>
              <p>Your Company Inc.</p>
              <p>123 Main Street</p>
              <p>San Francisco, CA 94102</p>
            </div>
            <div style="color: {colors.secondary}; font-size: {defaultSize * 0.9}px">
              <p class="mb-1" style="color: {colors.primary}; font-weight: {previewingTemplate.title === 'Elegant' ? '600' : '500'}">Bill To</p>
              <p style="color: {colors.primary}; font-weight: {previewingTemplate.title === 'Bold' ? '600' : '500'}">Client Name</p>
              <p>Acme Corporation</p>
              <p>client@example.com</p>
            </div>
          </div>

          <!-- Items Table -->
          <div class="mb-8">
            <table class="w-full" style="font-size: {defaultSize}px">
              <thead>
                <tr style="border-bottom-width: {borderWidth * 2}px; border-color: {colors.secondary}{borderWidth > 1 ? '50' : '40'}; {hasHeaderBg ? `background-color: ${hasHeaderBg}` : ''}">
                  <th class="text-left py-2 {hasHeaderBg ? 'px-2' : ''}" style="color: {colors.primary}; font-weight: {previewingTemplate.title === 'Bold' ? '600' : '500'}">Description</th>
                  <th class="text-center py-2 w-16 {hasHeaderBg ? 'px-2' : ''}" style="color: {colors.primary}; font-weight: {previewingTemplate.title === 'Bold' ? '600' : '500'}">Qty</th>
                  <th class="text-right py-2 w-24 {hasHeaderBg ? 'px-2' : ''}" style="color: {colors.primary}; font-weight: {previewingTemplate.title === 'Bold' ? '600' : '500'}">Rate</th>
                  <th class="text-right py-2 w-24 {hasHeaderBg ? 'px-2' : ''}" style="color: {colors.primary}; font-weight: {previewingTemplate.title === 'Bold' ? '600' : '500'}">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr style="border-bottom-width: {borderWidth}px; border-color: {colors.secondary}20">
                  <td class="py-3" style="color: {colors.secondary}">Brand Identity Design</td>
                  <td class="text-center py-3" style="color: {colors.secondary}">1</td>
                  <td class="text-right py-3" style="color: {colors.secondary}">$5,000.00</td>
                  <td class="text-right py-3" style="color: {colors.primary}">$5,000.00</td>
                </tr>
                <tr style="border-bottom-width: {borderWidth}px; border-color: {colors.secondary}20">
                  <td class="py-3" style="color: {colors.secondary}">Web Development</td>
                  <td class="text-center py-3" style="color: {colors.secondary}">40</td>
                  <td class="text-right py-3" style="color: {colors.secondary}">$150.00</td>
                  <td class="text-right py-3" style="color: {colors.primary}">$6,000.00</td>
                </tr>
                <tr style="border-bottom-width: {borderWidth}px; border-color: {colors.secondary}20">
                  <td class="py-3" style="color: {colors.secondary}">Consulting Services</td>
                  <td class="text-center py-3" style="color: {colors.secondary}">10</td>
                  <td class="text-right py-3" style="color: {colors.secondary}">$200.00</td>
                  <td class="text-right py-3" style="color: {colors.primary}">$2,000.00</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Totals -->
          <div class="flex justify-end mb-10">
            <div class="w-64" style="font-size: {defaultSize}px">
              <div class="flex justify-between py-2" style="color: {colors.secondary}">
                <span>Subtotal</span>
                <span>$13,000.00</span>
              </div>
              <div class="flex justify-between py-2" style="color: {colors.secondary}">
                <span>Tax (10%)</span>
                <span>$1,300.00</span>
              </div>
              <div class="flex justify-between py-3 font-bold" style="color: {colors.primary}; border-top-width: {borderWidth * 2}px; border-color: {colors.secondary}{borderWidth > 1 ? '60' : '40'}; font-size: {defaultSize * 1.4}px">
                <span>Total</span>
                <span>$14,300.00</span>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div style="color: {colors.secondary}; font-size: {defaultSize * 0.8}px">
            <p class="mb-2">Payment is due within 30 days. Please make checks payable to Your Company Inc.</p>
            <p>Thank you for your business!</p>
          </div>
        </div>
      </div>

      <!-- Modal Footer -->
      <div class="border-t border-gray-200 p-4 flex justify-end gap-3">
        <button
          onclick={closePreview}
          class="px-4 py-1.5 border border-gray-300 text-xs hover:bg-gray-50 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
{/if}