'use client';

import { JoinWalkInQueueData } from '@/src/application/repositories/IWalkInQueueRepository';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { useWalkInPresenter } from '@/src/presentation/presenters/walkIn/useWalkInPresenter';
import Link from 'next/link';
import { useState } from 'react';
import { WalkInStatusView } from './WalkInStatusView';

/**
 * JoinWalkInView
 * Premium UI for customers to join the walk-in queue
 */
export function JoinWalkInView() {
  const [state, actions] = useWalkInPresenter();
  const { currentQueue, availableMachines, loading, error } = state;

  const [formData, setFormData] = useState<JoinWalkInQueueData>({
    customerName: '',
    customerPhone: '',
    partySize: 1,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await actions.joinQueue(formData);
    } catch (err) {
      // Error is handled by presenter
    }
  };

  // If already in queue, show status view
  if (currentQueue) {
    return (
      <WalkInStatusView 
        queue={currentQueue} 
        onCancel={() => actions.cancelQueue(currentQueue.id)} 
        onRefresh={actions.loadData}
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] bg-white dark:bg-black overflow-y-auto">
      {/* Backdrop Layer - Fake View for Opacity */}
      <div className="fixed inset-0 z-[-1] bg-racing-gradient" />

      {/* Background Effects (Dark Mode Only) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none hidden dark:block">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 p-4 flex items-center justify-between">
        <Link 
          href="/"
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 dark:bg-white/10 dark:border-transparent dark:hover:bg-white/20 rounded-full text-gray-700 dark:text-white font-medium transition-all"
        >
          <span>←</span>
          <span className="hidden sm:inline">หน้าแรก</span>
        </Link>
      </header>

      <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md relative z-10">
          {/* Logo/Header */}
          <div className="text-center mb-8 animate-page-in">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-5xl mb-6 shadow-xl shadow-cyan-500/30">
              🏎️
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              เข้าคิวเล่นเกม
            </h1>
            <p className="text-gray-600 dark:text-white/60">
              กรอกข้อมูลเพื่อรับลำดับคิว Racing Simulation
            </p>
          </div>

          <AnimatedCard className="p-8 bg-white dark:bg-surface/80 border border-gray-200 dark:border-white/10 shadow-xl shadow-gray-200/50 dark:shadow-none" glowColor="rgba(6, 182, 212, 0.2)">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name */}
              <div className="space-y-2">
                <label htmlFor="customerName" className="block text-sm font-medium text-gray-700 dark:text-white/70">
                  ชื่อ-นามสกุล
                </label>
                <input
                  id="customerName"
                  type="text"
                  required
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-white/30"
                  placeholder="ระบุชื่อของคุณ"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label htmlFor="customerPhone" className="block text-sm font-medium text-gray-700 dark:text-white/70">
                  เบอร์โทรศัพท์
                </label>
                <input
                  id="customerPhone"
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono placeholder:text-gray-400 dark:placeholder:text-white/30"
                  placeholder="0XXXXXXXXX"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                />
                <p className="text-[10px] text-gray-500 dark:text-white/40">ใช้สำหรับแจ้งเตือนและตรวจสอบคิว</p>
              </div>

              {/* Party Size */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70">
                  จำนวนผู้เล่น
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setFormData({ ...formData, partySize: num })}
                      className={`py-2 rounded-lg border transition-all ${
                        formData.partySize === num
                          ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                          : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-white/60 hover:bg-gray-50 dark:hover:bg-white/10'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Machine Selection (Optional) */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70">
                  เลือกเครื่องเล่น (ไม่บังคับ)
                </label>
                <div className="relative">
                  <select
                    className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all appearance-none"
                    value={formData.preferredMachineId || ''}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const machine = availableMachines.find(m => m.id === selectedId);
                      setFormData({ 
                        ...formData, 
                        preferredMachineId: selectedId || undefined,
                        preferredStationType: machine?.type // Auto-derive type from machine
                      });
                    }}
                  >
                    <option value="">-- ไม่ระบุ (เครื่องไหนก็ได้) --</option>
                    {availableMachines.map((machine) => (
                      <option key={machine.id} value={machine.id}>
                        {machine.status === 'occupied' ? '🔴' : '🟢'} {machine.name} ({machine.type || 'General'})
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    ▼
                  </div>
                </div>
                <p className="text-[10px] text-gray-500 dark:text-white/40">
                  *สัญลักษณ์ 🔴 คือเครื่องที่มีคนเล่นอยู่ (คุณสามารถเข้าคิวรอเครื่องนี้ได้)
                </p>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-white/70">
                  หมายเหตุเพิ่มเติม (ถ้ามี)
                </label>
                <textarea
                  className="w-full bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-4 py-3 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-white/30 resize-none h-24"
                  placeholder="เช่น มากัน 3 คน ขอที่นั่งติดกัน, ขอจอย PS5 2 จอย"
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 rounded-xl p-3 text-red-600 dark:text-red-400 text-sm animate-shake">
                  ⚠️ {error}
                </div>
              )}

              {/* Submit Button */}
              <GlowButton
                type="submit"
                color="cyan"
                className="w-full py-4 text-lg font-bold"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    กำลังส่งข้อมูล...
                  </div>
                ) : (
                  '🏁 รับลำดับคิว'
                )}
              </GlowButton>
            </form>
          </AnimatedCard>

          {/* Footer Info */}
          <div className="mt-8 text-center text-gray-400 dark:text-white/40 text-sm pb-8">
            <p>เปิดบริการ 24 ชั่วโมง • ประสบการณ์แข่งรถระดับมืออาชีพ</p>
          </div>
        </div>
      </div>
    </div>
  );
}
