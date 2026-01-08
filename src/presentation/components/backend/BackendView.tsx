'use client';

import type { MachineStatus } from '@/src/application/repositories/IMachineRepository';
import type { QueueStatus } from '@/src/application/repositories/IQueueRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { BackendSkeleton } from '@/src/presentation/components/ui/Skeleton';
import { BackendViewModel } from '@/src/presentation/presenters/backend/BackendPresenter';
import { useBackendPresenter } from '@/src/presentation/presenters/backend/useBackendPresenter';
import { useCustomersPresenter } from '@/src/presentation/presenters/customers/useCustomersPresenter';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface BackendViewProps {
  initialViewModel?: BackendViewModel;
}

export function BackendView({ initialViewModel }: BackendViewProps) {
  const [state, actions] = useBackendPresenter(initialViewModel);
  const viewModel = state.viewModel;

  // NOTE: Removed pageSpring for better performance
  // Using CSS animations instead (animate-page-in)

  // Loading state - using Skeleton UI instead of spinner
  if (state.loading && !viewModel) {
    return <BackendSkeleton />;
  }

  // Error state
  if (state.error && !viewModel) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-error mb-4">{state.error}</p>
          <GlowButton color="purple" onClick={actions.loadData}>
            ลองใหม่อีกครั้ง
          </GlowButton>
        </div>
      </div>
    );
  }

  if (!viewModel) return null;

  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Header */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-muted hover:text-purple-400 transition-colors">
              ← กลับหน้าแรก
            </Link>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-3xl shadow-lg">
                ⚙️
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
                    แอดมิน Dashboard
                  </span>
                </h1>
                <p className="text-muted">จัดการคิวและเครื่องเล่น</p>
              </div>
            </div>

            <AnimatedButton variant="secondary" onClick={actions.refreshData}>
              🔄 รีเฟรช
            </AnimatedButton>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 md:px-8 py-4 bg-surface/50 border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
          <TabButton
            active={state.activeTab === 'dashboard'}
            onClick={() => actions.setActiveTab('dashboard')}
          >
            📊 Dashboard
          </TabButton>
          <TabButton
            active={state.activeTab === 'control'}
            onClick={() => actions.setActiveTab('control')}
          >
            🎛️ ควบคุมห้องเกม
          </TabButton>
          <TabButton
            active={state.activeTab === 'queues'}
            onClick={() => actions.setActiveTab('queues')}
          >
            📋 จัดการคิว ({viewModel.todayQueues.length})
          </TabButton>
          <TabButton
            active={state.activeTab === 'machines'}
            onClick={() => actions.setActiveTab('machines')}
          >
            🎮 จัดการเครื่อง ({viewModel.machines.length})
          </TabButton>
          <TabButton
            active={state.activeTab === 'customers'}
            onClick={() => actions.setActiveTab('customers')}
          >
            👥 จัดการลูกค้า
          </TabButton>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 md:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {state.activeTab === 'dashboard' && (
            <DashboardTab viewModel={viewModel} />
          )}
          {state.activeTab === 'control' && (
            <LiveControlTab
              viewModel={viewModel}
              isUpdating={state.isUpdating}
              onUpdateQueueStatus={actions.updateQueueStatus}
              onUpdateMachineStatus={actions.updateMachineStatus}
              onRefresh={actions.refreshData}
            />
          )}
          {state.activeTab === 'queues' && (
            <QueuesTab
              queues={viewModel.todayQueues}
              isUpdating={state.isUpdating}
              onUpdateStatus={actions.updateQueueStatus}
              onDelete={actions.deleteQueue}
            />
          )}
          {state.activeTab === 'machines' && (
            <MachinesTab
              machines={viewModel.machines}
              isUpdating={state.isUpdating}
              onUpdateStatus={actions.updateMachineStatus}
            />
          )}
          {state.activeTab === 'customers' && (
            <CustomersTab />
          )}
        </div>
      </section>

      {/* Error Toast */}
      {state.error && viewModel && (
        <div className="fixed bottom-4 right-4 bg-error text-white px-6 py-3 rounded-xl shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{state.error}</span>
            <button onClick={() => actions.setError(null)} className="ml-4 hover:opacity-70">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Tab Button Component
function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg font-medium transition-all ${
        active
          ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
          : 'bg-surface text-muted hover:bg-muted-light hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

// Dashboard Tab
function DashboardTab({ viewModel }: { viewModel: BackendViewModel }) {
  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatsCard icon="🎮" label="เครื่องทั้งหมด" value={viewModel.machineStats.totalMachines} color="from-blue-500 to-cyan-500" />
        <StatsCard icon="✅" label="เครื่องว่าง" value={viewModel.machineStats.availableMachines} color="from-emerald-500 to-green-500" />
        <StatsCard icon="📋" label="รอคิววันนี้" value={viewModel.waitingQueues.length} color="from-purple-500 to-violet-500" />
        <StatsCard icon="🏁" label="กำลังเล่น" value={viewModel.queueStats.playingQueues} color="from-orange-500 to-amber-500" />
      </div>

      {/* Recent Queues */}
      <AnimatedCard className="p-6">
        <h3 className="text-lg font-bold mb-4 text-foreground">📋 คิวล่าสุดวันนี้</h3>
        {viewModel.todayQueues.length === 0 ? (
          <p className="text-muted text-center py-8">ยังไม่มีคิววันนี้</p>
        ) : (
          <div className="space-y-3">
            {viewModel.todayQueues.slice(0, 5).map((queue) => (
              <QueueRow key={queue.id} queue={queue} />
            ))}
          </div>
        )}
      </AnimatedCard>

      {/* Machines Overview */}
      <AnimatedCard className="p-6">
        <h3 className="text-lg font-bold mb-4 text-foreground">🎮 สถานะเครื่อง</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {viewModel.machines.map((machine) => (
            <MachineStatusCard key={machine.id} machine={machine} />
          ))}
        </div>
      </AnimatedCard>
    </div>
  );
}

// Live Control Tab - Game Room Control Panel
interface LiveControlTabProps {
  viewModel: BackendViewModel;
  isUpdating: boolean;
  onUpdateQueueStatus: (queueId: string, status: QueueStatus) => Promise<void>;
  onUpdateMachineStatus: (machineId: string, status: MachineStatus) => Promise<void>;
  onRefresh: () => Promise<void>;
}

function LiveControlTab({ viewModel, isUpdating, onUpdateQueueStatus, onUpdateMachineStatus, onRefresh }: LiveControlTabProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // Get queues for a specific machine
  const getMachineQueues = (machineId: string) => {
    return viewModel.todayQueues.filter(q => q.machineId === machineId);
  };

  // Get current playing queue for a machine
  const getCurrentPlayer = (machineId: string) => {
    return viewModel.todayQueues.find(q => q.machineId === machineId && q.status === 'playing');
  };

  // Get waiting queues for a machine
  const getWaitingQueues = (machineId: string) => {
    return viewModel.todayQueues
      .filter(q => q.machineId === machineId && q.status === 'waiting')
      .sort((a, b) => a.position - b.position);
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
      await onUpdateQueueStatus(next.id, 'playing');
      await onUpdateMachineStatus(machineId, 'occupied');
    }
  };

  // Mark current player as done
  const handleMarkDone = async (machineId: string) => {
    const current = getCurrentPlayer(machineId);
    if (current) {
      await onUpdateQueueStatus(current.id, 'completed');
      
      // Check if there's next queue
      const next = getNextInQueue(machineId);
      if (!next) {
        await onUpdateMachineStatus(machineId, 'available');
      }
    }
  };

  // Toggle machine status
  const handleToggleMachine = async (machine: typeof viewModel.machines[0]) => {
    if (machine.status === 'maintenance') {
      await onUpdateMachineStatus(machine.id, 'available');
    } else {
      await onUpdateMachineStatus(machine.id, 'maintenance');
    }
  };

  // Show Focus Mode
  if (isFocusMode) {
    return (
      <Portal>
        <FullscreenControlPanel
          viewModel={viewModel}
          isUpdating={isUpdating}
          onCallNext={handleCallNext}
          onMarkDone={handleMarkDone}
          onToggleMachine={handleToggleMachine}
          onRefresh={onRefresh}
          onExit={() => setIsFocusMode(false)}
          getCurrentPlayer={getCurrentPlayer}
          getWaitingQueues={getWaitingQueues}
          getNextInQueue={getNextInQueue}
          formatTime={formatTime}
        />
      </Portal>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">🎛️ ควบคุมห้องเกม</h2>
          <p className="text-sm text-muted">จัดการเครื่องเกมและคิวแบบ Real-time</p>
        </div>
        <div className="flex gap-2">
          <GlowButton color="purple" onClick={() => setIsFocusMode(true)}>
            🖥️ โหมดเต็มจอ
          </GlowButton>
          <AnimatedButton variant="secondary" onClick={onRefresh} disabled={isUpdating}>
            🔄 รีเฟรช
          </AnimatedButton>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-emerald-400">{viewModel.machineStats.availableMachines}</div>
          <div className="text-sm text-muted">✅ ว่าง</div>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-orange-400">{viewModel.machineStats.occupiedMachines}</div>
          <div className="text-sm text-muted">🏁 กำลังเล่น</div>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-purple-400">{viewModel.waitingQueues.length}</div>
          <div className="text-sm text-muted">⏳ รอคิว</div>
        </div>
        <div className="bg-gray-500/10 border border-gray-500/30 rounded-xl p-4 text-center">
          <div className="text-3xl font-bold text-gray-400">{viewModel.machineStats.maintenanceMachines}</div>
          <div className="text-sm text-muted">🔧 ซ่อมบำรุง</div>
        </div>
      </div>

      {/* Machine Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {viewModel.machines.map((machine) => {
          const currentPlayer = getCurrentPlayer(machine.id);
          const waitingQueues = getWaitingQueues(machine.id);
          const nextInQueue = getNextInQueue(machine.id);
          const isOccupied = machine.status === 'occupied' || !!currentPlayer;
          const isMaintenance = machine.status === 'maintenance';

          return (
            <AnimatedCard 
              key={machine.id} 
              className={`p-5 ${isMaintenance ? 'opacity-60' : ''}`}
              glowColor={
                isMaintenance ? 'rgba(107, 114, 128, 0.3)' :
                isOccupied ? 'rgba(249, 115, 22, 0.3)' :
                'rgba(16, 185, 129, 0.3)'
              }
            >
              {/* Machine Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
                    isMaintenance ? 'bg-gradient-to-br from-gray-500 to-gray-600' :
                    isOccupied ? 'bg-gradient-to-br from-orange-500 to-red-600' :
                    'bg-gradient-to-br from-emerald-500 to-green-600'
                  }`}>
                    🎮
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{machine.name}</h3>
                    <p className="text-xs text-muted">เครื่องที่ {machine.position}</p>
                  </div>
                </div>
                
                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  isMaintenance ? 'bg-gray-500 text-white' :
                  isOccupied ? 'bg-orange-500 text-white' :
                  'bg-emerald-500 text-white'
                }`}>
                  {isMaintenance ? '🔧 ซ่อมบำรุง' : isOccupied ? '🏁 กำลังเล่น' : '✅ ว่าง'}
                </div>
              </div>

              {/* Current Player */}
              {currentPlayer ? (
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-orange-400 mb-1">🏁 กำลังเล่น</p>
                      <p className="font-bold text-foreground">{currentPlayer.customerName}</p>
                      <p className="text-sm text-muted">{currentPlayer.customerPhone}</p>
                      <p className="text-xs text-muted mt-1">
                        ⏰ เริ่ม {formatTime(currentPlayer.bookingTime)} • {currentPlayer.duration} นาที
                      </p>
                    </div>
                    <GlowButton 
                      color="green" 
                      size="sm"
                      onClick={() => handleMarkDone(machine.id)}
                      disabled={isUpdating}
                    >
                      ✅ เสร็จ
                    </GlowButton>
                  </div>
                </div>
              ) : !isMaintenance && (
                <div className="bg-surface border border-border rounded-xl p-4 mb-4 text-center">
                  <p className="text-muted text-sm">ไม่มีคนกำลังเล่น</p>
                </div>
              )}

              {/* Queue Section */}
              {!isMaintenance && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      📋 คิวรอ ({waitingQueues.length} คน)
                    </span>
                    {nextInQueue && !currentPlayer && (
                      <GlowButton 
                        color="purple" 
                        size="sm"
                        onClick={() => handleCallNext(machine.id)}
                        disabled={isUpdating}
                      >
                        📢 เรียกคิว
                      </GlowButton>
                    )}
                  </div>
                  
                  {waitingQueues.length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {waitingQueues.slice(0, 4).map((queue, index) => (
                        <div 
                          key={queue.id}
                          className={`flex items-center justify-between p-2 rounded-lg ${
                            index === 0 ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-surface'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-purple-500 text-white' : 'bg-muted-light text-muted'
                            }`}>
                              {queue.position}
                            </span>
                            <span className={`text-sm ${index === 0 ? 'font-medium text-foreground' : 'text-muted'}`}>
                              {queue.customerName}
                            </span>
                          </div>
                          <span className="text-xs text-muted">{formatTime(queue.bookingTime)}</span>
                        </div>
                      ))}
                      {waitingQueues.length > 4 && (
                        <p className="text-xs text-muted text-center">+{waitingQueues.length - 4} คิวเพิ่มเติม</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted text-center py-2">ไม่มีคิวรอ</p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t border-border">
                {nextInQueue && currentPlayer && (
                  <AnimatedButton 
                    variant="primary" 
                    size="sm"
                    onClick={() => handleCallNext(machine.id)}
                    disabled={isUpdating}
                    className="flex-1"
                  >
                    📢 เรียกคิวถัดไป
                  </AnimatedButton>
                )}
                <AnimatedButton 
                  variant={isMaintenance ? 'success' : 'ghost'} 
                  size="sm"
                  onClick={() => handleToggleMachine(machine)}
                  disabled={isUpdating}
                  className="flex-1"
                >
                  {isMaintenance ? '✅ เปิดเครื่อง' : '🔧 ปิดซ่อม'}
                </AnimatedButton>
              </div>
            </AnimatedCard>
          );
        })}
      </div>
    </div>
  );
}

// Fullscreen Control Panel - Focus Mode for Game Room Control
interface FullscreenControlPanelProps {
  viewModel: BackendViewModel;
  isUpdating: boolean;
  onCallNext: (machineId: string) => Promise<void>;
  onMarkDone: (machineId: string) => Promise<void>;
  onToggleMachine: (machine: BackendViewModel['machines'][0]) => Promise<void>;
  onRefresh: () => Promise<void>;
  onExit: () => void;
  getCurrentPlayer: (machineId: string) => BackendViewModel['todayQueues'][0] | undefined;
  getWaitingQueues: (machineId: string) => BackendViewModel['todayQueues'];
  getNextInQueue: (machineId: string) => BackendViewModel['todayQueues'][0] | null;
  formatTime: (dateString: string) => string;
}

function FullscreenControlPanel({
  viewModel,
  isUpdating,
  onCallNext,
  onMarkDone,
  onToggleMachine,
  onRefresh,
  onExit,
  getCurrentPlayer,
  getWaitingQueues,
  getNextInQueue,
  formatTime,
}: FullscreenControlPanelProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh every 10 seconds in fullscreen mode
  useEffect(() => {
    const interval = setInterval(() => {
      onRefresh();
    }, 10000);
    return () => clearInterval(interval);
  }, [onRefresh]);

  const formatCurrentTime = () => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }).format(currentTime);
  };

  const formatCurrentDate = () => {
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(currentTime);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-auto">
      {/* Header Bar */}
      <header className="sticky top-0 z-10 bg-gradient-to-r from-purple-900 via-purple-800 to-pink-900 px-6 py-4 shadow-2xl">
        <div className="flex items-center justify-between">
          {/* Left: Title & Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-3xl">
                🎮
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Racing Queue Control</h1>
                <p className="text-white/60 text-sm">โหมดควบคุมห้องเกม</p>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden lg:flex items-center gap-4 ml-8">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20">
                <span className="text-2xl font-bold text-emerald-400">{viewModel.machineStats.availableMachines}</span>
                <span className="text-emerald-400/80 text-sm">ว่าง</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20">
                <span className="text-2xl font-bold text-orange-400">{viewModel.machineStats.occupiedMachines}</span>
                <span className="text-orange-400/80 text-sm">กำลังเล่น</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-500/20">
                <span className="text-2xl font-bold text-purple-300">{viewModel.waitingQueues.length}</span>
                <span className="text-purple-300/80 text-sm">รอคิว</span>
              </div>
            </div>
          </div>

          {/* Right: Clock & Exit */}
          <div className="flex items-center gap-6">
            {/* Clock */}
            <div className="text-right hidden md:block">
              <div className="text-3xl font-mono font-bold text-white">{formatCurrentTime()}</div>
              <div className="text-white/60 text-sm">{formatCurrentDate()}</div>
            </div>

            {/* Refresh & Exit */}
            <div className="flex items-center gap-3">
              <button
                onClick={onRefresh}
                disabled={isUpdating}
                className="w-12 h-12 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-2xl transition-all disabled:opacity-50"
              >
                🔄
              </button>
              <button
                onClick={onExit}
                className="px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold flex items-center gap-2 transition-all shadow-lg"
              >
                <span className="text-xl">✕</span>
                <span className="hidden sm:inline">ออกจากโหมดเต็มจอ</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Machine Grid */}
      <main className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {viewModel.machines.map((machine) => {
            const currentPlayer = getCurrentPlayer(machine.id);
            const waitingQueues = getWaitingQueues(machine.id);
            const nextInQueue = getNextInQueue(machine.id);
            const isOccupied = machine.status === 'occupied' || !!currentPlayer;
            const isMaintenance = machine.status === 'maintenance';

            return (
              <div
                key={machine.id}
                className={`relative rounded-2xl overflow-hidden shadow-xl transition-all ${
                  isMaintenance
                    ? 'bg-gray-800 ring-2 ring-gray-600'
                    : isOccupied
                    ? 'bg-gradient-to-br from-orange-900/50 to-red-900/50 ring-2 ring-orange-500'
                    : 'bg-gradient-to-br from-emerald-900/50 to-green-900/50 ring-2 ring-emerald-500'
                }`}
              >
                {/* Machine Header */}
                <div className={`px-5 py-4 ${
                  isMaintenance ? 'bg-gray-700' :
                  isOccupied ? 'bg-orange-500' : 'bg-emerald-500'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">🎮</span>
                      <div>
                        <h3 className="text-xl font-bold text-white">{machine.name}</h3>
                        <p className="text-white/70 text-sm">เครื่องที่ {machine.position}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">
                        {isMaintenance ? '🔧 ซ่อมบำรุง' : isOccupied ? '🏁 กำลังเล่น' : '✅ ว่าง'}
                      </div>
                      <div className="text-white/70 text-sm">
                        คิวรอ: {waitingQueues.length} คน
                      </div>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                  {/* Current Player */}
                  {currentPlayer ? (
                    <div className="bg-black/30 rounded-xl p-4">
                      <p className="text-orange-400 text-sm mb-2">🏁 ผู้เล่นปัจจุบัน</p>
                      <p className="text-2xl font-bold text-white">{currentPlayer.customerName}</p>
                      <p className="text-white/60">{currentPlayer.customerPhone}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                        <span>⏰ {formatTime(currentPlayer.bookingTime)}</span>
                        <span>⏱️ {currentPlayer.duration} นาที</span>
                      </div>
                    </div>
                  ) : !isMaintenance && (
                    <div className="bg-black/20 rounded-xl p-4 text-center">
                      <p className="text-white/40 text-lg">ไม่มีผู้เล่น</p>
                    </div>
                  )}

                  {/* Next in Queue */}
                  {nextInQueue && !isMaintenance && (
                    <div className="bg-purple-500/20 rounded-xl p-3 border border-purple-500/30">
                      <p className="text-purple-300 text-xs mb-1">📋 คิวถัดไป</p>
                      <div className="flex items-center justify-between">
                        <span className="text-white font-medium">{nextInQueue.customerName}</span>
                        <span className="text-purple-300 text-sm">{formatTime(nextInQueue.bookingTime)}</span>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons - Large for touch */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    {/* Call Next / Start Playing */}
                    {nextInQueue && !currentPlayer && !isMaintenance && (
                      <button
                        onClick={() => onCallNext(machine.id)}
                        disabled={isUpdating}
                        className="col-span-2 py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                      >
                        📢 เรียกคิว
                      </button>
                    )}

                    {/* Mark Done */}
                    {currentPlayer && (
                      <button
                        onClick={() => onMarkDone(machine.id)}
                        disabled={isUpdating}
                        className="py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                      >
                        ✅ เสร็จสิ้น
                      </button>
                    )}

                    {/* Call Next (while playing) */}
                    {currentPlayer && nextInQueue && (
                      <button
                        onClick={() => onCallNext(machine.id)}
                        disabled={isUpdating}
                        className="py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50"
                      >
                        📢 เรียกถัดไป
                      </button>
                    )}

                    {/* Toggle Maintenance */}
                    <button
                      onClick={() => onToggleMachine(machine)}
                      disabled={isUpdating}
                      className={`py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg disabled:opacity-50 ${
                        isMaintenance
                          ? 'bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white col-span-2'
                          : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      }`}
                    >
                      {isMaintenance ? '✅ เปิดเครื่อง' : '🔧 ปิดซ่อม'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer Stats - Mobile */}
      <footer className="lg:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg px-4 py-3">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-400">{viewModel.machineStats.availableMachines}</div>
            <div className="text-xs text-white/60">ว่าง</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{viewModel.machineStats.occupiedMachines}</div>
            <div className="text-xs text-white/60">เล่นอยู่</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{viewModel.waitingQueues.length}</div>
            <div className="text-xs text-white/60">รอคิว</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-mono font-bold text-white">{formatCurrentTime()}</div>
            <div className="text-xs text-white/60">เวลา</div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Queues Tab
interface QueuesTabProps {
  queues: Array<{
    id: string;
    machineId: string;
    customerName: string;
    customerPhone: string;
    bookingTime: string;
    duration: number;
    status: string;
    position: number;
    notes?: string;
  }>;
  isUpdating: boolean;
  onUpdateStatus: (id: string, status: QueueStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function QueuesTab({ queues, isUpdating, onUpdateStatus, onDelete }: QueuesTabProps) {
  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return { label: 'รอคิว', color: 'bg-purple-500', textColor: 'text-purple-400' };
      case 'playing':
        return { label: 'กำลังเล่น', color: 'bg-cyan-500', textColor: 'text-cyan-400' };
      case 'completed':
        return { label: 'เสร็จสิ้น', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
      case 'cancelled':
        return { label: 'ยกเลิก', color: 'bg-red-500', textColor: 'text-red-400' };
      default:
        return { label: status, color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">คิววันนี้ ({queues.length})</h3>
      </div>

      {queues.length === 0 ? (
        <AnimatedCard className="p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-muted">ยังไม่มีคิววันนี้</p>
        </AnimatedCard>
      ) : (
        <div className="space-y-3">
          {queues.map((queue) => {
            const statusConfig = getStatusConfig(queue.status);
            return (
              <AnimatedCard key={queue.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl font-bold text-white">
                      #{queue.position}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{queue.customerName}</p>
                      <p className="text-sm text-muted">{queue.customerPhone}</p>
                      <p className="text-xs text-muted mt-1">
                        🕐 {formatTime(queue.bookingTime)} • {queue.duration} นาที
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
                      {statusConfig.label}
                    </span>

                    {queue.status === 'waiting' && (
                      <AnimatedButton
                        variant="primary"
                        size="sm"
                        onClick={() => onUpdateStatus(queue.id, 'playing')}
                        disabled={isUpdating}
                      >
                        ▶️ เริ่มเล่น
                      </AnimatedButton>
                    )}

                    {queue.status === 'playing' && (
                      <AnimatedButton
                        variant="success"
                        size="sm"
                        onClick={() => onUpdateStatus(queue.id, 'completed')}
                        disabled={isUpdating}
                      >
                        ✅ เสร็จสิ้น
                      </AnimatedButton>
                    )}

                    {(queue.status === 'waiting' || queue.status === 'playing') && (
                      <AnimatedButton
                        variant="danger"
                        size="sm"
                        onClick={() => onUpdateStatus(queue.id, 'cancelled')}
                        disabled={isUpdating}
                      >
                        ❌ ยกเลิก
                      </AnimatedButton>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Machines Tab
interface MachinesTabProps {
  machines: Array<{
    id: string;
    name: string;
    description: string;
    status: string;
    position: number;
    isActive: boolean;
  }>;
  isUpdating: boolean;
  onUpdateStatus: (id: string, status: MachineStatus) => Promise<void>;
}

function MachinesTab({ machines, isUpdating, onUpdateStatus }: MachinesTabProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { label: 'ว่าง', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
      case 'occupied':
        return { label: 'กำลังใช้งาน', color: 'bg-orange-500', textColor: 'text-orange-400' };
      case 'maintenance':
        return { label: 'ซ่อมบำรุง', color: 'bg-gray-500', textColor: 'text-gray-400' };
      default:
        return { label: status, color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {machines.map((machine) => {
        const statusConfig = getStatusConfig(machine.status);
        return (
          <AnimatedCard key={machine.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl">
                  🎮
                </div>
                <div>
                  <h4 className="font-bold text-foreground">{machine.name}</h4>
                  <p className="text-sm text-muted">เครื่องที่ {machine.position}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
                {statusConfig.label}
              </span>
            </div>

            <p className="text-sm text-muted mb-4">{machine.description}</p>

            <div className="flex flex-wrap gap-2">
              {machine.status !== 'available' && (
                <AnimatedButton
                  variant="success"
                  size="sm"
                  onClick={() => onUpdateStatus(machine.id, 'available')}
                  disabled={isUpdating}
                >
                  ✅ เปิดใช้งาน
                </AnimatedButton>
              )}
              {machine.status !== 'maintenance' && (
                <AnimatedButton
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdateStatus(machine.id, 'maintenance')}
                  disabled={isUpdating}
                >
                  🔧 ซ่อมบำรุง
                </AnimatedButton>
              )}
            </div>
          </AnimatedCard>
        );
      })}
    </div>
  );
}

// Stats Card - Using CSS hover transition instead of react-spring
function StatsCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${color} shadow-lg cursor-default transition-transform duration-200 hover:scale-105`}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-white">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm opacity-80">{label}</div>
      </div>
    </div>
  );
}

// Queue Row
function QueueRow({ queue }: { queue: { id: string; customerName: string; status: string; bookingTime: string; position: number } }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return { label: 'รอคิว', color: 'text-purple-400' };
      case 'playing':
        return { label: 'กำลังเล่น', color: 'text-cyan-400' };
      case 'completed':
        return { label: 'เสร็จสิ้น', color: 'text-emerald-400' };
      default:
        return { label: status, color: 'text-gray-400' };
    }
  };

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const statusConfig = getStatusConfig(queue.status);

  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 text-sm font-bold">
          #{queue.position}
        </span>
        <span className="text-foreground font-medium">{queue.customerName}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-muted text-sm">{formatTime(queue.bookingTime)}</span>
        <span className={`text-sm font-medium ${statusConfig.color}`}>{statusConfig.label}</span>
      </div>
    </div>
  );
}

// Machine Status Card
function MachineStatusCard({ machine }: { machine: { id: string; name: string; status: string; position: number } }) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return { icon: '✅', color: 'border-emerald-500 bg-emerald-500/10' };
      case 'occupied':
        return { icon: '🏁', color: 'border-orange-500 bg-orange-500/10' };
      case 'maintenance':
        return { icon: '🔧', color: 'border-gray-500 bg-gray-500/10' };
      default:
        return { icon: '❓', color: 'border-gray-500 bg-gray-500/10' };
    }
  };

  const statusConfig = getStatusConfig(machine.status);

  return (
    <div className={`p-3 rounded-xl border-2 ${statusConfig.color}`}>
      <div className="flex items-center gap-2">
        <span className="text-lg">{statusConfig.icon}</span>
        <span className="font-medium text-foreground">{machine.name}</span>
      </div>
    </div>
  );
}

// Customers Tab - Following Clean Architecture Pattern
function CustomersTab() {
  const [state, actions] = useCustomersPresenter();
  const { viewModel, loading, searchQuery, isAddModalOpen } = state;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(dateString));
  };

  if (loading && !viewModel) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  const customers = viewModel?.customers || [];
  const stats = viewModel?.stats;

  return (
    <div className="space-y-6">
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <CustomerStatsCard icon="👥" label="ลูกค้าทั้งหมด" value={stats.totalCustomers} color="from-blue-500 to-cyan-500" />
          <CustomerStatsCard icon="⭐" label="VIP" value={stats.vipCustomers} color="from-amber-500 to-orange-500" />
          <CustomerStatsCard icon="🆕" label="ใหม่วันนี้" value={stats.newCustomersToday} color="from-emerald-500 to-green-500" />
          <CustomerStatsCard icon="🔄" label="ลูกค้าประจำ" value={stats.returningCustomers} color="from-purple-500 to-pink-500" />
        </div>
      )}

      {/* Search & Add */}
      <div className="flex gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => actions.searchCustomers(e.target.value)}
          placeholder="🔍 ค้นหาชื่อหรือเบอร์โทร..."
          className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-foreground placeholder-muted"
        />
        <GlowButton color="orange" onClick={actions.openAddModal}>
          ➕ เพิ่ม
        </GlowButton>
      </div>

      {/* Customer List */}
      {customers.length === 0 ? (
        <AnimatedCard className="p-8 text-center">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-muted">ไม่พบลูกค้า</p>
        </AnimatedCard>
      ) : (
        <div className="space-y-3">
          {customers.map((customer) => (
            <AnimatedCard key={customer.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    customer.isVip 
                      ? 'bg-gradient-to-br from-amber-400 to-orange-500' 
                      : 'bg-gradient-to-br from-gray-400 to-gray-600'
                  }`}>
                    {customer.isVip ? '⭐' : '👤'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-foreground">{customer.name}</span>
                      {customer.isVip && (
                        <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs font-bold rounded-full">VIP</span>
                      )}
                    </div>
                    <span className="text-sm text-muted">{customer.phone}</span>
                    <div className="flex gap-3 text-xs text-muted mt-1">
                      <span>🎮 {customer.visitCount} ครั้ง</span>
                      <span>⏱️ {customer.totalPlayTime} นาที</span>
                      {customer.lastVisit && <span>📅 {formatDate(customer.lastVisit)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <AnimatedButton 
                    variant={customer.isVip ? 'secondary' : 'primary'} 
                    size="sm" 
                    onClick={() => actions.toggleVipStatus(customer)}
                  >
                    {customer.isVip ? '⭐ ยกเลิก' : '⭐ VIP'}
                  </AnimatedButton>
                  <AnimatedButton variant="danger" size="sm" onClick={() => actions.deleteCustomer(customer.id)}>
                    🗑️
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Add Modal */}
      {isAddModalOpen && (
        <Portal>
          <AddCustomerModal 
            onClose={actions.closeAddModal}
            onSave={actions.createCustomer}
          />
        </Portal>
      )}
    </div>
  );
}

// Customer Stats Card
function CustomerStatsCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${color} shadow-lg`}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-white">
        <div className="text-xl mb-1">{icon}</div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs opacity-80">{label}</div>
      </div>
    </div>
  );
}

// Add Customer Modal
function AddCustomerModal({ onClose, onSave }: { 
  onClose: () => void; 
  onSave: (data: { name: string; phone: string; email?: string; notes?: string }) => Promise<void>;
}) {
  const [formData, setFormData] = useState({ name: '', phone: '', email: '', notes: '' });
  const [saving, setSaving] = useState(false);

  // Using CSS animation instead of react-spring

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.phone.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        notes: formData.notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
        <div className="p-4 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-lg text-foreground">➕ เพิ่มลูกค้า</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-amber-500 text-foreground"
            placeholder="ชื่อ-นามสกุล *"
          />
          <input
            type="tel"
            required
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-amber-500 text-foreground"
            placeholder="เบอร์โทร *"
          />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-amber-500 text-foreground"
            placeholder="อีเมล"
          />
          <div className="flex gap-3 pt-2">
            <AnimatedButton variant="ghost" onClick={onClose} className="flex-1" disabled={saving}>ยกเลิก</AnimatedButton>
            <AnimatedButton variant="primary" type="submit" className="flex-1" disabled={saving}>
              {saving ? '⏳...' : '💾 บันทึก'}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
