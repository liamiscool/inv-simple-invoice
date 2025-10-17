/**
 * Centralized date formatting utility with locale support
 */

export type DateFormat = 'US' | 'AU';

export interface DateFormatOptions {
  includeTime?: boolean;
  shortFormat?: boolean;
}

/**
 * Format a date string according to the user's locale preference
 * @param dateString - ISO date string
 * @param format - User's preferred date format ('US' or 'AU')
 * @param options - Additional formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string, 
  format: DateFormat = 'AU', 
  options: DateFormatOptions = {}
): string {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const { includeTime = false, shortFormat = false } = options;

  if (format === 'AU') {
    // Australian format: DD/MM/YYYY
    if (shortFormat) {
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    }
    
    if (includeTime) {
      return date.toLocaleDateString('en-AU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString('en-AU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } else {
    // US format: MM/DD/YYYY (default)
    if (shortFormat) {
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: '2-digit'
      });
    }
    
    if (includeTime) {
      return date.toLocaleDateString('en-US', {
        month: '2-digit',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
  }
}

/**
 * Format a date for display in lists and cards (shorter format)
 * @param dateString - ISO date string
 * @param format - User's preferred date format
 * @returns Formatted date string for display
 */
export function formatDateShort(dateString: string, format: DateFormat = 'AU'): string {
  return formatDate(dateString, format, { shortFormat: true });
}

/**
 * Format a date for display in detailed views
 * @param dateString - ISO date string
 * @param format - User's preferred date format
 * @returns Formatted date string for detailed display
 */
export function formatDateLong(dateString: string, format: DateFormat = 'AU'): string {
  return formatDate(dateString, format, { shortFormat: false });
}

/**
 * Format a date with time for timestamps
 * @param dateString - ISO date string
 * @param format - User's preferred date format
 * @returns Formatted date and time string
 */
export function formatDateTime(dateString: string, format: DateFormat = 'AU'): string {
  return formatDate(dateString, format, { includeTime: true });
}

/**
 * Get date format options for UI
 */
export const DATE_FORMAT_OPTIONS = [
  { value: 'AU', label: 'DD/MM/YYYY (25/12/2024)', example: '25/12/2024' },
  { value: 'US', label: 'MM/DD/YYYY (12/25/2024)', example: '12/25/2024' }
] as const;
