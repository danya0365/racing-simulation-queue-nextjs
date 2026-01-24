'use client';

import { MachineStatus } from '@/src/application/repositories/IMachineRepository';
import { WalkInQueue, WalkInStatus } from '@/src/application/repositories/IWalkInQueueRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { BackendViewModel } from '@/src/presentation/presenters/backend/BackendPresenter';
import dayjs from 'dayjs';
import { useState } from 'react';
import { FullscreenControlPanel } from './FullscreenControlPanel';
import { QueueDetailModal } from './QueueDetailModal';

// Type alias match BackendView
type QueueStatus = WalkInStatus | 'playing' | 'completed' | 'cancelled';

interface LiveControlTabProps {
  viewModel: BackendViewModel;
  isUpdating: boolean;
  onUpdateQueueStatus: (queueId: string, status: QueueStatus) => Promise<void>;
  onSeatCustomer: (queueId: string, machineId: string) => Promise<void>;
  onEndSession: (sessionId: string, totalAmount?: number) => Promise<void>;
  onUpdateMachineStatus: (machineId: string, status: MachineStatus) => Promise<void>;
  onResetQueue: (machineId: string) => Promise<void>;
  onRefresh: () => Promise<void>;
}

export function LiveControlTab({ 
  viewModel, 
  isUpdating, 
  onUpdateQueueStatus, 
  onSeatCustomer,
  onEndSession,
  onUpdateMachineStatus, 
  onResetQueue, 
  onRefresh 
}: LiveControlTabProps) {
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [resetConfirmMachineId, setResetConfirmMachineId] = useState<string | null>(null);
  const [viewQueueMachineId, setViewQueueMachineId] = useState<string | null>(null);

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dayjs(dateString).toDate());
  };

  // Get queues for a specific machine (Waiting or Called)
  const getMachineQueues = (machineId: string): WalkInQueue[] => {
    return (viewModel.walkInQueues || []).filter(q => q.preferredMachineId === machineId);
  };

  // Get current session for a machine
  const getCurrentPlayer = (machineId: string) => {
    return (viewModel.activeSessions || []).find(s => s.stationId === machineId);
  };

  // Get waiting/called queues (Global or for this machine)
  const getQueuesByStatus = (status: WalkInStatus, machineId?: string): WalkInQueue[] => {
    const filtered = (viewModel.walkInQueues || []).filter(q => q.status === status);
    if (machineId) {
      return filtered.filter(q => q.preferredMachineId === machineId);
    }
    return filtered;
  };

  const getWaitingQueues = (machineId?: string) => getQueuesByStatus('waiting', machineId);
  const getCalledQueues = (machineId?: string) => getQueuesByStatus('called', machineId);

  // Get next in queue
  const getNextInQueue = (machineId: string) => {
    const waiting = getWaitingQueues(machineId);
    return waiting.length > 0 ? waiting[0] : null;
  };

  // Call next queue (mark as called)
  const handleCallNext = async (machineId: string) => {
    const next = getNextInQueue(machineId);
    if (next) {
      await onUpdateQueueStatus(next.id, 'called');
    }
  };

  // Seat a customer
  const handleSeat = async (queueId: string, machineId: string) => {
    await onSeatCustomer(queueId, machineId);
  };

  // Mark current session as done
  const handleMarkDone = async (machineId: string) => {
    const currentSession = getCurrentPlayer(machineId);
    if (currentSession) {
      await onEndSession(currentSession.id);
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
                      <p className="text-xs text-muted mt-1">
                        ⏰ เริ่ม {formatTime(currentPlayer.startTime)} • {currentPlayer.durationMinutes || 0} นาที
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
                <div className="mb-4 space-y-4">
                  {/* Called Customers */}
                  {getCalledQueues(machine.id).length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-bold text-cyan-400 animate-pulse">
                          🔔 เรียกแล้ว ({getCalledQueues(machine.id).length})
                        </span>
                      </div>
                      <div className="space-y-2">
                        {getCalledQueues(machine.id).map((q) => (
                          <div key={q.id} className="flex items-center justify-between p-2 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-foreground">#{q.queueNumber} {q.customerName}</span>
                            </div>
                            {!currentPlayer && (
                              <GlowButton color="cyan" size="sm" onClick={() => handleSeat(q.id, machine.id)} disabled={isUpdating}>
                                💺 จัดที่นั่ง
                              </GlowButton>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Waiting List */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">
                        📋 คิวรอ ({getWaitingQueues(machine.id).length} คน)
                      </span>
                      {getNextInQueue(machine.id) && !currentPlayer && (
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
                    
                    {getWaitingQueues(machine.id).length > 0 ? (
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {getWaitingQueues(machine.id).slice(0, 4).map((queue, index) => (
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
                                {queue.queueNumber}
                              </span>
                              <span className={`text-sm ${index === 0 ? 'font-medium text-foreground' : 'text-muted'}`}>
                                {queue.customerName}
                              </span>
                            </div>
                            <span className="text-xs text-muted">{formatTime(queue.joinedAt)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted text-center py-2">ไม่มีคิวรอ</p>
                    )}
                  </div>
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
                    🔍 ดูคิว ({getMachineQueues(machine.id).length})
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
                      type="button"
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
                      type="button"
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
