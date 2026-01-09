import { Skeleton, SkeletonCircle, SkeletonText } from "@/src/presentation/components/ui/Skeleton";

/**
 * Loading UI for Single Queue Status page
 * This file is automatically used by Next.js as the loading fallback
 * when the page.tsx is fetching data server-side
 */
export default function Loading() {
  return (
    <div className="h-full overflow-auto scrollbar-thin">
      {/* Header Skeleton */}
      <section className="px-4 md:px-8 py-6 bg-gradient-to-br from-purple-500/10 via-background to-cyan-500/10">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <SkeletonText width="w-36" />
            <SkeletonText width="w-20" />
          </div>
          <Skeleton className="h-8 w-48" />
        </div>
      </section>

      {/* Content Skeleton */}
      <section className="px-4 md:px-8 py-6">
        <div className="max-w-lg mx-auto space-y-6">
          {/* Queue Number Card */}
          <div className="bg-surface border border-border rounded-xl p-8 text-center">
            {/* Status Icon */}
            <SkeletonCircle size="w-24 h-24 mx-auto mb-4" />
            
            {/* Queue Number */}
            <Skeleton className="h-16 w-24 mx-auto mb-2" />
            <Skeleton className="h-6 w-20 mx-auto mb-4" />
            
            {/* Queue Ahead */}
            <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-xl">
              <SkeletonText width="w-32 mx-auto" className="mb-2" />
              <SkeletonText width="w-24 mx-auto" />
            </div>
          </div>

          {/* Details Card */}
          <div className="bg-surface border border-border rounded-xl p-6">
            <Skeleton className="h-5 w-40 mb-4" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="flex justify-between items-center py-2 border-b border-border">
                  <SkeletonText width="w-20" />
                  <SkeletonText width="w-28" />
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>

          {/* Auto refresh notice */}
          <div className="flex items-center justify-center gap-2 pt-4">
            <Skeleton className="w-2 h-2 rounded-full" />
            <SkeletonText width="w-52" />
          </div>
        </div>
      </section>
    </div>
  );
}
