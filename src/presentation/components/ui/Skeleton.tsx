'use client';

import { ReactNode } from 'react';

/**
 * Skeleton base component
 * Provides animated shimmer effect for loading states
 */
interface SkeletonProps {
  className?: string;
  children?: ReactNode;
}

export function Skeleton({ className = '', children }: SkeletonProps) {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-surface via-border to-surface bg-[length:200%_100%] rounded-lg ${className}`}
    >
      {children}
    </div>
  );
}

/**
 * Skeleton Text - for text placeholders
 */
export function SkeletonText({ width = 'w-full', className = '' }: { width?: string; className?: string }) {
  return <Skeleton className={`h-4 ${width} ${className}`} />;
}

/**
 * Skeleton Circle - for avatar/icon placeholders
 */
export function SkeletonCircle({ size = 'w-10 h-10', className = '' }: { size?: string; className?: string }) {
  return <Skeleton className={`${size} rounded-full ${className}`} />;
}

/**
 * Skeleton Card - for card placeholders
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-surface border border-border rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-4">
        <SkeletonCircle size="w-14 h-14" />
        <div className="flex-1 space-y-2">
          <SkeletonText width="w-3/4" />
          <SkeletonText width="w-1/2" />
        </div>
      </div>
    </div>
  );
}

/**
 * Queue Status Skeleton - for MyQueueStatusView
 */
export function QueueStatusSkeleton() {
  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Header Skeleton */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <SkeletonText width="w-32" />
            <div className="text-right space-y-1">
              <SkeletonText width="w-20" className="ml-auto" />
              <SkeletonText width="w-24" className="h-6 ml-auto" />
            </div>
          </div>
          <Skeleton className="h-8 w-48 mb-2" />
          <SkeletonText width="w-64" />
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="px-4 md:px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Section Header */}
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="w-3 h-3 rounded-full" />
            <SkeletonText width="w-40" className="h-5" />
          </div>

          {/* Queue Cards */}
          {[1, 2].map((i) => (
            <div 
              key={i} 
              className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  {/* Queue Number */}
                  <Skeleton className="w-16 h-16 rounded-xl" />
                  {/* Details */}
                  <div className="space-y-2">
                    <SkeletonText width="w-32" className="h-5" />
                    <SkeletonText width="w-24" />
                    <div className="flex gap-3">
                      <SkeletonText width="w-16" />
                      <SkeletonText width="w-20" />
                    </div>
                  </div>
                </div>
                {/* Status */}
                <div className="text-right space-y-1">
                  <SkeletonText width="w-20" />
                  <SkeletonText width="w-16" />
                </div>
              </div>
              {/* Actions */}
              <div className="flex gap-2 mt-4">
                <Skeleton className="flex-1 h-10 rounded-xl" />
                <Skeleton className="w-24 h-10 rounded-xl" />
              </div>
            </div>
          ))}

          {/* Refresh Notice */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Skeleton className="w-2 h-2 rounded-full" />
            <SkeletonText width="w-52" />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 justify-center pt-4">
            <Skeleton className="w-32 h-10 rounded-xl" />
            <Skeleton className="w-24 h-10 rounded-xl" />
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Home Page Skeleton
 */
export function HomePageSkeleton() {
  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Hero Skeleton */}
      <section className="relative min-h-[50vh] flex items-center justify-center">
        <div className="text-center px-4 py-12">
          <SkeletonCircle size="w-24 h-24 mx-auto mb-6" />
          <Skeleton className="h-12 w-80 mx-auto mb-4" />
          <div className="space-y-2 mb-8">
            <SkeletonText width="w-96 mx-auto" />
            <SkeletonText width="w-64 mx-auto" />
          </div>
          <div className="flex gap-4 justify-center">
            <Skeleton className="w-36 h-12 rounded-xl" />
            <Skeleton className="w-32 h-12 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Stats Skeleton */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <Skeleton className="h-8 w-48 mx-auto mb-6" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} className="h-48" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Backend Dashboard Skeleton
 */
export function BackendSkeleton() {
  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Header */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-pink-500/10 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <SkeletonCircle size="w-14 h-14 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <SkeletonText width="w-32" />
              </div>
            </div>
            <Skeleton className="w-24 h-10 rounded-xl" />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <section className="px-4 md:px-8 py-4 border-b border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-2 overflow-x-auto">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-10 w-32 rounded-full shrink-0" />
            ))}
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="px-4 md:px-8 py-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-28 rounded-xl" />
            ))}
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Customer View Skeleton
 */
export function CustomerViewSkeleton() {
  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Hero Header */}
      <section className="relative py-10 px-4 md:px-8 bg-gradient-to-br from-cyan-500/10 via-background to-purple-500/10">
        <div className="max-w-6xl mx-auto">
          <SkeletonText width="w-32 mb-6" />
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="flex items-center gap-4">
              <SkeletonCircle size="w-16 h-16 rounded-2xl" />
              <div className="space-y-2">
                <Skeleton className="h-8 w-64" />
                <SkeletonText width="w-48" />
              </div>
            </div>
            <div className="flex gap-3">
              <Skeleton className="w-28 h-10 rounded-xl" />
              <Skeleton className="w-32 h-12 rounded-xl" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 md:px-8 py-6 border-b border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </section>

      {/* Machines Grid */}
      <section className="px-4 md:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-8 w-24 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <SkeletonCard key={i} className="h-44" />
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

/**
 * Dashboard Tab Skeleton
 */
export function DashboardTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>

      {/* Charts / Summary Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface border border-border rounded-xl p-4">
          <Skeleton className="h-5 w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkeletonCircle size="w-8 h-8" />
                  <SkeletonText width="w-32" />
                </div>
                <SkeletonText width="w-16" />
              </div>
            ))}
          </div>
        </div>
        <div className="bg-surface border border-border rounded-xl p-4">
          <Skeleton className="h-5 w-40 mb-4" />
          <Skeleton className="h-48 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Live Control Tab Skeleton
 */
export function LiveControlTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>

      {/* Machine Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-12 h-12 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-24" />
                  <SkeletonText width="w-16" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            {/* Current Queue */}
            <div className="mb-4 p-3 bg-background rounded-lg">
              <SkeletonText width="w-20 mb-2" />
              <div className="flex items-center gap-2">
                <SkeletonCircle size="w-8 h-8" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <SkeletonText width="w-24" />
                </div>
              </div>
            </div>
            {/* Action Buttons */}
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-10 rounded-xl" />
              <Skeleton className="flex-1 h-10 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Queues Tab Skeleton
 */
export function QueuesTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-32" />
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl" />
        ))}
      </div>

      {/* Queue List */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SkeletonCircle size="w-12 h-12" />
                <div className="space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <div className="flex gap-3">
                    <SkeletonText width="w-20" />
                    <SkeletonText width="w-16" />
                    <SkeletonText width="w-24" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}

/**
 * Machines Tab Skeleton
 */
export function MachinesTabSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-10 w-32 rounded-xl" />
      </div>

      {/* Machine Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-12 h-12 rounded-xl" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-28" />
                  <SkeletonText width="w-20" />
                </div>
              </div>
              <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <SkeletonText width="w-full mb-4" />
            <div className="flex gap-2">
              <Skeleton className="flex-1 h-9 rounded-lg" />
              <Skeleton className="flex-1 h-9 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Customers Tab Skeleton
 */
export function CustomersTabSkeleton() {
  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-28 rounded-xl" />
        ))}
      </div>

      {/* Search & Add */}
      <div className="flex gap-3">
        <Skeleton className="flex-1 h-12 rounded-xl" />
        <Skeleton className="h-12 w-24 rounded-xl" />
      </div>

      {/* Results Info */}
      <div className="flex justify-between">
        <SkeletonText width="w-48" />
        <SkeletonText width="w-24" />
      </div>

      {/* Customer List */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-12 h-12" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <SkeletonText width="w-28" />
                  <div className="flex gap-3">
                    <SkeletonText width="w-16" />
                    <SkeletonText width="w-20" />
                    <SkeletonText width="w-16" />
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-10 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 pt-4">
        <Skeleton className="h-10 w-24 rounded-lg" />
        <div className="flex gap-1">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-10 w-10 rounded-lg" />
          ))}
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>
    </div>
  );
}
