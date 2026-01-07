'use client';

import type { MachineStatus } from '@/src/application/repositories/IMachineRepository';
import type { QueueStatus } from '@/src/application/repositories/IQueueRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { BackendViewModel } from '@/src/presentation/presenters/backend/BackendPresenter';
import { useBackendPresenter } from '@/src/presentation/presenters/backend/useBackendPresenter';
import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useState } from 'react';

interface BackendViewProps {
  initialViewModel?: BackendViewModel;
}

export function BackendView({ initialViewModel }: BackendViewProps) {
  const [state, actions] = useBackendPresenter(initialViewModel);
  const viewModel = state.viewModel;

  // Page animation
  const pageSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle,
  });

  // Loading state
  if (state.loading && !viewModel) {
    return (
      <div className="h-full flex items-center justify-center bg-racing-gradient">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-400/30 border-t-purple-400 rounded-full animate-spin-glow mx-auto mb-4" />
          <p className="text-muted animate-pulse">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
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
    <animated.div style={pageSpring} className="h-full overflow-auto scrollbar-thin">
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
        <div className="max-w-7xl mx-auto flex gap-2">
          <TabButton
            active={state.activeTab === 'dashboard'}
            onClick={() => actions.setActiveTab('dashboard')}
          >
            📊 Dashboard
          </TabButton>
          <TabButton
            active={state.activeTab === 'queues'}
            onClick={() => actions.setActiveTab('queues')}
          >
            📋 จัดการคิว ({viewModel.waitingQueues.length})
          </TabButton>
          <TabButton
            active={state.activeTab === 'machines'}
            onClick={() => actions.setActiveTab('machines')}
          >
            🎮 จัดการเครื่อง ({viewModel.machines.length})
          </TabButton>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 md:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          {state.activeTab === 'dashboard' && (
            <DashboardTab viewModel={viewModel} />
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
    </animated.div>
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

// Stats Card
function StatsCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  const [isHovered, setIsHovered] = useState(false);

  const spring = useSpring({
    transform: isHovered ? 'scale(1.05)' : 'scale(1)',
    config: config.wobbly,
  });

  return (
    <animated.div
      style={spring}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-xl p-4 bg-gradient-to-br ${color} shadow-lg cursor-default`}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-white">
        <div className="text-2xl mb-1">{icon}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm opacity-80">{label}</div>
      </div>
    </animated.div>
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
