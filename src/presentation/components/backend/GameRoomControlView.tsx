'use client';

import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { useBackendPresenter } from '@/src/presentation/presenters/backend/useBackendPresenter';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Portal } from '../ui/Portal';
import { FullscreenControlPanel } from './FullscreenControlPanel';

/**
 * GameRoomControlView - Dedicated Page for Game Room Control
 * 
 * This is a standalone page version of the FullscreenControlPanel,
 * providing a direct URL shortcut for admins to quickly access
 * the game room control interface.
 * 
 * Route: /backend/control
 */
export function GameRoomControlView() {
  const router = useRouter();
  const [state, actions] = useBackendPresenter();
  const viewModel = state.viewModel;

  // Helper: Format time
  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dayjs(dateString).toDate());
  };

  // Get current playing queue for a machine
  const getCurrentPlayer = (machineId: string) => {
    return viewModel?.activeQueues.find(q => q.machineId === machineId && q.status === 'playing');
  };

  // Get waiting queues for a machine
  const getWaitingQueues = (machineId: string) => {
    return viewModel?.activeQueues
      .filter(q => q.machineId === machineId && q.status === 'waiting')
      .sort((a, b) => a.position - b.position) || [];
  };

  // Get next in queue
  const getNextInQueue = (machineId: string) => {
    const waiting = getWaitingQueues(machineId);
    return waiting.length > 0 ? waiting[0] : null;
  };

  // Call next queue (mark as playing)
  const handleCallNext = async (machineId: string) => {
    const next = getNextInQueue(machineId);
    if (next) {
      await actions.updateQueueStatus(next.id, 'playing');
      await actions.updateMachineStatus(machineId, 'occupied');
    }
  };

  // Mark current player as done
  const handleMarkDone = async (machineId: string) => {
    const current = getCurrentPlayer(machineId);
    if (current) {
      await actions.updateQueueStatus(current.id, 'completed');
      
      // Check if there's next queue
      const next = getNextInQueue(machineId);
      if (!next) {
        await actions.updateMachineStatus(machineId, 'available');
      }
    }
  };

  // Toggle machine status
  const handleToggleMachine = async (machine: NonNullable<typeof viewModel>['machines'][0]) => {
    if (machine.status === 'maintenance') {
      await actions.updateMachineStatus(machine.id, 'available');
    } else {
      await actions.updateMachineStatus(machine.id, 'maintenance');
    }
  };

  // Exit handler - navigate back to dashboard
  const handleExit = () => {
    router.push('/backend');
  };

  // Loading state
  if (state.loading && !viewModel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/60 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (state.error && !viewModel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 mb-4">{state.error}</p>
          <div className="flex gap-4 justify-center">
            <GlowButton color="purple" onClick={actions.loadData}>
              ลองใหม่
            </GlowButton>
            <Link href="/backend">
              <GlowButton color="purple">
                กลับ Dashboard
              </GlowButton>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!viewModel) return null;

  return (
    <div className='h-screen w-screen'>
      <Portal>
        <FullscreenControlPanel
          viewModel={viewModel}
          isUpdating={state.isUpdating}
          onCallNext={handleCallNext}
          onMarkDone={handleMarkDone}
          onToggleMachine={handleToggleMachine}
          onRefresh={actions.refreshData}
          onExit={handleExit}
          getCurrentPlayer={getCurrentPlayer}
          getWaitingQueues={getWaitingQueues}
          getNextInQueue={getNextInQueue}
          formatTime={formatTime}
          isModal={true}
        />
      </Portal>
    </div>
  );
}
