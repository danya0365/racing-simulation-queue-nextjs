'use client';

import { Customer, UpdateCustomerData } from '@/src/application/repositories/ICustomerRepository';
import type { MachineStatus } from '@/src/application/repositories/IMachineRepository';
import type { QueueStatus } from '@/src/application/repositories/IQueueRepository';
import { CUSTOMER_CONFIG } from '@/src/config/customerConfig';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { ConfirmationModal } from '@/src/presentation/components/ui/ConfirmationModal';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import {
    BackendSkeleton,
    CustomersTabSkeleton
} from '@/src/presentation/components/ui/Skeleton';
import { BackendViewModel } from '@/src/presentation/presenters/backend/BackendPresenter';
import { useBackendPresenter } from '@/src/presentation/presenters/backend/useBackendPresenter';
import { useCustomersPresenter } from '@/src/presentation/presenters/customers/useCustomersPresenter';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useReactToPrint } from 'react-to-print';
import { AdvanceBookingsTab } from './AdvanceBookingsTab';
import { FullscreenControlPanel } from './FullscreenControlPanel';
import { QueueDetailModal } from './QueueDetailModal';
import { QuickBookingQRCode } from './QuickBookingQRCode';

interface BackendViewProps {
  initialViewModel?: BackendViewModel;
}

export function BackendView({ initialViewModel }: BackendViewProps) {
  const [state, actions] = useBackendPresenter(initialViewModel);
  const viewModel = state.viewModel;

  const qrCodeRef = useRef<HTMLDivElement>(null);
  const handlePrintQR = useReactToPrint({
    contentRef: qrCodeRef,
  });

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

            <div className="flex gap-3">
              <GlowButton color="cyan" onClick={() => handlePrintQR && handlePrintQR()}>
                🖨️ Print QR
              </GlowButton>
              <Link href="/backend/advance-control">
                <GlowButton color="pink">
                  📅 ห้องควบคุม
                </GlowButton>
              </Link>
              <AnimatedButton variant="secondary" onClick={actions.refreshData}>
                🔄 รีเฟรช
              </AnimatedButton>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 md:px-8 py-4 bg-surface/50 backdrop-blur-sm border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2">
          <TabButton
            active={state.activeTab === 'dashboard'}
            onClick={() => actions.setActiveTab('dashboard')}
          >
            📊 Dashboard
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
          <TabButton
            active={state.activeTab === 'advanceBookings'}
            onClick={() => actions.setActiveTab('advanceBookings')}
          >
            📅 จองเวลา
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
              onResetQueue={actions.resetMachineQueue}
              onRefresh={actions.refreshData}
            />
          )}
          {state.activeTab === 'queues' && (
            <QueuesTab
              queues={viewModel.activeQueues}
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
              onUpdateMachine={actions.updateMachine}
            />
          )}
          {state.activeTab === 'customers' && (
            <CustomersTab />
          )}
          {state.activeTab === 'advanceBookings' && (
            <AdvanceBookingsTab />
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

      {/* Hidden Printable Component */}
      <div style={{ display: 'none' }}>
        <QuickBookingQRCode ref={qrCodeRef} url="http://localhost:3000/quick-advance-booking" />
      </div>
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
        <StatsCard icon="🏁" label="กำลังเล่น" value={viewModel.machineStats.occupiedMachines} color="from-orange-500 to-amber-500" />
      </div>

      {/* Recent Queues */}
      <AnimatedCard className="p-6">
        <h3 className="text-lg font-bold mb-4 text-foreground">📋 คิวล่าสุดวันนี้</h3>
        {viewModel.activeQueues.length === 0 ? (
          <p className="text-muted text-center py-8">ยังไม่มีคิววันนี้</p>
        ) : (
          <div className="space-y-3">
            {viewModel.activeQueues.slice(0, 5).map((queue) => (
              <QueueRow key={queue.id} queue={queue} />
            ))}
          </div>
        )}
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
  onResetQueue: (machineId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

function LiveControlTab({ viewModel, isUpdating, onUpdateQueueStatus, onUpdateMachineStatus, onResetQueue, onRefresh }: LiveControlTabProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [resetConfirmMachineId, setResetConfirmMachineId] = useState<string | null>(null);
  const [viewQueueMachineId, setViewQueueMachineId] = useState<string | null>(null); // New state to track which machine's queue to view

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  // Get queues for a specific machine
  const getMachineQueues = (machineId: string) => {
    return viewModel.activeQueues.filter(q => q.machineId === machineId);
  };

  // Get current playing queue for a machine
  const getCurrentPlayer = (machineId: string) => {
    return viewModel.activeQueues.find(q => q.machineId === machineId && q.status === 'playing');
  };

  // Get waiting queues for a machine
  const getWaitingQueues = (machineId: string) => {
    return viewModel.activeQueues
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
              className={`p-5 transition-all duration-300 ${isMaintenance ? 'bg-surface/40' : ''}`}
              glowColor={
                isMaintenance ? 'rgba(107, 114, 128, 0.3)' :
                isOccupied ? 'rgba(249, 115, 22, 0.3)' :
                'rgba(16, 185, 129, 0.3)'
              }
            >
              {/* Machine Header */}
              <div className={`flex items-center justify-between mb-4 ${isMaintenance ? 'opacity-50 grayscale' : ''}`}>
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
                {!isMaintenance && (
                   <AnimatedButton 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setViewQueueMachineId(machine.id)}
                    className="flex-1"
                  >
                    🔍 ดูคิว ({waitingQueues.length})
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
                {/* Reset Queue Button */}
                {waitingQueues.length > 0 && (
                  <AnimatedButton 
                    variant="danger" 
                    size="sm"
                    onClick={() => setResetConfirmMachineId(machine.id)}
                    disabled={isUpdating}
                  >
                    🔄 Reset
                  </AnimatedButton>
                )}
              </div>

              {/* Reset Confirmation */}
              {resetConfirmMachineId === machine.id && (
                <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                  <p className="text-sm text-red-400 mb-2">
                    ⚠️ ยืนยัน Reset คิวทั้งหมดของเครื่องนี้?
                  </p>
                  <p className="text-xs text-muted mb-3">
                    คิวรอ {waitingQueues.length} คนจะถูกยกเลิก และลำดับคิวจะเริ่มใหม่
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setResetConfirmMachineId(null)}
                      className="flex-1 px-3 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:bg-muted-light"
                    >
                      ยกเลิก
                    </button>
                    <button
                      onClick={async () => {
                        await onResetQueue(machine.id);
                        setResetConfirmMachineId(null);
                      }}
                      disabled={isUpdating}
                      className="flex-1 px-3 py-2 bg-red-500 hover:bg-red-600 rounded-lg text-sm text-white font-medium disabled:opacity-50"
                    >
                      🔄 Reset เลย
                    </button>
                  </div>
                </div>
              )}
            </AnimatedCard>
          );
        })}
      </div>

      {/* Queue Detail Modal */}
      {viewQueueMachineId && (
        <Portal>
          <QueueDetailModal
            machine={viewModel.machines.find(m => m.id === viewQueueMachineId)!}
            queues={getMachineQueues(viewQueueMachineId)}
            onClose={() => setViewQueueMachineId(null)}
          />
        </Portal>
      )}
    </div>
  );
}

// Queue Detail Modal


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
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  // Filter queues by status
  const filteredQueues = statusFilter === 'all' 
    ? queues 
    : queues.filter(q => q.status === statusFilter);

  // Calculate pagination
  const totalPages = Math.ceil(filteredQueues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQueues = filteredQueues.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filter changes
  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  // Count by status for filter badges
  const statusCounts = {
    all: queues.length,
    waiting: queues.filter(q => q.status === 'waiting').length,
    playing: queues.filter(q => q.status === 'playing').length,
    completed: queues.filter(q => q.status === 'completed').length,
    cancelled: queues.filter(q => q.status === 'cancelled').length,
  };

  const filterButtons = [
    { key: 'all', label: 'ทั้งหมด', icon: '📋', color: 'from-gray-500 to-gray-600' },
    { key: 'waiting', label: 'รอคิว', icon: '⏳', color: 'from-purple-500 to-violet-600' },
    { key: 'playing', label: 'กำลังเล่น', icon: '🏁', color: 'from-cyan-500 to-blue-600' },
    { key: 'completed', label: 'เสร็จสิ้น', icon: '✅', color: 'from-emerald-500 to-green-600' },
    { key: 'cancelled', label: 'ยกเลิก', icon: '❌', color: 'from-red-500 to-rose-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">
          คิววันนี้ ({filteredQueues.length}{statusFilter !== 'all' ? ` / ${queues.length}` : ''})
        </h3>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleFilterChange(btn.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              statusFilter === btn.key
                ? `bg-gradient-to-r ${btn.color} text-white shadow-lg`
                : 'bg-surface border border-border text-muted hover:bg-muted-light hover:text-foreground'
            }`}
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === btn.key 
                ? 'bg-white/20' 
                : 'bg-muted-light'
            }`}>
              {statusCounts[btn.key as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Queue List */}
      {paginatedQueues.length === 0 ? (
        <AnimatedCard className="p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-muted">
            {statusFilter === 'all' ? 'ยังไม่มีคิววันนี้' : `ไม่มีคิวสถานะ "${getStatusConfig(statusFilter).label}"`}
          </p>
        </AnimatedCard>
      ) : (
        <div className="space-y-3">
          {paginatedQueues.map((queue) => {
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:bg-muted-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ← ก่อนหน้า
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // Show first, last, current, and pages around current
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .map((page, index, arr) => {
                // Add ellipsis if there's a gap
                const prevPage = arr[index - 1];
                const showEllipsis = prevPage && page - prevPage > 1;
                
                return (
                  <span key={page} className="flex items-center gap-1">
                    {showEllipsis && <span className="px-2 text-muted">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-surface border border-border text-muted hover:bg-muted-light'
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:bg-muted-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ถัดไป →
          </button>
        </div>
      )}

      {/* Summary Footer */}
      {filteredQueues.length > 0 && (
        <div className="text-center text-sm text-muted">
          แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredQueues.length)} จาก {filteredQueues.length} รายการ
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
    imageUrl?: string;
  }>;
  isUpdating: boolean;
  onUpdateStatus: (id: string, status: MachineStatus) => Promise<void>;
  onUpdateMachine: (id: string, data: {
    name?: string;
    description?: string;
    position?: number;
    imageUrl?: string;
    isActive?: boolean;
    status?: MachineStatus;
  }) => Promise<void>;
}

function MachinesTab({ machines, isUpdating, onUpdateStatus, onUpdateMachine }: MachinesTabProps) {
  const [editingMachine, setEditingMachine] = useState<typeof machines[0] | null>(null);

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

  const handleToggleActive = async (machine: typeof machines[0]) => {
    await onUpdateMachine(machine.id, { isActive: !machine.isActive });
  };

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {machines.map((machine) => {
          const statusConfig = getStatusConfig(machine.status);
          return (
            <AnimatedCard 
              key={machine.id} 
              className={`p-6 ${!machine.isActive ? 'opacity-60' : ''}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-2xl">
                    🎮
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      {machine.name}
                      {!machine.isActive && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          ซ่อน
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-muted">เครื่องที่ {machine.position}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
                    {statusConfig.label}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted mb-4 line-clamp-2">{machine.description}</p>

              <div className="flex flex-wrap gap-2">
                {/* Toggle Active Button */}
                <AnimatedButton
                  variant={machine.isActive ? 'ghost' : 'success'}
                  size="sm"
                  onClick={() => handleToggleActive(machine)}
                  disabled={isUpdating}
                >
                  {machine.isActive ? '👁️ ซ่อน' : '👁️ แสดง'}
                </AnimatedButton>

                {/* Status Buttons */}
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

                {/* Edit Button */}
                <AnimatedButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingMachine(machine)}
                  disabled={isUpdating}
                >
                  ✏️ แก้ไข
                </AnimatedButton>
              </div>
            </AnimatedCard>
          );
        })}
      </div>

      {/* Edit Machine Modal */}
      {editingMachine && (
        <Portal>
          <EditMachineModal
            machine={editingMachine}
            onClose={() => setEditingMachine(null)}
            onSave={async (data) => {
              await onUpdateMachine(editingMachine.id, data);
              setEditingMachine(null);
            }}
            isUpdating={isUpdating}
          />
        </Portal>
      )}
    </>
  );
}

// Edit Machine Modal
interface EditMachineModalProps {
  machine: {
    id: string;
    name: string;
    description: string;
    status: string;
    position: number;
    isActive: boolean;
    imageUrl?: string;
  };
  onClose: () => void;
  onSave: (data: {
    name?: string;
    description?: string;
    position?: number;
    imageUrl?: string;
    isActive?: boolean;
    status?: MachineStatus;
  }) => Promise<void>;
  isUpdating: boolean;
}

function EditMachineModal({ machine, onClose, onSave, isUpdating }: EditMachineModalProps) {
  const [formData, setFormData] = useState({
    name: machine.name,
    description: machine.description,
    position: machine.position,
    imageUrl: machine.imageUrl || '',
    isActive: machine.isActive,
    status: machine.status as MachineStatus,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({
      name: formData.name,
      description: formData.description,
      position: formData.position,
      imageUrl: formData.imageUrl || undefined,
      isActive: formData.isActive,
      status: formData.status,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-lg text-foreground">✏️ แก้ไขเครื่อง</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground transition-colors">✕</button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm text-muted mb-1">ชื่อเครื่อง</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground"
              placeholder="เช่น Racing Sim 1"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm text-muted mb-1">รายละเอียด</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground resize-none"
              rows={3}
              placeholder="เช่น เครื่อง Formula Racing Simulator พร้อมพวงมาลัย..."
            />
          </div>

          {/* Position */}
          <div>
            <label className="block text-sm text-muted mb-1">ลำดับเครื่อง</label>
            <input
              type="number"
              min="1"
              required
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: parseInt(e.target.value) || 1 })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground"
            />
          </div>

          {/* Image URL */}
          <div>
            <label className="block text-sm text-muted mb-1">URL รูปภาพ (optional)</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground"
              placeholder="https://..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm text-muted mb-1">สถานะ</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as MachineStatus })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-cyan-500 text-foreground"
            >
              <option value="available">✅ ว่าง</option>
              <option value="occupied">🏁 กำลังใช้งาน</option>
              <option value="maintenance">🔧 ซ่อมบำรุง</option>
            </select>
          </div>

          {/* isActive Toggle */}
          <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
            <div>
              <p className="font-medium text-foreground">แสดงในหน้าลูกค้า</p>
              <p className="text-xs text-muted">เมื่อปิด เครื่องนี้จะไม่แสดงให้ลูกค้าเห็น</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                formData.isActive ? 'bg-emerald-500' : 'bg-gray-500'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                formData.isActive ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <AnimatedButton variant="ghost" onClick={onClose} className="flex-1" disabled={isUpdating}>
              ยกเลิก
            </AnimatedButton>
            <AnimatedButton variant="primary" type="submit" className="flex-1" disabled={isUpdating}>
              {isUpdating ? '⏳ กำลังบันทึก...' : '💾 บันทึก'}
            </AnimatedButton>
          </div>
        </form>
      </div>
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



// Customers Tab - Following Clean Architecture Pattern
function CustomersTab() {
  const [state, actions] = useCustomersPresenter();
  const { viewModel, loading, searchQuery, isAddModalOpen } = state;
  
  // Filter and pagination state
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [customerToDelete, setCustomerToDelete] = useState<{ id: string; name: string } | null>(null);
  const itemsPerPage = 10;

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(dateString));
  };

  if (loading && !viewModel) {
    return <CustomersTabSkeleton />;
  }

  // Error state
  if (state.error && !viewModel) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">⚠️</div>
        <p className="text-error mb-4">{state.error}</p>
        <AnimatedButton onClick={actions.loadData}>
          🔄 ลองใหม่อีกครั้ง
        </AnimatedButton>
      </div>
    );
  }

  const allCustomers = viewModel?.customers || [];
  const stats = viewModel?.stats;

  // Calculate today date for "new today" filter
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Filter customers based on active filter
  const getFilteredCustomers = () => {
    let filtered = allCustomers;
    
    // Apply search first
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.phone.includes(query)
      );
    }
    
    // Apply filter
    switch (activeFilter) {
      case 'vip':
        return filtered.filter(c => c.isVip);
      case 'new':
        return filtered.filter(c => {
          const createdAt = new Date(c.createdAt);
          createdAt.setHours(0, 0, 0, 0);
          return createdAt.getTime() === today.getTime();
        });
      case 'regular':
        return filtered.filter(c => c.visitCount >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS);
      default:
        return filtered;
    }
  };

  const filteredCustomers = getFilteredCustomers();
  
  // Pagination
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedCustomers = filteredCustomers.slice(startIndex, startIndex + itemsPerPage);

  // Reset page when filter/search changes
  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleSearch = (query: string) => {
    actions.searchCustomers(query);
    setCurrentPage(1);
  };

  // Count by filter for badges
  const filterCounts = {
    all: allCustomers.length,
    vip: allCustomers.filter(c => c.isVip).length,
    new: allCustomers.filter(c => {
      const createdAt = new Date(c.createdAt);
      createdAt.setHours(0, 0, 0, 0);
      return createdAt.getTime() === today.getTime();
    }).length,
    regular: allCustomers.filter(c => c.visitCount >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS).length,
  };

  const filterButtons = [
    { key: 'all', label: 'ทั้งหมด', icon: '👥', color: 'from-gray-500 to-gray-600' },
    { key: 'vip', label: 'VIP', icon: '⭐', color: 'from-amber-500 to-orange-600' },
    { key: 'new', label: 'ใหม่วันนี้', icon: '🆕', color: 'from-emerald-500 to-green-600' },
    { key: 'regular', label: 'ลูกค้าประจำ', icon: '🔄', color: 'from-purple-500 to-pink-600' },
  ];

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

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleFilterChange(btn.key)}
            className={`relative flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeFilter === btn.key
                ? `bg-gradient-to-r ${btn.color} text-white shadow-lg`
                : 'bg-surface border border-border text-muted hover:text-foreground hover:border-amber-500/50'
            }`}
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              activeFilter === btn.key 
                ? 'bg-white/20' 
                : 'bg-muted-light'
            }`}>
              {filterCounts[btn.key as keyof typeof filterCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Search & Add */}
      <div className="flex gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="🔍 ค้นหาชื่อหรือเบอร์โทร..."
          className="flex-1 px-4 py-3 bg-surface border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 text-foreground placeholder-muted"
        />
        <GlowButton color="orange" onClick={actions.openAddModal}>
          ➕ เพิ่ม
        </GlowButton>
      </div>

      {/* Results info */}
      <div className="flex justify-between items-center text-sm text-muted">
        <span>
          แสดง {paginatedCustomers.length} จาก {filteredCustomers.length} รายการ
          {activeFilter !== 'all' && ` (กรอง: ${filterButtons.find(b => b.key === activeFilter)?.label})`}
        </span>
        {totalPages > 1 && (
          <span>หน้า {currentPage} / {totalPages}</span>
        )}
      </div>

      {/* Customer List */}
      {paginatedCustomers.length === 0 ? (
        <AnimatedCard className="p-8 text-center">
          <div className="text-4xl mb-4">👥</div>
          <p className="text-muted">
            {searchQuery 
              ? `ไม่พบลูกค้าที่ตรงกับ "${searchQuery}"` 
              : activeFilter !== 'all'
                ? `ไม่มีลูกค้าในหมวด "${filterButtons.find(b => b.key === activeFilter)?.label}"`
                : 'ยังไม่มีลูกค้า'}
          </p>
        </AnimatedCard>
      ) : (
        <div className="space-y-3">
          {paginatedCustomers.map((customer) => (
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
                      {customer.visitCount >= CUSTOMER_CONFIG.REGULAR_CUSTOMER_MIN_VISITS && !customer.isVip && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs font-bold rounded-full">ประจำ</span>
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
                    variant="secondary" 
                    size="sm" 
                    onClick={() => actions.openDetailModal(customer)}
                  >
                    ✏️ แก้ไข
                  </AnimatedButton>
                  <AnimatedButton 
                    variant={customer.isVip ? 'secondary' : 'primary'} 
                    size="sm" 
                    onClick={() => actions.toggleVipStatus(customer)}
                  >
                    {customer.isVip ? '⭐ ยกเลิก' : '⭐ VIP'}
                  </AnimatedButton>
                  <AnimatedButton variant="danger" size="sm" onClick={() => setCustomerToDelete({ id: customer.id, name: customer.name })}>
                    🗑️
                  </AnimatedButton>
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ← ก่อนหน้า
          </button>
          
          <div className="flex gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                    currentPage === pageNum
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                      : 'bg-surface border border-border text-muted hover:text-foreground hover:border-amber-500/50'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            {totalPages > 5 && currentPage < totalPages - 2 && (
              <>
                <span className="px-2 text-muted">...</span>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  className="w-10 h-10 rounded-lg text-sm font-medium bg-surface border border-border text-muted hover:text-foreground"
                >
                  {totalPages}
                </button>
              </>
            )}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-surface border border-border rounded-lg text-foreground hover:bg-muted-light disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ถัดไป →
          </button>
        </div>
      )}

      {/* Edit Modal */}
      {state.isDetailModalOpen && state.selectedCustomer && (
        <Portal>
          <EditCustomerModal 
            customer={state.selectedCustomer}
            onClose={actions.closeDetailModal}
            onSave={async (data) => {
              await actions.updateCustomer(state.selectedCustomer!.id, data);
              actions.closeDetailModal();
            }}
          />
        </Portal>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!customerToDelete}
        title="ยืนยันการลบข้อมูล"
        description={`คุณต้องการลบข้อมูลลูกค้า "${customerToDelete?.name}" ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        confirmText="ลบข้อมูล"
        variant="danger"
        isLoading={state.loading}
        onConfirm={async () => {
          if (customerToDelete) {
            await actions.deleteCustomer(customerToDelete.id);
            setCustomerToDelete(null);
          }
        }}
        onClose={() => setCustomerToDelete(null)}
      />

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

// Edit Customer Modal
function EditCustomerModal({ customer, onClose, onSave }: { 
  customer: Customer;
  onClose: () => void; 
  onSave: (data: UpdateCustomerData) => Promise<void>;
}) {
  const [formData, setFormData] = useState({ 
    name: customer.name, 
    phone: customer.phone, 
    email: customer.email || '', 
    notes: customer.notes || '',
    isVip: customer.isVip || false
  });
  const [saving, setSaving] = useState(false);

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
        isVip: formData.isVip
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-backdrop-in" onClick={onClose} />
      <div className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden animate-modal-in">
        <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-b border-border flex justify-between items-center">
          <h3 className="font-bold text-lg text-foreground">✏️ แก้ไขข้อมูลลูกค้า</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm text-muted mb-1">ชื่อ-นามสกุล *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 text-foreground"
              placeholder="ชื่อ-นามสกุล"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">เบอร์โทร *</label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 text-foreground"
              placeholder="เบอร์โทร"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">อีเมล</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 text-foreground"
              placeholder="อีเมล (ถ้ามี)"
            />
          </div>
          <div>
            <label className="block text-sm text-muted mb-1">หมายเหตุ</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-purple-500 text-foreground resize-none"
              rows={3}
              placeholder="รายละเอียดเพิ่มเติม..."
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-background rounded-xl border border-border">
            <div>
              <p className="font-medium text-foreground">สถานะ VIP</p>
              <p className="text-xs text-muted">ลูกค้าจะได้รับสิทธิพิเศษตามความเหมาะสม</p>
            </div>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, isVip: !formData.isVip })}
              className={`relative w-14 h-8 rounded-full transition-colors ${
                formData.isVip ? 'bg-amber-500' : 'bg-gray-500'
              }`}
            >
              <span className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                formData.isVip ? 'left-7' : 'left-1'
              }`} />
            </button>
          </div>

          <div className="bg-muted/30 p-3 rounded-xl space-y-2">
            <h4 className="text-xs font-bold text-muted uppercase">สถิติการใช้งาน</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">เข้าเล่นทั้งหมด:</span>
                <span className="text-foreground font-medium">{customer.visitCount} ครั้ง</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">เวลารวม:</span>
                <span className="text-foreground font-medium">{customer.totalPlayTime} นาที</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <AnimatedButton variant="ghost" onClick={onClose} className="flex-1" disabled={saving}>ยกเลิก</AnimatedButton>
            <AnimatedButton variant="primary" type="submit" className="flex-1" disabled={saving}>
              {saving ? '⏳ กำลังบันทึก...' : '💾 บันทึกข้อมูล'}
            </AnimatedButton>
          </div>
        </form>
      </div>
    </div>
  );
}
