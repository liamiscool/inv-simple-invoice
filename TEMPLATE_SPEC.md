# Template Specification

## Overview
Templates define how invoice data is positioned and styled in the final PDF output. Each template contains metadata and field positioning information.

## Template JSON Structure

```typescript
interface TemplateSpec {
  meta: {
    name: string;           // Display name
    description?: string;   // Optional description
    width: number;          // Page width in mm (A4: 210)
    height: number;         // Page height in mm (A4: 297)
    dpi: number;           // Resolution (300 for print quality)
    margins: {             // Page margins in mm
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
  };
  
  styles: {
    fonts: {
      primary: string;     // Main font family
      secondary?: string;  // Optional secondary font
    };
    colors: {
      primary: string;     // Main text color (hex)
      secondary: string;   // Secondary text color (hex)
      accent?: string;     // Optional accent color
    };
    sizes: {
      default: number;     // Default font size in pt
      small: number;       // Small text size
      large: number;       // Large text size
      title: number;       // Title/header size
    };
  };
  
  areas: {
    // Fixed text areas
    invoice_title?: AreaSpec;
    invoice_number?: AreaSpec;
    issue_date?: AreaSpec;
    due_date?: AreaSpec;
    
    // Company info
    company_info?: AreaSpec;
    company_address?: AreaSpec;
    
    // Client info
    client_name?: AreaSpec;
    client_company?: AreaSpec;
    client_address?: AreaSpec;
    client_email?: AreaSpec;
    
    // Items table
    items_table: TableSpec;
    
    // Totals
    subtotal?: AreaSpec;
    tax_total?: AreaSpec;
    grand_total: AreaSpec;
    
    // Additional
    notes?: AreaSpec;
    payment_info?: AreaSpec;
    footer?: AreaSpec;
  };
}

interface AreaSpec {
  x: number;              // X position in mm from left
  y: number;              // Y position in mm from top
  w?: number;             // Width in mm (optional)
  h?: number;             // Height in mm (optional)
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  font_size?: number;     // Override default font size
  font_weight?: 'normal' | 'bold';
  color?: string;         // Override default color
  style?: 'normal' | 'italic';
}

interface TableSpec {
  x: number;              // Table start X position
  y: number;              // Table start Y position
  w: number;              // Total table width
  row_height: number;     // Height of each row in mm
  header_height?: number; // Height of header row (defaults to row_height)
  
  columns: ColumnSpec[];
  
  // Styling
  border_color?: string;
  border_width?: number;
  header_bg?: string;
  alt_row_bg?: string;    // Alternating row background
  
  // Header styling
  header_font_size?: number;
  header_font_weight?: 'normal' | 'bold';
  header_color?: string;
}

interface ColumnSpec {
  key: 'description' | 'qty' | 'unit_price' | 'tax_rate' | 'line_total';
  label: string;          // Column header text
  w: number;              // Column width in mm
  align?: 'left' | 'center' | 'right';
  font_size?: number;
}
```

## Example: Minimal Template

```json
{
  "meta": {
    "name": "Minimal",
    "description": "Clean, minimal invoice template",
    "width": 210,
    "height": 297,
    "dpi": 300,
    "margins": {
      "top": 20,
      "right": 20,
      "bottom": 20,
      "left": 20
    }
  },
  "styles": {
    "fonts": {
      "primary": "Arial, sans-serif"
    },
    "colors": {
      "primary": "#000000",
      "secondary": "#666666"
    },
    "sizes": {
      "default": 10,
      "small": 8,
      "large": 12,
      "title": 18
    }
  },
  "areas": {
    "invoice_title": {
      "x": 20,
      "y": 20,
      "font_size": 18,
      "font_weight": "bold"
    },
    "invoice_number": {
      "x": 150,
      "y": 20,
      "align": "right"
    },
    "company_info": {
      "x": 20,
      "y": 40,
      "w": 80,
      "h": 30
    },
    "client_name": {
      "x": 20,
      "y": 80,
      "font_weight": "bold"
    },
    "client_company": {
      "x": 20,
      "y": 85
    },
    "issue_date": {
      "x": 120,
      "y": 80
    },
    "due_date": {
      "x": 120,
      "y": 85
    },
    "items_table": {
      "x": 20,
      "y": 110,
      "w": 170,
      "row_height": 8,
      "header_height": 10,
      "columns": [
        {
          "key": "description",
          "label": "Description",
          "w": 90,
          "align": "left"
        },
        {
          "key": "qty",
          "label": "Qty",
          "w": 20,
          "align": "center"
        },
        {
          "key": "unit_price",
          "label": "Price",
          "w": 25,
          "align": "right"
        },
        {
          "key": "line_total",
          "label": "Total",
          "w": 35,
          "align": "right"
        }
      ]
    },
    "subtotal": {
      "x": 150,
      "y": 200,
      "w": 40,
      "align": "right"
    },
    "tax_total": {
      "x": 150,
      "y": 205,
      "w": 40,
      "align": "right"
    },
    "grand_total": {
      "x": 150,
      "y": 210,
      "w": 40,
      "align": "right",
      "font_weight": "bold"
    },
    "notes": {
      "x": 20,
      "y": 230,
      "w": 170,
      "h": 30
    }
  }
}
```

## Template Types

1. **curated**: Built-in templates (org_id = null)
2. **custom**: User-uploaded templates (linked to org_id)

## Database Schema

The template table already exists with:
- `id`: UUID primary key
- `org_id`: UUID (null for curated templates)
- `title`: Template display name
- `kind`: 'curated' | 'custom'
- `spec`: JSONB containing the template specification
- `created_at`: Timestamp

## Validation Rules

1. All coordinates must be within page bounds
2. Table must fit within page width
3. Required areas: `items_table`, `grand_total`
4. Font sizes must be between 6pt and 72pt
5. Colors must be valid hex codes
6. Margins must not exceed 50% of page dimensions

## Rendering Process

1. Load template spec from database
2. Validate spec against schema
3. Create PDF page with specified dimensions
4. Apply fonts and base styles
5. Render each area according to its specification
6. Handle text overflow and truncation
7. Generate final PDF output

## Future Extensions

- Multi-page support
- Custom fonts upload
- Logo/image placement
- Background patterns
- Conditional fields
- Formula calculations