/**
 * PDF Text Extraction Utilities
 *
 * Uses PDF.js to extract text content with precise positioning from PDF files.
 * This is used to intelligently separate static labels from dynamic data in
 * uploaded invoice templates.
 */

import * as pdfjsLib from 'pdfjs-dist';

export interface TextItem {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontName: string;
  transform: number[]; // PDF transform matrix
}

export interface ExtractedText {
  items: TextItem[];
  pageWidth: number;
  pageHeight: number;
  dpi: number;
}

/**
 * Extract all text items with positions from a PDF file
 * @param file PDF file to extract text from
 * @param dpi Target DPI for coordinate conversion (default: 300)
 * @returns Extracted text items with positions
 */
export async function extractTextFromPdf(
  file: File | ArrayBuffer,
  dpi: number = 300
): Promise<ExtractedText> {
  // Load PDF
  const arrayBuffer = file instanceof File ? await file.arrayBuffer() : file;
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  // Get first page only (MVP - single page invoices)
  const page = await pdf.getPage(1);

  // Get page dimensions at target DPI
  const scale = dpi / 72; // PDF is natively 72 DPI
  const viewport = page.getViewport({ scale });
  const pageWidth = viewport.width;
  const pageHeight = viewport.height;

  // Extract text content (this returns coordinates at scale 1.0)
  const textContent = await page.getTextContent();

  // Convert text items to our format
  const items: TextItem[] = textContent.items
    .filter((item): item is any => 'str' in item && 'transform' in item)
    .map((item) => {
      // PDF.js returns transform matrix: [scaleX, skewY, skewX, scaleY, translateX, translateY]
      // These are at 72 DPI (scale 1.0), so we need to scale them to our target DPI
      const transform = item.transform;
      const fontSize = Math.abs(transform[3]) * scale; // scaleY gives font height, scaled to target DPI
      const x = transform[4] * scale; // translateX, scaled to target DPI
      const y = transform[5] * scale; // translateY, scaled to target DPI

      // Estimate width based on text length and font size (rough approximation)
      const width = item.width ? (item.width * scale) : (item.str.length * fontSize * 0.5);
      const height = fontSize;

      return {
        text: item.str.trim(),
        x,
        y: pageHeight - y - fontSize, // Flip Y coordinate and offset by font height (PDF Y is at baseline, we want top)
        width,
        height,
        fontSize,
        fontName: item.fontName || 'unknown',
        transform
      };
    })
    .filter(item => item.text.length > 0); // Filter out empty strings

  return {
    items,
    pageWidth,
    pageHeight,
    dpi
  };
}

/**
 * Detect if a text item is likely to be dynamic data vs. static label
 * Uses pattern matching and heuristics
 */
export function suggestClassification(text: string): 'static' | 'dynamic' {
  const trimmed = text.trim();

  // Dynamic patterns
  const dynamicPatterns = [
    /^INV-\d{4}-\d+$/, // Invoice number: INV-2024-001
    /^\d{1,2}\/\d{1,2}\/\d{2,4}$/, // Date: 01/15/2024
    /^\d{4}-\d{2}-\d{2}$/, // Date: 2024-01-15
    /^\$[\d,]+\.?\d*$/, // Currency: $1,234.56
    /^[\d,]+\.?\d*$/, // Number: 1234.56
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // Email
    /^\d{1,3}$/, // Quantity: 1, 2, 123
    /^#\d+$/, // ID: #123
  ];

  for (const pattern of dynamicPatterns) {
    if (pattern.test(trimmed)) {
      return 'dynamic';
    }
  }

  // Static patterns (labels, headers)
  const staticPatterns = [
    /^(invoice|bill to|bill from|date|due date|amount|total|subtotal|tax|item|description|qty|quantity|price|notes|payment|terms)$/i,
    /^[A-Z\s]{2,}$/, // All caps labels: "INVOICE NUMBER"
    /:\s*$/, // Ends with colon: "Date:"
  ];

  for (const pattern of staticPatterns) {
    if (pattern.test(trimmed)) {
      return 'static';
    }
  }

  // Default: If it's short and has no special chars, likely a label
  if (trimmed.length < 20 && !/[\d@$]/.test(trimmed)) {
    return 'static';
  }

  // Default to dynamic if unsure (safer - user can override)
  return 'dynamic';
}

/**
 * Suggest field mapping for dynamic text based on patterns and position
 */
export function suggestFieldMapping(
  text: string,
  item: TextItem,
  allItems: TextItem[]
): string | null {
  const trimmed = text.trim();

  // Invoice number patterns
  if (/^INV-\d{4}-\d+$/.test(trimmed) || /^#?\d{4,}$/.test(trimmed)) {
    return 'invoice_number';
  }

  // Date patterns (look for nearby "Date" or "Due" label)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(trimmed) || /^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    // Check if there's a "Due" label nearby
    const nearbyItems = allItems.filter(
      other => Math.abs(other.y - item.y) < 20 && other.x < item.x
    );
    const hasDueLabel = nearbyItems.some(i => /due/i.test(i.text));

    return hasDueLabel ? 'due_date' : 'issue_date';
  }

  // Currency/amount patterns
  if (/^\$[\d,]+\.?\d*$/.test(trimmed)) {
    // Check if it's in bottom-right area (likely grand total)
    // This is a rough heuristic - would need page dimensions for accuracy
    return 'grand_total'; // Could be subtotal, tax_total, or grand_total
  }

  // Email pattern
  if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) {
    return 'client_email';
  }

  // Quantity (small numbers, usually in table)
  if (/^\d{1,3}$/.test(trimmed) && parseInt(trimmed) < 1000) {
    return null; // Part of items_table, will be handled separately
  }

  return null;
}

/**
 * Detect table structures in extracted text
 * Looks for grid patterns with aligned rows and columns
 */
export function detectTables(items: TextItem[]): Array<{
  items: TextItem[];
  x: number;
  y: number;
  width: number;
  height: number;
  rows: number;
  columns: number;
}> {
  // Group items by Y coordinate (rows)
  const rowGroups = new Map<number, TextItem[]>();
  const tolerance = 5; // pixels

  items.forEach(item => {
    const yKey = Math.round(item.y / tolerance) * tolerance;
    if (!rowGroups.has(yKey)) {
      rowGroups.set(yKey, []);
    }
    rowGroups.get(yKey)!.push(item);
  });

  // Find rows with multiple items (potential table rows)
  const tableRows = Array.from(rowGroups.entries())
    .filter(([_, items]) => items.length >= 3) // At least 3 columns
    .sort((a, b) => a[0] - b[0]); // Sort by Y

  if (tableRows.length < 2) {
    return []; // Need at least 2 rows for a table
  }

  // Find consecutive rows with similar column structure
  const tables: Array<{
    items: TextItem[];
    x: number;
    y: number;
    width: number;
    height: number;
    rows: number;
    columns: number;
  }> = [];

  let currentTable: TextItem[] = [];
  let prevRowY = -1000;

  tableRows.forEach(([y, rowItems]) => {
    const rowSpacing = y - prevRowY;

    if (currentTable.length === 0 || rowSpacing < 50) {
      // Start new table or continue current one
      currentTable.push(...rowItems);
    } else {
      // Gap too large, finalize current table and start new one
      if (currentTable.length >= 6) { // At least 2 rows x 3 cols
        tables.push(finalizeTable(currentTable));
      }
      currentTable = [...rowItems];
    }

    prevRowY = y;
  });

  // Finalize last table
  if (currentTable.length >= 6) {
    tables.push(finalizeTable(currentTable));
  }

  return tables;
}

function finalizeTable(items: TextItem[]) {
  const xs = items.map(i => i.x);
  const ys = items.map(i => i.y);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs.map((x, i) => x + items[i].width));
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys.map((y, i) => y + items[i].height));

  // Estimate rows and columns (rough)
  const uniqueYs = new Set(ys.map(y => Math.round(y / 5) * 5));
  const uniqueXs = new Set(xs.map(x => Math.round(x / 10) * 10));

  return {
    items,
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    rows: uniqueYs.size,
    columns: uniqueXs.size
  };
}
