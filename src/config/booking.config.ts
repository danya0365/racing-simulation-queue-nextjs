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
 * Export type for readonly config
 */
export type BookingConfig = {
  durations: typeof DURATION_OPTIONS;
  defaultDuration: typeof DEFAULT_DURATION;
  validation: typeof BOOKING_VALIDATION;
};
