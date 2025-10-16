import type { SupabaseClient } from '@supabase/supabase-js';

import minimalTemplate from './minimal.json';
import modernTemplate from './modern.json';

export interface AreaSpec {
  x: number;
  y: number;
  w?: number;
  h?: number;
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
  font_size?: number;
  font_weight?: 'normal' | 'bold';
  color?: string;
  style?: 'normal' | 'italic';
}

export interface ColumnSpec {
  key: 'description' | 'qty' | 'unit_price' | 'tax_rate' | 'line_total';
  label: string;
  w: number;
  align?: 'left' | 'center' | 'right';
  font_size?: number;
}

export interface TableSpec {
  x: number;
  y: number;
  w: number;
  row_height: number;
  header_height?: number;
  columns: ColumnSpec[];
  border_color?: string;
  border_width?: number;
  header_bg?: string;
  alt_row_bg?: string;
  header_font_size?: number;
  header_font_weight?: 'normal' | 'bold';
  header_color?: string;
}

export interface TemplateSpec {
  meta: {
    name: string;
    description?: string;
    width: number;
    height: number;
    dpi: number;
    margins: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    background_image_url?: string; // PNG/JPEG preview for mapping UI
    background_pdf_url?: string;   // Original PDF for final invoice rendering (better quality)
  };
  styles: {
    fonts: {
      primary: string;
      secondary?: string;
    };
    colors: {
      primary: string;
      secondary: string;
      accent?: string;
    };
    sizes: {
      default: number;
      small: number;
      large: number;
      title: number;
    };
  };
  areas: {
    invoice_title?: AreaSpec;
    invoice_number?: AreaSpec;
    issue_date?: AreaSpec;
    due_date?: AreaSpec;
    company_info?: AreaSpec;
    company_address?: AreaSpec;
    client_name?: AreaSpec;
    client_company?: AreaSpec;
    client_address?: AreaSpec;
    client_email?: AreaSpec;
    client_tax_id?: AreaSpec;
    items_table: TableSpec;
    subtotal?: AreaSpec;
    tax_total?: AreaSpec;
    grand_total: AreaSpec;
    notes?: AreaSpec;
    payment_info?: AreaSpec;
    footer?: AreaSpec;
  };
}

export interface Template {
  id: string;
  org_id?: string;
  title: string;
  kind: 'curated' | 'custom';
  spec: TemplateSpec;
  created_at: string;
}

// Built-in curated templates
export const CURATED_TEMPLATES: Array<Omit<Template, 'id' | 'created_at'>> = [
  {
    org_id: undefined,
    title: 'Minimal',
    kind: 'curated',
    spec: minimalTemplate as TemplateSpec
  },
  {
    org_id: undefined,
    title: 'Modern',
    kind: 'curated',
    spec: modernTemplate as TemplateSpec
  }
];

/**
 * Ensure curated templates exist in the database
 */
export async function ensureCuratedTemplates(supabase: SupabaseClient) {
  try {
    // Check which curated templates already exist
    const { data: existingTemplates, error: fetchError } = await supabase
      .from('template')
      .select('id, title')
      .eq('kind', 'curated')
      .is('org_id', null);

    if (fetchError) {
      console.error('Error fetching templates:', fetchError);
      return;
    }

    const existingTitles = new Set(existingTemplates?.map(t => t.title) || []);
    const validTitles = new Set(CURATED_TEMPLATES.map(t => t.title));
    
    // Remove unwanted curated templates (Bold, Elegant, Tech)
    const templatesToDelete = existingTemplates?.filter(t => !validTitles.has(t.title)) || [];
    if (templatesToDelete.length > 0) {
      console.log(`Attempting to delete ${templatesToDelete.length} unwanted templates: ${templatesToDelete.map(t => t.title).join(', ')}`);
      
      // Try to delete each template individually to see which ones fail
      for (const template of templatesToDelete) {
        const { error: deleteError } = await supabase
          .from('template')
          .delete()
          .eq('id', template.id);

        if (deleteError) {
          console.error(`Error deleting template ${template.title}:`, deleteError);
        } else {
          console.log(`Successfully deleted template: ${template.title}`);
        }
      }
    }
    
    // Insert missing curated templates OR update existing ones
    const templatesToInsert = CURATED_TEMPLATES
      .filter(template => !existingTitles.has(template.title))
      .map(template => ({
        org_id: template.org_id,
        title: template.title,
        kind: template.kind,
        spec: template.spec
      }));

    // Also update existing templates to ensure they have the latest spec
    const templatesToUpdate = CURATED_TEMPLATES
      .filter(template => existingTitles.has(template.title))
      .map(template => ({
        org_id: template.org_id,
        title: template.title,
        kind: template.kind,
        spec: template.spec
      }));

    if (templatesToInsert.length > 0) {
      // For curated templates, we need to use a service role or create them manually
      // Since RLS policies prevent inserting templates with org_id = null
      // This is expected to fail until the RLS policy is updated
      const { error: insertError } = await supabase
        .from('template')
        .insert(templatesToInsert);

      if (insertError) {
        console.error('Error inserting curated templates:', insertError);
        console.log('Note: This is expected until RLS policies are updated to allow curated templates');
      } else {
        console.log(`Inserted ${templatesToInsert.length} curated templates`);
      }
    }

    // Update existing templates to ensure they have the latest spec
    if (templatesToUpdate.length > 0) {
      console.log(`Updating ${templatesToUpdate.length} existing templates with latest spec`);
      for (const template of templatesToUpdate) {
        const { error: updateError } = await supabase
          .from('template')
          .update({ spec: template.spec })
          .eq('title', template.title)
          .eq('kind', 'curated');

        if (updateError) {
          console.error(`Error updating template ${template.title}:`, updateError);
        } else {
          console.log(`Successfully updated template: ${template.title}`);
        }
      }
    }
  } catch (error) {
    console.error('Error ensuring curated templates:', error);
  }
}

/**
 * Get available templates for an organization
 */
export async function getTemplatesForOrg(supabase: SupabaseClient, orgId: string): Promise<Template[]> {
  const { data, error } = await supabase
    .from('template')
    .select('*')
    .or(`org_id.is.null,org_id.eq.${orgId}`)
    .order('kind', { ascending: true }) // curated first
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching templates:', error);
    return [];
  }

  return data || [];
}

/**
 * Get a specific template by ID
 */
export async function getTemplate(supabase: SupabaseClient, templateId: string): Promise<Template | null> {
  const { data, error } = await supabase
    .from('template')
    .select('*')
    .eq('id', templateId)
    .maybeSingle();

  if (error) {
    console.error('Error fetching template:', error);
    return null;
  }

  return data;
}

/**
 * Validate a template specification
 */
export function validateTemplateSpec(spec: TemplateSpec): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Check required fields
  if (!spec.meta) {
    errors.push('Template meta information is required');
  } else {
    if (!spec.meta.name) errors.push('Template name is required');
    if (!spec.meta.width || spec.meta.width <= 0) errors.push('Valid page width is required');
    if (!spec.meta.height || spec.meta.height <= 0) errors.push('Valid page height is required');
    if (!spec.meta.margins) errors.push('Page margins are required');
  }

  if (!spec.styles) {
    errors.push('Template styles are required');
  } else {
    if (!spec.styles.fonts?.primary) errors.push('Primary font is required');
    if (!spec.styles.colors?.primary) errors.push('Primary color is required');
    if (!spec.styles.colors?.secondary) errors.push('Secondary color is required');
    if (!spec.styles.sizes) errors.push('Font sizes are required');
  }

  if (!spec.areas) {
    errors.push('Template areas are required');
  } else {
    if (!spec.areas.items_table) errors.push('Items table area is required');
    if (!spec.areas.grand_total) errors.push('Grand total area is required');
  }

  // Validate coordinates are within page bounds
  if (spec.meta && spec.areas) {
    const { width, height, margins } = spec.meta;
    const maxX = width - margins.right;
    const maxY = height - margins.bottom;

    Object.entries(spec.areas).forEach(([key, area]) => {
      if (area && typeof area === 'object' && 'x' in area && 'y' in area) {
        if (area.x < margins.left || area.x > maxX) {
          errors.push(`${key}: X coordinate out of bounds`);
        }
        if (area.y < margins.top || area.y > maxY) {
          errors.push(`${key}: Y coordinate out of bounds`);
        }
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calculate maximum number of line items that fit in a template before overflow
 * Based on available vertical space between items table and the next element (usually subtotal)
 */
export function calculateMaxItems(spec: TemplateSpec): number {
  const { items_table, subtotal, grand_total, notes } = spec.areas;

  // Calculate where the table starts
  const tableStartY = items_table.y;
  const headerHeight = items_table.header_height || items_table.row_height;
  const rowHeight = items_table.row_height;

  // Find the Y position of the first element after the table
  // This is typically subtotal, but could be grand_total or notes
  let nextElementY = spec.meta.height; // Default to page height

  if (subtotal && subtotal.y > tableStartY) {
    nextElementY = Math.min(nextElementY, subtotal.y);
  }
  if (grand_total && grand_total.y > tableStartY) {
    nextElementY = Math.min(nextElementY, grand_total.y);
  }
  if (notes && notes.y > tableStartY) {
    nextElementY = Math.min(nextElementY, notes.y);
  }

  // Calculate available space for rows
  const availableSpace = nextElementY - (tableStartY + headerHeight);

  // Calculate how many rows fit (leave 2mm buffer for safety)
  const maxRows = Math.floor((availableSpace - 2) / rowHeight);

  // Return at least 1 to avoid negative or zero values
  return Math.max(1, maxRows);
}