'use client';

import { TIMEZONE_DATABASE, TimezoneInfo } from '@/src/config/booking.config';
import { getShopNow, SHOP_TIMEZONE, SHOP_TIMEZONE_INFO } from '@/src/lib/date';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';

export interface TimezoneCheckInfo {
  /** User's IANA timezone (e.g., 'Asia/Tokyo') */
  userTimezone: string;
  /** Shop's IANA timezone (e.g., 'Asia/Bangkok') */
  shopTimezone: string;
  /** Whether user's timezone matches shop's timezone */
  isMatchingTimezone: boolean;
  /** Current time in user's timezone (formatted string HH:mm:ss) */
  userCurrentTime: string;
  /** Current time in shop's timezone (formatted string HH:mm:ss) */
  shopCurrentTime: string;
  /** User's timezone offset (e.g., 'GMT+9') */
  userOffset: string;
  /** Shop's timezone offset (e.g., 'GMT+7') */
  shopOffset: string;
  /** User's timezone info (if found in database) */
  userTimezoneInfo: TimezoneInfo | null;
  /** Shop's timezone info (from config) */
  shopTimezoneInfo: TimezoneInfo;
}

interface UseTimezoneCheckOptions {
  /** Update interval in milliseconds (default: 1000ms = 1 second) */
  updateInterval?: number;
  /** Include seconds in time display (default: true) */
  includeSeconds?: boolean;
}

/**
 * Hook to check user's timezone and compare with shop timezone
 * Uses TIMEZONE_CONFIG as single source of truth
 * Updates every second by default for real-time display
 */
export function useTimezoneCheck(options: UseTimezoneCheckOptions = {}): TimezoneCheckInfo | null {
  const { updateInterval = 1000, includeSeconds = true } = options;
  const [timezoneInfo, setTimezoneInfo] = useState<TimezoneCheckInfo | null>(null);

  useEffect(() => {
    const timeFormat = includeSeconds ? 'HH:mm:ss' : 'HH:mm';
    
    const updateTimezoneInfo = () => {
      try {
        // Detect user's timezone
        const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        
        // Get current times
        const now = dayjs();
        const shopNow = getShopNow();
        const userNow = now.tz(userTimezone);
        
        // Calculate offsets
        const userOffsetMinutes = userNow.utcOffset();
        const shopOffsetMinutes = shopNow.utcOffset();
        
        // Format offset strings
        const formatOffset = (minutes: number): string => {
          const hours = Math.floor(Math.abs(minutes) / 60);
          const mins = Math.abs(minutes) % 60;
          const sign = minutes >= 0 ? '+' : '-';
          return mins > 0 ? `GMT${sign}${hours}:${mins.toString().padStart(2, '0')}` : `GMT${sign}${hours}`;
        };

        // Check if timezones match (by offset)
        const isMatchingTimezone = userOffsetMinutes === shopOffsetMinutes;

        // Get timezone info from database
        const userTimezoneInfo = TIMEZONE_DATABASE[userTimezone] || null;

        setTimezoneInfo({
          userTimezone,
          shopTimezone: SHOP_TIMEZONE,
          isMatchingTimezone,
          userCurrentTime: userNow.format(timeFormat),
          shopCurrentTime: shopNow.format(timeFormat),
          userOffset: formatOffset(userOffsetMinutes),
          shopOffset: formatOffset(shopOffsetMinutes),
          userTimezoneInfo,
          shopTimezoneInfo: SHOP_TIMEZONE_INFO,
        });
      } catch (error) {
        console.error('Error detecting timezone:', error);
        // Fallback
        setTimezoneInfo({
          userTimezone: SHOP_TIMEZONE,
          shopTimezone: SHOP_TIMEZONE,
          isMatchingTimezone: true,
          userCurrentTime: getShopNow().format(timeFormat),
          shopCurrentTime: getShopNow().format(timeFormat),
          userOffset: SHOP_TIMEZONE_INFO.utcOffset.replace('UTC', 'GMT'),
          shopOffset: SHOP_TIMEZONE_INFO.utcOffset.replace('UTC', 'GMT'),
          userTimezoneInfo: SHOP_TIMEZONE_INFO,
          shopTimezoneInfo: SHOP_TIMEZONE_INFO,
        });
      }
    };

    // Initial check
    updateTimezoneInfo();

    // Update at specified interval (default: every second)
    const interval = setInterval(updateTimezoneInfo, updateInterval);

    return () => clearInterval(interval);
  }, [updateInterval, includeSeconds]);

  return timezoneInfo;
}
