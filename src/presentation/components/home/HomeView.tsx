'use client';

import { Booking, BookingDaySchedule } from '@/src/application/repositories/IBookingRepository';
import { Machine } from '@/src/application/repositories/IMachineRepository';
import { createBookingRepositories } from '@/src/infrastructure/repositories/RepositoryFactory';
import { getShopNow, getShopTodayString, SHOP_TIMEZONE } from '@/src/lib/date';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import { GlowButton } from '@/src/presentation/components/ui/GlowButton';
import { TimezoneNotice } from '@/src/presentation/components/ui/TimezoneNotice';
import { HomeViewModel } from '@/src/presentation/presenters/home/HomePresenter';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';


const DEFAULT_TIMEZONE = SHOP_TIMEZONE;


/**
 * HomeView - Main landing page
 * Redesigned to focus on Booking system
 * 
 * ✅ Now uses IBookingRepository (TIMESTAMPTZ-based) instead of IAdvanceBookingRepository
 */
export function HomeView({ initialViewModel }: { initialViewModel?: HomeViewModel }) {
  // Data state
  const [machines, setMachines] = useState<Machine[]>([]);
  const [allSchedules, setAllSchedules] = useState<Map<string, BookingDaySchedule>>(new Map());
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  // Get today's date in Shop timezone (YYYY-MM-DD)
  const today = useMemo(() => {
    return getShopTodayString();
  }, []);

  // ✅ Use factory for repositories - now using new IBookingRepository
  const { bookingRepo, machineRepo } = useMemo(
    () => createBookingRepositories(),
    []
  );

  // Load data
  const loadData = useCallback(async () => {
    try {
      const allMachines = await machineRepo.getAll();
      const activeMachines = allMachines.filter(m => m.isActive);
      setMachines(activeMachines);

      // Load today's schedules - use shop timezone
      const referenceTime = getShopNow().toISOString();
      const schedulesMap = new Map<string, BookingDaySchedule>();
      const allBookings: Booking[] = [];

      await Promise.all(activeMachines.map(async (machine) => {
        const [schedule, bookings] = await Promise.all([
          bookingRepo.getDaySchedule(machine.id, today, DEFAULT_TIMEZONE, referenceTime),
          bookingRepo.getByMachineAndDate(machine.id, today),
        ]);
        schedulesMap.set(machine.id, schedule);
        allBookings.push(...bookings);
      }));

      setAllSchedules(schedulesMap);
      setTodayBookings(allBookings);
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  }, [machineRepo, bookingRepo, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculate stats
  const totalAvailable = Array.from(allSchedules.values()).reduce((sum, s) => sum + s.availableSlots, 0);
  const totalBooked = Array.from(allSchedules.values()).reduce((sum, s) => sum + s.bookedSlots, 0);
  const activeBookings = todayBookings.filter(b => b.status === 'confirmed' || b.status === 'pending').length;

  // Get current time for display and filtering - use shop timezone
  const currentTime = getShopNow().locale('th').format('HH:mm');
  const nowTimeStr = getShopNow().format('HH:mm');

  return (
    <div className="min-h-screen bg-background overflow-auto scrollbar-thin">
      {/* Today's Overview */}
      <section className="px-4 md:px-8 py-12 -mt-8 relative z-20">
        <div className="max-w-6xl mx-auto">
          {/* 🌍 Timezone Notice - Shows when user's timezone differs from shop */}
          <TimezoneNotice />
          
          {/* Section Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-full mb-4">
              <span className="text-sm text-purple-400 font-medium">📆 วันนี้ {dayjs().locale('th').format('ddddที่ D MMMM')}</span>
              <span className="text-sm text-muted">•</span>
              <span className="text-sm text-foreground font-bold">{currentTime}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground">
              สถานะการจองวันนี้
            </h2>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl p-5 text-center transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">🎮</div>
              <div className="text-3xl font-bold text-foreground">{machines.length}</div>
              <div className="text-sm text-muted">เครื่องทั้งหมด</div>
            </div>
            <div className="bg-gradient-to-br from-emerald-500/20 to-green-500/20 border border-emerald-500/30 rounded-2xl p-5 text-center transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">✅</div>
              <div className="text-3xl font-bold text-emerald-400">{totalAvailable}</div>
              <div className="text-sm text-muted">Slots ว่าง</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 border border-orange-500/30 rounded-2xl p-5 text-center transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">🔥</div>
              <div className="text-3xl font-bold text-orange-400">{totalBooked}</div>
              <div className="text-sm text-muted">Slots จองแล้ว</div>
            </div>
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-2xl p-5 text-center transform hover:scale-105 transition-all">
              <div className="text-4xl mb-2">📋</div>
              <div className="text-3xl font-bold text-cyan-400">{activeBookings}</div>
              <div className="text-sm text-muted">การจองที่ active</div>
            </div>
          </div>

          {/* Machines Schedule Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {machines.map((machine) => {
              const schedule = allSchedules.get(machine.id);
               const allMachineBookings = todayBookings.filter(b => b.machineId === machine.id && (b.status === 'confirmed' || b.status === 'pending'));
               const upcomingBookings = allMachineBookings
                 .filter(b => b.localStartTime >= nowTimeStr)
                 .sort((a, b) => a.localStartTime.localeCompare(b.localStartTime));
              
              return (
                <AnimatedCard key={machine.id} className="p-5 hover:border-purple-500/50">
                  {/* Header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-2xl shadow-lg">
                      🎮
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground">{machine.name}</h3>
                      <p className="text-sm text-muted">เครื่องที่ {machine.position}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  {schedule && (
                    <div className="flex gap-2 mb-4">
                      <span className="flex-1 px-3 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-center">
                        <span className="text-lg font-bold text-emerald-400">{schedule.availableSlots}</span>
                        <span className="text-xs text-muted ml-1">ว่าง</span>
                      </span>
                      <span className="flex-1 px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
                        <span className="text-lg font-bold text-red-400">{schedule.bookedSlots}</span>
                        <span className="text-xs text-muted ml-1">จอง</span>
                      </span>
                    </div>
                  )}

                  {/* Time Slots Mini Bar */}
                  {schedule && (
                    <div className="mb-4">
                      <div className="flex gap-0.5">
                        {schedule.timeSlots.map((slot) => {
                          let color = 'bg-gray-500/30';
                          if (slot.status === 'available') color = 'bg-emerald-500/50';
                          else if (slot.status === 'booked') color = 'bg-red-500/50';
                          return (
                            <div key={slot.id} className={`h-2 flex-1 rounded-sm ${color}`} />
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Upcoming Bookings */}
                   {upcomingBookings.length > 0 ? (
                     <div className="space-y-2 mb-4">
                       <p className="text-xs text-muted font-medium">การจองถัดไป:</p>
                       {upcomingBookings.slice(0, 2).map((booking) => (
                        <div key={booking.id} className="flex justify-between items-center text-sm p-2 bg-purple-500/10 rounded-lg">
                          <span className="text-foreground font-medium">{booking.localStartTime.slice(0, 5)}</span>
                          <span className="text-muted text-xs">{booking.customerName}</span>
                        </div>
                      ))}
                    </div>
                  ) : allMachineBookings.length > 0 ? (
                    <p className="text-sm text-muted text-center py-3 bg-surface rounded-lg mb-4">
                      ไม่มีการจองเพิ่มเติมในวันนี้
                    </p>
                  ) : (
                    <p className="text-sm text-muted text-center py-3 bg-surface rounded-lg mb-4">
                      ไม่มีการจองวันนี้
                    </p>
                  )}

                  {/* CTA */}
                  <Link href={`/time-booking`}>
                    <GlowButton color="purple" size="sm" className="w-full">
                      📅 จองเครื่องนี้
                    </GlowButton>
                  </Link>
                </AnimatedCard>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 md:px-8 py-16 bg-surface/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10">
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              ทำไมต้องจองเวลา?
            </span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon="⏰"
              title="ไม่ต้องรอคิว"
              description="จองเวลาที่ต้องการล่วงหน้า มาถึงเวลาเล่นได้เลย"
            />
            <FeatureCard
              icon="📅"
              title="วางแผนได้"
              description="เลือกวันและเวลาที่สะดวก จองได้ล่วงหน้าถึง 7 วัน"
            />
            <FeatureCard
              icon="📱"
              title="จองง่าย"
              description="จองผ่านมือถือได้ทุกที่ทุกเวลา ไม่ต้องโทร"
            />
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="px-4 md:px-8 py-16">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
            พร้อมจองแล้วหรือยัง?
          </h2>
          <p className="text-muted mb-8">
            เลือกเวลาที่ต้องการและจองเลยตอนนี้!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/walk-in">
              <GlowButton color="cyan" size="lg" className="w-full sm:w-auto">
                🏁 เข้าคิวหน้าร้าน (Walk-in)
              </GlowButton>
            </Link>
            <Link href="/time-booking">
              <GlowButton color="pink" size="lg" className="w-full sm:w-auto">
                📅 จองล่วงหน้า
              </GlowButton>
            </Link>
            <Link href="/customer/booking-history">
              <GlowButton color="purple" size="lg" className="w-full sm:w-auto">
                📋 ประวัติการจอง
              </GlowButton>
            </Link>
          </div>
        </div>
      </section>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted">กำลังโหลด...</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="text-center p-6 bg-background border border-border rounded-2xl hover:border-purple-500/50 transition-all">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 text-4xl mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-foreground mb-2">{title}</h3>
      <p className="text-muted">{description}</p>
    </div>
  );
}
