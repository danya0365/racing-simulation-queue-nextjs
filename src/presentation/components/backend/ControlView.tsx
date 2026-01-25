'use client';

import { WalkInQueue } from '@/src/application/repositories/IWalkInQueueRepository';
import { ConfirmationModal } from '@/src/presentation/components/ui/ConfirmationModal';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { ControlViewModel, StationViewModel } from '@/src/presentation/presenters/backend/ControlPresenter';
import { useControlPresenter } from '@/src/presentation/presenters/backend/useControlPresenter';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import Link from 'next/link';
import { useEffect, useState } from 'react';

dayjs.extend(duration);

// ============================================================
// PROPS
// ============================================================

interface ControlViewProps {
  initialViewModel?: ControlViewModel;
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function ControlView({ initialViewModel }: ControlViewProps) {
  const [state, actions] = useControlPresenter(initialViewModel);
  const [currentTime, setCurrentTime] = useState(dayjs());
  
  // Manual start modal form state
  const [manualCustomerName, setManualCustomerName] = useState('');

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ============================================================
  // LOADING STATE
  // ============================================================

  if (state.loading && !state.viewModel) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-6" />
          <p className="text-white/60 text-lg">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // ERROR STATE
  // ============================================================

  if (state.error && !state.viewModel) {
    return (
      <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl text-white mb-4">{state.error}</p>
          <GlowButton color="purple" onClick={actions.loadData}>
            ลองใหม่
          </GlowButton>
        </div>
      </div>
    );
  }

  const viewModel = state.viewModel!;

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-auto">
      {/* Header - Mobile Optimized */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/40 border-b border-white/10">
        {/* Row 1: Back, Title, Time */}
        <div className="px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/backend">
              <button className="w-10 h-10 rounded-xl bg-purple-500/30 border border-purple-500/50 flex items-center justify-center text-white font-bold">
                ←
              </button>
            </Link>
            <h1 className="text-lg md:text-xl font-bold text-white">
              🎮 Control
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Time - Compact on mobile */}
            <div className="bg-white/10 rounded-lg px-3 py-1.5 border border-white/20">
              <p className="text-lg md:text-xl font-bold text-white font-mono">
                {currentTime.format('HH:mm:ss')}
              </p>
            </div>
            
            {/* Refresh */}
            <button
              onClick={() => actions.loadData()}
              disabled={state.isUpdating}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-lg disabled:opacity-50"
            >
              🔄
            </button>
          </div>
        </div>
        
        {/* Row 2: Full Width Stats Grid */}
        <div className="px-3 pb-2 grid grid-cols-2 md:grid-cols-4 gap-2">
          <MiniStat icon="🟢" value={viewModel.stats.availableCount} label="ว่าง" color="emerald" />
          <MiniStat icon="🔴" value={viewModel.stats.inUseCount} label="ใช้งาน" color="orange" />
          <MiniStat icon="🟡" value={viewModel.stats.reservedCount} label="จอง" color="yellow" />
          <MiniStat icon="📋" value={viewModel.stats.waitingQueueCount} label="คิว" color="cyan" />
        </div>
      </header>

      {/* Station Grid - Full width cards on mobile */}
      <div className="px-3 py-3 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {viewModel.stations.map((station) => (
            <StationCard
              key={station.machine.id}
              station={station}
              currentTime={currentTime}
              waitingQueue={viewModel.waitingQueue}
              isUpdating={state.isUpdating}
              onStartManual={() => actions.openManualStartModal(station.machine.id)}
              onSelectFromQueue={() => actions.openQueueSelectModal(station.machine.id)}
              onCheckIn={() => {
                if (station.reservedBooking) {
                  actions.openCheckInModal(station.machine.id, station.reservedBooking);
                }
              }}
              onEndSession={() => {
                if (station.activeSession) {
                  actions.openEndSessionModal(station.activeSession.id);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Manual Start Modal */}
      {state.manualStartModal.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl border border-white/20 w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                ▶️ เริ่ม Manual Session
              </h3>
              <p className="text-white/60 mb-4">
                เครื่อง: {viewModel.stations.find(s => s.machine.id === state.manualStartModal.machineId)?.machine.name}
              </p>
              <input
                type="text"
                placeholder="ชื่อลูกค้า"
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500 mb-4"
                value={manualCustomerName}
                onChange={(e) => setManualCustomerName(e.target.value)}
                autoFocus
              />
              <div className="flex gap-3">
                <GlowButton
                  color="purple"
                  className="flex-1"
                  onClick={() => {
                    setManualCustomerName('');
                    actions.closeManualStartModal();
                  }}
                >
                  ยกเลิก
                </GlowButton>
                <GlowButton
                  color="green"
                  className="flex-1"
                  disabled={!manualCustomerName.trim() || state.isUpdating}
                  onClick={() => {
                    if (state.manualStartModal.machineId && manualCustomerName.trim()) {
                      actions.startManualSession(
                        state.manualStartModal.machineId,
                        manualCustomerName.trim()
                      );
                      setManualCustomerName('');
                    }
                  }}
                >
                  {state.isUpdating ? '...' : '✅ เริ่มเลย'}
                </GlowButton>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Queue Select Modal */}
      {state.queueSelectModal.isOpen && (
        <Portal>
          <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-2xl border border-white/20 w-full max-w-md p-6 max-h-[80vh] overflow-auto">
              <h3 className="text-xl font-bold text-white mb-4">
                📋 เลือกจากคิว
              </h3>
              {viewModel.waitingQueue.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  <p className="text-4xl mb-2">📭</p>
                  <p>ไม่มีคิวรออยู่</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {viewModel.waitingQueue.map((queue) => (
                    <QueueSelectItem
                      key={queue.id}
                      queue={queue}
                      isUpdating={state.isUpdating}
                      onSelect={() => {
                        if (state.queueSelectModal.machineId) {
                          actions.startFromQueue(state.queueSelectModal.machineId, queue);
                        }
                      }}
                    />
                  ))}
                </div>
              )}
              <div className="mt-4">
                <GlowButton
                  color="purple"
                  className="w-full"
                  onClick={actions.closeQueueSelectModal}
                >
                  ปิด
                </GlowButton>
              </div>
            </div>
          </div>
        </Portal>
      )}

      {/* Check-in Modal */}
      {state.checkInModal.isOpen && state.checkInModal.booking && (
        <ConfirmationModal
          isOpen={true}
          title="✅ Check-in ลูกค้า?"
          description={`ยืนยัน Check-in สำหรับ ${state.checkInModal.booking.customerName} (${state.checkInModal.booking.localStartTime} - ${state.checkInModal.booking.localEndTime})`}
          confirmText="✅ Check-in"
          cancelText="ยกเลิก"
          variant="info"
          onConfirm={() => {
            if (state.checkInModal.machineId && state.checkInModal.booking) {
              actions.startFromBooking(state.checkInModal.machineId, state.checkInModal.booking);
            }
          }}
          onClose={actions.closeCheckInModal}
          isLoading={state.isUpdating}
        />
      )}

      {/* End Session Modal */}
      <ConfirmationModal
        isOpen={state.endSessionModal.isOpen}
        title="⏹️ จบ Session?"
        description="ยืนยันว่าลูกค้าเล่นเสร็จแล้ว และต้องการปิด Session?"
        confirmText="✅ ยืนยัน"
        cancelText="ยกเลิก"
        variant="warning"
        onConfirm={() => {
          if (state.endSessionModal.sessionId) {
            actions.endSession(state.endSessionModal.sessionId);
          }
        }}
        onClose={actions.closeEndSessionModal}
        isLoading={state.isUpdating}
      />

      {/* Error Toast */}
      {state.error && state.viewModel && (
        <div className="fixed bottom-4 right-4 z-[300] bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          <div className="flex items-center">
            <span className="mr-2">⚠️</span>
            <span>{state.error}</span>
            <button
              onClick={() => actions.setError(null)}
              className="ml-4 text-white hover:text-gray-200"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function MiniStat({ 
  icon, 
  value, 
  label, 
  color 
}: { 
  icon: string; 
  value: number; 
  label: string;
  color: 'emerald' | 'orange' | 'yellow' | 'cyan';
}) {
  const colorMap = {
    emerald: 'bg-emerald-500/30 border-emerald-500/50 text-emerald-300',
    orange: 'bg-orange-500/30 border-orange-500/50 text-orange-300',
    yellow: 'bg-yellow-500/30 border-yellow-500/50 text-yellow-300',
    cyan: 'bg-cyan-500/30 border-cyan-500/50 text-cyan-300',
  };

  return (
    <div className={`${colorMap[color]} border rounded-lg px-3 py-2 flex items-center gap-2 w-full`}>
      <span className="text-lg">{icon}</span>
      <div className="flex flex-col leading-tight">
        <span className="text-xl font-bold">{value}</span>
        <span className="text-[10px] text-white/70 uppercase tracking-wide">{label}</span>
      </div>
    </div>
  );
}

function StationCard({
  station,
  currentTime,
  waitingQueue,
  isUpdating,
  onStartManual,
  onSelectFromQueue,
  onCheckIn,
  onEndSession,
}: {
  station: StationViewModel;
  currentTime: dayjs.Dayjs;
  waitingQueue: WalkInQueue[];
  isUpdating: boolean;
  onStartManual: () => void;
  onSelectFromQueue: () => void;
  onCheckIn: () => void;
  onEndSession: () => void;
}) {
  const { machine, state: stationState, activeSession, reservedBooking } = station;
  
  // Check if booking is overdue
  const isOverdue = reservedBooking && reservedBooking.localStartTime < currentTime.format('HH:mm');

  // Color mapping
  const stateColors = {
    available: 'border-emerald-500/40 bg-emerald-500/5',
    in_use: 'border-orange-500/40 bg-orange-500/10',
    reserved: isOverdue ? 'border-red-500/40 bg-red-500/10' : 'border-yellow-500/40 bg-yellow-500/5',
  };

  const headerColors = {
    available: 'from-emerald-500 to-green-600',
    in_use: 'from-orange-500 to-red-600',
    reserved: isOverdue ? 'from-red-500 to-rose-600' : 'from-yellow-500 to-orange-600',
  };

  const badgeColors = {
    available: 'bg-emerald-500 text-white',
    in_use: 'bg-orange-500 text-white animate-pulse',
    reserved: isOverdue ? 'bg-red-500 text-white animate-bounce' : 'bg-yellow-500 text-black',
  };

  const stateLabels = {
    available: '✅ ว่าง',
    in_use: '🏁 เล่นอยู่',
    reserved: isOverdue ? '⚠️ เลยเวลา' : '📅 จอง',
  };

  return (
    <div className={`rounded-xl border backdrop-blur-sm transition-all duration-300 ${stateColors[stationState]}`}>
      {/* Header - Compact */}
      <div className={`px-3 py-2 border-b ${stationState === 'in_use' ? 'border-orange-500/30' : stationState === 'reserved' ? 'border-yellow-500/30' : 'border-emerald-500/30'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl bg-gradient-to-br ${headerColors[stationState]}`}>
              🎮
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{machine.name}</h3>
              <p className="text-xs text-white/50">#{machine.position}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${badgeColors[stationState]}`}>
            {stateLabels[stationState]}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* AVAILABLE STATE */}
        {stationState === 'available' && (
          <div className="space-y-2">
            <GlowButton
              color="green"
              className="w-full py-3"
              onClick={onStartManual}
              disabled={isUpdating}
            >
              ▶️ Start Manual
            </GlowButton>
            {waitingQueue.length > 0 && (
              <GlowButton
                color="purple"
                className="w-full py-3"
                onClick={onSelectFromQueue}
                disabled={isUpdating}
              >
                📋 เลือกจากคิว ({waitingQueue.length})
              </GlowButton>
            )}
          </div>
        )}

        {/* IN USE STATE */}
        {stationState === 'in_use' && activeSession && (
          <div className="space-y-3">
            <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-3">
              <p className="text-xs text-orange-400 mb-1">👤 ผู้เล่น</p>
              <p className="text-lg font-bold text-white">{activeSession.customerName}</p>
            </div>
            
            <SessionTimer startTime={activeSession.startTime} />
            
            <GlowButton
              color="red"
              className="w-full py-3"
              onClick={onEndSession}
              disabled={isUpdating}
            >
              ⏹️ จบ Session
            </GlowButton>
          </div>
        )}

        {/* RESERVED STATE */}
        {stationState === 'reserved' && reservedBooking && (
          <div className="space-y-3">
            <div className={`${isOverdue ? 'bg-red-500/20 border-red-500/30' : 'bg-yellow-500/20 border-yellow-500/30'} border rounded-xl p-3`}>
              <p className={`text-xs ${isOverdue ? 'text-red-400' : 'text-yellow-400'} mb-1`}>
                {isOverdue ? '⚠️ เลยเวลา' : '📅 จองไว้'}
              </p>
              <p className="text-lg font-bold text-white">{reservedBooking.customerName}</p>
              <p className="text-sm text-white/60">
                {reservedBooking.localStartTime} - {reservedBooking.localEndTime}
              </p>
            </div>
            
            <GlowButton
              color={isOverdue ? 'red' : 'green'}
              className="w-full py-3"
              onClick={onCheckIn}
              disabled={isUpdating}
            >
              ✅ Check-in
            </GlowButton>
          </div>
        )}

        {/* Upcoming Bookings */}
        {station.upcomingBookings.length > 0 && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-xs text-white/40 mb-2">คิวถัดไป</p>
            <div className="space-y-1">
              {station.upcomingBookings.map(b => (
                <div key={b.id} className="flex justify-between text-sm text-white/60">
                  <span>{b.customerName}</span>
                  <span>{b.localStartTime}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SessionTimer({ startTime }: { startTime: string }) {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const diffMs = now.diff(dayjs(startTime));
  if (diffMs < 0) return null;

  const dur = dayjs.duration(diffMs);
  const hours = Math.floor(dur.asHours());
  const mins = dur.minutes();
  const secs = dur.seconds();

  const timeStr = hours > 0
    ? `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    : `${mins}:${secs.toString().padStart(2, '0')}`;

  return (
    <div className="bg-black/20 rounded-lg p-3 flex justify-between items-center">
      <span className="text-sm text-white/60">⏱️ เวลาใช้งาน</span>
      <span className="font-mono font-bold text-xl text-emerald-400 animate-pulse">
        {timeStr}
      </span>
    </div>
  );
}

function QueueSelectItem({
  queue,
  isUpdating,
  onSelect,
}: {
  queue: WalkInQueue;
  isUpdating: boolean;
  onSelect: () => void;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-center justify-between">
      <div>
        <div className="flex items-center gap-2">
          <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded">
            #{queue.queueNumber}
          </span>
          <span className="font-bold text-white">{queue.customerName}</span>
        </div>
        {queue.preferredMachineName && (
          <p className="text-xs text-white/50 mt-1">
            ต้องการ: {queue.preferredMachineName}
          </p>
        )}
      </div>
      <GlowButton
        color="green"
        size="sm"
        onClick={onSelect}
        disabled={isUpdating}
      >
        เลือก
      </GlowButton>
    </div>
  );
}
