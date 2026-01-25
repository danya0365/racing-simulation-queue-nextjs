'use client';

import { Session, SessionStats } from '@/src/application/repositories/ISessionRepository';
import { SessionDetailModal, SessionTimer } from '@/src/presentation/components/backend/SessionDetailModal';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import dayjs from 'dayjs';
import { useState } from 'react';

interface SessionsTabProps {
  sessions: Session[];
  sessionStats: SessionStats;
}

export function SessionsTab({ sessions, sessionStats }: SessionsTabProps) {
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
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <StatsCard 
           label="รอบการเล่นทั้งหมด" 
           value={sessionStats.totalSessions} 
           icon="📝" 
           color="bg-purple-500/20 border-purple-500/30 text-purple-300" 
         />
         <StatsCard 
           label="กำลังเล่น" 
           value={sessionStats.activeSessions} 
           icon="🟢" 
           color="bg-emerald-500/20 border-emerald-500/30 text-emerald-300" 
         />
         <StatsCard 
           label="เสร็จสิ้นแล้ว" 
           value={sessionStats.completedSessions} 
           icon="🏁" 
           color="bg-blue-500/20 border-blue-500/30 text-blue-300" 
         />
         <StatsCard 
           label="รายได้รวม" 
           value={`฿${sessionStats.totalRevenue.toLocaleString()}`} 
           icon="💰" 
           color="bg-yellow-500/20 border-yellow-500/30 text-yellow-300" 
         />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
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
          activeClass="bg-emerald-500 text-white"
        />
        <FilterButton 
          active={filter === 'completed'} 
          onClick={() => handleFilterChange('completed')}
          label="ประวัติการเล่น"
          count={sessions.filter(s => !!s.endTime).length}
          activeClass="bg-blue-500 text-white"
        />
      </div>

      {/* Sessions List */}
      {paginatedSessions.length === 0 ? (
        <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10">
           <div className="text-4xl mb-4">📭</div>
           <p className="text-white/40">ไม่พบข้อมูลการเล่น</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedSessions.map((session) => (
            <AnimatedCard 
              key={session.id} 
              className="p-4 cursor-pointer hover:bg-white/5 transition-colors"
              onClick={() => setSelectedSession(session)}
            >
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                   <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg ${
                     !session.endTime 
                       ? 'bg-gradient-to-br from-emerald-500 to-green-600 animate-pulse text-white' 
                       : 'bg-white/10 text-white/40'
                   }`}>
                     {session.sourceType === 'manual' ? 'M' : 'B'}
                   </div>
                   <div>
                     <p className="font-bold text-white text-lg">{session.customerName}</p>
                     <p className="text-xs text-white/50 flex items-center gap-2">
                       <span>{session.stationName || 'Unknown Station'}</span>
                       <span>•</span>
                       <span>{dayjs(session.startTime).format('D MMM HH:mm')}</span>
                     </p>
                   </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                   {!session.endTime ? (
                     <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                       <span className="text-emerald-400 font-bold">กำลังเล่น</span>
                     </div>
                   ) : (
                     <div className="flex items-center gap-2">
                       <span className="text-white/60 text-sm">{session.durationMinutes} นาที</span>
                       <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white/60 text-xs">เสร็จสิ้น</span>
                     </div>
                   )}
                   
                   {!session.endTime && (
                      <div className="scale-75 origin-right">
                        <SessionTimer startTime={session.startTime} estimatedEndTime={session.estimatedEndTime} />
                      </div>
                   )}
                   
                   {session.totalAmount > 0 && (
                     <p className="text-yellow-400 font-bold">฿{session.totalAmount}</p>
                   )}
                </div>
              </div>
            </AnimatedCard>
          ))}
        </div>
      )}

      {/* Pagination (Simplified) */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 pt-4">
           {Array.from({ length: totalPages }).map((_, i) => (
             <button
               key={i}
               onClick={() => setCurrentPage(i + 1)}
               className={`w-8 h-8 rounded-lg ${
                 currentPage === i + 1 
                   ? 'bg-purple-500 text-white' 
                   : 'bg-white/5 text-white/40 hover:bg-white/10'
               }`}
             >
               {i + 1}
             </button>
           ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedSession && (
        <SessionDetailModal 
          session={selectedSession} 
          onClose={() => setSelectedSession(null)} 
        />
      )}
    </div>
  );
}

function StatsCard({ label, value, icon, color }: { label: string; value: string | number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color}`}>
       <div className="flex items-center justify-between mb-2">
         <span className="text-2xl">{icon}</span>
       </div>
       <p className="text-2xl font-bold">{value}</p>
       <p className="text-xs opacity-70">{label}</p>
    </div>
  );
}

function FilterButton({ 
  active, 
  onClick, 
  label, 
  count, 
  activeClass = 'bg-white text-black' 
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
          : 'bg-white/5 text-white/60 hover:bg-white/10'
      }`}
    >
      {label}
      <span className={`px-1.5 py-0.5 rounded-md text-xs ${active ? 'bg-black/20' : 'bg-white/10'}`}>
        {count}
      </span>
    </button>
  );
}
