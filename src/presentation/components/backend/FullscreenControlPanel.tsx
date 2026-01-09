'use client';

import { BackendViewModel } from '@/src/presentation/presenters/backend/BackendPresenter';
import { useEffect, useState } from 'react';

/**
 * FullscreenControlPanel - Focus Mode for Game Room Control
 * 
 * Reusable fullscreen control panel component for managing racing simulators.
 * Used in:
 * - LiveControlTab (as modal overlay)
 * - /backend/control (as dedicated page)
 */

export interface FullscreenControlPanelProps {
  viewModel: BackendViewModel;
  isUpdating: boolean;
  onCallNext: (machineId: string) => Promise<void>;
  onMarkDone: (machineId: string) => Promise<void>;
  onToggleMachine: (machine: BackendViewModel['machines'][0]) => Promise<void>;
  onRefresh: () => Promise<void>;
  onExit: () => void;
  getCurrentPlayer: (machineId: string) => BackendViewModel['activeQueues'][0] | undefined;
  getWaitingQueues: (machineId: string) => BackendViewModel['activeQueues'];
  getNextInQueue: (machineId: string) => BackendViewModel['activeQueues'][0] | null;
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

  const containerClass = isModal
    ? 'fixed inset-0 z-[100] bg-background overflow-auto'
    : 'min-h-screen bg-background overflow-auto';

  return (
    <div className={containerClass}>
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
                <span className="hidden sm:inline">{isModal ? 'ออกจากโหมดเต็มจอ' : 'กลับ Dashboard'}</span>
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
