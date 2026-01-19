'use client';

import { BackendViewModel } from '@/src/presentation/presenters/backend/BackendPresenter';
import dayjs from 'dayjs';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Portal } from '../ui/Portal';
import { QueueDetailModal } from './QueueDetailModal';

/**
 * FullscreenControlPanel - Focus Mode for Game Room Control
 * 
 * Reusable fullscreen control panel component for managing racing simulators.
 * Design matches the QuickBookingView focus mode aesthetic.
 */

export interface FullscreenControlPanelProps {
  viewModel: BackendViewModel;
  isUpdating: boolean;
  onCallNext: (machineId: string) => Promise<void>;
  onMarkDone: (machineId: string) => Promise<void>;
  onToggleMachine: (machine: BackendViewModel['machines'][0]) => Promise<void>;
  onRefresh: () => Promise<void>;
  onExit: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCurrentPlayer: (machineId: string) => any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getWaitingQueues: (machineId: string) => any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getNextInQueue: (machineId: string) => any;
  formatTime: (dateString: string) => string;
  /** If true, uses fixed positioning (modal mode). If false, uses normal flow (page mode). */
  isModal?: boolean;
}

export function FullscreenControlPanel({
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
  isModal = true,
}: FullscreenControlPanelProps) {
  const [currentTime, setCurrentTime] = useState(dayjs());
  const [viewQueueMachineId, setViewQueueMachineId] = useState<string | null>(null);

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(dayjs());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh every 10 seconds
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
    }).format(currentTime.toDate());
  };

  const formatCurrentDate = () => {
    return new Intl.DateTimeFormat('th-TH', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    }).format(currentTime.toDate());
  };

  const containerClass = isModal
    ? 'fixed inset-0 z-[100] bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-auto'
    : 'min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 overflow-auto';

  return (
    <div className={containerClass}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        {/* Back Button */}
        {isModal ? (
          <button
            onClick={onExit}
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-all"
          >
            <span>←</span>
            <span className="hidden sm:inline">ออก</span>
          </button>
        ) : (
          <Link 
            href="/backend"
            className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white font-medium transition-all"
          >
            <span>←</span>
            <span className="hidden sm:inline">กลับ</span>
          </Link>
        )}

        {/* Title */}
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>🎮</span>
          ควบคุมห้องเกม
        </h1>

        {/* Clock & Refresh */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:block text-right">
            <div className="text-lg font-mono font-bold text-white">{formatCurrentTime()}</div>
            <div className="text-white/50 text-xs">{formatCurrentDate()}</div>
          </div>
          <button
            onClick={onRefresh}
            disabled={isUpdating}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-lg transition-all disabled:opacity-50"
          >
            🔄
          </button>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="relative z-10 px-4 py-2">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 rounded-full">
              <span className="text-xl font-bold text-emerald-400">{viewModel.machineStats.availableMachines}</span>
              <span className="text-emerald-400/80 text-sm">ว่าง</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 rounded-full">
              <span className="text-xl font-bold text-orange-400">{viewModel.machineStats.occupiedMachines}</span>
              <span className="text-orange-400/80 text-sm">เล่นอยู่</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full">
              <span className="text-xl font-bold text-purple-300">{viewModel.waitingQueues.length}</span>
              <span className="text-purple-300/80 text-sm">รอคิว</span>
            </div>
          </div>
        </div>
      </div>

      {/* Machine Grid */}
      <main className="relative z-10 flex-1 px-4 py-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-6">
            🕹️ เลือกเครื่องเพื่อควบคุม
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {viewModel.machines.map((machine) => {
              const currentPlayer = getCurrentPlayer(machine.id);
              const waitingQueues = getWaitingQueues(machine.id);
              const nextInQueue = getNextInQueue(machine.id);
              const isOccupied = machine.status === 'occupied' || !!currentPlayer;
              const isMaintenance = machine.status === 'maintenance';

              // Determine card style
              let cardStyle = 'bg-emerald-500/20 border-emerald-500/50';
              let statusIcon = '✅';
              let statusText = 'ว่าง';
              
              if (isMaintenance) {
                cardStyle = 'bg-gray-500/20 border-gray-500/50';
                statusIcon = '🔧';
                statusText = 'ซ่อมบำรุง';
              } else if (isOccupied) {
                cardStyle = 'bg-orange-500/20 border-orange-500/50';
                statusIcon = '🏁';
                statusText = 'กำลังเล่น';
              }

              return (
                <div
                  key={machine.id}
                  className={`rounded-2xl border-2 overflow-hidden transition-all ${cardStyle}`}
                >
                  {/* Machine Header */}
                  <div className="p-4 flex items-center gap-3 border-b border-white/10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${
                      isMaintenance 
                        ? 'bg-gradient-to-br from-gray-400 to-gray-600' 
                        : isOccupied 
                        ? 'bg-gradient-to-br from-orange-400 to-amber-600' 
                        : 'bg-gradient-to-br from-emerald-400 to-green-600'
                    }`}>
                      🎮
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{machine.name}</h3>
                      <p className="text-white/60 text-sm">
                        {statusIcon} {statusText} • คิวรอ {waitingQueues.length}
                      </p>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-3">
                    {/* Current Player */}
                    {currentPlayer && (
                      <div className="bg-black/20 rounded-xl p-3">
                        <p className="text-orange-400 text-xs mb-1">🏁 ผู้เล่นปัจจุบัน</p>
                        <p className="text-white font-bold">{currentPlayer.customerName}</p>
                        <p className="text-white/50 text-sm">{currentPlayer.customerPhone}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-white/40">
                          <span>⏰ {formatTime(currentPlayer.bookingTime)}</span>
                          <span>⏱️ {currentPlayer.duration}น.</span>
                        </div>
                      </div>
                    )}

                    {/* No Player */}
                    {!currentPlayer && !isMaintenance && (
                      <div className="bg-black/10 rounded-xl p-3 text-center">
                        <p className="text-white/30 text-sm">ไม่มีผู้เล่น</p>
                      </div>
                    )}

                    {/* Next Queue */}
                    {nextInQueue && !isMaintenance && (
                      <div className="bg-purple-500/20 rounded-xl p-2 border border-purple-500/30">
                        <div className="flex items-center justify-between">
                          <span className="text-purple-300 text-xs">📋 ถัดไป: {nextInQueue.customerName}</span>
                          <span className="text-purple-300/70 text-xs">{formatTime(nextInQueue.bookingTime)}</span>
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="space-y-2 pt-1">
                      {/* View Queue Button - Always show unless maintenance */}
                      {!isMaintenance && (
                        <button
                          onClick={() => setViewQueueMachineId(machine.id)}
                          className="w-full py-2 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 font-medium flex items-center justify-center gap-2 transition-all border border-blue-500/30"
                        >
                          🔍 ดูคิว ({waitingQueues.length})
                        </button>
                      )}
                      {/* Call Next */}
                      {nextInQueue && !currentPlayer && !isMaintenance && (
                        <button
                          onClick={() => onCallNext(machine.id)}
                          disabled={isUpdating}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50"
                        >
                          📢 เรียกคิว
                        </button>
                      )}

                      {/* Mark Done & Call Next (while playing) */}
                      {currentPlayer && (
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => onMarkDone(machine.id)}
                            disabled={isUpdating}
                            className="py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center gap-1 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                          >
                            ✅ เสร็จ
                          </button>
                          {nextInQueue ? (
                            <button
                              onClick={() => onCallNext(machine.id)}
                              disabled={isUpdating}
                              className="py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold flex items-center justify-center gap-1 transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50"
                            >
                              📢 ถัดไป
                            </button>
                          ) : (
                            <button
                              onClick={() => onToggleMachine(machine)}
                              disabled={isUpdating}
                              className="py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/70 font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                            >
                              🔧 ปิดซ่อม
                            </button>
                          )}
                        </div>
                      )}

                      {/* Toggle Maintenance */}
                      {isMaintenance && (
                        <button
                          onClick={() => onToggleMachine(machine)}
                          disabled={isUpdating}
                          className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/30 disabled:opacity-50"
                        >
                          ✅ เปิดเครื่อง
                        </button>
                      )}

                      {/* Idle machine - just maintenance button */}
                      {!currentPlayer && !isMaintenance && !nextInQueue && (
                        <button
                          onClick={() => onToggleMachine(machine)}
                          disabled={isUpdating}
                          className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white/60 font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                        >
                          🔧 ปิดซ่อมบำรุง
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 p-4 text-center">
        <p className="text-white/30 text-sm">
          🎮 Racing Queue Control • Auto-refresh ทุก 10 วินาที
        </p>
      </footer>

      {/* Mobile Stats Footer */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-lg px-4 py-3 z-20">
        <div className="flex items-center justify-around">
          <div className="text-center">
            <div className="text-lg font-bold text-emerald-400">{viewModel.machineStats.availableMachines}</div>
            <div className="text-xs text-white/50">ว่าง</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-orange-400">{viewModel.machineStats.occupiedMachines}</div>
            <div className="text-xs text-white/50">เล่นอยู่</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-purple-400">{viewModel.waitingQueues.length}</div>
            <div className="text-xs text-white/50">รอคิว</div>
          </div>
          <div className="text-center">
            <div className="text-sm font-mono font-bold text-white">{formatCurrentTime()}</div>
            <div className="text-xs text-white/50">เวลา</div>
          </div>
        </div>
      </div>
      {/* Queue Detail Modal */}
      {viewQueueMachineId && (
        <Portal>
          <QueueDetailModal
            machine={viewModel.machines.find(m => m.id === viewQueueMachineId)!}
            queues={(viewModel.activeQueues || []).filter((q: any) => q.machineId === viewQueueMachineId || q.preferredMachineId === viewQueueMachineId)}
            onClose={() => setViewQueueMachineId(null)}
          />
        </Portal>
      )}
    </div>
  );
}
