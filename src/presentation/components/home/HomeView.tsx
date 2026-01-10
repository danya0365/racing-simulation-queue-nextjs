'use client';

import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { HomePageSkeleton } from '@/src/presentation/components/ui/Skeleton';
import { HomeViewModel } from '@/src/presentation/presenters/home/HomePresenter';
import { useHomePresenter } from '@/src/presentation/presenters/home/useHomePresenter';
import Link from 'next/link';

interface HomeViewProps {
  initialViewModel?: HomeViewModel;
}

export function HomeView({ initialViewModel }: HomeViewProps) {
  const [state, actions] = useHomePresenter(initialViewModel);
  const viewModel = state.viewModel;

  // Loading state - using Skeleton UI instead of spinner
  if (state.loading && !viewModel) {
    return <HomePageSkeleton />;
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
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Hero Section */}
      <section className="relative min-h-[50vh] flex items-center justify-center overflow-hidden">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-background via-surface to-background" />
        <div className="absolute inset-0 bg-racing-gradient opacity-50" />
        
        {/* Animated grid lines */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(0, 212, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(0, 212, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* Content - Using CSS animation */}
        <div className="relative z-10 text-center px-4 py-12 animate-hero-in">
          {/* Racing icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-purple-600 mb-6 animate-float shadow-2xl shadow-cyan-500/30">
            <span className="text-5xl">🏎️</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent animate-gradient-text">
              Racing Queue
            </span>
          </h1>

          <p className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-8">
            ระบบจองคิวสำหรับร้านเกม Racing Simulation
            <br />
            <span className="text-cyan-400">ง่าย • รวดเร็ว • สะดวก</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/customer/booking">
              <GlowButton color="cyan" size="lg">
                🎮 จองคิวเลย
              </GlowButton>
            </Link>
            <Link href="/backend">
              <GlowButton color="purple" size="lg">
                ⚙️ แอดมิน
              </GlowButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              สถานะเครื่องเล่น
            </span>
          </h2>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatsCard
              icon="🎮"
              label="ทั้งหมด"
              value={viewModel.machineStats.totalMachines}
              color="from-blue-500 to-cyan-500"
            />
            <StatsCard
              icon="✅"
              label="ว่าง"
              value={viewModel.machineStats.availableMachines}
              color="from-emerald-500 to-green-500"
            />
            <StatsCard
              icon="🏁"
              label="กำลังใช้"
              value={viewModel.machineStats.occupiedMachines}
              color="from-orange-500 to-amber-500"
            />
            <StatsCard
              icon="🔧"
              label="ซ่อมบำรุง"
              value={viewModel.machineStats.maintenanceMachines}
              color="from-gray-500 to-slate-500"
            />
          </div>

          {/* Machines Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {viewModel.machines.map((machine, index) => (
              <MachineCard
                key={machine.id}
                machine={machine}
                index={index}
                onSelect={() => actions.selectMachine(machine)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Queue Stats Section */}
      <section className="px-4 md:px-8 py-8 bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-6">
            <span className="bg-gradient-to-r from-purple-400 to-pink-500 bg-clip-text text-transparent">
              สถานะคิว
            </span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatsCard
              icon="📋"
              label="รอคิว"
              value={viewModel.queueStats.waitingQueues}
              color="from-purple-500 to-violet-500"
            />
            <StatsCard
              icon="🎯"
              label="กำลังเล่น"
              value={viewModel.queueStats.playingQueues}
              color="from-cyan-500 to-blue-500"
            />
            <StatsCard
              icon="✅"
              label="เสร็จสิ้น"
              value={viewModel.queueStats.completedQueues}
              color="from-emerald-500 to-teal-500"
            />
            <StatsCard
              icon="❌"
              label="ยกเลิก"
              value={viewModel.queueStats.cancelledQueues}
              color="from-red-500 to-rose-500"
            />
          </div>
        </div>
      </section>

      {/* Error Toast */}
      {state.error && viewModel && (
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
    </div>
  );
}

// Stats Card Component - Using CSS instead of react-spring
interface StatsCardProps {
  icon: string;
  label: string;
  value: number;
  color: string;
}

function StatsCard({ icon, label, value, color }: StatsCardProps) {
  return (
    <div
      className={`
        relative overflow-hidden rounded-xl p-4
        bg-gradient-to-br ${color}
        shadow-lg cursor-default
        transition-transform duration-200 ease-out
        hover:scale-105
      `}
    >
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative z-10 text-white">
        <div className="text-3xl mb-2">{icon}</div>
        <div className="text-3xl font-bold">{value}</div>
        <div className="text-sm opacity-80">{label}</div>
      </div>
    </div>
  );
}

// Machine Card Component
interface MachineCardProps {
  machine: {
    id: string;
    name: string;
    description: string;
    status: string;
    position: number;
    isActive: boolean;
  };
  index: number;
  onSelect: () => void;
}

function MachineCard({ machine, onSelect }: MachineCardProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'available':
        return {
          label: 'พร้อมเล่น',
          color: 'bg-emerald-500',
          glow: 'rgba(16, 185, 129, 0.4)',
          icon: '✅',
        };
      case 'occupied':
        return {
          label: 'กำลังใช้งาน',
          color: 'bg-orange-500',
          glow: 'rgba(249, 115, 22, 0.4)',
          icon: '🏁',
        };
      case 'maintenance':
        return {
          label: 'ซ่อมบำรุง',
          color: 'bg-gray-500',
          glow: 'rgba(107, 114, 128, 0.4)',
          icon: '🔧',
        };
      default:
        return {
          label: status,
          color: 'bg-gray-500',
          glow: 'rgba(107, 114, 128, 0.4)',
          icon: '❓',
        };
    }
  };

  const statusConfig = getStatusConfig(machine.status);
  const isAvailable = machine.status === 'available';
  const isOccupied = machine.status === 'occupied';
  const isMaintenance = machine.status === 'maintenance';

  return (
    <AnimatedCard
      onClick={isAvailable ? onSelect : undefined}
      disabled={isMaintenance}
      className="p-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ${
            isMaintenance 
              ? 'bg-gradient-to-br from-gray-500 to-slate-600' 
              : isOccupied
              ? 'bg-gradient-to-br from-orange-500 to-amber-600'
              : 'bg-gradient-to-br from-cyan-500 to-blue-600'
          }`}>
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
      <p className="text-sm text-muted mb-4 line-clamp-2">
        {machine.description}
      </p>

      {/* Action - Different for each status */}
      {isAvailable ? (
        <Link href="/customer/booking" className="block">
          <GlowButton color="cyan" size="sm" className="w-full">
            🎯 จองคิวเครื่องนี้
          </GlowButton>
        </Link>
      ) : isOccupied ? (
        <Link href="/customer/booking" className="block">
          <GlowButton color="purple" size="sm" className="w-full">
            📋 ต่อคิวรอ
          </GlowButton>
        </Link>
      ) : (
        <div className="text-center py-2 text-gray-400 text-sm">
          🔧 ปิดปรับปรุงชั่วคราว
        </div>
      )}
    </AnimatedCard>
  );
}
