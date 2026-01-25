/**
 * Backend Control Page - Game Room Control Panel
 * 
 * Full-screen focus mode for managing game room sessions.
 * Session-centric approach: tracks actual machine usage.
 * 
 * Route: /backend/control
 */

import { ControlView } from '@/src/presentation/components/backend/ControlView';

export default function BackendControlPage() {
  return <ControlView />;
}
