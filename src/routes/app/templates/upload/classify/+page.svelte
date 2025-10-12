<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import type { PageData } from './$types';
  import * as pdfjsLib from 'pdfjs-dist';
  import { extractTextFromPdf, suggestClassification, suggestFieldMapping, detectTables, type TextItem, type ExtractedText } from '$lib/pdf/text-extractor';
  import type { TemplateSpec, AreaSpec } from '$lib/templates';

  // Set up PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();

  let { data }: { data: PageData } = $props();

  // State
  let canvas: HTMLCanvasElement;
  let ctx: CanvasRenderingContext2D;
  let extractedText = $state<ExtractedText | null>(null);
  let classifiedItems = $state<Map<number, { classification: 'static' | 'dynamic', fieldMapping: string | null }>>(new Map());
  let selectedItemIndex = $state<number | null>(null);
  let loading = $state(true);
  let generating = $state(false);
  let error = $state<string | null>(null);
  let scale = $state(1);
  let pdfRendered = $state(false);

  // Area definitions for field mapping
  const fieldOptions = [
    { value: 'invoice_title', label: 'Invoice Title' },
    { value: 'invoice_number', label: 'Invoice Number' },
    { value: 'issue_date', label: 'Issue Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'company_info', label: 'Company Info' },
    { value: 'company_address', label: 'Company Address' },
    { value: 'client_name', label: 'Client Name' },
    { value: 'client_company', label: 'Client Company' },
    { value: 'client_address', label: 'Client Address' },
    { value: 'client_email', label: 'Client Email' },
    { value: 'subtotal', label: 'Subtotal' },
    { value: 'tax_total', label: 'Tax Total' },
    { value: 'grand_total', label: 'Grand Total' },
    { value: 'notes', label: 'Notes' },
    { value: 'payment_info', label: 'Payment Info' },
  ];

  // Load and process PDF on mount
  $effect(() => {
    if (data.pdfUrl) {
      loadPdf();
    }
  });

  async function loadPdf() {
    try {
      loading = true;
      error = null;

      // Fetch PDF from URL
      const response = await fetch(data.pdfUrl);
      const arrayBuffer = await response.arrayBuffer();

      // Extract text
      const extracted = await extractTextFromPdf(arrayBuffer);
      extractedText = extracted;

      console.log('Extracted text items:', extracted.items.length);

      // Initialize classifications with suggestions
      extracted.items.forEach((item, index) => {
        const classification = suggestClassification(item.text);
        const fieldMapping = classification === 'dynamic'
          ? suggestFieldMapping(item.text, item, extracted.items)
          : null;

        classifiedItems.set(index, { classification, fieldMapping });
      });

      // Render PDF to canvas
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);

      // Calculate scale to fit canvas
      const viewport = page.getViewport({ scale: 300 / 72 }); // 300 DPI

      canvas.width = viewport.width;
      canvas.height = viewport.height;
      scale = Math.min(1000 / viewport.width, 700 / viewport.height);

      ctx = canvas.getContext('2d')!;

      // Render PDF
      await page.render({
        canvasContext: ctx,
        viewport
      }).promise;

      pdfRendered = true;
      redraw();

      loading = false;
    } catch (err) {
      console.error('Failed to load PDF:', err);
      error = 'Failed to load and analyze PDF. Please try again.';
      loading = false;
    }
  }

  function redraw() {
    if (!ctx || !pdfRendered || !extractedText) return;

    // Redraw canvas (clear overlays)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    ctx.putImageData(imageData, 0, 0);

    // Draw text boxes
    extractedText.items.forEach((item, index) => {
      const classification = classifiedItems.get(index);
      if (!classification) return;

      const isSelected = selectedItemIndex === index;
      const isStatic = classification.classification === 'static';

      // Convert coordinates to canvas space (already at 300 DPI from extraction)
      const x = item.x;
      const y = item.y;
      const w = item.width;
      const h = item.height;

      // Draw box
      ctx.strokeStyle = isStatic
        ? (isSelected ? '#10b981' : '#6ee7b7') // Green for static
        : (isSelected ? '#ef4444' : '#fca5a5'); // Red for dynamic
      ctx.lineWidth = isSelected ? 3 : 1.5;
      ctx.strokeRect(x, y, w, h);

      // Draw fill overlay
      ctx.fillStyle = isStatic
        ? 'rgba(16, 185, 129, 0.1)'
        : 'rgba(239, 68, 68, 0.1)';
      ctx.fillRect(x, y, w, h);

      // Draw index label for selected item
      if (isSelected) {
        ctx.fillStyle = isStatic ? '#10b981' : '#ef4444';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`#${index}`, x, y - 5);
      }
    });
  }

  function handleCanvasClick(event: MouseEvent) {
    if (!extractedText) return;

    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) / scale;
    const y = (event.clientY - rect.top) / scale;

    // Find clicked text item
    let clickedIndex: number | null = null;

    extractedText.items.forEach((item, index) => {
      const itemX = item.x;
      const itemY = item.y;
      const itemW = item.width;
      const itemH = item.height;

      if (x >= itemX && x <= itemX + itemW && y >= itemY && y <= itemY + itemH) {
        clickedIndex = index;
      }
    });

    if (clickedIndex !== null) {
      selectedItemIndex = clickedIndex;
      redraw();
    }
  }

  function toggleClassification(index: number) {
    const current = classifiedItems.get(index);
    if (!current) return;

    const newClassification = current.classification === 'static' ? 'dynamic' : 'static';
    const newFieldMapping = newClassification === 'dynamic'
      ? suggestFieldMapping(extractedText!.items[index].text, extractedText!.items[index], extractedText!.items)
      : null;

    classifiedItems.set(index, {
      classification: newClassification,
      fieldMapping: newFieldMapping
    });

    redraw();
  }

  function updateFieldMapping(index: number, fieldMapping: string) {
    const current = classifiedItems.get(index);
    if (!current) return;

    classifiedItems.set(index, {
      ...current,
      fieldMapping
    });
  }

  function bulkSetClassification(classification: 'static' | 'dynamic') {
    if (!extractedText) return;

    extractedText.items.forEach((_, index) => {
      const current = classifiedItems.get(index);
      if (!current) return;

      classifiedItems.set(index, {
        classification,
        fieldMapping: classification === 'dynamic'
          ? suggestFieldMapping(extractedText.items[index].text, extractedText.items[index], extractedText.items)
          : null
      });
    });

    redraw();
  }

  async function generateTemplate() {
    if (!extractedText || !ctx || !canvas) {
      error = 'Cannot generate template - missing required data';
      return;
    }

    try {
      generating = true;
      error = null;

      // Step 1: Generate blank template by removing dynamic text
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = canvas.width;
      blankCanvas.height = canvas.height;
      const blankCtx = blankCanvas.getContext('2d')!;

      // Copy original PDF rendering
      blankCtx.drawImage(canvas, 0, 0);

      // White out dynamic text areas
      blankCtx.fillStyle = '#ffffff';
      extractedText.items.forEach((item, index) => {
        const classification = classifiedItems.get(index);
        if (classification?.classification === 'dynamic') {
          // Add small padding to ensure complete coverage
          const padding = 2;
          blankCtx.fillRect(
            item.x - padding,
            item.y - padding,
            item.width + (padding * 2),
            item.height + (padding * 2)
          );
        }
      });

      // Convert blank canvas to blob
      const blankBlob = await new Promise<Blob>((resolve) => {
        blankCanvas.toBlob((b) => resolve(b!), 'image/png');
      });

      // Step 2: Upload blank template to Supabase
      const timestamp = Date.now();
      const fileName = `blank_${timestamp}_${data.template.title.replace(/[^a-z0-9]/gi, '_')}.png`;
      const filePath = `${data.template.org_id}/${fileName}`;

      // We need to upload via form, so convert blob to File
      const blankFile = new File([blankBlob], fileName, { type: 'image/png' });

      // Upload to Supabase Storage (we'll need to add this to the form)
      // For now, create a FormData and upload via fetch
      const uploadFormData = new FormData();
      uploadFormData.append('file', blankFile);
      uploadFormData.append('path', filePath);

      const uploadResponse = await fetch('/api/upload-template-image', {
        method: 'POST',
        body: uploadFormData
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload blank template');
      }

      const { publicUrl } = await uploadResponse.json();

      // Step 3: Generate TemplateSpec from classified items
      const spec = generateTemplateSpec(publicUrl);

      // Step 4: Save to database via form
      const saveForm = document.getElementById('saveForm') as HTMLFormElement;
      (document.getElementById('specInput') as HTMLInputElement).value = JSON.stringify(spec);
      (document.getElementById('blankUrlInput') as HTMLInputElement).value = publicUrl;
      (document.getElementById('templateIdInput') as HTMLInputElement).value = data.template.id;

      saveForm.requestSubmit();
    } catch (err) {
      console.error('Failed to generate template:', err);
      error = `Failed to generate template: ${err instanceof Error ? err.message : 'Unknown error'}`;
      generating = false;
    }
  }

  function generateTemplateSpec(blankTemplateUrl: string): TemplateSpec {
    if (!extractedText) {
      throw new Error('No extracted text available');
    }

    // Convert pixels to mm (at 300 DPI: 1mm = 11.811 px)
    const pxToMm = (px: number) => (px * 25.4) / 300;

    const spec: TemplateSpec = {
      meta: {
        name: data.template.title,
        description: 'Auto-generated from uploaded invoice',
        width: pxToMm(extractedText.pageWidth),
        height: pxToMm(extractedText.pageHeight),
        dpi: 300,
        margins: { top: 20, right: 20, bottom: 20, left: 20 },
        background_image_url: blankTemplateUrl
      },
      styles: {
        fonts: { primary: 'Arial, sans-serif' },
        colors: { primary: '#000000', secondary: '#666666' },
        sizes: { default: 10, small: 8, large: 12, title: 18 }
      },
      areas: {
        items_table: {
          x: 20,
          y: 110,
          w: pxToMm(extractedText.pageWidth) - 40,
          row_height: 8,
          columns: [
            { key: 'description', label: 'Description', w: 85, align: 'left' },
            { key: 'qty', label: 'Qty', w: 20, align: 'center' },
            { key: 'unit_price', label: 'Price', w: 25, align: 'right' },
            { key: 'line_total', label: 'Total', w: 25, align: 'right' }
          ]
        },
        grand_total: { x: 140, y: 212, w: 50, align: 'right', font_weight: 'bold' }
      }
    };

    // Add dynamic text items as areas
    extractedText.items.forEach((item, index) => {
      const classification = classifiedItems.get(index);
      if (classification?.classification === 'dynamic' && classification.fieldMapping) {
        const fieldKey = classification.fieldMapping as keyof typeof spec.areas;

        // Skip if it's grand_total or items_table (already defined)
        if (fieldKey === 'grand_total' || fieldKey === 'items_table') {
          // Update position of grand_total if we have one
          if (fieldKey === 'grand_total') {
            spec.areas.grand_total = {
              x: pxToMm(item.x),
              y: pxToMm(item.y),
              w: pxToMm(item.width),
              h: pxToMm(item.height),
              align: 'right',
              font_weight: 'bold',
              font_size: item.fontSize
            };
          }
          return;
        }

        // Add as area
        (spec.areas as any)[fieldKey] = {
          x: pxToMm(item.x),
          y: pxToMm(item.y),
          w: pxToMm(item.width),
          h: pxToMm(item.height),
          align: 'left',
          font_size: Math.round(item.fontSize)
        };
      }
    });

    return spec;
  }

  // Computed stats
  let stats = $derived.by(() => {
    if (!extractedText) return { total: 0, static: 0, dynamic: 0, mapped: 0 };

    let staticCount = 0;
    let dynamicCount = 0;
    let mappedCount = 0;

    classifiedItems.forEach((classification) => {
      if (classification.classification === 'static') {
        staticCount++;
      } else {
        dynamicCount++;
        if (classification.fieldMapping) {
          mappedCount++;
        }
      }
    });

    return {
      total: extractedText.items.length,
      static: staticCount,
      dynamic: dynamicCount,
      mapped: mappedCount
    };
  });
</script>

<svelte:head>
  <title>Classify Template - {data.template.title} - inv</title>
</svelte:head>

<div class="max-w-7xl space-y-4">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <div class="flex items-center gap-3 mb-2">
        <a href="/app/templates/upload" class="text-xs text-gray-600 hover:text-black">
          ← Back to Upload
        </a>
      </div>
      <h1 class="text-sm mb-1">Classify Text: {data.template.title}</h1>
      <p class="text-xs text-gray-600">
        Mark text as static (keep) or dynamic (remove & map to invoice fields)
      </p>
    </div>

    <button
      onclick={generateTemplate}
      disabled={generating || loading || stats.dynamic === 0}
      class="px-6 py-2 bg-black text-white text-xs rounded-sm hover:bg-gray-800 disabled:bg-gray-300"
    >
      {generating ? 'Generating Template...' : 'Generate Template'}
    </button>
  </div>

  <!-- Instructions -->
  <div class="border border-thin rounded-sm p-4 bg-blue-50">
    <div class="text-xs space-y-2">
      <div class="font-medium">How to classify your template:</div>
      <ul class="list-disc list-inside text-gray-700 space-y-1">
        <li><span class="text-green-600 font-medium">Green boxes</span> = Static labels (will be kept in template)</li>
        <li><span class="text-red-600 font-medium">Red boxes</span> = Dynamic data (will be removed and mapped)</li>
        <li>Click any text box to toggle between static/dynamic</li>
        <li>For dynamic text, assign a field mapping in the sidebar</li>
        <li>Click "Generate Template" when done to create your blank template</li>
      </ul>
    </div>
  </div>

  <!-- Stats -->
  {#if extractedText}
    <div class="grid grid-cols-4 gap-4">
      <div class="border border-thin rounded-sm p-3 bg-white">
        <div class="text-xs text-gray-600">Total Text Items</div>
        <div class="text-lg font-medium">{stats.total}</div>
      </div>
      <div class="border border-thin rounded-sm p-3 bg-green-50">
        <div class="text-xs text-green-700">Static Labels</div>
        <div class="text-lg font-medium text-green-900">{stats.static}</div>
      </div>
      <div class="border border-thin rounded-sm p-3 bg-red-50">
        <div class="text-xs text-red-700">Dynamic Data</div>
        <div class="text-lg font-medium text-red-900">{stats.dynamic}</div>
      </div>
      <div class="border border-thin rounded-sm p-3 bg-blue-50">
        <div class="text-xs text-blue-700">Mapped Fields</div>
        <div class="text-lg font-medium text-blue-900">{stats.mapped}/{stats.dynamic}</div>
      </div>
    </div>
  {/if}

  {#if error}
    <div class="border border-red-300 rounded-sm p-4 bg-red-50 text-red-700 text-xs">
      {error}
    </div>
  {/if}

  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Canvas -->
    <div class="lg:col-span-2 border border-thin rounded-sm p-4 bg-white">
      {#if loading}
        <div class="flex items-center justify-center h-96 text-gray-400 text-xs">
          Analyzing PDF and extracting text...
        </div>
      {:else if extractedText}
        <div class="overflow-auto" style="max-height: 800px;">
          <canvas
            bind:this={canvas}
            onclick={handleCanvasClick}
            style="cursor: pointer; width: {canvas?.width ? canvas.width * scale : 0}px; height: {canvas?.height ? canvas.height * scale : 0}px;"
            class="border border-gray-200"
          ></canvas>
        </div>
      {/if}
    </div>

    <!-- Sidebar -->
    <div class="space-y-4">
      <!-- Quick Actions -->
      <div class="border border-thin rounded-sm p-4 space-y-3">
        <div class="text-xs font-medium">Quick Actions</div>
        <div class="flex flex-col gap-2">
          <button
            onclick={() => bulkSetClassification('static')}
            class="px-3 py-2 text-xs bg-green-100 text-green-700 hover:bg-green-200 rounded-sm"
          >
            Mark All as Static
          </button>
          <button
            onclick={() => bulkSetClassification('dynamic')}
            class="px-3 py-2 text-xs bg-red-100 text-red-700 hover:bg-red-200 rounded-sm"
          >
            Mark All as Dynamic
          </button>
        </div>
      </div>

      <!-- Text Items List -->
      {#if extractedText}
        <div class="border border-thin rounded-sm p-4 space-y-3 overflow-y-auto" style="max-height: 600px;">
          <div class="text-xs font-medium">Text Items ({extractedText.items.length})</div>
          <div class="space-y-2">
            {#each extractedText.items as item, index}
              {@const classification = classifiedItems.get(index)}
              {@const isSelected = selectedItemIndex === index}
              {@const isStatic = classification?.classification === 'static'}

              <div
                class="border rounded-sm p-2 text-xs cursor-pointer transition-colors {isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'}"
                onclick={() => { selectedItemIndex = index; redraw(); }}
              >
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex-1 font-mono text-xs break-all {isStatic ? 'text-green-700' : 'text-red-700'}">
                    {item.text}
                  </div>
                  <button
                    onclick={(e) => { e.stopPropagation(); toggleClassification(index); }}
                    class="px-2 py-1 text-xs rounded-sm {isStatic ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}"
                  >
                    {isStatic ? 'Static' : 'Dynamic'}
                  </button>
                </div>

                {#if !isStatic && classification}
                  <select
                    value={classification.fieldMapping || ''}
                    onchange={(e) => updateFieldMapping(index, e.currentTarget.value)}
                    onclick={(e) => e.stopPropagation()}
                    class="w-full px-2 py-1 text-xs border border-gray-200 rounded-sm"
                  >
                    <option value="">-- Select field --</option>
                    {#each fieldOptions as field}
                      <option value={field.value}>{field.label}</option>
                    {/each}
                  </select>
                {/if}
              </div>
            {/each}
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
    generating = true;
    return async ({ update }) => {
      generating = false;
      await update();
    };
  }}
  class="hidden"
>
  <input id="templateIdInput" type="hidden" name="template_id" />
  <input id="specInput" type="hidden" name="spec" />
  <input id="blankUrlInput" type="hidden" name="blank_template_url" />
</form>
