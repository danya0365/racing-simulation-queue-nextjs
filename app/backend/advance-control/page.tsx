/**
 * Backend Advance Control Page - Game Room Control for Advance Bookings
 * 
 * Dedicated page for game room control using the advance booking system.
 * Shows real-time status based on scheduled time slots.
 * 
 * Route: /backend/advance-control
 */

import { AdvanceControlView } from '@/src/presentation/components/backend/AdvanceControlView';

export default function BackendAdvanceControlPage() {
  return <AdvanceControlView />;
}
