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
  let originalImageData: ImageData | null = null; // Store original PDF rendering
  let customFieldIndex: number | null = $state(null); // Index of item being given custom field
  let customFieldName = $state(''); // Custom field name input
  let customFieldSuggestion: string | null = $state(null); // Suggested standard field
  let validationError = $state(false); // Show validation errors

  // Multi-select state
  let isDragging = $state(false);
  let dragStartX = $state(0);
  let dragStartY = $state(0);
  let dragEndX = $state(0);
  let dragEndY = $state(0);
  let selectedItems = $state<Set<number>>(new Set());
  let showMultiSelectPopup = $state(false);
  let popupX = $state(0);
  let popupY = $state(0);

  // Custom areas drawn by user
  type CustomArea = {
    x: number;
    y: number;
    width: number;
    height: number;
    fieldMapping: string | null;
    classification: 'static' | 'dynamic';
  };
  let customAreas = $state<CustomArea[]>([]);
  let selectedAreaIndex = $state<number | null>(null);

  // Area definitions for field mapping
  const fieldOptions = [
    { value: '__ignore__', label: '🗑️ Ignore / Delete' },
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

      // Fetch PDF from URL (need to fetch twice - ArrayBuffer gets detached after first use)
      const response1 = await fetch(data.pdfUrl);
      const arrayBuffer1 = await response1.arrayBuffer();

      // Extract text
      const extracted = await extractTextFromPdf(arrayBuffer1);
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

      // Fetch PDF again for rendering (ArrayBuffer was consumed by text extraction)
      const response2 = await fetch(data.pdfUrl);
      const arrayBuffer2 = await response2.arrayBuffer();

      // Render PDF to canvas (wait for canvas to be ready)
      if (!canvas) {
        console.error('Canvas element not ready');
        error = 'Canvas not initialized. Please refresh the page.';
        loading = false;
        return;
      }

      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer2 }).promise;
      const page = await pdf.getPage(1);

      // Calculate scale to fit canvas (render at 300 DPI for quality)
      const viewport = page.getViewport({ scale: 300 / 72 }); // 300 DPI

      canvas.width = viewport.width;
      canvas.height = viewport.height;

      // Scale to fit container (will be handled by CSS max-width: 100%)
      scale = 1;

      ctx = canvas.getContext('2d')!;

      // Render PDF
      await page.render({
        canvasContext: ctx,
        viewport
      }).promise;

      // Save the original PDF rendering (before we draw overlays)
      originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

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
    if (!ctx || !pdfRendered || !extractedText || !originalImageData) return;

    // Restore original PDF rendering (clears all overlays)
    ctx.putImageData(originalImageData, 0, 0);

    // Draw selection rectangle if dragging
    if (isDragging) {
      const x1 = Math.min(dragStartX, dragEndX);
      const y1 = Math.min(dragStartY, dragEndY);
      const x2 = Math.max(dragStartX, dragEndX);
      const y2 = Math.max(dragStartY, dragEndY);

      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]); // Dashed line
      ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
      ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
      ctx.setLineDash([]); // Reset to solid lines
    }

    // Draw custom areas
    customAreas.forEach((area, index) => {
      const isSelected = selectedAreaIndex === index;
      const isStatic = area.classification === 'static';
      const isMapped = area.fieldMapping && area.fieldMapping !== '' && area.fieldMapping !== '__ignore__';

      let strokeColor: string;
      let fillColor: string;

      if (isStatic) {
        strokeColor = isSelected ? '#6b7280' : '#9ca3af';
        fillColor = 'rgba(107, 114, 128, 0.15)';
      } else if (isMapped) {
        // Mapped dynamic - green
        strokeColor = isSelected ? '#10b981' : '#6ee7b7';
        fillColor = 'rgba(16, 185, 129, 0.15)';
      } else {
        // Unmapped dynamic - blue
        strokeColor = isSelected ? '#3b82f6' : '#93c5fd';
        fillColor = 'rgba(59, 130, 246, 0.15)';
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.strokeRect(area.x, area.y, area.width, area.height);
      ctx.fillStyle = fillColor;
      ctx.fillRect(area.x, area.y, area.width, area.height);

      // Draw label
      if (isMapped || isSelected) {
        const label = isMapped
          ? (fieldOptions.find(f => f.value === area.fieldMapping)?.label || area.fieldMapping)
          : 'Click to map';

        ctx.fillStyle = strokeColor;
        ctx.font = 'bold 14px monospace';
        const textWidth = ctx.measureText(label).width;

        // Draw background for label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(area.x + 5, area.y + 5, textWidth + 10, 20);

        // Draw label text
        ctx.fillStyle = strokeColor;
        ctx.fillText(label, area.x + 10, area.y + 20);
      }
    });

    // Draw text boxes
    extractedText.items.forEach((item, index) => {
      const classification = classifiedItems.get(index);
      if (!classification) return;

      const isSelected = selectedItemIndex === index;
      const isInMultiSelect = selectedItems.has(index);
      const isStatic = classification.classification === 'static';
      const isDynamic = classification.classification === 'dynamic';
      const isMapped = isDynamic && classification.fieldMapping && classification.fieldMapping !== '' && classification.fieldMapping !== '__ignore__';
      const isIgnored = classification.fieldMapping === '__ignore__';
      const isUnmapped = isDynamic && !isMapped && !isIgnored;

      // Convert coordinates to canvas space (already at 300 DPI from extraction)
      const x = item.x;
      const y = item.y;
      const w = item.width;
      const h = item.height;

      // Color scheme: gray=static, green=mapped, blue=unmapped dynamic, red=validation error
      let strokeColor: string;
      let fillColor: string;

      if (isIgnored) {
        // Ignored items - very light gray
        strokeColor = isSelected ? '#9ca3af' : '#d1d5db';
        fillColor = 'rgba(156, 163, 175, 0.05)';
      } else if (isStatic) {
        // Static - gray
        strokeColor = isSelected ? '#6b7280' : '#9ca3af';
        fillColor = 'rgba(107, 114, 128, 0.1)';
      } else if (validationError && isUnmapped) {
        // Validation error - unmapped dynamic field - red
        strokeColor = isSelected ? '#ef4444' : '#fca5a5';
        fillColor = 'rgba(239, 68, 68, 0.15)';
      } else if (isMapped) {
        // Mapped dynamic - green
        strokeColor = isSelected ? '#10b981' : '#6ee7b7';
        fillColor = 'rgba(16, 185, 129, 0.1)';
      } else {
        // Unmapped dynamic - blue
        strokeColor = isSelected ? '#3b82f6' : '#93c5fd';
        fillColor = 'rgba(59, 130, 246, 0.1)';
      }

      // Draw box
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = (isSelected || isInMultiSelect) ? 3 : 1.5;
      ctx.strokeRect(x, y, w, h);

      // Draw fill overlay
      ctx.fillStyle = fillColor;
      ctx.fillRect(x, y, w, h);

      // Highlight multi-selected items
      if (isInMultiSelect) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
        ctx.fillRect(x, y, w, h);
      }

      // Draw index label for selected item
      if (isSelected || isInMultiSelect) {
        ctx.fillStyle = isInMultiSelect ? '#3b82f6' : strokeColor;
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`#${index}`, x, y - 5);
      }
    });
  }

  function handleCanvasMouseDown(event: MouseEvent) {
    if (!extractedText) return;

    const rect = canvas.getBoundingClientRect();
    const actualScale = rect.width / canvas.width;
    const x = (event.clientX - rect.left) / actualScale;
    const y = (event.clientY - rect.top) / actualScale;

    // Check if clicking on an existing custom area
    let clickedAreaIndex: number | null = null;
    for (let i = customAreas.length - 1; i >= 0; i--) {
      const area = customAreas[i];
      if (x >= area.x && x <= area.x + area.width &&
          y >= area.y && y <= area.y + area.height) {
        clickedAreaIndex = i;
        break;
      }
    }

    // Check if clicking on an existing text item box
    let clickedTextIndex: number | null = null;
    if (clickedAreaIndex === null) {
      extractedText.items.forEach((item, index) => {
        if (x >= item.x && x <= item.x + item.width &&
            y >= item.y && y <= item.y + item.height) {
          clickedTextIndex = index;
        }
      });
    }

    if (clickedAreaIndex !== null) {
      // Clicked on existing custom area - show popup
      selectedAreaIndex = clickedAreaIndex;
      const area = customAreas[clickedAreaIndex];

      // Position popup to right of area
      const popupWidth = 192;
      const x2Screen = rect.left + ((area.x + area.width) * actualScale);
      const y1Screen = rect.top + (area.y * actualScale);

      popupX = x2Screen + 10;
      popupY = y1Screen;

      // Boundary checks
      if (popupX + popupWidth > window.innerWidth) {
        popupX = rect.left + (area.x * actualScale) - popupWidth - 10;
      }

      showMultiSelectPopup = true;
      redraw();
    } else if (clickedTextIndex !== null) {
      // Clicked on existing text item - show popup
      selectedItemIndex = clickedTextIndex;
      const item = extractedText.items[clickedTextIndex];

      // Position popup to right of text item
      const popupWidth = 192;
      const x2Screen = rect.left + ((item.x + item.width) * actualScale);
      const y1Screen = rect.top + (item.y * actualScale);

      popupX = x2Screen + 10;
      popupY = y1Screen;

      // Boundary checks
      if (popupX + popupWidth > window.innerWidth) {
        popupX = rect.left + (item.x * actualScale) - popupWidth - 10;
      }

      showMultiSelectPopup = true;
      redraw();
    } else {
      // Start drawing new area
      isDragging = true;
      dragStartX = x;
      dragStartY = y;
      dragEndX = x;
      dragEndY = y;
      selectedItems = new Set();
      showMultiSelectPopup = false;
      selectedAreaIndex = null;
      selectedItemIndex = null;

      // Store popup position at mouse down
      popupX = event.clientX;
      popupY = event.clientY;
    }
  }

  function handleCanvasMouseMove(event: MouseEvent) {
    if (!isDragging || !extractedText) return;

    const rect = canvas.getBoundingClientRect();
    const actualScale = rect.width / canvas.width;
    dragEndX = (event.clientX - rect.left) / actualScale;
    dragEndY = (event.clientY - rect.top) / actualScale;

    redraw();
  }

  function handleCanvasMouseUp(event: MouseEvent) {
    if (!isDragging) return;

    isDragging = false;

    // Calculate area dimensions
    const x1 = Math.min(dragStartX, dragEndX);
    const y1 = Math.min(dragStartY, dragEndY);
    const x2 = Math.max(dragStartX, dragEndX);
    const y2 = Math.max(dragStartY, dragEndY);
    const width = x2 - x1;
    const height = y2 - y1;

    // Only create area if drag was significant (at least 10px)
    if (width > 10 && height > 10) {
      // Create new custom area
      const newArea: CustomArea = {
        x: x1,
        y: y1,
        width,
        height,
        fieldMapping: null,
        classification: 'dynamic'
      };

      customAreas = [...customAreas, newArea];
      selectedAreaIndex = customAreas.length - 1;

      // Position popup to the right of the selection box
      const rect = canvas.getBoundingClientRect();
      const actualScale = rect.width / canvas.width;

      const x2Screen = rect.left + (x2 * actualScale);
      const y1Screen = rect.top + (y1 * actualScale);

      const popupWidth = 192;
      const popupHeight = 256;

      let x = x2Screen + 10;
      let y = y1Screen;

      // Check right boundary
      if (x + popupWidth > window.innerWidth) {
        x = rect.left + (x1 * actualScale) - popupWidth - 10;
      }

      // Check bottom boundary
      if (y + popupHeight > window.innerHeight) {
        y = window.innerHeight - popupHeight - 10;
      }

      // Check top boundary
      if (y < 10) {
        y = 10;
      }

      popupX = x;
      popupY = y;
      showMultiSelectPopup = true;
    }

    redraw();
  }

  function toggleClassification(index: number) {
    const current = classifiedItems.get(index);
    if (!current) return;

    const newClassification = current.classification === 'static' ? 'dynamic' : 'static';
    const newFieldMapping = newClassification === 'dynamic'
      ? suggestFieldMapping(extractedText!.items[index].text, extractedText!.items[index], extractedText!.items)
      : null;

    // Create new Map to trigger Svelte reactivity
    classifiedItems = new Map(classifiedItems);
    classifiedItems.set(index, {
      classification: newClassification,
      fieldMapping: newFieldMapping
    });

    redraw();
  }

  function updateFieldMapping(index: number, fieldMapping: string) {
    const current = classifiedItems.get(index);
    if (!current) return;

    if (fieldMapping === '__custom__') {
      // User selected "Custom..." - show custom field input
      customFieldIndex = index;
      customFieldName = '';
      customFieldSuggestion = null;
      return;
    }

    classifiedItems.set(index, {
      ...current,
      fieldMapping
    });
  }

  function detectSimilarField(customName: string): string | null {
    const normalized = customName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if it matches any standard field
    for (const field of fieldOptions) {
      const fieldNormalized = field.value.toLowerCase().replace(/[^a-z0-9]/g, '');
      const labelNormalized = field.label.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (normalized === fieldNormalized || normalized === labelNormalized) {
        return field.value;
      }

      // Check for partial matches (e.g., "invoice" matches "invoice_number")
      if (normalized.includes(fieldNormalized) || fieldNormalized.includes(normalized)) {
        return field.value;
      }
    }

    return null;
  }

  function handleCustomFieldInput() {
    if (!customFieldName.trim()) return;

    // Check if it matches an existing field
    const suggestion = detectSimilarField(customFieldName);
    customFieldSuggestion = suggestion;
  }

  function saveCustomField(useSuggestion: boolean) {
    if (customFieldIndex === null) return;

    const current = classifiedItems.get(customFieldIndex);
    if (!current) return;

    let fieldValue: string;

    if (useSuggestion && customFieldSuggestion) {
      // Use suggested standard field
      fieldValue = customFieldSuggestion;
    } else {
      // Create custom field (prefix with custom_)
      fieldValue = 'custom_' + customFieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    }

    classifiedItems.set(customFieldIndex, {
      ...current,
      fieldMapping: fieldValue
    });

    // Reset custom field state
    customFieldIndex = null;
    customFieldName = '';
    customFieldSuggestion = null;
  }

  function cancelCustomField() {
    customFieldIndex = null;
    customFieldName = '';
    customFieldSuggestion = null;
  }

  function applyToArea(fieldMapping: string) {
    if (selectedAreaIndex === null) return;

    customAreas = customAreas.map((area, index) => {
      if (index === selectedAreaIndex) {
        return {
          ...area,
          fieldMapping,
          classification: 'dynamic'
        };
      }
      return area;
    });

    showMultiSelectPopup = false;
    selectedAreaIndex = null;
    redraw();
  }

  function setAreaAsStatic() {
    if (selectedAreaIndex === null) return;

    customAreas = customAreas.map((area, index) => {
      if (index === selectedAreaIndex) {
        return {
          ...area,
          fieldMapping: null,
          classification: 'static'
        };
      }
      return area;
    });

    showMultiSelectPopup = false;
    selectedAreaIndex = null;
    redraw();
  }

  function deleteArea() {
    if (selectedAreaIndex === null) return;

    customAreas = customAreas.filter((_, index) => index !== selectedAreaIndex);
    showMultiSelectPopup = false;
    selectedAreaIndex = null;
    redraw();
  }

  function applyToTextItem(fieldMapping: string) {
    if (selectedItemIndex === null) return;

    classifiedItems = new Map(classifiedItems);
    classifiedItems.set(selectedItemIndex, {
      classification: 'dynamic',
      fieldMapping
    });

    showMultiSelectPopup = false;
    selectedItemIndex = null;
    redraw();
  }

  function setTextItemAsStatic() {
    if (selectedItemIndex === null) return;

    classifiedItems = new Map(classifiedItems);
    classifiedItems.set(selectedItemIndex, {
      classification: 'static',
      fieldMapping: null
    });

    showMultiSelectPopup = false;
    selectedItemIndex = null;
    redraw();
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

    // Validate all dynamic fields are mapped
    const unmappedItems: number[] = [];
    classifiedItems.forEach((classification, index) => {
      if (classification.classification === 'dynamic' &&
          (!classification.fieldMapping || classification.fieldMapping === '')) {
        unmappedItems.push(index);
      }
    });

    if (unmappedItems.length > 0) {
      validationError = true;
      error = `Please map all dynamic fields. ${unmappedItems.length} field${unmappedItems.length > 1 ? 's' : ''} need${unmappedItems.length === 1 ? 's' : ''} a mapping (highlighted in red).`;
      redraw(); // Redraw to show red highlights
      return;
    }

    try {
      generating = true;
      error = null;
      validationError = false;

      // Step 1: Generate blank template by removing dynamic text
      const blankCanvas = document.createElement('canvas');
      blankCanvas.width = canvas.width;
      blankCanvas.height = canvas.height;
      const blankCtx = blankCanvas.getContext('2d')!;

      // Copy original PDF rendering
      blankCtx.drawImage(canvas, 0, 0);

      // White out dynamic text areas and ignored items
      blankCtx.fillStyle = '#ffffff';
      extractedText.items.forEach((item, index) => {
        const classification = classifiedItems.get(index);
        const isDynamic = classification?.classification === 'dynamic';
        const isIgnored = classification?.fieldMapping === '__ignore__';

        // Remove dynamic data and ignored items from template
        if (isDynamic || isIgnored) {
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
      const filePath = `${data.userId}/${fileName}`;

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

    // Add dynamic text items as areas (skip ignored items)
    extractedText.items.forEach((item, index) => {
      const classification = classifiedItems.get(index);
      if (classification?.classification === 'dynamic' && classification.fieldMapping) {
        const fieldMapping = classification.fieldMapping;

        // Skip ignored items
        if (fieldMapping === '__ignore__') {
          return;
        }

        const fieldKey = fieldMapping as keyof typeof spec.areas;

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

        // Add as area (supports both standard and custom fields)
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

  // Track which fields have been used
  let usedFields = $derived.by(() => {
    const used = new Set<string>();
    classifiedItems.forEach((classification) => {
      if (classification.fieldMapping && classification.fieldMapping !== '__ignore__' && !classification.fieldMapping.startsWith('custom_')) {
        used.add(classification.fieldMapping);
      }
    });
    return used;
  });

  // Computed stats
  let stats = $derived.by(() => {
    if (!extractedText) return { total: 0, static: 0, dynamic: 0, mapped: 0, unmapped: 0, ignored: 0 };

    let staticCount = 0;
    let dynamicCount = 0;
    let mappedCount = 0;
    let unmappedCount = 0;
    let ignoredCount = 0;

    classifiedItems.forEach((classification) => {
      if (classification.fieldMapping === '__ignore__') {
        ignoredCount++;
      } else if (classification.classification === 'static') {
        staticCount++;
      } else {
        dynamicCount++;
        if (classification.fieldMapping && classification.fieldMapping !== '') {
          mappedCount++;
        } else {
          unmappedCount++;
        }
      }
    });

    return {
      total: extractedText.items.length,
      static: staticCount,
      dynamic: dynamicCount,
      mapped: mappedCount,
      unmapped: unmappedCount,
      ignored: ignoredCount
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
        <li><span class="text-gray-600 font-medium">Gray boxes</span> = Static labels (kept in template)</li>
        <li><span class="text-blue-600 font-medium">Blue boxes</span> = Dynamic data (will be replaced with invoice data)</li>
        <li>Use the toggle switch to change between static/dynamic</li>
        <li>For dynamic text, assign a field mapping in the sidebar</li>
        <li>Use "Ignore / Delete" for unwanted text</li>
      </ul>
    </div>
  </div>

  <!-- Stats -->
  {#if extractedText}
    <div class="grid grid-cols-3 gap-4">
      <div class="border border-thin rounded-sm p-3 {stats.unmapped === 0 ? 'bg-green-50' : 'bg-red-50'}">
        <div class="text-xs {stats.unmapped === 0 ? 'text-green-700' : 'text-red-700'}">Dynamic Fields</div>
        <div class="text-lg font-medium {stats.unmapped === 0 ? 'text-green-900' : 'text-red-900'}">{stats.mapped + stats.ignored} of {stats.dynamic + stats.ignored}</div>
      </div>
      <div class="border border-thin rounded-sm p-3 bg-gray-50">
        <div class="text-xs text-gray-700">Static Labels</div>
        <div class="text-lg font-medium text-gray-900">{stats.static}</div>
      </div>
      <div class="border border-thin rounded-sm p-3 bg-gray-50">
        <div class="text-xs text-gray-600">Ignored</div>
        <div class="text-lg font-medium text-gray-700">{stats.ignored}</div>
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
    <div class="lg:col-span-2 border border-thin rounded-sm p-4 bg-white flex items-start justify-center">
      <!-- Always render canvas so it can be bound -->
      <canvas
        bind:this={canvas}
        onmousedown={handleCanvasMouseDown}
        onmousemove={handleCanvasMouseMove}
        onmouseup={handleCanvasMouseUp}
        style="cursor: crosshair; width: 100%; height: auto; display: {pdfRendered ? 'block' : 'none'};"
        class="border border-gray-200"
      ></canvas>

      <!-- Loading/Error States -->
      {#if loading}
        <div class="flex items-center justify-center h-96 text-gray-400 text-xs">
          Analyzing PDF and extracting text...
        </div>
      {:else if !extractedText && !error}
        <div class="flex items-center justify-center h-96 text-gray-400 text-xs">
          Waiting for PDF...
        </div>
      {/if}
    </div>

    <!-- Sidebar -->
    <div class="space-y-4">
      <!-- Text Items List -->
      {#if extractedText}
        <div class="border border-thin rounded-sm p-4 space-y-3">
          <div class="text-xs font-medium">Text Items ({extractedText.items.length})</div>
          <div class="space-y-2">
            {#each extractedText.items as item, index}
              {@const classification = classifiedItems.get(index)}
              {@const isSelected = selectedItemIndex === index}
              {@const isStatic = classification?.classification === 'static'}
              {@const isDynamic = classification?.classification === 'dynamic'}
              {@const isMapped = isDynamic && classification.fieldMapping && classification.fieldMapping !== ''}
              {@const isIgnored = classification?.fieldMapping === '__ignore__'}

              <div
                class="border rounded-sm p-2 text-xs cursor-pointer transition-colors {isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'} {isMapped ? 'bg-green-50' : isDynamic && !isIgnored ? 'bg-blue-50' : ''}"
                onclick={() => { selectedItemIndex = index; redraw(); }}
              >
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-1.5 flex-1 min-w-0">
                    {#if isMapped}
                      <span class="text-green-600 text-sm flex-shrink-0">✓</span>
                    {/if}
                    <div class="font-mono text-xs break-all {isIgnored ? 'text-gray-400 line-through' : isStatic ? 'text-gray-700' : isMapped ? 'text-green-700' : 'text-blue-700'}">
                      {item.text}
                    </div>
                  </div>
                  <!-- Toggle Switch -->
                  <button
                    onclick={(e) => { e.stopPropagation(); toggleClassification(index); }}
                    class="flex items-center gap-1.5 text-xs flex-shrink-0"
                    title="Toggle between static and dynamic"
                  >
                    <span class="text-gray-600 text-[10px] uppercase tracking-wide {isStatic ? 'font-medium' : ''}">Static</span>
                    <div class="relative inline-block w-8 h-4 rounded-full transition-colors {isStatic ? 'bg-gray-400' : 'bg-blue-500'}">
                      <div class="absolute top-0.5 transition-transform rounded-full w-3 h-3 bg-white {isStatic ? 'left-0.5' : 'left-4'}"></div>
                    </div>
                    <span class="text-gray-600 text-[10px] uppercase tracking-wide {!isStatic ? 'font-medium' : ''}">Dynamic</span>
                  </button>
                </div>

                {#if !isStatic && classification}
                  {#if customFieldIndex === index}
                    <!-- Custom field input -->
                    <div class="space-y-2" onclick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        bind:value={customFieldName}
                        oninput={handleCustomFieldInput}
                        placeholder="Enter field name..."
                        class="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm"
                        autofocus
                      />

                      {#if customFieldSuggestion}
                        <div class="text-xs p-2 bg-blue-50 border border-blue-200 rounded-sm">
                          <div class="text-blue-700 mb-1">Did you mean:</div>
                          <button
                            onclick={() => saveCustomField(true)}
                            class="text-blue-600 hover:underline font-medium"
                          >
                            {fieldOptions.find(f => f.value === customFieldSuggestion)?.label}
                          </button>
                        </div>
                      {/if}

                      <div class="flex gap-1">
                        <button
                          onclick={() => saveCustomField(false)}
                          disabled={!customFieldName.trim()}
                          class="flex-1 px-2 py-1 text-xs bg-black text-white rounded-sm hover:bg-gray-800 disabled:bg-gray-300"
                        >
                          Save Custom
                        </button>
                        <button
                          onclick={cancelCustomField}
                          class="px-2 py-1 text-xs border border-gray-300 rounded-sm hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  {:else}
                    <select
                      value={classification.fieldMapping || ''}
                      onchange={(e) => updateFieldMapping(index, e.currentTarget.value)}
                      onclick={(e) => e.stopPropagation()}
                      class="w-full px-2 py-1 text-xs border border-gray-200 rounded-sm"
                    >
                      <option value="">-- Select field --</option>
                      {#each fieldOptions as field}
                        {@const isUsed = usedFields.has(field.value) && classification.fieldMapping !== field.value}
                        {@const canReuse = field.value === 'payment_info' || field.value === '__ignore__'}
                        <option value={field.value} disabled={isUsed && !canReuse}>
                          {field.label}{isUsed && !canReuse ? ' ✓' : ''}{canReuse && isUsed ? ' (reusable)' : ''}
                        </option>
                      {/each}
                      <option value="__custom__">✨ Custom field...</option>
                    </select>
                  {/if}
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  </div>

  <!-- Mapping popup (for both areas and text items) -->
  {#if showMultiSelectPopup && (selectedAreaIndex !== null || selectedItemIndex !== null)}
    <div
      class="fixed bg-white border border-gray-300 rounded-sm shadow-lg z-50 w-48"
      style="left: {popupX}px; top: {popupY}px; position: fixed;"
    >
      <div class="text-xs font-medium px-3 py-2 border-b border-gray-200 bg-gray-50">
        {selectedAreaIndex !== null ? 'Map Area' : 'Map Field'}
      </div>

      <div class="max-h-64 overflow-y-auto">
        <div class="p-1">
          <button
            onclick={() => selectedAreaIndex !== null ? setAreaAsStatic() : setTextItemAsStatic()}
            class="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded-sm"
          >
            Set as Static
          </button>

          <div class="border-t border-gray-200 my-1"></div>

          <div class="text-[10px] text-gray-600 px-2 py-1 uppercase tracking-wide">
            Set as Dynamic:
          </div>

          {#each fieldOptions as field}
            {@const isUsed = usedFields.has(field.value)}
            {@const canReuse = field.value === 'payment_info' || field.value === '__ignore__'}
            {@const currentFieldMapping = selectedAreaIndex !== null ? customAreas[selectedAreaIndex]?.fieldMapping : (selectedItemIndex !== null ? classifiedItems.get(selectedItemIndex)?.fieldMapping : null)}
            {@const isCurrent = currentFieldMapping === field.value}
            <button
              onclick={() => selectedAreaIndex !== null ? applyToArea(field.value) : applyToTextItem(field.value)}
              class="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded-sm flex items-center justify-between gap-2"
              disabled={isUsed && !canReuse && !isCurrent}
            >
              <span class={isUsed && !canReuse && !isCurrent ? 'text-gray-400' : ''}>{field.label}</span>
              {#if isUsed && !isCurrent}
                <span class="text-green-600 text-sm">✓</span>
              {/if}
            </button>
          {/each}
        </div>
      </div>

      <div class="border-t border-gray-200 p-1">
        {#if selectedAreaIndex !== null}
          <button
            onclick={() => deleteArea()}
            class="w-full text-left px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-sm"
          >
            Delete Area
          </button>
        {/if}
        <button
          onclick={() => { showMultiSelectPopup = false; selectedAreaIndex = null; selectedItemIndex = null; redraw(); }}
          class="w-full text-left px-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  {/if}
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
