'use client';

import { AnimatedButton } from '@/src/presentation/components/ui/AnimatedButton';
import { AnimatedCard } from '@/src/presentation/components/ui/AnimatedCard';
import dayjs from 'dayjs';
import { useState } from 'react';

import { WalkInStatus } from '@/src/application/repositories/IWalkInQueueRepository';

// Type alias match BackendView
type QueueStatus = WalkInStatus | 'playing' | 'completed' | 'cancelled';

interface QueuesTabProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queues: any[];
  isUpdating: boolean;
  onUpdateStatus: (id: string, status: QueueStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function QueuesTab({ queues, isUpdating, onUpdateStatus, onDelete }: QueuesTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(dayjs(dateString).toDate());
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'waiting':
        return { label: 'รอคิว', color: 'bg-purple-500', textColor: 'text-purple-400' };
      case 'called':
        return { label: 'เรียกแล้ว', color: 'bg-cyan-500', textColor: 'text-cyan-400' };
      case 'seated':
        return { label: 'เริ่มเล่นแล้ว', color: 'bg-emerald-500', textColor: 'text-emerald-400' };
      case 'cancelled':
        return { label: 'ยกเลิก', color: 'bg-red-500', textColor: 'text-red-400' };
      default:
        return { label: status, color: 'bg-gray-500', textColor: 'text-gray-400' };
    }
  };

  // Filter queues by status
  const filteredQueues = statusFilter === 'all' 
    ? queues 
    : queues.filter(q => q.status === statusFilter);

  // Calculate pagination
  const totalPages = Math.ceil(filteredQueues.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedQueues = filteredQueues.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filter changes
  const handleFilterChange = (filter: string) => {
    setStatusFilter(filter);
    setCurrentPage(1);
  };

  // Count by status for filter badges
  const statusCounts = {
    all: queues.length,
    waiting: queues.filter(q => q.status === 'waiting').length,
    called: queues.filter(q => q.status === 'called').length,
    seated: queues.filter(q => q.status === 'seated').length,
    cancelled: queues.filter(q => q.status === 'cancelled').length,
  };

  const filterButtons = [
    { key: 'all', label: 'ทั้งหมด', icon: '📋', color: 'from-gray-500 to-gray-600' },
    { key: 'waiting', label: 'รอคิว', icon: '⏳', color: 'from-purple-500 to-violet-600' },
    { key: 'called', label: 'เรียกแล้ว', icon: '🔔', color: 'from-cyan-500 to-blue-600' },
    { key: 'seated', label: 'เริ่มเล่นแล้ว', icon: '✅', color: 'from-emerald-500 to-green-600' },
    { key: 'cancelled', label: 'ยกเลิก', icon: '❌', color: 'from-red-500 to-rose-600' },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-foreground">
          คิววันนี้ ({filteredQueues.length}{statusFilter !== 'all' ? ` / ${queues.length}` : ''})
        </h3>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {filterButtons.map((btn) => (
          <button
            key={btn.key}
            onClick={() => handleFilterChange(btn.key)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
              statusFilter === btn.key
                ? `bg-gradient-to-r ${btn.color} text-white shadow-lg`
                : 'bg-surface border border-border text-muted hover:bg-muted-light hover:text-foreground'
            }`}
          >
            <span>{btn.icon}</span>
            <span>{btn.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
              statusFilter === btn.key 
                ? 'bg-white/20' 
                : 'bg-muted-light'
            }`}>
              {statusCounts[btn.key as keyof typeof statusCounts]}
            </span>
          </button>
        ))}
      </div>

      {/* Queue List */}
      {paginatedQueues.length === 0 ? (
        <AnimatedCard className="p-8 text-center">
          <div className="text-4xl mb-4">📋</div>
          <p className="text-muted">
            {statusFilter === 'all' ? 'ยังไม่มีคิววันนี้' : `ไม่มีคิวสถานะ "${getStatusConfig(statusFilter).label}"`}
          </p>
        </AnimatedCard>
      ) : (
        <div className="space-y-3">
          {paginatedQueues.map((queue) => {
            const statusConfig = getStatusConfig(queue.status);
            return (
              <AnimatedCard key={queue.id} className="p-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl font-bold text-white">
                      #{queue.queueNumber}
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{queue.customerName}</p>
                      <p className="text-sm text-muted">{queue.customerPhone}</p>
                      <p className="text-xs text-muted mt-1">
                        🕐 {formatTime(queue.joinedAt)} • {queue.partySize} ท่าน
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full ${statusConfig.color} text-white text-xs font-medium`}>
                      {statusConfig.label}
                    </span>

                    {queue.status === 'waiting' && (
                      <AnimatedButton
                        variant="primary"
                        size="sm"
                        onClick={() => onUpdateStatus(queue.id, 'called')}
                        disabled={isUpdating}
                      >
                        🔔 เรียกคิว
                      </AnimatedButton>
                    )}

                    {queue.status === 'called' && (
                      <div className="text-xs text-muted italic">รอจัดที่นั่งที่ 'ควบคุมห้องเกม'</div>
                    )}

                    {(queue.status === 'waiting' || queue.status === 'called') && (
                      <AnimatedButton
                        variant="danger"
                        size="sm"
                        onClick={() => onUpdateStatus(queue.id, 'cancelled')}
                        disabled={isUpdating}
                      >
                        ❌ ยกเลิก
                      </AnimatedButton>
                    )}
                  </div>
                </div>
              </AnimatedCard>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:bg-muted-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ← ก่อนหน้า
          </button>
          
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .map((page, index, arr) => {
                const prevPage = arr[index - 1];
                const showEllipsis = prevPage && page - prevPage > 1;
                
                return (
                  <span key={page} className="flex items-center gap-1">
                    {showEllipsis && <span className="px-2 text-muted">...</span>}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-surface border border-border text-muted hover:bg-muted-light'
                      }`}
                    >
                      {page}
                    </button>
                  </span>
                );
              })}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 rounded-lg bg-surface border border-border text-muted hover:bg-muted-light disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            ถัดไป →
          </button>
        </div>
      )}

      {/* Summary Footer */}
      {filteredQueues.length > 0 && (
        <div className="text-center text-sm text-muted">
          แสดง {startIndex + 1} - {Math.min(startIndex + itemsPerPage, filteredQueues.length)} จาก {filteredQueues.length} รายการ
        </div>
      )}
    </div>
  );
}
