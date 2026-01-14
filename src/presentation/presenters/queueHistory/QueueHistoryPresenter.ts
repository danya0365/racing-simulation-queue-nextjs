/**
 * QueueHistoryPresenter
 * Handles business logic for Queue History page
 * Uses local storage data from CustomerStore
 */

import dayjs from 'dayjs';
import { Metadata } from 'next';

export interface QueueHistoryItem {
  id: string;
  machineId: string;
  machineName: string;
  customerName: string;
  customerPhone: string;
  bookingTime: string;
  duration: number;
  position: number;
  status: 'waiting' | 'playing' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface QueueHistoryStats {
  total: number;
  completed: number;
  cancelled: number;
}

export interface QueueHistoryViewModel {
  history: QueueHistoryItem[];
  filteredHistory: QueueHistoryItem[];
  stats: QueueHistoryStats;
  filter: 'all' | 'completed' | 'cancelled';
}

/**
 * Presenter for Queue History page
 * ✅ Works with local storage data
 */
export class QueueHistoryPresenter {
  /**
   * Generate metadata for the page
   */
  generateMetadata(): Metadata {
    return {
      title: 'ประวัติการจอง | Racing Queue',
      description: 'ดูประวัติการจองคิวทั้งหมดของคุณ',
    };
  }

  /**
   * Get view model from history data
   */
  getViewModel(
    history: QueueHistoryItem[],
    filter: 'all' | 'completed' | 'cancelled' = 'all'
  ): QueueHistoryViewModel {
    // Filter history
    const filteredHistory = history.filter(item => {
      if (filter === 'all') return true;
      return item.status === filter;
    });

    // Calculate stats
    const stats: QueueHistoryStats = {
      total: history.length,
      completed: history.filter(h => h.status === 'completed').length,
      cancelled: history.filter(h => h.status === 'cancelled').length,
    };

    return {
      history,
      filteredHistory,
      stats,
      filter,
    };
  }

  /**
   * Group history by date
   */
  groupByDate(history: QueueHistoryItem[]): Record<string, QueueHistoryItem[]> {
    return history.reduce((groups, item) => {
      const date = this.formatDate(item.bookingTime);
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(item);
      return groups;
    }, {} as Record<string, QueueHistoryItem[]>);
  }

  /**
   * Format date for grouping
   */
  private formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('th-TH', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(dayjs(dateString).toDate());
  }
}
