import type { DateFormat } from './dateFormat';

/**
 * Get user's date format preference from session data
 * @param userProfile - User profile data from session
 * @returns User's preferred date format, defaults to 'AU'
 */
export function getUserDateFormat(userProfile: any): DateFormat {
  return (userProfile?.date_format as DateFormat) || 'AU';
}

/**
 * Get user's currency preference from session data
 * @param userProfile - User profile data from session
 * @returns User's preferred currency, defaults to 'USD'
 */
export function getUserCurrency(userProfile: any): string {
  return userProfile?.default_currency || 'USD';
}
