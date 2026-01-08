/**
 * Customer Configuration
 * Constants for customer-related business rules
 * 
 * To change the threshold, simply edit the values below.
 */

export const CUSTOMER_CONFIG = {
  /**
   * Minimum number of visits to be considered a "Regular Customer" (ลูกค้าประจำ)
   * - Used for filtering in UI
   * - Used for stats calculation
   * - Used for badge display
   */
  REGULAR_CUSTOMER_MIN_VISITS: 3,

  /**
   * Auto-upgrade to VIP after this many visits (optional feature, not yet implemented)
   * Set to 0 to disable auto-upgrade
   */
  AUTO_VIP_THRESHOLD: 0, // Disabled by default
} as const;

// Type export for TypeScript
export type CustomerConfig = typeof CUSTOMER_CONFIG;
