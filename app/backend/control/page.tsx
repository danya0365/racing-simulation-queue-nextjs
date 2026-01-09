/**
 * Backend Control Page - Game Room Control
 * 
 * Dedicated page for game room control with fullscreen UI.
 * This provides a direct shortcut for admins to quickly access
 * the control interface without navigating through the dashboard.
 * 
 * Route: /backend/control
 */

import { GameRoomControlView } from '@/src/presentation/components/backend/GameRoomControlView';

export default function BackendControlPage() {
  return <GameRoomControlView />;
}
