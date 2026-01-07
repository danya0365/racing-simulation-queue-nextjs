'use client';

import { Queue } from '@/src/application/repositories/IQueueRepository';
import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { Portal } from '@/src/presentation/components/ui/Portal';
import { BookingFormData, CustomerViewModel, MachineQueueInfo } from '@/src/presentation/presenters/customer/CustomerPresenter';
import { useCustomerPresenter } from '@/src/presentation/presenters/customer/useCustomerPresenter';
import { ActiveBooking, useCustomerStore } from '@/src/presentation/stores/useCustomerStore';
import { animated, config, useSpring } from '@react-spring/web';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CustomerViewProps {
  initialViewModel?: CustomerViewModel;
}

export function CustomerView({ initialViewModel }: CustomerViewProps) {
  const [state, actions] = useCustomerPresenter(initialViewModel);
  const viewModel = state.viewModel;
  const { customerInfo } = useCustomerStore();
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'booking' | 'history'>('booking');

  // Page animation
  const pageSpring = useSpring({
    from: { opacity: 0, transform: 'translateY(20px)' },
    to: { opacity: 1, transform: 'translateY(0px)' },
    config: config.gentle,
  });

  // Handle cancel booking
  const handleCancelBooking = async (queueId: string) => {
    if (confirm('คุณต้องการยกเลิกคิวนี้หรือไม่?')) {
      setCancellingId(queueId);
      try {
        await actions.cancelBooking(queueId);
      } finally {
        setCancellingId(null);
      }
    }
  };

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

  return (
    <animated.div style={pageSpring} className="h-full overflow-auto scrollbar-thin">
      {/* Header Section */}
      <section className="relative py-8 px-4 md:px-8 bg-gradient-to-br from-cyan-500/10 via-background to-purple-500/10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="text-muted hover:text-cyan-400 transition-colors">
              ← กลับหน้าแรก
            </Link>
          </div>
          
          <div className="flex items-center justify-between flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg">
                🎮
              </div>
              <div>
                <h1 className="text-3xl font-bold">
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                    จองคิว Racing Simulator
                  </span>
                </h1>
                <p className="text-muted">เลือกเครื่องที่ต้องการและจองคิวได้เลย</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
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

          {/* Quick Stats */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium">{viewModel.machineStats.availableMachines} เครื่องว่าง</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/20 text-orange-400">
              <span className="text-sm font-medium">{viewModel.machineStats.occupiedMachines} กำลังใช้งาน</span>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 md:px-8 py-4 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('booking')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === 'booking'
                  ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                  : 'bg-surface border border-border text-muted hover:border-cyan-500'
              }`}
            >
              🎯 จองคิว
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                activeTab === 'history'
                  ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/30'
                  : 'bg-surface border border-border text-muted hover:border-purple-500'
              }`}
            >
              📜 ประวัติคิว
              {state.bookingHistory.length > 0 && (
                <span className="ml-2 px-2 py-0.5 text-xs bg-white/20 rounded-full">
                  {state.bookingHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Tab Content */}
      {activeTab === 'booking' ? (
        <>
          {/* My Active Bookings Section */}
          {state.activeBookings.length > 0 && (
            <section className="px-4 md:px-8 py-6 bg-gradient-to-r from-purple-500/10 to-cyan-500/5 border-b border-border">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    คิวที่คุณจอง
                    <span className="text-sm font-normal text-muted ml-2">
                      ({state.activeBookings.length} คิว)
                    </span>
                  </h2>
                  <button 
                    onClick={actions.syncBookingStatus}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1"
                  >
                    🔄 รีเฟรช
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {state.activeBookings.map((booking) => (
                    <ActiveBookingCard 
                      key={booking.id} 
                      booking={booking} 
                      onCancel={() => handleCancelBooking(booking.id)}
                      isCancelling={cancellingId === booking.id}
                    />
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Machines Grid */}
          <section className="px-4 md:px-8 py-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-xl font-bold mb-6 text-foreground">เลือกเครื่องเล่น</h2>

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
            </div>
          </section>
        </>
      ) : (
        /* History Tab */
        <section className="px-4 md:px-8 py-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">ประวัติการจองคิว</h2>
              {state.bookingHistory.length > 0 && (
                <button 
                  onClick={actions.clearHistory}
                  className="text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  🗑️ ล้างประวัติ
                </button>
              )}
            </div>

            {state.bookingHistory.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-6xl mb-4">📭</div>
                <p className="text-muted mb-2">ยังไม่มีประวัติการจองคิว</p>
                <p className="text-sm text-muted">คิวที่เสร็จสิ้นหรือยกเลิกจะแสดงที่นี่</p>
              </div>
            ) : (
              <div className="space-y-4">
                {state.bookingHistory.map((booking) => (
                  <HistoryCard key={booking.id} booking={booking} />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Search Modal - Rendered via Portal to fix fixed positioning */}
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

      {/* Booking Modal - Rendered via Portal to fix fixed positioning */}
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

      {/* Success Modal - Rendered via Portal to fix fixed positioning */}
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
              className="w-8 h-8 rounded-full bg-surface hover:bg-muted-light flex items-center justify-center text-muted hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="p-6">
          {/* Search Type Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              type="button"
              onClick={() => { setSearchType('phone'); setSearchValue(''); onClearResults(); }}
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
              onClick={() => { setSearchType('id'); setSearchValue(''); onClearResults(); }}
              className={`flex-1 py-2 rounded-lg font-medium transition-all ${
                searchType === 'id'
                  ? 'bg-cyan-500 text-white'
                  : 'bg-surface border border-border text-muted hover:border-cyan-500'
              }`}
            >
              #️⃣ หมายเลขคิว
            </button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2 mb-4">
            <input
              type={searchType === 'phone' ? 'tel' : 'text'}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchType === 'phone' ? 'กรอกเบอร์โทรศัพท์...' : 'กรอกหมายเลขคิว เช่น 3 หรือ #3'}
              className="flex-1 px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 text-foreground placeholder-input-placeholder"
            />
            <AnimatedButton
              variant="primary"
              type="submit"
              loading={isSearching}
              disabled={isSearching || !searchValue.trim()}
            >
              ค้นหา
            </AnimatedButton>
          </div>

          {/* Search Error */}
          {searchError && (
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm mb-4">
              ⚠️ {searchError}
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="border border-border rounded-xl overflow-hidden">
              <div className="bg-surface/50 px-4 py-2 border-b border-border">
                <span className="text-sm text-muted">พบ {searchResults.length} ผลลัพธ์</span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searchResults.map((queue) => (
                  <Link 
                    key={queue.id} 
                    href={`/customer/queue/${queue.id}`}
                    className="block p-4 hover:bg-surface transition-colors border-b border-border last:border-b-0"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-cyan-400">#{queue.position}</span>
                      {getStatusBadge(queue.status)}
                    </div>
                    <div className="text-sm text-foreground mb-1">{queue.customerName}</div>
                    <div className="text-xs text-muted flex gap-3">
                      <span>📱 {queue.customerPhone}</span>
                      <span>📅 {formatDate(queue.bookingTime)}</span>
                      <span>⏰ {formatTime(queue.bookingTime)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </form>
      </animated.div>
    </div>
  );
}

// ✨ History Card Component
interface HistoryCardProps {
  booking: ActiveBooking;
}

function HistoryCard({ booking }: HistoryCardProps) {
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
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          label: 'เสร็จสิ้น',
          color: 'bg-emerald-500',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/30',
          icon: '✅',
        };
      case 'cancelled':
        return {
          label: 'ยกเลิก',
          color: 'bg-red-500',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/30',
          icon: '❌',
        };
      case 'waiting':
        return {
          label: 'รอคิว',
          color: 'bg-purple-500',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30',
          icon: '⏳',
        };
      default:
        return {
          label: status,
          color: 'bg-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          icon: '❓',
        };
    }
  };

  const statusConfig = getStatusConfig(booking.status);

  return (
    <div className={`rounded-xl border ${statusConfig.borderColor} ${statusConfig.bgColor} p-4`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </div>
          <span className="text-xl font-bold text-foreground">#{booking.position}</span>
          <span className="text-foreground">{booking.machineName}</span>
        </div>
        <div className="text-right text-sm text-muted">
          <div>{formatDate(booking.bookingTime)}</div>
          <div>{formatTime(booking.bookingTime)}</div>
        </div>
      </div>
      <div className="mt-2 text-sm text-muted flex gap-4">
        <span>👤 {booking.customerName}</span>
        <span>📱 {booking.customerPhone}</span>
        <span>⏱️ {booking.duration} นาที</span>
      </div>
    </div>
  );
}

// Active Booking Card
interface ActiveBookingCardProps {
  booking: ActiveBooking;
  onCancel: () => void;
  isCancelling: boolean;
}

function ActiveBookingCard({ booking, onCancel, isCancelling }: ActiveBookingCardProps) {
  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return {
          label: 'รอคิว',
          color: 'bg-purple-500',
          bgColor: 'bg-purple-500/10',
          borderColor: 'border-purple-500/30',
          icon: '⏳',
        };
      case 'playing':
        return {
          label: 'กำลังเล่น',
          color: 'bg-cyan-500',
          bgColor: 'bg-cyan-500/10',
          borderColor: 'border-cyan-500/30',
          icon: '🏁',
        };
      default:
        return {
          label: status,
          color: 'bg-gray-500',
          bgColor: 'bg-gray-500/10',
          borderColor: 'border-gray-500/30',
          icon: '❓',
        };
    }
  };

  const statusConfig = getStatusConfig(booking.status);

  return (
    <div className={`relative rounded-xl border ${statusConfig.borderColor} ${statusConfig.bgColor} p-4 transition-all hover:shadow-lg`}>
      {/* Status Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
          <span>{statusConfig.icon}</span>
          <span>{statusConfig.label}</span>
        </div>
        <span className="text-2xl font-bold text-cyan-400">#{booking.position}</span>
      </div>

      {/* Machine Name */}
      <h3 className="font-bold text-foreground mb-2">{booking.machineName}</h3>

      {/* Details */}
      <div className="space-y-1 text-sm text-muted mb-4">
        <div className="flex justify-between">
          <span>เวลานัด:</span>
          <span className="text-foreground">{formatTime(booking.bookingTime)}</span>
        </div>
        <div className="flex justify-between">
          <span>ระยะเวลา:</span>
          <span className="text-foreground">{booking.duration} นาที</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Link href={`/customer/queue/${booking.id}`} className="flex-1">
          <button className="w-full py-2 px-3 text-sm bg-surface border border-border rounded-lg hover:border-cyan-500 text-cyan-400 transition-all">
            📋 ดูรายละเอียด
          </button>
        </Link>
        {booking.status === 'waiting' && (
          <button 
            onClick={onCancel}
            disabled={isCancelling}
            className="py-2 px-3 text-sm bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 text-red-400 transition-all disabled:opacity-50"
          >
            {isCancelling ? '...' : '❌'}
          </button>
        )}
      </div>
    </div>
  );
}

// Machine Booking Card

interface MachineBookingCardProps {
  machine: {
    id: string;
    name: string;
    description: string;
    status: string;
    position: number;
    isActive: boolean;
  };
  queueInfo?: MachineQueueInfo;
  index: number;
  onBook: () => void;
}

function MachineBookingCard({ machine, queueInfo, index, onBook }: MachineBookingCardProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), index * 80);
    return () => clearTimeout(timer);
  }, [index]);

  const spring = useSpring({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
    config: config.gentle,
  });

  // Get status based on queue info
  const getStatusConfig = () => {
    const totalInQueue = queueInfo ? queueInfo.waitingCount + queueInfo.playingCount : 0;
    const waitMinutes = queueInfo?.estimatedWaitMinutes || 0;

    if (machine.status === 'maintenance') {
      return {
        label: 'ซ่อมบำรุง',
        color: 'bg-gray-500',
        textColor: 'text-gray-400',
        icon: '🔧',
        canBook: false,
        sublabel: null,
      };
    }

    if (totalInQueue === 0 && machine.status === 'available') {
      return {
        label: 'พร้อมเล่นทันที!',
        color: 'bg-emerald-500',
        textColor: 'text-emerald-400',
        icon: '✅',
        canBook: true,
        sublabel: null,
      };
    } else if (machine.status === 'occupied' || (queueInfo?.playingCount || 0) > 0) {
      return {
        label: 'กำลังใช้งาน',
        color: 'bg-orange-500',
        textColor: 'text-orange-400',
        icon: '🏁',
        canBook: true,
        sublabel: (queueInfo?.waitingCount || 0) > 0 
          ? `รอ ${queueInfo!.waitingCount} คน (~${waitMinutes} นาที)`
          : `รอ ~${waitMinutes} นาที`,
      };
    } else if ((queueInfo?.waitingCount || 0) > 0) {
      return {
        label: `รอ ${queueInfo!.waitingCount} คน`,
        color: 'bg-amber-500',
        textColor: 'text-amber-400',
        icon: '⏳',
        canBook: true,
        sublabel: `~${waitMinutes} นาที`,
      };
    }
    
    return {
      label: 'พร้อมเล่น',
      color: 'bg-emerald-500',
      textColor: 'text-emerald-400',
      icon: '✅',
      canBook: true,
      sublabel: null,
    };
  };

  const statusConfig = getStatusConfig();

  return (
    <animated.div style={spring}>
      <AnimatedCard
        glowColor="rgba(0, 212, 255, 0.3)"
        disabled={!statusConfig.canBook}
        className="p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl shadow-lg">
              🎮
            </div>
            <div>
              <h3 className="font-bold text-lg text-foreground">{machine.name}</h3>
              <p className="text-sm text-muted">เครื่องที่ {machine.position}</p>
            </div>
          </div>

          {/* Status Badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
            <span>{statusConfig.icon}</span>
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted mb-4 line-clamp-2">{machine.description}</p>

        {/* Queue Info */}
        {statusConfig.sublabel && (
          <div className="text-xs text-muted bg-background px-3 py-2 rounded-lg mb-4">
            ⏱️ {statusConfig.sublabel}
          </div>
        )}
        {queueInfo && queueInfo.nextPosition > 1 && (
          <div className="text-xs text-purple-400 mb-4">
            📋 คิวถัดไป: ลำดับที่ #{queueInfo.nextPosition}
          </div>
        )}

        {/* Action */}
        {statusConfig.canBook ? (
          <GlowButton color="cyan" size="md" onClick={onBook} className="w-full">
            🎯 จองคิวเครื่องนี้
          </GlowButton>
        ) : (
          <div className={`text-center py-3 ${statusConfig.textColor} text-sm rounded-xl bg-surface`}>
            🔧 ปิดปรับปรุงชั่วคราว
          </div>
        )}
      </AnimatedCard>
    </animated.div>
  );
}

// Booking Modal
interface BookingModalProps {
  machine: {
    id: string;
    name: string;
  };
  isSubmitting: boolean;
  error: string | null;
  initialData?: { name: string; phone: string };
  onSubmit: (data: BookingFormData) => Promise<void>;
  onClose: () => void;
}

function BookingModal({ machine, isSubmitting, error, initialData, onSubmit, onClose }: BookingModalProps) {
  const [formData, setFormData] = useState({
    customerName: initialData?.name || '',
    customerPhone: initialData?.phone || '',
    duration: 30,
    notes: '',
  });

  const modalSpring = useSpring({
    from: { opacity: 0, transform: 'scale(0.9)' },
    to: { opacity: 1, transform: 'scale(1)' },
    config: config.gentle,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Get next available time slot (now + 5 minutes)
    const bookingTime = new Date();
    bookingTime.setMinutes(bookingTime.getMinutes() + 5);

    await onSubmit({
      machineId: machine.id,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      bookingTime: bookingTime.toISOString(),
      duration: formData.duration,
      notes: formData.notes,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-md bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-b border-border">
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
              className="w-8 h-8 rounded-full bg-surface hover:bg-muted-light flex items-center justify-center text-muted hover:text-foreground transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-error/20 text-error text-sm">
              ⚠️ {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ชื่อ-นามสกุล *
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground placeholder-input-placeholder"
              placeholder="กรอกชื่อ-นามสกุล"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              เบอร์โทรศัพท์ *
            </label>
            <input
              type="tel"
              required
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground placeholder-input-placeholder"
              placeholder="081-234-5678"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              ระยะเวลา *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[30, 60, 90].map((duration) => (
                <button
                  key={duration}
                  type="button"
                  onClick={() => setFormData({ ...formData, duration })}
                  className={`py-3 rounded-xl font-medium transition-all ${
                    formData.duration === duration
                      ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30'
                      : 'bg-surface border border-border text-muted hover:border-cyan-500'
                  }`}
                >
                  {duration} นาที
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              หมายเหตุ (ถ้ามี)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="w-full px-4 py-3 bg-input-bg border border-input-border rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-foreground placeholder-input-placeholder resize-none"
              placeholder="เช่น ต้องการเครื่องใกล้หน้าต่าง"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-2">
            <AnimatedButton
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              ยกเลิก
            </AnimatedButton>
            <AnimatedButton
              variant="primary"
              type="submit"
              className="flex-1"
              loading={isSubmitting}
              disabled={isSubmitting}
            >
              ✅ ยืนยันจอง
            </AnimatedButton>
          </div>
        </form>
      </animated.div>
    </div>
  );
}

// Success Modal
interface SuccessModalProps {
  queue: {
    id: string;
    machineId: string;
    customerName: string;
    bookingTime: string;
    duration: number;
    position: number;
  };
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
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <animated.div
        style={modalSpring}
        className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden text-center"
      >
        <div className="p-8">
          {/* Success Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center text-4xl shadow-lg shadow-emerald-500/30 animate-float">
            ✅
          </div>

          <h3 className="text-2xl font-bold text-foreground mb-2">จองคิวสำเร็จ!</h3>
          <p className="text-muted mb-6">คุณ {queue.customerName}</p>

          {/* Queue Info */}
          <div className="bg-background rounded-xl p-4 mb-6 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted">หมายเลขคิว</span>
              <span className="font-bold text-cyan-400">#{queue.position}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">เวลานัด</span>
              <span className="font-medium text-foreground">{formatTime(queue.bookingTime)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">ระยะเวลา</span>
              <span className="font-medium text-foreground">{queue.duration} นาที</span>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm text-purple-400 font-medium mb-2">📌 สิ่งที่ต้องทำต่อไป:</p>
            <ul className="text-sm text-muted space-y-1">
              <li>• รอเรียกคิวใกล้เวลานัดหมาย</li>
              <li>• ตรวจสอบสถานะได้ตลอดเวลา</li>
              <li>• สามารถยกเลิกได้หากจำเป็น</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            <Link href={`/customer/queue/${queue.id}`}>
              <GlowButton color="cyan" className="w-full">
                📋 ดูสถานะคิว
              </GlowButton>
            </Link>
            <AnimatedButton variant="ghost" onClick={onClose} className="w-full">
              จองเครื่องเพิ่ม
            </AnimatedButton>
          </div>
        </div>
      </animated.div>
    </div>
  );
}
