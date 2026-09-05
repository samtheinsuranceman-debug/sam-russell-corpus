import { cn } from "@/lib/utils";

/**
 * Premium skeleton loading states — Mark 10/10 Technical.
 * Matches the dimensions of loaded content for seamless transitions.
 */

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[var(--radius-interactive)] bg-muted/50",
        className
      )}
      {...props}
    />
  );
}

/** Profile page skeleton — matches radar chart + score cards layout */
function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-32 rounded-[var(--radius-interactive)]" />
          <Skeleton className="h-10 w-32 rounded-[var(--radius-interactive)]" />
        </div>
      </div>

      {/* Rarity Score */}
      <div className="flex justify-center">
        <Skeleton className="h-48 w-48 rounded-full" />
      </div>

      {/* Radar Chart */}
      <div className="glass-card p-8 rounded-[var(--radius-container)]">
        <Skeleton className="h-[400px] w-full rounded-[var(--radius-container)]" />
      </div>

      {/* Score Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-[var(--radius-container)] space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-2 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Pricing page skeleton — matches tier cards layout */
function PricingSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">
      <div className="text-center space-y-3">
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-6 w-72 mx-auto" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-8 rounded-[var(--radius-container)] space-y-4">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-10 w-32" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
            <Skeleton className="h-12 w-full rounded-[var(--radius-interactive)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Admin dashboard skeleton */
function AdminSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-[var(--radius-container)] space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="glass-card p-6 rounded-[var(--radius-container)] space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Assessment page skeleton — matches the voice recording interface */
function AssessmentSkeleton() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Progress bar */}
      <Skeleton className="h-1 w-full max-w-md absolute top-0 left-0 right-0" />
      {/* Question text */}
      <div className="text-center space-y-4 mb-12">
        <Skeleton className="h-4 w-32 mx-auto" />
        <Skeleton className="h-12 w-96 mx-auto" />
        <Skeleton className="h-8 w-72 mx-auto" />
      </div>
      {/* Mic button */}
      <Skeleton className="h-40 w-40 rounded-full" />
      <Skeleton className="h-4 w-48 mt-6" />
      {/* Nav buttons */}
      <div className="flex gap-4 mt-12">
        <Skeleton className="h-10 w-28 rounded-[var(--radius-interactive)]" />
        <Skeleton className="h-10 w-28 rounded-[var(--radius-interactive)]" />
      </div>
    </div>
  );
}

/** Evidence page skeleton — matches file upload interface */
function EvidenceSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-[var(--radius-interactive)]" />
        <Skeleton className="h-8 w-48" />
      </div>
      <Skeleton className="h-6 w-96" />
      {/* Upload area */}
      <Skeleton className="h-48 w-full rounded-[var(--radius-container)] border-2 border-dashed border-muted" />
      {/* File list */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="glass-card p-4 rounded-[var(--radius-container)] flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-[var(--radius-interactive)]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-8 w-20 rounded-[var(--radius-interactive)]" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Science page skeleton — matches academic content layout */
function ScienceSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 space-y-8">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-[var(--radius-interactive)]" />
        <Skeleton className="h-8 w-64" />
      </div>
      <Skeleton className="h-6 w-full max-w-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="glass-card p-6 rounded-[var(--radius-container)] space-y-3">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Generic page skeleton */
function PageSkeleton() {
  return (
    <div className="min-h-screen bg-background p-6 md:p-12 space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-6 w-96" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-[var(--radius-container)]" />
        ))}
      </div>
    </div>
  );
}

export { Skeleton, ProfileSkeleton, PricingSkeleton, AdminSkeleton, AssessmentSkeleton, EvidenceSkeleton, ScienceSkeleton, PageSkeleton };
