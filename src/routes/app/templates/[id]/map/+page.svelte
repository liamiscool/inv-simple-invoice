<script lang="ts">
  import { enhance } from '$app/forms';
  import type { PageData } from './$types';
  import type { AreaSpec, TableSpec, TemplateSpec } from '$lib/templates';

  let { data }: { data: PageData } = $props();

  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let bgImage: HTMLImageElement;
  let saving = $state(false);

  // Template spec being edited
  let spec = $state<TemplateSpec>(structuredClone(data.template.spec));

  // Debug logging
  console.log('=== MAP PAGE DEBUG ===');
  console.log('Full template:', data.template);
  console.log('Template spec:', spec);
  console.log('Background image URL:', spec.meta?.background_image_url);
  console.log('====================');

  // UI state
  let selectedArea: string | null = $state(null);
  let isDragging = $state(false);
  let dragStart = $state({ x: 0, y: 0 });
  let scale = $state(1); // Canvas zoom/scale factor
  let imageLoaded = $state(false);
  let imageError = $state<string | null>(null);

  // Area definitions
  const areaDefinitions = {
    invoice_title: { label: 'Invoice Title', type: 'text' },
    invoice_number: { label: 'Invoice Number', type: 'text' },
    issue_date: { label: 'Issue Date', type: 'text' },
    due_date: { label: 'Due Date', type: 'text' },
    company_info: { label: 'Company Info', type: 'multiline' },
    client_name: { label: 'Client Name', type: 'text' },
    client_company: { label: 'Client Company', type: 'text' },
    client_email: { label: 'Client Email', type: 'text' },
    items_table: { label: 'Line Items Table', type: 'table', required: true },
    subtotal: { label: 'Subtotal', type: 'text' },
    tax_total: { label: 'Tax Total', type: 'text' },
    grand_total: { label: 'Grand Total', type: 'text', required: true },
    notes: { label: 'Notes', type: 'multiline' },
    payment_info: { label: 'Payment Info', type: 'multiline' }
  };

  // Load background image
  $effect(() => {
    console.log('Effect running - canvas:', !!canvas, 'url:', spec.meta?.background_image_url);

    if (!spec.meta?.background_image_url) {
      console.error('No background_image_url in template spec');
      imageError = 'Template has no background image URL';
      return;
    }

    if (!canvas) {
      console.log('Canvas not ready yet, waiting...');
      return;
    }

    console.log('Loading image from:', spec.meta.background_image_url);
    ctx = canvas.getContext('2d')!;
    bgImage = new Image();
    bgImage.crossOrigin = 'anonymous';

    bgImage.onload = () => {
      console.log('Image loaded successfully:', bgImage.width, 'x', bgImage.height);
      // Set canvas size to match image
      canvas.width = bgImage.width;
      canvas.height = bgImage.height;
      scale = Math.min(800 / bgImage.width, 600 / bgImage.height);
      imageLoaded = true;
      redraw();
    };

    bgImage.onerror = (e) => {
      console.error('Image failed to load:', e);
      console.error('Image URL:', spec.meta.background_image_url);
      imageError = `Failed to load image from: ${spec.meta.background_image_url}. Check if the storage bucket is public and the URL is accessible.`;
    };

    bgImage.src = spec.meta.background_image_url;
  });

  function mmToPx(mm: number): number {
    // Convert mm to pixels at 300 DPI
    return (mm * spec.meta.dpi) / 25.4;
  }

  function pxToMm(px: number): number {
    // Convert pixels to mm at 300 DPI
    return (px * 25.4) / spec.meta.dpi;
  }

  function redraw() {
    if (!ctx || !imageLoaded) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background image
    ctx.drawImage(bgImage, 0, 0);

    // Draw all area boxes
    Object.entries(spec.areas).forEach(([key, area]: [string, any]) => {
      if (!area || !('x' in area)) return;

      const isSelected = key === selectedArea;
      const x = mmToPx(area.x);
      const y = mmToPx(area.y);
      const w = area.w ? mmToPx(area.w) : 100;
      const h = area.h ? mmToPx(area.h) : 30;

      // Draw box
      ctx.strokeStyle = isSelected ? '#000000' : '#3b82f6';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(x, y, w, h);

      // Draw fill overlay
      ctx.fillStyle = isSelected ? 'rgba(0, 0, 0, 0.1)' : 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(x, y, w, h);

      // Draw label
      ctx.fillStyle = '#000000';
      ctx.font = '14px monospace';
      const label = areaDefinitions[key as keyof typeof areaDefinitions]?.label || key;
      ctx.fillText(label, x + 5, y - 5);
    });
  }

  function handleCanvasMouseDown(event: MouseEvent) {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    // Check if clicking on existing area
    let clickedArea: string | null = null;
    Object.entries(spec.areas).forEach(([key, area]: [string, any]) => {
      if (!area || !('x' in area)) return;

      const ax = mmToPx(area.x);
      const ay = mmToPx(area.y);
      const aw = area.w ? mmToPx(area.w) : 100;
      const ah = area.h ? mmToPx(area.h) : 30;

      if (x >= ax && x <= ax + aw && y >= ay && y <= ay + ah) {
        clickedArea = key;
      }
    });

    if (clickedArea) {
      selectedArea = clickedArea;
      redraw();
    } else {
      // Start drawing new area
      isDragging = true;
      dragStart = { x, y };
    }
  }

  function handleCanvasMouseMove(event: MouseEvent) {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    // Draw preview rectangle
    redraw();
    ctx.strokeStyle = '#22c55e';
    ctx.lineWidth = 2;
    ctx.strokeRect(
      Math.min(dragStart.x, x),
      Math.min(dragStart.y, y),
      Math.abs(x - dragStart.x),
      Math.abs(y - dragStart.y)
    );
  }

  function handleCanvasMouseUp(event: MouseEvent) {
    if (!isDragging) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    const areaX = pxToMm(Math.min(dragStart.x, x));
    const areaY = pxToMm(Math.min(dragStart.y, y));
    const areaW = pxToMm(Math.abs(x - dragStart.x));
    const areaH = pxToMm(Math.abs(y - dragStart.y));

    // Only create area if it has meaningful size
    if (areaW > 5 && areaH > 5) {
      // Prompt for area type
      const areaKey = prompt('Enter area name (e.g., invoice_number, client_name):');
      if (areaKey && areaKey in areaDefinitions) {
        // Create new area
        const newArea: AreaSpec = {
          x: areaX,
          y: areaY,
          w: areaW,
          h: areaH,
          align: 'left',
          font_size: spec.styles.sizes.default
        };

        spec.areas[areaKey as keyof typeof spec.areas] = newArea as any;
        selectedArea = areaKey;
      }
    }

    isDragging = false;
    redraw();
  }

  function updateSelectedArea(updates: Partial<AreaSpec>) {
    if (!selectedArea || !spec.areas[selectedArea as keyof typeof spec.areas]) return;

    const current: any = spec.areas[selectedArea as keyof typeof spec.areas];
    if (current && 'x' in current) {
      spec.areas[selectedArea as keyof typeof spec.areas] = {
        ...current,
        ...updates
      } as any;
      redraw();
    }
  }

  function deleteSelectedArea() {
    if (!selectedArea || areaDefinitions[selectedArea as keyof typeof areaDefinitions]?.required) {
      alert('Cannot delete required area');
      return;
    }

    delete spec.areas[selectedArea as keyof typeof spec.areas];
    selectedArea = null;
    redraw();
  }

  function handleSave() {
    const form = document.getElementById('saveForm') as HTMLFormElement;
    const input = document.getElementById('specInput') as HTMLInputElement;
    input.value = JSON.stringify(spec);
    form.requestSubmit();
  }
</script>

<svelte:head>
  <title>Map Template - {data.template.title} - inv</title>
</svelte:head>

<div class="max-w-7xl space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-lg font-medium mb-1 dark:text-white">Map Template: {data.template.title}</h1>
      <p class="text-sm text-gray-600 dark:text-gray-400">
        Define areas for dynamic invoice data by drawing boxes on your design
      </p>
    </div>

    <button
      onclick={handleSave}
      disabled={saving}
      class="px-5 py-2.5 bg-black dark:bg-dark-button text-white text-sm rounded-sm hover:bg-gray-800 dark:hover:bg-dark-button-hover disabled:bg-gray-300 dark:disabled:bg-gray-700"
    >
      {saving ? 'Saving...' : 'Save Template'}
    </button>
  </div>

  <!-- Instructions -->
  <div class="border border-gray-300 dark:border-gray-700 rounded-sm p-4 bg-blue-50 dark:bg-blue-900/30">
    <div class="text-sm space-y-1 dark:text-white">
      <div class="font-medium">How to map your template:</div>
      <ul class="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-1">
        <li>Click and drag on the canvas to draw bounding boxes for dynamic areas</li>
        <li>Click existing boxes to select and edit their properties</li>
        <li>Use the sidebar to fine-tune positioning, fonts, and colors</li>
        <li>Required areas: Line Items Table and Grand Total</li>
      </ul>
    </div>
  </div>

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Canvas -->
    <div class="lg:col-span-2 border border-gray-300 dark:border-gray-700 rounded-sm p-4 bg-white dark:bg-dark-bg">
      <div class="overflow-auto" style="max-height: 800px;">
        <!-- Canvas - always render but hide when loading/error -->
        <canvas
          bind:this={canvas}
          onmousedown={handleCanvasMouseDown}
          onmousemove={handleCanvasMouseMove}
          onmouseup={handleCanvasMouseUp}
          style="cursor: crosshair; width: {canvas?.width ? canvas.width * scale : 0}px; height: {canvas?.height ? canvas.height * scale : 0}px; display: {imageLoaded ? 'block' : 'none'};"
          class="border border-gray-200 dark:border-gray-700"
        ></canvas>

        <!-- Loading/Error States -->
        {#if imageError}
          <div class="flex flex-col items-center justify-center h-96 text-red-600 dark:text-red-400 text-sm p-4 text-center">
            <div class="mb-2 font-medium">Image Loading Error</div>
            <div class="text-gray-600 dark:text-gray-400 max-w-md">{imageError}</div>
            <div class="mt-4 text-gray-500 dark:text-gray-500 text-sm">
              Debug info: Check browser console for details
            </div>
          </div>
        {:else if !imageLoaded}
          <div class="flex items-center justify-center h-96 text-gray-400 dark:text-gray-500 text-sm">
            <div class="flex flex-col items-center gap-2">
              <div>Loading template image...</div>
              <div class="text-sm text-gray-500 dark:text-gray-500">URL: {spec.meta?.background_image_url || 'No URL set'}</div>
            </div>
          </div>
        {/if}
      </div>
    </div>

    <!-- Sidebar -->
    <div class="space-y-4">
      <!-- Area Selector -->
      <div class="border border-gray-300 dark:border-gray-700 rounded-sm p-4 space-y-3 bg-white dark:bg-dark-bg">
        <div class="text-sm font-medium dark:text-white">Areas</div>
        <div class="space-y-2">
          {#each Object.entries(areaDefinitions) as [key, def]}
            {@const exists = key in spec.areas}
            {@const isSelected = selectedArea === key}
            <button
              onclick={() => { selectedArea = key; redraw(); }}
              class="w-full text-left px-3 py-2 text-sm rounded-sm border transition-colors {isSelected ? 'border-black dark:border-white bg-gray-50 dark:bg-dark-input' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'} {!exists && 'text-gray-400 dark:text-gray-600'} dark:text-white"
            >
              <div class="flex items-center justify-between">
                <span>{def.label}</span>
                {#if def.required}
                  <span class="text-red-500 dark:text-red-400">*</span>
                {:else if exists}
                  <span class="text-green-600 dark:text-green-400">✓</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>
      </div>

      <!-- Area Properties -->
      {#if selectedArea && spec.areas[selectedArea as keyof typeof spec.areas]}
        {@const area = spec.areas[selectedArea as keyof typeof spec.areas] as AreaSpec}
        <div class="border border-gray-300 dark:border-gray-700 rounded-sm p-4 space-y-4 bg-white dark:bg-dark-bg">
          <div class="flex items-center justify-between">
            <div class="text-sm font-medium dark:text-white">
              {areaDefinitions[selectedArea as keyof typeof areaDefinitions]?.label}
            </div>
            {#if !areaDefinitions[selectedArea as keyof typeof areaDefinitions]?.required}
              <button
                onclick={deleteSelectedArea}
                class="text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
              >
                Delete
              </button>
            {/if}
          </div>

          <div class="space-y-3 text-sm">
            <!-- Position -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">X (mm)</label>
                <input
                  type="number"
                  value={area.x?.toFixed(1)}
                  onchange={(e) => updateSelectedArea({ x: parseFloat(e.currentTarget.value) })}
                  class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-dark-input dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Y (mm)</label>
                <input
                  type="number"
                  value={area.y?.toFixed(1)}
                  onchange={(e) => updateSelectedArea({ y: parseFloat(e.currentTarget.value) })}
                  class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-dark-input dark:text-white"
                />
              </div>
            </div>

            <!-- Dimensions -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Width (mm)</label>
                <input
                  type="number"
                  value={area.w?.toFixed(1) || ''}
                  onchange={(e) => updateSelectedArea({ w: parseFloat(e.currentTarget.value) })}
                  class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-dark-input dark:text-white"
                />
              </div>
              <div>
                <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Height (mm)</label>
                <input
                  type="number"
                  value={area.h?.toFixed(1) || ''}
                  onchange={(e) => updateSelectedArea({ h: parseFloat(e.currentTarget.value) })}
                  class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-dark-input dark:text-white"
                />
              </div>
            </div>

            <!-- Alignment -->
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Alignment</label>
              <select
                value={area.align || 'left'}
                onchange={(e) => updateSelectedArea({ align: e.currentTarget.value as any })}
                class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-dark-input dark:text-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>

            <!-- Font Size -->
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Font Size (pt)</label>
              <input
                type="number"
                value={area.font_size || spec.styles.sizes.default}
                onchange={(e) => updateSelectedArea({ font_size: parseFloat(e.currentTarget.value) })}
                class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-dark-input dark:text-white"
              />
            </div>

            <!-- Font Weight -->
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Font Weight</label>
              <select
                value={area.font_weight || 'normal'}
                onchange={(e) => updateSelectedArea({ font_weight: e.currentTarget.value as any })}
                class="w-full px-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-sm bg-white dark:bg-dark-input dark:text-white"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
              </select>
            </div>

            <!-- Color -->
            <div>
              <label class="block text-sm text-gray-600 dark:text-gray-400 mb-1">Text Color</label>
              <input
                type="color"
                value={area.color || spec.styles.colors.primary}
                onchange={(e) => updateSelectedArea({ color: e.currentTarget.value })}
                class="w-full h-8 border border-gray-300 dark:border-gray-600 rounded-sm"
              />
            </div>
          </div>
        </div>
      {/if}
    </div>
  </div>
</div>

<!-- Hidden form for save -->
<form
  id="saveForm"
  method="POST"
  action="?/save"
  use:enhance={() => {
    saving = true;
    return async ({ update }: any) => {
      saving = false;
      await update();
    };
  }}
  class="hidden"
>
  <input id="specInput" type="hidden" name="spec" />
</form>
