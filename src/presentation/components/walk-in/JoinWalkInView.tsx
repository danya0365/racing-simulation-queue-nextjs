'use client';

import { JoinWalkInQueueData } from '@/src/application/repositories/IWalkInQueueRepository';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { useWalkInPresenter } from '@/src/presentation/presenters/walkIn/useWalkInPresenter';
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
    <div className="min-h-screen bg-racing-gradient flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8 animate-page-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-5xl mb-6 shadow-xl shadow-cyan-500/30">
            🏎️
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            เข้าคิวเล่นเกม
          </h1>
          <p className="text-white/60">
            กรอกข้อมูลเพื่อรับลำดับคิว Racing Simulation
          </p>
        </div>

        <AnimatedCard className="p-8" glowColor="rgba(6, 182, 212, 0.2)">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div className="space-y-2">
              <label htmlFor="customerName" className="block text-sm font-medium text-white/70">
                ชื่อ-นามสกุล
              </label>
              <input
                id="customerName"
                type="text"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                placeholder="ระบุชื่อของคุณ"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <label htmlFor="customerPhone" className="block text-sm font-medium text-white/70">
                เบอร์โทรศัพท์
              </label>
              <input
                id="customerPhone"
                type="tel"
                required
                pattern="[0-9]{10}"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all font-mono"
                placeholder="0XXXXXXXXX"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              />
              <p className="text-[10px] text-white/40">ใช้สำหรับแจ้งเตือนและตรวจสอบคิว</p>
            </div>

            {/* Party Size */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-white/70">
                จำนวนผู้เล่น
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setFormData({ ...formData, party_size: num })}
                    className={`py-2 rounded-lg border transition-all ${
                      formData.party_size === num
                        ? 'bg-cyan-500 border-cyan-400 text-white shadow-lg shadow-cyan-500/20'
                        : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm animate-shake">
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
        <div className="mt-8 text-center text-white/40 text-sm">
          <p>เปิดบริการ 24 ชั่วโมง • ประสบการณ์แข่งรถระดับมืออาชีพ</p>
        </div>
      </div>
    </div>
  );
}
