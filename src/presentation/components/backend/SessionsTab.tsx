'use client';

import { Session, SessionStats } from '@/src/application/repositories/ISessionRepository';
import { SessionDetailModal, SessionTimer } from '@/src/presentation/components/backend/SessionDetailModal';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import dayjs from 'dayjs';
import { useState } from 'react';

interface SessionsTabProps {
  sessions: Session[];
  sessionStats: SessionStats;
  onUpdatePayment: (sessionId: string, status: 'paid' | 'unpaid' | 'partial') => Promise<void>;
  onUpdateAmount: (sessionId: string, amount: number) => Promise<void>;
}

export function SessionsTab({ sessions, sessionStats, onUpdatePayment, onUpdateAmount }: SessionsTabProps) {
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  
  const itemsPerPage = 10;

  // Filter logic
  const filteredSessions = sessions.filter(session => {
    if (filter === 'all') return true;
    if (filter === 'active') return !session.endTime;
    if (filter === 'completed') return !!session.endTime;
    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSessions = filteredSessions.slice(startIndex, startIndex + itemsPerPage);

  const handleFilterChange = (newFilter: 'all' | 'active' | 'completed') => {
    setFilter(newFilter);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-8 animate-page-in">
      {/* 1. Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatsCard 
           icon="📝"
           label="รอบการเล่นทั้งหมด" 
           value={`${sessionStats.totalSessions}`}
           subLabel="รวม Active และ History"
           color="from-purple-500 to-indigo-600" 
         />
         <StatsCard 
           icon="🟢"
           label="กำลังเล่น" 
           value={`${sessionStats.activeSessions}`}
           subLabel="เครื่องที่ใช้งานอยู่ณ ขณะนี้"
           color="from-emerald-500 to-teal-500" 
           alert={sessionStats.activeSessions > 0}
         />
         <StatsCard 
           icon="🏁"
           label="เสร็จสิ้นแล้ว" 
           value={`${sessionStats.completedSessions}`}
           subLabel="จบการทำงานวันนี้"
           color="from-blue-500 to-cyan-500" 
         />
         <StatsCard 
           icon="💰"
           label="รายได้รวม" 
           value={`฿${sessionStats.totalRevenue.toLocaleString()}`} 
           subLabel="รายได้จากทุก Session"
           color="from-amber-400 to-orange-500" 
         />
      </div>

      {/* 2. Session List Section */}
      <AnimatedCard className="p-6">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              📋 รายการเล่น ({filteredSessions.length})
              {filter !== 'all' && <span className="text-sm font-normal text-muted bg-surface/50 px-2 py-1 rounded-full">{filter}</span>}
            </h3>
            <p className="text-sm text-muted">จัดการและตรวจสอบประวัติการใช้งานเครื่อง</p>
          </div>

          {/* Filter Tabs */}
          <div className="flex bg-surface/50 p-1 rounded-xl border border-border">
            <FilterButton 
              active={filter === 'all'} 
              onClick={() => handleFilterChange('all')}
              label="ทั้งหมด"
              count={sessions.length}
            />
            <FilterButton 
              active={filter === 'active'} 
              onClick={() => handleFilterChange('active')}
              label="กำลังเล่น"
              count={sessions.filter(s => !s.endTime).length}
              activeClass="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
            />
            <FilterButton 
              active={filter === 'completed'} 
              onClick={() => handleFilterChange('completed')}
              label="จบแล้ว"
              count={sessions.filter(s => !!s.endTime).length}
              activeClass="bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
            />
          </div>
        </div>

        {/* Sessions List */}
        {paginatedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-muted py-16 opacity-60 bg-surface/30 rounded-2xl border border-dashed border-border">
             <div className="text-6xl mb-4 bg-surface p-4 rounded-full">📭</div>
             <p className="text-lg font-medium">ไม่พบข้อมูลการเล่น</p>
             <p className="text-sm">ลองเปลี่ยนตัวกรอง หรือเริ่มใช้งานเครื่องใหม่</p>
          </div>
        ) : (
          <div className="space-y-3">
            {paginatedSessions.map((session) => (
              <div 
                key={session.id} 
                className={`group flex flex-col md:flex-row items-center justify-between p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden
                  ${!session.endTime 
                    ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' 
                    : 'bg-surface hover:bg-surface/80 border-border hover:border-purple-500/30'
                  }
                `}
                onClick={() => setSelectedSession(session)}
              >
                {!session.endTime && <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />}
                
                <div className="flex items-center gap-4 w-full md:w-auto">
                   <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg shrink-0 ${
                     !session.endTime 
                       ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white animate-pulse-slow' 
                       : 'bg-surface border border-border text-muted-foreground'
                   }`}>
                     {session.sourceType === 'manual' ? 'M' : 'B'}
                   </div>
                   <div>
                     <div className="flex items-center gap-2">
                        <p className="font-bold text-foreground text-lg">{session.customerName}</p>
                        {session.sourceType === 'booking' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">Booking</span>
                        )}
                     </div>
                     <p className="text-xs text-muted flex items-center gap-2 mt-0.5">
                       <span className="font-medium text-foreground/80">{session.stationName || 'Unknown Station'}</span>
                       <span>•</span>
                       <span>เริ่ม {dayjs(session.startTime).format('HH:mm')}</span>
                       {session.endTime && <span>• จบ {dayjs(session.endTime).format('HH:mm')}</span>}
                     </p>
                   </div>
                </div>

                <div className="flex items-center gap-6 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                   <div className="text-right">
                     {!session.endTime ? (
                       <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1.5 mb-1">
                           <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                           <span className="text-emerald-500 font-bold text-sm">กำลังเล่น</span>
                         </div>
                         <div>
                            <SessionTimer startTime={session.startTime} estimatedEndTime={session.estimatedEndTime} compact={true} />
                         </div>
                       </div>
                     ) : (
                       <div className="flex flex-col items-end">
                         <div className="flex items-center gap-1.5">
                           <span className="text-muted text-sm font-mono">{session.durationMinutes} นาที</span>
                           <span className="px-2 py-0.5 rounded-md bg-surface border border-border text-muted text-[10px]">เสร็จสิ้น</span>
                         </div>
                       </div>
                     )}
                   </div>
                   
                   <div className="w-px h-8 bg-border hidden md:block" />

                   <div className="flex flex-col items-end min-w-[80px]">
                     {session.totalAmount > 0 ? (
                       <>
                         <span className="text-lg font-bold text-amber-500">฿{session.totalAmount}</span>
                         <span className="text-[10px] text-muted">
                           {session.paymentStatus === 'paid' ? 'ชำระแล้ว' : 'ยังไม่ชำระ'}
                         </span>
                       </>
                     ) : (
                       <span className="text-muted text-sm">-</span>
                     )}
                   </div>
                   
                   <div className="opacity-0 group-hover:opacity-100 transition-opacity -mr-2 text-muted">
                     ›
                   </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 pt-6 mt-4 border-t border-border">
             <button
               disabled={currentPage === 1}
               onClick={() => setCurrentPage(p => p - 1)}
               className="px-3 py-1.5 rounded-lg text-sm bg-surface border border-border hover:bg-muted/10 disabled:opacity-50 transition-colors"
             >
               ก่อนหน้า
             </button>
             <div className="flex gap-1">
               {Array.from({ length: totalPages }).map((_, i) => (
                 <button
                   key={i}
                   onClick={() => setCurrentPage(i + 1)}
                   className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                     currentPage === i + 1 
                       ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md' 
                       : 'bg-surface border border-border hover:bg-muted/10 text-muted-foreground'
                   }`}
                 >
                   {i + 1}
                 </button>
               ))}
             </div>
             <button
               disabled={currentPage === totalPages}
               onClick={() => setCurrentPage(p => p + 1)}
               className="px-3 py-1.5 rounded-lg text-sm bg-surface border border-border hover:bg-muted/10 disabled:opacity-50 transition-colors"
             >
               ถัดไป
             </button>
          </div>
        )}
      </AnimatedCard>

      {/* Detail Modal */}
      {selectedSession && (
        <SessionDetailModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
          onUpdatePayment={onUpdatePayment}
          onUpdateAmount={onUpdateAmount}
        />
      )}
    </div>
  );
}

// Reusable Stats Card Component (Matches Dashboard)
function StatsCard({ icon, label, value, subLabel, color, alert }: { icon: string; label: string; value: string; subLabel: string; color: string; alert?: boolean }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl p-5 shadow-lg cursor-default transition-all duration-300 hover:translate-y-[-2px] hover:shadow-xl group
        ${alert ? 'ring-2 ring-red-500/50 animate-pulse-slow' : ''}
      `}
    >
      {/* Dynamic Background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${color} opacity-90`} />
      <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
      
      {/* Decorative Circles */}
      <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full bg-white/10 blur-xl" />
      <div className="absolute -left-6 -bottom-6 w-20 h-20 rounded-full bg-black/10 blur-xl" />

      <div className="relative z-10 text-white">
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-2xl shadow-inner">
            {icon}
          </div>
          {alert && (
            <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full uppercase tracking-wider shadow-sm">
              Active
            </span>
          )}
        </div>
        
        <div className="mt-3">
          <div className="text-3xl font-bold tracking-tight shadow-black/20 drop-shadow-sm">{value}</div>
          <div className="text-sm font-medium opacity-90 mb-1">{label}</div>
          <div className="text-xs opacity-70 font-light flex items-center gap-1">
            {subLabel}
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterButton({ 
  active, 
  onClick, 
  label, 
  count, 
  activeClass = 'bg-white text-black shadow-md' 
}: { 
  active: boolean; 
  onClick: () => void; 
  label: string; 
  count: number;
  activeClass?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        active 
          ? activeClass 
          : 'text-muted-foreground hover:bg-muted/10 hover:text-foreground'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${active ? 'bg-black/10' : 'bg-muted/10'}`}>
        {count}
      </span>
    </button>
  );
}
