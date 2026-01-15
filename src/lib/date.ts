import dayjs from 'dayjs';
import 'dayjs/locale/th';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

// Configure dayjs plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.locale('th');

import { TIMEZONE_CONFIG, TIMEZONE_DATABASE, TimezoneInfo } from '@/src/config/booking.config';

// ============================================
// SINGLE SOURCE OF TRUTH: Shop Timezone
// ============================================

/** Shop's IANA timezone identifier (e.g., 'Asia/Bangkok', 'Asia/Tokyo') */
export const SHOP_TIMEZONE = TIMEZONE_CONFIG.defaultBusinessTimezone;

/** Shop's timezone metadata (display names, country, flag, etc.) */
export const SHOP_TIMEZONE_INFO = TIMEZONE_CONFIG.shopTimezoneInfo;

// ============================================
// Date/Time Utility Functions
// ============================================

/**
 * Get current date/time in Shop's Timezone
 */
export function getShopNow(): dayjs.Dayjs {
  return dayjs().tz(SHOP_TIMEZONE);
}

/**
 * Get "Today" date string (YYYY-MM-DD) in Shop's Timezone
 */
export function getShopTodayString(): string {
  return getShopNow().format('YYYY-MM-DD');
}

/**
 * Convert a date string to shop's timezone start of day
 */
export function toShopDate(dateStr: string): dayjs.Dayjs {
  return dayjs.tz(dateStr, SHOP_TIMEZONE).startOf('day');
}

// ============================================
// Timezone Info Helpers
// ============================================

/**
 * Get timezone info for a given IANA timezone
 * Returns metadata like display names, country, flag, etc.
 */
export function getTimezoneInfo(ianaTimezone: string): TimezoneInfo | null {
  return TIMEZONE_DATABASE[ianaTimezone] || null;
}

/**
 * Get formatted display name for timezone
 * @param ianaTimezone - IANA timezone identifier
 * @param lang - 'th' or 'en'
 * @param includeFlag - Whether to include country flag emoji
 */
export function getTimezoneDisplayName(
  ianaTimezone: string,
  lang: 'th' | 'en' = 'th',
  includeFlag: boolean = true
): string {
  const info = TIMEZONE_DATABASE[ianaTimezone];
  if (!info) {
    return ianaTimezone; // Fallback to IANA name
  }
  
  const name = lang === 'th' ? info.displayNameTH : info.displayNameEN;
  return includeFlag ? `${info.flag} ${name}` : name;
}

/**
 * Get shop's display name
 * @param lang - 'th' or 'en'
 * @param includeFlag - Whether to include country flag emoji
 */
export function getShopTimezoneDisplayName(
  lang: 'th' | 'en' = 'th',
  includeFlag: boolean = true
): string {
  return getTimezoneDisplayName(SHOP_TIMEZONE, lang, includeFlag);
}

export default dayjs;
