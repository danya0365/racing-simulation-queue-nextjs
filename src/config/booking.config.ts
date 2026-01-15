/**
 * Booking Configuration
 * 
 * Single source of truth for booking-related settings.
 * Update this file to change pricing, durations, and other booking options.
 * 
 * ⚠️ Changes here will affect all booking components:
 * - BookingWizard
 * - QuickBookingView
 * - CustomerView (BookingModal)
 */

/**
 * Duration option for booking
 */
export interface DurationOption {
  /** Duration in minutes */
  time: number;
  /** Display label (Thai) */
  label: string;
  /** Display label (English) - for codes like WARM UP, PRO RACE */
  labelEn: string;
  /** Price in THB */
  price: number;
  /** Display price string */
  priceDisplay: string;
  /** Icon emoji */
  icon: string;
  /** If true, shows "แนะนำ" badge */
  popular?: boolean;
  /** Price per minute (for value comparison) */
  pricePerMinute: number;
}

/**
 * Pro Racer Rates - Gran Turismo Narathiwat
 * 
 * 30 นาที (WARM UP) - 60 บาท
 * 1 ชั่วโมง (PRO RACE) - 100 บาท
 * 3 ชั่วโมง (GRAND PRIX) - 280 บาท - คุ้มสุด! ลดเหลือ 1.5 บาท/นาที
 */
export const DURATION_OPTIONS: DurationOption[] = [
  { 
    time: 30, 
    label: '30 นาที', 
    labelEn: 'WARM UP',
    price: 60, 
    priceDisplay: '฿60', 
    icon: '⏱️',
    pricePerMinute: 2,
  },
  { 
    time: 60, 
    label: '1 ชั่วโมง', 
    labelEn: 'PRO RACE',
    price: 100, 
    priceDisplay: '฿100', 
    icon: '🏁', 
    popular: true,
    pricePerMinute: 1.67,
  },
  { 
    time: 120, 
    label: '2 ชั่วโมง', 
    labelEn: 'PRO RACE',
    price: 200, 
    priceDisplay: '฿200', 
    icon: '🏁', 
    pricePerMinute: 1.67,
  },
  { 
    time: 180, 
    label: '3 ชั่วโมง', 
    labelEn: 'GRAND PRIX',
    price: 280, 
    priceDisplay: '฿280', 
    icon: '🏆',
    popular: true,
    pricePerMinute: 1.56,
  },
];

/**
 * Default duration (in minutes) when user hasn't selected one
 */
export const DEFAULT_DURATION = 30;

/**
 * Get duration option by time (minutes)
 */
export function getDurationOption(time: number): DurationOption | undefined {
  return DURATION_OPTIONS.find(d => d.time === time);
}

/**
 * Get price for a duration (in THB)
 */
export function getPrice(durationMinutes: number): number {
  const option = getDurationOption(durationMinutes);
  return option?.price ?? 0;
}

/**
 * Format price display string
 */
export function formatPrice(durationMinutes: number): string {
  const option = getDurationOption(durationMinutes);
  return option?.priceDisplay ?? `฿${durationMinutes * 2}`;
}

/**
 * Simple duration values for quick selection (in minutes)
 * Used in components that just need a list of numbers
 */
export const QUICK_DURATIONS = DURATION_OPTIONS.map(d => d.time);

/**
 * Booking form validation rules
 */
export const BOOKING_VALIDATION = {
  /** Minimum phone number length (digits only) */
  minPhoneLength: 9,
  /** Maximum phone number length (digits only) */
  maxPhoneLength: 10,
  /** Minimum customer name length */
  minNameLength: 2,
  /** Maximum customer name length */
  maxNameLength: 100,
} as const;

/**
 * Operating hours for advance booking
 */
export const OPERATING_HOURS = {
  /** Opening hour (24h format) */
  open: 10,
  /** Closing hour (24h format) */
  close: 22,
  /** Duration of each time slot in minutes */
  slotDurationMinutes: 30,
  /** Whether the booking system is enabled */
  isEnabled: true,
  /** Whether to open 24 hours (overrides open/close) */
  isOpen24Hours: true,
} as const;

/**
 * Timezone metadata for display purposes
 */
export interface TimezoneInfo {
  /** IANA timezone identifier (e.g., 'Asia/Bangkok') */
  iana: string;
  /** Display name in Thai */
  displayNameTH: string;
  /** Display name in English */
  displayNameEN: string;
  /** City/Region name */
  cityName: string;
  /** Country name in Thai */
  countryTH: string;
  /** Country name in English */
  countryEN: string;
  /** Country flag emoji */
  flag: string;
  /** UTC offset description (e.g., 'UTC+7') */
  utcOffset: string;
}

/**
 * Predefined timezone configurations
 * Add more as needed for different countries
 */
export const TIMEZONE_DATABASE: Record<string, TimezoneInfo> = {
  'Asia/Bangkok': {
    iana: 'Asia/Bangkok',
    displayNameTH: 'เวลากรุงเทพฯ',
    displayNameEN: 'Bangkok Time',
    cityName: 'กรุงเทพฯ',
    countryTH: 'ประเทศไทย',
    countryEN: 'Thailand',
    flag: '🇹🇭',
    utcOffset: 'UTC+7',
  },
  'Asia/Tokyo': {
    iana: 'Asia/Tokyo',
    displayNameTH: 'เวลาโตเกียว',
    displayNameEN: 'Tokyo Time',
    cityName: 'โตเกียว',
    countryTH: 'ญี่ปุ่น',
    countryEN: 'Japan',
    flag: '🇯🇵',
    utcOffset: 'UTC+9',
  },
  'Asia/Singapore': {
    iana: 'Asia/Singapore',
    displayNameTH: 'เวลาสิงคโปร์',
    displayNameEN: 'Singapore Time',
    cityName: 'สิงคโปร์',
    countryTH: 'สิงคโปร์',
    countryEN: 'Singapore',
    flag: '🇸🇬',
    utcOffset: 'UTC+8',
  },
  'Asia/Hong_Kong': {
    iana: 'Asia/Hong_Kong',
    displayNameTH: 'เวลาฮ่องกง',
    displayNameEN: 'Hong Kong Time',
    cityName: 'ฮ่องกง',
    countryTH: 'ฮ่องกง',
    countryEN: 'Hong Kong',
    flag: '🇭🇰',
    utcOffset: 'UTC+8',
  },
  'Asia/Seoul': {
    iana: 'Asia/Seoul',
    displayNameTH: 'เวลาโซล',
    displayNameEN: 'Seoul Time',
    cityName: 'โซล',
    countryTH: 'เกาหลีใต้',
    countryEN: 'South Korea',
    flag: '🇰🇷',
    utcOffset: 'UTC+9',
  },
  'America/Los_Angeles': {
    iana: 'America/Los_Angeles',
    displayNameTH: 'เวลาแปซิฟิก',
    displayNameEN: 'Pacific Time',
    cityName: 'ลอสแองเจลิส',
    countryTH: 'สหรัฐอเมริกา',
    countryEN: 'United States',
    flag: '🇺🇸',
    utcOffset: 'UTC-8',
  },
  'America/New_York': {
    iana: 'America/New_York',
    displayNameTH: 'เวลาตะวันออก',
    displayNameEN: 'Eastern Time',
    cityName: 'นิวยอร์ก',
    countryTH: 'สหรัฐอเมริกา',
    countryEN: 'United States',
    flag: '🇺🇸',
    utcOffset: 'UTC-5',
  },
  'Europe/London': {
    iana: 'Europe/London',
    displayNameTH: 'เวลาลอนดอน',
    displayNameEN: 'London Time',
    cityName: 'ลอนดอน',
    countryTH: 'สหราชอาณาจักร',
    countryEN: 'United Kingdom',
    flag: '🇬🇧',
    utcOffset: 'UTC+0',
  },
  'Australia/Sydney': {
    iana: 'Australia/Sydney',
    displayNameTH: 'เวลาซิดนีย์',
    displayNameEN: 'Sydney Time',
    cityName: 'ซิดนีย์',
    countryTH: 'ออสเตรเลีย',
    countryEN: 'Australia',
    flag: '🇦🇺',
    utcOffset: 'UTC+10',
  },
};

/**
 * Timezone configuration for booking system
 * 
 * ⚠️ SINGLE SOURCE OF TRUTH for shop timezone
 * Change `defaultBusinessTimezone` to switch the shop's timezone
 */
export const TIMEZONE_CONFIG = {
  /** 
   * Default business timezone for the shop
   * This is the timezone where the physical shop is located
   * Change this when deploying to a different country
   */
  defaultBusinessTimezone: 'Asia/Bangkok' as keyof typeof TIMEZONE_DATABASE,
  
  /** Fallback timezone if something goes wrong */
  fallbackTimezone: 'Asia/Bangkok' as keyof typeof TIMEZONE_DATABASE,
  
  /** Get the shop's timezone info */
  get shopTimezoneInfo(): TimezoneInfo {
    return TIMEZONE_DATABASE[this.defaultBusinessTimezone] || TIMEZONE_DATABASE[this.fallbackTimezone];
  },
  
  /** Get supported timezones list */
  supportedTimezones: Object.keys(TIMEZONE_DATABASE),
} as const;

/**
 * Export type for readonly config
 */
export type BookingConfig = {
  durations: typeof DURATION_OPTIONS;
  defaultDuration: typeof DEFAULT_DURATION;
  validation: typeof BOOKING_VALIDATION;
  operatingHours: typeof OPERATING_HOURS;
  timezone: typeof TIMEZONE_CONFIG;
};
