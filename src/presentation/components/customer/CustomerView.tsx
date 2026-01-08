'use client';

import { Queue } from '@/src/application/repositories/IQueueRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { BookingFormData, CustomerViewModel, MachineQueueInfo } from '@/src/presentation/presenters/customer/CustomerPresenter';
import { useCustomerPresenter } from '@/src/presentation/presenters/customer/useCustomerPresenter';
import { useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useState } from 'react';

interface CustomerViewProps {
  initialViewModel?: CustomerViewModel;
}

export function CustomerView({ initialViewModel }: CustomerViewProps) {
  const [state, actions] = useCustomerPresenter(initialViewModel);
  const viewModel = state.viewModel;
  const { customerInfo, activeBookings } = useCustomerStore();

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
          <div className="w-16 h-16 border-4 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin-glow mx-auto mb-4" />
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
          <GlowButton color="cyan" onClick={actions.loadData}>
            ลองใหม่อีกครั้ง
          </GlowButton>
        </div>
      </div>
    );
  }

  if (!viewModel) return null;

  // Count active waiting queues
  const waitingCount = activeBookings.filter(b => b.status === 'waiting').length;

  return (
    <animated.div style={pageSpring} className="h-full overflow-auto scrollbar-thin">
      {/* Hero Header Section */}
      <section className="relative py-10 px-4 md:px-8 bg-gradient-to-br from-cyan-500/10 via-background to-purple-500/10 overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Link href="/" className="text-muted hover:text-cyan-400 transition-colors">
              ← กลับหน้าแรก
            </Link>
          </div>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            {/* Title */}
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-4xl shadow-lg shadow-cyan-500/30">
                🎮
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    จองคิว Racing Simulator
                  </span>
                </h1>
                <p className="text-muted mt-1">เลือกเครื่องที่ต้องการและจองคิวได้ทันที</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-3">
              <AnimatedButton 
                variant="ghost" 
                onClick={actions.openSearchModal}
                className="border-purple-500/30 text-purple-400 hover:bg-purple-500/10"
              >
                🔍 ค้นหาคิว
              </AnimatedButton>
              <Link href="/customer/booking">
                <GlowButton color="cyan" size="lg">
                  🚀 จองแบบง่าย
                </GlowButton>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Status Cards */}
      <section className="px-4 md:px-8 py-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Available Machines */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/5 border border-emerald-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-xl">
                  ✅
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{viewModel.machineStats.availableMachines}</p>
                  <p className="text-xs text-muted">เครื่องว่าง</p>
                </div>
              </div>
            </div>

            {/* Occupied Machines */}
            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-xl">
                  🏁
                </div>
                <div>
                  <p className="text-2xl font-bold text-orange-400">{viewModel.machineStats.occupiedMachines}</p>
                  <p className="text-xs text-muted">กำลังใช้งาน</p>
                </div>
              </div>
            </div>

            {/* My Active Queues - Link to status page */}
            <Link href="/customer/queue-status" className="block">
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/5 border border-purple-500/30 rounded-xl p-4 hover:border-purple-400 transition-colors h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center text-xl">
                    📋
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-400">{waitingCount}</p>
                    <p className="text-xs text-muted">คิวของฉัน →</p>
                  </div>
                </div>
              </div>
            </Link>

            {/* History - Link to history page */}
            <Link href="/customer/queue-history" className="block">
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 border border-cyan-500/30 rounded-xl p-4 hover:border-cyan-400 transition-colors h-full">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-xl">
                    📜
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-cyan-400">{state.bookingHistory.length}</p>
                    <p className="text-xs text-muted">ประวัติ →</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Machines Grid - Main Content */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              เลือกเครื่องเล่น
            </h2>
            <AnimatedButton 
              variant="ghost" 
              size="sm"
              onClick={actions.loadData}
            >
              🔄 รีเฟรช
            </AnimatedButton>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewModel.machines.filter(m => m.isActive && m.status !== 'maintenance').map((machine, index) => (
              <MachineBookingCard
                key={machine.id}
                machine={machine}
                queueInfo={viewModel.machineQueueInfo[machine.id]}
                index={index}
                onBook={() => actions.openBookingModal(machine)}
              />
            ))}
          </div>

          {/* Empty State */}
          {viewModel.machines.filter(m => m.isActive && m.status !== 'maintenance').length === 0 && (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔧</div>
              <p className="text-muted mb-2">ขณะนี้ไม่มีเครื่องเล่นที่พร้อมใช้งาน</p>
              <p className="text-sm text-muted">กรุณาลองใหม่อีกครั้งในภายหลัง</p>
            </div>
          )}
        </div>
      </section>

      {/* Search Modal - Rendered via Portal */}
      {state.isSearchModalOpen && (
        <Portal>
          <SearchModal
            isSearching={state.isSearching}
            searchResults={state.searchResults}
            searchError={state.searchError}
            onSearchByPhone={actions.searchByPhone}
            onSearchById={actions.searchById}
            onClearResults={actions.clearSearchResults}
            onClose={actions.closeSearchModal}
          />
        </Portal>
      )}

      {/* Booking Modal - Rendered via Portal */}
      {state.isBookingModalOpen && state.selectedMachine && (
        <Portal>
          <BookingModal
            machine={state.selectedMachine}
            isSubmitting={state.isSubmitting}
            error={state.error}
            initialData={customerInfo}
            onSubmit={actions.submitBooking}
            onClose={actions.closeBookingModal}
          />
        </Portal>
      )}

      {/* Success Modal - Rendered via Portal */}
      {state.bookingSuccess && (
        <Portal>
          <SuccessModal
            queue={state.bookingSuccess}
            onClose={actions.clearBookingSuccess}
          />
        </Portal>
      )}

      {/* Error Toast */}
      {state.error && viewModel && !state.isBookingModalOpen && (
        <div className="fixed bottom-4 right-4 bg-error text-white px-6 py-3 rounded-xl shadow-lg z-50">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span>{state.error}</span>
            <button
              onClick={() => actions.setError(null)}
              className="ml-4 hover:opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </animated.div>
  );
}

// ✨ Machine Booking Card Component
interface MachineBookingCardProps {
  machine: CustomerViewModel['machines'][0];
  queueInfo?: MachineQueueInfo;
  index: number;
  onBook: () => void;
}

function MachineBookingCard({ machine, queueInfo, index, onBook }: MachineBookingCardProps) {
  const isAvailable = machine.status === 'available';
  const waitingCount = queueInfo?.waitingCount || 0;

  const cardSpring = useSpring({
    from: { opacity: 0, y: 20 },
    to: { opacity: 1, y: 0 },
    delay: index * 100,
    config: config.gentle,
  });

  return (
    <animated.div style={cardSpring}>
      <AnimatedCard className="h-full">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                isAvailable 
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600' 
                  : 'bg-gradient-to-br from-orange-500 to-amber-600'
              }`}>
                🎮
              </div>
              <div>
                <h3 className="font-bold text-foreground">{machine.name}</h3>
                <p className="text-xs text-muted">เครื่องที่ {machine.position}</p>
              </div>
            </div>
            
            {/* Status Badge */}
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              isAvailable
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
            }`}>
              {isAvailable ? 'ว่าง' : 'มีคนเล่น'}
            </span>
          </div>

          {/* Queue Info */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">คิวรอ</span>
              <span className={`font-medium ${waitingCount > 0 ? 'text-purple-400' : 'text-emerald-400'}`}>
                {waitingCount} คน
              </span>
            </div>
            {queueInfo?.estimatedWaitMinutes !== undefined && waitingCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">รอประมาณ</span>
                <span className="text-cyan-400 font-medium">{queueInfo.estimatedWaitMinutes} นาที</span>
              </div>
            )}
            {queueInfo?.playingCount && queueInfo.playingCount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">กำลังเล่น</span>
                <span className="text-orange-400">{queueInfo.playingCount} คน</span>
              </div>
            )}
          </div>

          {/* Book Button */}
          <GlowButton
            color={isAvailable ? 'green' : 'cyan'}
            size="sm"
            onClick={onBook}
            className="w-full"
          >
            {isAvailable ? '⚡ จองเลย' : '📝 ต่อคิว'}
          </GlowButton>
        </div>
      </AnimatedCard>
    </animated.div>
  );
}

// ✨ Search Modal Component
interface SearchModalProps {
  isSearching: boolean;
  searchResults: Queue[];
  searchError: string | null;
  onSearchByPhone: (phone: string) => Promise<void>;
  onSearchById: (id: string) => Promise<void>;
  onClearResults: () => void;
  onClose: () => void;
}

function SearchModal({ 
  isSearching, 
  searchResults, 
  searchError, 
  onSearchByPhone, 
  onSearchById,
  onClearResults,
  onClose 
}: SearchModalProps) {
  const [searchType, setSearchType] = useState<'phone' | 'id'>('phone');
  const [searchValue, setSearchValue] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchType === 'phone') {
      await onSearchByPhone(searchValue);
    } else {
      await onSearchById(searchValue);
    }
  };

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting':
        return <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">รอคิว</span>;
      case 'playing':
        return <span className="px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-400">กำลังเล่น</span>;
      case 'completed':
        return <span className="px-2 py-1 text-xs rounded-full bg-emerald-500/20 text-emerald-400">เสร็จสิ้น</span>;
      case 'cancelled':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-500/20 text-red-400">ยกเลิก</span>;
      default:
        return null;
    }
  };

  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-cyan-600 flex items-center justify-center text-xl">
                🔍
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">ค้นหาคิว</h3>
                <p className="text-sm text-muted">ค้นหาด้วยเบอร์โทรหรือหมายเลขคิว</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-muted"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-6 space-y-4">
          {/* Search Type Toggle */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setSearchType('phone'); onClearResults(); setSearchValue(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                searchType === 'phone' 
                  ? 'bg-purple-500 text-white' 
                  : 'bg-surface border border-border text-muted hover:border-purple-500'
              }`}
            >
              📱 เบอร์โทร
            </button>
            <button
              type="button"
              onClick={() => { setSearchType('id'); onClearResults(); setSearchValue(''); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                searchType === 'id' 
                  ? 'bg-cyan-500 text-white' 
                  : 'bg-surface border border-border text-muted hover:border-cyan-500'
              }`}
            >
              🔢 หมายเลขคิว
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <input
              type={searchType === 'phone' ? 'tel' : 'text'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'phone' ? 'เบอร์โทรศัพท์' : 'หมายเลขคิว (เช่น queue-xxx)'}
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-cyan-400 focus:outline-none transition-colors"
            />
          </div>

          <GlowButton
            color="cyan"
            disabled={isSearching || !searchValue}
            className="w-full"
            onClick={() => handleSearch({ preventDefault: () => {} } as React.FormEvent)}
          >
            {isSearching ? '🔄 กำลังค้นหา...' : '🔍 ค้นหา'}
          </GlowButton>
        </form>

        {/* Error */}
        {searchError && (
          <div className="px-6 pb-4">
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
              {searchError}
            </div>
          </div>
        )}

        {/* Results */}
        {searchResults.length > 0 && (
          <div className="px-6 pb-6">
            <p className="text-muted text-sm mb-3">พบ {searchResults.length} รายการ</p>
            <div className="space-y-3 max-h-60 overflow-auto">
              {searchResults.map(queue => (
                <Link key={queue.id} href={`/customer/queue/${queue.id}`}>
                  <div className="p-4 bg-background border border-border rounded-xl hover:border-cyan-500 transition-colors cursor-pointer">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground">คิว #{queue.position}</span>
                      {getStatusBadge(queue.status)}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted">
                      <span>{queue.customerName}</span>
                      <span>{formatDate(queue.bookingTime)} {formatTime(queue.bookingTime)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </animated.div>
    </div>
  );
}

// ✨ Booking Modal Component  
interface BookingModalProps {
  machine: CustomerViewModel['machines'][0];
  isSubmitting: boolean;
  error: string | null;
  initialData: { name: string; phone: string };
  onSubmit: (data: BookingFormData) => Promise<void>;
  onClose: () => void;
}

function BookingModal({ machine, isSubmitting, error, initialData, onSubmit, onClose }: BookingModalProps) {
  const [name, setName] = useState(initialData.name);
  const [phone, setPhone] = useState(initialData.phone);
  const [duration, setDuration] = useState(30);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      machineId: machine.id,
      customerName: name,
      customerPhone: phone,
      bookingTime: new Date().toISOString(),
      duration,
    });
  };

  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-xl">
                🎮
              </div>
              <div>
                <h3 className="font-bold text-lg text-foreground">จองคิว</h3>
                <p className="text-sm text-muted">{machine.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-muted"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">ชื่อผู้จอง</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อ-นามสกุล"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-cyan-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Phone Input */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08X-XXX-XXXX"
              className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:border-cyan-400 focus:outline-none transition-colors"
              required
            />
          </div>

          {/* Duration Select */}
          <div>
            <label className="block text-sm font-medium text-muted mb-2">ระยะเวลา</label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDuration(d)}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    duration === d 
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                      : 'bg-surface border border-border text-muted hover:border-cyan-500'
                  }`}
                >
                  {d} นาที
                </button>
              ))}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-center">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <GlowButton
            color="cyan"
            disabled={isSubmitting || !name || !phone}
            className="w-full"
            onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
          >
            {isSubmitting ? '🔄 กำลังจอง...' : '✅ ยืนยันการจอง'}
          </GlowButton>
        </form>
      </animated.div>
    </div>
  );
}

// ✨ Success Modal Component
interface SuccessModalProps {
  queue: Queue;
  onClose: () => void;
}

function SuccessModal({ queue, onClose }: SuccessModalProps) {
  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
  });

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-center"
      >
        {/* Success Animation */}
        <div className="p-8 bg-gradient-to-br from-emerald-500/20 to-green-500/10">
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-5xl shadow-lg mb-4 animate-bounce">
            ✅
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">จองคิวสำเร็จ!</h2>
          <p className="text-muted">คิวของคุณถูกบันทึกเรียบร้อยแล้ว</p>
        </div>

        {/* Queue Details */}
        <div className="p-6">
          <div className="bg-background border border-border rounded-xl p-4 mb-4">
            <div className="text-center mb-4">
              <p className="text-sm text-muted">หมายเลขคิว</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                #{queue.position}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted">ชื่อ</p>
                <p className="font-medium text-foreground">{queue.customerName}</p>
              </div>
              <div>
                <p className="text-muted">เวลา</p>
                <p className="font-medium text-cyan-400">{formatTime(queue.bookingTime)}</p>
              </div>
              <div>
                <p className="text-muted">ระยะเวลา</p>
                <p className="font-medium text-foreground">{queue.duration} นาที</p>
              </div>
              <div>
                <p className="text-muted">สถานะ</p>
                <span className="px-2 py-1 text-xs rounded-full bg-purple-500/20 text-purple-400">รอคิว</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <Link href={`/customer/queue/${queue.id}`} className="flex-1">
              <GlowButton color="purple" className="w-full">
                📊 ดูสถานะ
              </GlowButton>
            </Link>
            <AnimatedButton onClick={onClose} className="flex-1">
              ปิด
            </AnimatedButton>
          </div>
        </div>
      </animated.div>
    </div>
  );
}
