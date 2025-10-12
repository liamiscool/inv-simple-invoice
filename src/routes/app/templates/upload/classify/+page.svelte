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
  let customFieldAreaIndex: number | null = $state(null); // Index of area being given custom field
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
  type TableColumn = {
    field: 'description' | 'quantity' | 'rate' | 'amount' | 'tax' | 'custom';
    customLabel?: string;
    widthPercent: number;
    align: 'left' | 'center' | 'right';
  };

  type CustomArea = {
    x: number;
    y: number;
    width: number;
    height: number;
    fieldMapping: string | null;
    classification: 'static' | 'dynamic';
    coveredTextIndices?: number[]; // Track which text items this area covers

    // Line items table specific
    isLineItemsTable?: boolean;
    tableConfig?: {
      columns: TableColumn[];
      rowHeight: number;
      headerRow: boolean;
      autoDetected: boolean;
      detectedRows?: number;
      confidence?: number;
    };
  };
  let customAreas = $state<CustomArea[]>([]);
  let selectedAreaIndex = $state<number | null>(null);

  // Line items table configuration modal state
  let showTableConfigModal = $state(false);
  let editingTableIndex = $state<number | null>(null);

  // Auto-save state
  let autoSaveTimeout: ReturnType<typeof setTimeout> | null = null;
  let isSaving = $state(false);
  let lastSaved = $state<Date | null>(null);
  let saveStatus = $state<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Dynamic field labels based on user's business setup
  const isCompany = data.operatesAsCompany;

  // Standard field options with dynamic labels
  const standardFieldOptions = [
    { value: '__ignore__', label: '🗑️ Ignore / Delete' },
    { value: '__line_items_table__', label: '📋 Line Items Table' },
    { value: 'invoice_title', label: 'Invoice Title' },
    { value: 'invoice_number', label: 'Invoice Number' },
    { value: 'issue_date', label: 'Issue Date' },
    { value: 'due_date', label: 'Due Date' },
    { value: 'freelancer_company', label: isCompany ? 'Your Company Name' : 'Your Name / Business Name' },
    { value: 'freelancer_address', label: isCompany ? 'Your Company Address' : 'Your Address' },
    { value: 'freelancer_contact', label: isCompany ? 'Your Company Contact' : 'Your Contact Details' },
    { value: 'freelancer_tax_id', label: isCompany ? 'Your Tax ID (ABN/ACN/EIN)' : 'Your Tax ID (optional)' },
    { value: 'client_name', label: 'Client Name' },
    { value: 'client_company', label: 'Client Legal Name' },
    { value: 'client_address', label: 'Client Address' },
    { value: 'client_email', label: 'Client Email' },
    { value: 'client_tax_id', label: 'Client Tax ID (ABN/ACN/EIN)' },
    { value: 'subtotal', label: 'Subtotal' },
    { value: 'tax_total', label: 'Tax Total' },
    { value: 'grand_total', label: 'Grand Total' },
    { value: 'notes', label: 'Notes' },
    { value: 'payment_info', label: 'Payment Info' },
  ];

  // Fields that can be reused (multiple instances allowed)
  const reusableFields = new Set(['payment_info', '__ignore__', 'client_name', 'client_company']);

  // Org-wide custom fields - using $state so we can update it
  let customFieldsList = $state(data.customFields);

  // Org-wide custom fields from database
  let orgCustomFields = $derived(
    customFieldsList.map((field: any) => ({
      value: field.field_name,
      label: field.field_label + ' (custom)'
    }))
  );

  // Combined field options (standard + org custom fields)
  let fieldOptions = $derived([...standardFieldOptions, ...orgCustomFields]);

  // Load and process PDF on mount
  $effect(() => {
    if (data.pdfUrl) {
      loadPdf();
    }
  });

  // Handle keyboard events for deleting selected areas
  $effect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Delete or Backspace key
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAreaIndex !== null) {
        e.preventDefault();
        deleteArea();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });

  // Auto-save when classifiedItems or customAreas change
  $effect(() => {
    // Trigger on any change to classifiedItems or customAreas
    const _ = classifiedItems;
    const __ = customAreas;

    // Don't auto-save if still loading or generating
    if (loading || generating) return;

    // Debounce auto-save (wait 2 seconds after last change)
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }

    autoSaveTimeout = setTimeout(() => {
      triggerAutoSave();
    }, 2000);
  });

  async function triggerAutoSave() {
    if (isSaving) return;

    try {
      isSaving = true;
      saveStatus = 'saving';

      // Convert Map to plain object for JSON serialization
      const classifiedItemsObj: Record<string, any> = {};
      classifiedItems.forEach((value, key) => {
        classifiedItemsObj[key] = value;
      });

      const formData = new FormData();
      formData.append('template_id', data.template.id);
      formData.append('classified_items', JSON.stringify(classifiedItemsObj));
      formData.append('custom_areas', JSON.stringify(customAreas));

      const response = await fetch('?/autosave', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        saveStatus = 'saved';
        lastSaved = new Date();
        setTimeout(() => {
          if (saveStatus === 'saved') saveStatus = 'idle';
        }, 2000);
      } else {
        saveStatus = 'error';
      }
    } catch (err) {
      console.error('Auto-save failed:', err);
      saveStatus = 'error';
    } finally {
      isSaving = false;
    }
  }

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

      // Initialize classifications - use saved state if available, otherwise suggest
      if (data.savedClassifiedItems) {
        // Restore from saved state
        Object.entries(data.savedClassifiedItems).forEach(([key, value]: [string, any]) => {
          classifiedItems.set(parseInt(key), value);
        });
      } else {
        // Auto-suggest classifications
        extracted.items.forEach((item, index) => {
          const classification = suggestClassification(item.text);
          const fieldMapping = classification === 'dynamic'
            ? suggestFieldMapping(item.text, item, extracted.items)
            : null;

          classifiedItems.set(index, { classification, fieldMapping });
        });
      }

      // Restore custom areas if saved
      if (data.savedCustomAreas) {
        customAreas = data.savedCustomAreas;
        // Check for overlaps with restored areas
        customAreas.forEach((_, index) => {
          markOverlappingTextAsIgnored(index);
        });
      }

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

      // Highlight text items that will be covered by this box
      const dragRect = { x: x1, y: y1, width: x2 - x1, height: y2 - y1 };
      extractedText.items.forEach((item, index) => {
        const textRect = { x: item.x, y: item.y, width: item.width, height: item.height };
        if (rectanglesOverlap(textRect, dragRect)) {
          // Highlight overlapping text with orange
          ctx.strokeStyle = '#f97316';
          ctx.lineWidth = 2;
          ctx.strokeRect(item.x, item.y, item.width, item.height);
          ctx.fillStyle = 'rgba(249, 115, 22, 0.2)';
          ctx.fillRect(item.x, item.y, item.width, item.height);
        }
      });

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
      const isTable = area.isLineItemsTable && area.tableConfig;

      let strokeColor: string;
      let fillColor: string;

      if (isStatic) {
        strokeColor = isSelected ? '#6b7280' : '#9ca3af';
        fillColor = 'rgba(107, 114, 128, 0.15)';
      } else if (isMapped || isTable) {
        // Mapped dynamic or table - green
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

      // Draw table-specific overlays (column dividers and row grid)
      if (isTable && area.tableConfig) {
        const config = area.tableConfig;

        // Draw column dividers (vertical dashed lines)
        ctx.strokeStyle = isSelected ? '#10b981' : '#6ee7b7';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);

        let currentX = area.x;
        config.columns.forEach((column, colIndex) => {
          // Skip first column divider (left edge)
          if (colIndex > 0) {
            ctx.beginPath();
            ctx.moveTo(currentX, area.y);
            ctx.lineTo(currentX, area.y + area.height);
            ctx.stroke();
          }
          currentX += (column.widthPercent / 100) * area.width;
        });

        ctx.setLineDash([]); // Reset to solid lines

        // Draw row grid (horizontal lines) - only when selected for clarity
        if (isSelected) {
          ctx.strokeStyle = 'rgba(16, 185, 129, 0.3)';
          ctx.lineWidth = 1;
          ctx.setLineDash([2, 3]);

          let currentY = area.y + config.rowHeight;
          const maxY = area.y + area.height;

          while (currentY < maxY) {
            ctx.beginPath();
            ctx.moveTo(area.x, currentY);
            ctx.lineTo(area.x + area.width, currentY);
            ctx.stroke();
            currentY += config.rowHeight;
          }

          ctx.setLineDash([]); // Reset to solid lines
        }

        // Draw column labels on first row when selected
        if (isSelected) {
          ctx.font = '10px monospace';
          let currentX = area.x;

          config.columns.forEach((column, colIndex) => {
            const colWidth = (column.widthPercent / 100) * area.width;
            const label = column.field === 'custom' && column.customLabel
              ? column.customLabel
              : column.field.toUpperCase();

            const textMetrics = ctx.measureText(label);
            const textWidth = textMetrics.width;

            // Calculate text position based on alignment
            let textX = currentX;
            if (column.align === 'center') {
              textX = currentX + (colWidth - textWidth) / 2;
            } else if (column.align === 'right') {
              textX = currentX + colWidth - textWidth - 5;
            } else {
              textX = currentX + 5;
            }

            // Draw background for label
            ctx.fillStyle = 'rgba(16, 185, 129, 0.9)';
            ctx.fillRect(textX - 3, area.y + 2, textWidth + 6, 14);

            // Draw label text
            ctx.fillStyle = 'white';
            ctx.fillText(label, textX, area.y + 12);

            currentX += colWidth;
          });
        }
      }

      // Draw label for non-table areas
      if (!isTable && (isMapped || isSelected)) {
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
      } else if (isTable && !isSelected) {
        // Draw "Line Items Table" label for unselected tables
        const label = '📋 Line Items Table';
        ctx.font = 'bold 12px monospace';
        const textWidth = ctx.measureText(label).width;

        // Draw background for label
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(area.x + 5, area.y + 5, textWidth + 10, 18);

        // Draw label text
        ctx.fillStyle = strokeColor;
        ctx.fillText(label, area.x + 10, area.y + 17);
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

      // Mark any overlapping text items as ignored
      markOverlappingTextAsIgnored(selectedAreaIndex);

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

  // Helper function to check if two rectangles overlap
  function rectanglesOverlap(
    r1: { x: number; y: number; width: number; height: number },
    r2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      r1.x + r1.width < r2.x ||  // r1 is left of r2
      r1.x > r2.x + r2.width ||  // r1 is right of r2
      r1.y + r1.height < r2.y || // r1 is above r2
      r1.y > r2.y + r2.height    // r1 is below r2
    );
  }

  // Auto-detect line items table structure from text within a box
  function detectLineItemsTable(box: { x: number; y: number; width: number; height: number }) {
    if (!extractedText) return null;

    // 1. Filter text items within the box
    const itemsInBox = extractedText.items.filter(item =>
      rectanglesOverlap(
        { x: item.x, y: item.y, width: item.width, height: item.height },
        box
      )
    );

    if (itemsInBox.length === 0) {
      return null;
    }

    // 2. Group items by Y-position to find rows (tolerance: 5px)
    const tolerance = 5;
    const rows: typeof itemsInBox[] = [];

    itemsInBox.forEach(item => {
      const foundRow = rows.find(row =>
        Math.abs(row[0].y - item.y) < tolerance
      );

      if (foundRow) {
        foundRow.push(item);
      } else {
        rows.push([item]);
      }
    });

    // Sort rows by Y position
    rows.sort((a, b) => a[0].y - b[0].y);

    // Sort items within each row by X position
    rows.forEach(row => row.sort((a, b) => a.x - b.x));

    if (rows.length < 2) {
      // Need at least 2 rows for reliable detection
      return null;
    }

    // 3. Detect columns by analyzing X-positions across rows
    // Find common X-positions (column starts) across all rows
    const columnStarts: number[] = [];

    rows.forEach(row => {
      row.forEach(item => {
        // Check if this X position is similar to any existing column start
        const existingCol = columnStarts.find(x => Math.abs(x - item.x) < 10);
        if (!existingCol) {
          columnStarts.push(item.x);
        }
      });
    });

    columnStarts.sort((a, b) => a - b);

    // 4. Calculate column widths and create column configs
    const columns: TableColumn[] = [];

    for (let i = 0; i < columnStarts.length; i++) {
      const colStart = columnStarts[i];
      const colEnd = columnStarts[i + 1] || (box.x + box.width);
      const width = colEnd - colStart;
      const widthPercent = (width / box.width) * 100;

      // Infer field type based on column index and content patterns
      let field: TableColumn['field'] = 'description';
      let align: TableColumn['align'] = 'left';

      // Sample text from this column across rows
      const columnTexts = rows.map(row =>
        row.find(item => Math.abs(item.x - colStart) < 10)?.text || ''
      );

      // Detect if column contains numbers (quantity/rate/amount)
      const hasNumbers = columnTexts.some(text => /^\$?\d+\.?\d*$/.test(text.trim()));
      const hasDollar = columnTexts.some(text => text.includes('$'));

      if (i === 0) {
        field = 'description';
        align = 'left';
      } else if (hasNumbers && !hasDollar && width < box.width * 0.15) {
        field = 'quantity';
        align = 'center';
      } else if (hasDollar && i < columnStarts.length - 1) {
        field = 'rate';
        align = 'right';
      } else if (hasDollar) {
        field = 'amount';
        align = 'right';
      } else {
        field = 'custom';
        align = 'left';
      }

      columns.push({
        field,
        widthPercent: Math.round(widthPercent * 10) / 10,
        align
      });
    }

    // 5. Calculate average row height
    let totalRowHeight = 0;
    for (let i = 0; i < rows.length - 1; i++) {
      const rowGap = rows[i + 1][0].y - rows[i][0].y;
      totalRowHeight += rowGap;
    }
    const avgRowHeight = Math.round(totalRowHeight / (rows.length - 1));

    // 6. Calculate confidence score
    const allRowsHaveSameColumns = rows.every(row => row.length === columnStarts.length);
    const hasMinimumRows = rows.length >= 2;
    const hasReasonableRowHeight = avgRowHeight > 10 && avgRowHeight < 100;

    let confidence = 0;
    if (allRowsHaveSameColumns) confidence += 0.4;
    if (hasMinimumRows) confidence += 0.3;
    if (hasReasonableRowHeight) confidence += 0.3;

    console.log('✓ Detected line items table:', {
      rows: rows.length,
      columns: columns.length,
      rowHeight: avgRowHeight,
      confidence
    });

    return {
      columns,
      rowHeight: avgRowHeight,
      headerRow: true, // Assume first row is headers by default
      autoDetected: true,
      detectedRows: rows.length,
      confidence
    };
  }

  // Store original state of text items before marking as ignored
  const textItemOriginalStates = new Map<number, { classification: 'static' | 'dynamic', fieldMapping: string | null }>();

  // Mark text items that are covered by a custom area as ignored
  function markOverlappingTextAsIgnored(areaIndex: number) {
    if (!extractedText) return;

    const area = customAreas[areaIndex];
    if (!area) return;

    const coveredIndices: number[] = [];
    let overlappingCount = 0;

    extractedText.items.forEach((item, index) => {
      const textRect = {
        x: item.x,
        y: item.y,
        width: item.width,
        height: item.height
      };

      const areaRect = {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height
      };

      // If text item overlaps with the custom area, mark it as ignored
      if (rectanglesOverlap(textRect, areaRect)) {
        const current = classifiedItems.get(index);
        if (current) {
          // Save original state if not already saved
          if (!textItemOriginalStates.has(index)) {
            textItemOriginalStates.set(index, {
              classification: current.classification,
              fieldMapping: current.fieldMapping
            });
          }

          // Mark as ignored if not already
          if (current.fieldMapping !== '__ignore__') {
            classifiedItems.set(index, {
              classification: current.classification,
              fieldMapping: '__ignore__'
            });
            overlappingCount++;
          }

          coveredIndices.push(index);
        }
      }
    });

    // Store covered indices in the area
    area.coveredTextIndices = coveredIndices;

    if (overlappingCount > 0) {
      // Trigger reactivity
      classifiedItems = new Map(classifiedItems);
      console.log(`✓ Marked ${overlappingCount} overlapping text items as ignored for custom area`);
      redraw();
    }
  }

  // Restore text items that were covered by a deleted custom area
  function restoreCoveredTextItems(areaIndex: number) {
    if (!extractedText) return;

    const area = customAreas[areaIndex];
    if (!area || !area.coveredTextIndices) return;

    let restoredCount = 0;

    area.coveredTextIndices.forEach(textIndex => {
      // Check if this text is covered by any OTHER custom area
      const coveredByOtherArea = customAreas.some((otherArea, otherIndex) => {
        if (otherIndex === areaIndex) return false; // Skip the area being deleted
        if (!otherArea.coveredTextIndices) return false;
        return otherArea.coveredTextIndices.includes(textIndex);
      });

      // Only restore if not covered by another area
      if (!coveredByOtherArea) {
        const originalState = textItemOriginalStates.get(textIndex);
        if (originalState) {
          classifiedItems.set(textIndex, originalState);
          textItemOriginalStates.delete(textIndex);
          restoredCount++;
        }
      }
    });

    if (restoredCount > 0) {
      classifiedItems = new Map(classifiedItems);
      console.log(`✓ Restored ${restoredCount} text items after deleting custom area`);
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

    // Create new Map to trigger reactivity
    classifiedItems = new Map(classifiedItems);
    classifiedItems.set(index, {
      ...current,
      fieldMapping
    });
  }

  function detectSimilarField(customName: string): string | null {
    const normalized = customName.toLowerCase().replace(/[^a-z0-9]/g, '');

    // Check if it matches any standard field (only check standard fields, not custom ones)
    for (const field of standardFieldOptions) {
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

  async function saveCustomField(useSuggestion: boolean) {
    let fieldValue: string;
    let fieldLabel: string;

    if (useSuggestion && customFieldSuggestion) {
      // Use suggested standard field
      fieldValue = customFieldSuggestion;
    } else {
      // Create custom field (prefix with custom_)
      fieldValue = 'custom_' + customFieldName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      fieldLabel = customFieldName;

      // Create org-wide custom field in database (if it doesn't exist)
      const existingField = customFieldsList.find((f: any) => f.field_name === fieldValue);
      if (!existingField) {
        try {
          const formData = new FormData();
          formData.append('field_label', fieldLabel);

          const response = await fetch('/app/settings?/createCustomField', {
            method: 'POST',
            body: formData
          });

          if (response.ok) {
            // Add the new field to customFieldsList immediately for UI update
            customFieldsList = [...customFieldsList, {
              field_name: fieldValue,
              field_label: fieldLabel,
              field_type: 'text'
            }];
          }
        } catch (err) {
          console.error('Failed to create org-wide custom field:', err);
        }
      }
    }

    // Handle text item custom field
    if (customFieldIndex !== null) {
      const current = classifiedItems.get(customFieldIndex);
      if (current) {
        // Create new Map to trigger reactivity
        classifiedItems = new Map(classifiedItems);
        classifiedItems.set(customFieldIndex, {
          ...current,
          fieldMapping: fieldValue
        });
      }
    }

    // Handle area custom field
    if (customFieldAreaIndex !== null) {
      customAreas = customAreas.map((area, index) => {
        if (index === customFieldAreaIndex) {
          return {
            ...area,
            classification: 'dynamic',
            fieldMapping: fieldValue
          };
        }
        return area;
      });
      redraw();
    }

    // Reset custom field state
    customFieldIndex = null;
    customFieldAreaIndex = null;
    customFieldName = '';
    customFieldSuggestion = null;
  }

  function cancelCustomField() {
    customFieldIndex = null;
    customFieldAreaIndex = null;
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

    // Restore text items covered by this area before deleting
    restoreCoveredTextItems(selectedAreaIndex);

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

  // Track which fields have been used (from both text items and custom areas)
  let usedFields = $derived.by(() => {
    const used = new Set<string>();

    // Add fields from classified text items
    classifiedItems.forEach((classification) => {
      if (classification.fieldMapping && classification.fieldMapping !== '__ignore__' && !classification.fieldMapping.startsWith('custom_')) {
        used.add(classification.fieldMapping);
      }
    });

    // Add fields from custom areas
    customAreas.forEach((area) => {
      if (area.fieldMapping && area.fieldMapping !== '__ignore__' && !area.fieldMapping.startsWith('custom_')) {
        used.add(area.fieldMapping);
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

    <div class="flex items-center gap-3">
      {#if saveStatus === 'saving'}
        <span class="text-xs text-gray-600">Saving...</span>
      {:else if saveStatus === 'saved'}
        <span class="text-xs text-green-600">✓ Saved</span>
      {:else if saveStatus === 'error'}
        <span class="text-xs text-red-600">Save failed</span>
      {/if}

      <button
        onclick={generateTemplate}
        disabled={generating || loading || stats.dynamic === 0}
        class="px-6 py-2 bg-black text-white text-xs rounded-sm hover:bg-gray-800 disabled:bg-gray-300"
      >
        {generating ? 'Generating Template...' : 'Generate Template'}
      </button>
    </div>
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
    <div class="lg:col-span-2 space-y-4">
      <div class="border border-thin rounded-sm p-4 bg-white flex items-start justify-center">
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

      <!-- Custom field input for area (shows when area selected for custom field) -->
      {#if customFieldAreaIndex !== null}
        <div class="border border-thin rounded-sm p-4 bg-blue-50">
          <div class="text-xs font-medium mb-3">Create Custom Field for Selected Area</div>
          <div class="space-y-2">
            <input
              type="text"
              bind:value={customFieldName}
              oninput={handleCustomFieldInput}
              placeholder="Enter field name..."
              class="w-full px-2 py-1.5 text-xs border border-gray-300 rounded-sm"
              autofocus
            />

            {#if customFieldSuggestion}
              <div class="text-xs p-2 bg-white border border-blue-300 rounded-sm">
                <div class="text-blue-700 mb-1">Did you mean:</div>
                <button
                  onclick={() => saveCustomField(true)}
                  class="text-blue-600 hover:underline font-medium"
                >
                  {fieldOptions.find(f => f.value === customFieldSuggestion)?.label}
                </button>
              </div>
            {/if}

            <div class="flex gap-2">
              <button
                onclick={() => saveCustomField(false)}
                disabled={!customFieldName.trim()}
                class="flex-1 px-3 py-1.5 text-xs bg-black text-white rounded-sm hover:bg-gray-800 disabled:bg-gray-300"
              >
                Save Custom Field
              </button>
              <button
                onclick={cancelCustomField}
                class="px-3 py-1.5 text-xs border border-gray-300 bg-white rounded-sm hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      {/if}
    </div>

    <!-- Sidebar -->
    <div class="space-y-4">
      <!-- Text Items List -->
      {#if extractedText}
        <div class="border border-thin rounded-sm p-4 space-y-3">
          <div class="text-xs font-medium">Fields ({extractedText.items.length + customAreas.length})</div>
          <div class="space-y-2">
            <!-- Custom Boxes (shown first) -->
            {#each customAreas as area, areaIndex}
              {@const isSelected = selectedAreaIndex === areaIndex}
              {@const isMapped = area.fieldMapping && area.fieldMapping !== '' && area.fieldMapping !== '__ignore__'}
              {@const mappingLabel = isMapped
                ? fieldOptions.find(f => f.value === area.fieldMapping)?.label || area.fieldMapping
                : null}
              {@const coveredCount = area.coveredTextIndices?.length || 0}

              <div
                class="border rounded-sm p-2 text-xs cursor-pointer transition-colors {isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'} {isMapped ? 'bg-green-50' : 'bg-blue-50'}"
                onclick={() => { selectedAreaIndex = areaIndex; selectedItemIndex = null; redraw(); }}
              >
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-1.5 flex-1 min-w-0">
                    {#if isMapped}
                      <span class="text-green-600 text-sm flex-shrink-0">✓</span>
                    {/if}
                    <div class="flex items-center gap-2 flex-1">
                      <span class="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 rounded border border-indigo-300 font-medium flex-shrink-0">
                        Custom Box
                      </span>
                      {#if coveredCount > 0}
                        <span class="text-[10px] text-gray-400">({coveredCount} text{coveredCount !== 1 ? 's' : ''} replaced)</span>
                      {/if}
                    </div>
                  </div>
                </div>

                <!-- Dropdown for custom area mapping -->
                <select
                  value={area.isLineItemsTable ? '__line_items_table__' : (area.fieldMapping || '')}
                  onchange={(e) => {
                    const newMapping = e.currentTarget.value;

                    if (newMapping === '__line_items_table__') {
                      // Run auto-detection
                      const detected = detectLineItemsTable({
                        x: area.x,
                        y: area.y,
                        width: area.width,
                        height: area.height
                      });

                      if (detected) {
                        // Mark as line items table and show config modal
                        customAreas[areaIndex].isLineItemsTable = true;
                        customAreas[areaIndex].tableConfig = detected;
                        customAreas[areaIndex].fieldMapping = '__line_items_table__';
                        customAreas = [...customAreas];

                        // Show configuration modal
                        editingTableIndex = areaIndex;
                        showTableConfigModal = true;
                      } else {
                        // No table detected, show error or simple config
                        alert('Could not auto-detect table structure. Please configure manually.');
                        customAreas[areaIndex].isLineItemsTable = true;
                        customAreas[areaIndex].fieldMapping = '__line_items_table__';
                        customAreas[areaIndex].tableConfig = {
                          columns: [
                            { field: 'description', widthPercent: 50, align: 'left' },
                            { field: 'quantity', widthPercent: 15, align: 'center' },
                            { field: 'rate', widthPercent: 17.5, align: 'right' },
                            { field: 'amount', widthPercent: 17.5, align: 'right' }
                          ],
                          rowHeight: 24,
                          headerRow: true,
                          autoDetected: false
                        };
                        customAreas = [...customAreas];
                        editingTableIndex = areaIndex;
                        showTableConfigModal = true;
                      }
                    } else {
                      // Regular field mapping
                      customAreas[areaIndex].isLineItemsTable = false;
                      customAreas[areaIndex].tableConfig = undefined;
                      customAreas[areaIndex].fieldMapping = newMapping;
                      customAreas = [...customAreas];
                    }

                    redraw();
                  }}
                  onclick={(e) => e.stopPropagation()}
                  class="w-full px-2 py-1 text-xs border rounded-sm {isMapped || area.isLineItemsTable ? 'border-green-300 bg-green-50 text-green-700 font-medium' : 'border-gray-200'}"
                >
                  <option value="">-- Select field --</option>
                  {#each fieldOptions as field}
                    {@const isUsed = usedFields.has(field.value) && area.fieldMapping !== field.value}
                    {@const canReuse = reusableFields.has(field.value)}
                    <option value={field.value} disabled={isUsed && !canReuse}>
                      {field.label}{isUsed && !canReuse ? ' ✓' : ''}{canReuse && isUsed ? ' (reusable)' : ''}
                    </option>
                  {/each}
                </select>
              </div>
            {/each}

            <!-- Text Items (hide if covered by box) -->
            {#each extractedText.items as item, index}
              {@const classification = classifiedItems.get(index)}
              {@const isSelected = selectedItemIndex === index}
              {@const isStatic = classification?.classification === 'static'}
              {@const isDynamic = classification?.classification === 'dynamic'}
              {@const isMapped = isDynamic && classification.fieldMapping && classification.fieldMapping !== ''}
              {@const isIgnored = classification?.fieldMapping === '__ignore__'}
              {@const isCoveredByBox = customAreas.some(area => area.coveredTextIndices?.includes(index))}

              <!-- Skip rendering if covered by a box -->
              {#if !isCoveredByBox}
              <div
                class="border rounded-sm p-2 text-xs cursor-pointer transition-colors {isSelected ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-gray-300'} {isMapped ? 'bg-green-50' : isDynamic && !isIgnored ? 'bg-blue-50' : isStatic ? 'bg-gray-50' : ''}"
                onclick={() => { selectedItemIndex = index; selectedAreaIndex = null; redraw(); }}
              >
                <div class="flex items-start justify-between gap-2 mb-2">
                  <div class="flex items-center gap-1.5 flex-1 min-w-0">
                    {#if isMapped}
                      <span class="text-green-600 text-sm flex-shrink-0">✓</span>
                    {/if}
                    <div class="font-mono text-xs break-all {isIgnored ? 'text-gray-300 line-through' : isStatic ? 'text-gray-400' : isMapped ? 'text-green-700' : 'text-blue-700'}">
                      {item.text}
                    </div>
                  </div>
                  <!-- Toggle Switch -->
                  <button
                    onclick={(e) => { e.stopPropagation(); toggleClassification(index); }}
                    class="flex items-center gap-1.5 text-xs flex-shrink-0"
                    title="Toggle between static and dynamic"
                  >
                    <span class="text-[10px] uppercase tracking-wide {isStatic ? 'font-medium text-gray-500' : 'text-gray-400'}">Static</span>
                    <div class="relative inline-block w-8 h-4 rounded-full transition-colors {isStatic ? 'bg-gray-300' : 'bg-blue-500'}">
                      <div class="absolute top-0.5 transition-transform rounded-full w-3 h-3 bg-white {isStatic ? 'left-0.5' : 'left-4'}"></div>
                    </div>
                    <span class="text-[10px] uppercase tracking-wide {!isStatic ? 'font-medium text-gray-600' : 'text-gray-400'}">Dynamic</span>
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
                      class="w-full px-2 py-1 text-xs border rounded-sm {isMapped ? 'border-green-300 bg-green-50 text-green-700 font-medium' : 'border-gray-200'}"
                    >
                      <option value="">-- Select field --</option>
                      {#each fieldOptions as field}
                        {@const isUsed = usedFields.has(field.value) && classification.fieldMapping !== field.value}
                        {@const canReuse = reusableFields.has(field.value)}
                        <option value={field.value} disabled={isUsed && !canReuse}>
                          {field.label}{isUsed && !canReuse ? ' ✓' : ''}{canReuse && isUsed ? ' (reusable)' : ''}
                        </option>
                      {/each}
                      <option value="__custom__">✨ Custom field...</option>
                    </select>
                  {/if}
                {/if}
              </div>
              {/if}
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
            {@const canReuse = reusableFields.has(field.value)}
            {@const currentFieldMapping = selectedAreaIndex !== null ? customAreas[selectedAreaIndex]?.fieldMapping : (selectedItemIndex !== null ? classifiedItems.get(selectedItemIndex)?.fieldMapping : null)}
            {@const isCurrent = currentFieldMapping === field.value}
            <button
              onclick={() => selectedAreaIndex !== null ? applyToArea(field.value) : applyToTextItem(field.value)}
              class="w-full text-left px-2 py-1.5 text-xs rounded-sm flex items-center justify-between gap-2 {isCurrent ? 'bg-green-100 hover:bg-green-200 font-medium' : 'hover:bg-gray-100'}"
              disabled={isUsed && !canReuse && !isCurrent}
            >
              <span class={isUsed && !canReuse && !isCurrent ? 'text-gray-400' : isCurrent ? 'text-green-700' : ''}>{field.label}</span>
              {#if isCurrent}
                <span class="text-green-600 text-sm">✓</span>
              {:else if isUsed && !isCurrent}
                <span class="text-green-600 text-sm">✓</span>
              {/if}
            </button>
          {/each}

          <div class="border-t border-gray-200 my-1"></div>

          <button
            onclick={() => {
              if (selectedItemIndex !== null) {
                customFieldIndex = selectedItemIndex;
                customFieldName = '';
                customFieldSuggestion = null;
                showMultiSelectPopup = false;
              } else if (selectedAreaIndex !== null) {
                customFieldAreaIndex = selectedAreaIndex;
                customFieldName = '';
                customFieldSuggestion = null;
                showMultiSelectPopup = false;
              }
            }}
            class="w-full text-left px-2 py-1.5 text-xs hover:bg-gray-100 rounded-sm"
          >
            Custom Field...
          </button>
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

<!-- Line Items Table Configuration Modal -->
{#if showTableConfigModal && editingTableIndex !== null && customAreas[editingTableIndex]?.tableConfig}
  {@const tableConfig = customAreas[editingTableIndex].tableConfig}
  <div
    class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    onclick={() => {
      showTableConfigModal = false;
      editingTableIndex = null;
    }}
  >
    <div
      class="bg-white rounded-sm shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
      onclick={(e) => e.stopPropagation()}
    >
      <!-- Header -->
      <div class="border-b border-gray-200 p-4">
        <h2 class="text-sm font-medium">Line Items Table Configuration</h2>
        {#if tableConfig.autoDetected}
          <p class="text-xs text-gray-600 mt-1">
            ✓ Auto-detected {tableConfig.detectedRows} rows, {tableConfig.columns.length} columns
            {#if tableConfig.confidence}
              (confidence: {Math.round(tableConfig.confidence * 100)}%)
            {/if}
          </p>
        {/if}
      </div>

      <!-- Body -->
      <div class="p-4 space-y-4">
        <!-- Columns Configuration -->
        <div>
          <label class="block text-xs font-medium text-gray-700 mb-2">Columns</label>
          <div class="space-y-2">
            {#each tableConfig.columns as column, colIndex}
              <div class="border border-gray-200 rounded-sm p-3">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-xs font-medium">Column {colIndex + 1}</span>
                  {#if tableConfig.columns.length > 1}
                    <button
                      type="button"
                      onclick={() => {
                        tableConfig.columns.splice(colIndex, 1);
                        customAreas = [...customAreas];
                      }}
                      class="text-xs text-red-600 hover:text-red-700"
                    >
                      Remove
                    </button>
                  {/if}
                </div>

                <div class="grid grid-cols-2 gap-2">
                  <!-- Field Type -->
                  <div>
                    <label class="block text-xs text-gray-600 mb-1">Field</label>
                    <select
                      bind:value={column.field}
                      class="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm"
                    >
                      <option value="description">Description</option>
                      <option value="quantity">Quantity</option>
                      <option value="rate">Rate</option>
                      <option value="amount">Amount</option>
                      <option value="tax">Tax</option>
                      <option value="custom">Custom</option>
                    </select>
                    {#if column.field === 'custom'}
                      <input
                        type="text"
                        bind:value={column.customLabel}
                        placeholder="Custom label..."
                        class="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm mt-1"
                      />
                    {/if}
                  </div>

                  <!-- Alignment -->
                  <div>
                    <label class="block text-xs text-gray-600 mb-1">Align</label>
                    <select
                      bind:value={column.align}
                      class="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                </div>

                <!-- Width Slider -->
                <div class="mt-2">
                  <label class="block text-xs text-gray-600 mb-1">
                    Width: {column.widthPercent.toFixed(1)}%
                  </label>
                  <input
                    type="range"
                    min="5"
                    max="80"
                    step="0.5"
                    bind:value={column.widthPercent}
                    onchange={() => {
                      // Normalize widths to 100%
                      const total = tableConfig.columns.reduce((sum, c) => sum + c.widthPercent, 0);
                      if (total !== 100) {
                        const factor = 100 / total;
                        tableConfig.columns.forEach(c => {
                          c.widthPercent = c.widthPercent * factor;
                        });
                      }
                      customAreas = [...customAreas];
                    }}
                    class="w-full"
                  />
                </div>
              </div>
            {/each}
          </div>

          <button
            type="button"
            onclick={() => {
              tableConfig.columns.push({
                field: 'custom',
                widthPercent: 10,
                align: 'left'
              });
              // Re-normalize widths
              const total = tableConfig.columns.reduce((sum, c) => sum + c.widthPercent, 0);
              const factor = 100 / total;
              tableConfig.columns.forEach(c => {
                c.widthPercent = c.widthPercent * factor;
              });
              customAreas = [...customAreas];
            }}
            class="mt-2 px-3 py-1.5 text-xs border border-gray-300 rounded-sm hover:bg-gray-50"
          >
            + Add Column
          </button>
        </div>

        <!-- Row Settings -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 mb-1">Row Height (px)</label>
            <input
              type="number"
              bind:value={tableConfig.rowHeight}
              min="10"
              max="100"
              class="w-full px-2 py-1 text-xs border border-gray-300 rounded-sm"
            />
          </div>

          <div class="flex items-end">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                bind:checked={tableConfig.headerRow}
                class="w-4 h-4"
              />
              <span class="text-xs text-gray-700">First row is headers</span>
            </label>
          </div>
        </div>

        <!-- Table Preview -->
        <div class="border border-gray-200 rounded-sm p-3 bg-gray-50">
          <div class="text-xs font-medium text-gray-700 mb-2">Preview</div>
          <div class="text-[10px] font-mono">
            <div class="flex border-b border-gray-300">
              {#each tableConfig.columns as column}
                <div style="width: {column.widthPercent}%; text-align: {column.align}" class="px-1 py-1 truncate">
                  {column.field === 'custom' && column.customLabel ? column.customLabel : column.field}
                </div>
              {/each}
            </div>
            <div class="flex">
              {#each tableConfig.columns as column}
                <div style="width: {column.widthPercent}%; text-align: {column.align}" class="px-1 py-1 text-gray-500 truncate">
                  {column.field === 'description' ? 'Sample item...' : column.field === 'quantity' ? '5' : column.field === 'rate' ? '$150' : column.field === 'amount' ? '$750' : '...'}
                </div>
              {/each}
            </div>
          </div>
          <div class="text-[10px] text-gray-500 mt-2">
            Estimated capacity: ~{Math.floor(customAreas[editingTableIndex].height / tableConfig.rowHeight)} rows
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 p-4 flex justify-end gap-2">
        <button
          type="button"
          onclick={() => {
            // Reset to non-table
            customAreas[editingTableIndex].isLineItemsTable = false;
            customAreas[editingTableIndex].tableConfig = undefined;
            customAreas[editingTableIndex].fieldMapping = '';
            customAreas = [...customAreas];
            showTableConfigModal = false;
            editingTableIndex = null;
            redraw();
          }}
          class="px-3 py-1.5 text-xs border border-gray-300 rounded-sm hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={() => {
            showTableConfigModal = false;
            editingTableIndex = null;
            redraw();
          }}
          class="px-3 py-1.5 text-xs bg-black text-white rounded-sm hover:bg-gray-800"
        >
          Save Configuration
        </button>
      </div>
    </div>
  </div>
{/if}
