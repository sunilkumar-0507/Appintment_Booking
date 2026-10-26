import type { CSSProperties } from 'react';
import { Loader2, Scissors } from 'lucide-react';
import { cn } from '@/utils/cn';
import { APP_NAME } from '@/constants/config';

/* -------------------------------------------------------------------------- */
/* Spinner                                                                     */
/* -------------------------------------------------------------------------- */

export function LoadingSpinner({
  size = 'md',
  className,
  label = 'Loading',
}: {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}) {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <span role="status" aria-live="polite" className={cn('inline-flex items-center', className)}>
      <Loader2 className={cn('animate-spin text-gold-500', sizes[size])} aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Skeletons                                                                   */
/* -------------------------------------------------------------------------- */

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={cn('skeleton', className)} style={style} />;
}

export function SkeletonCard({ lines = 3, className }: { lines?: number; className?: string }) {
  return (
    <div className={cn('surface-card p-5', className)}>
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
      </div>
      <div className="mt-5 space-y-2.5">
        {Array.from({ length: lines }).map((_, index) => (
          <Skeleton key={index} className={cn('h-3', index === lines - 1 ? 'w-2/3' : 'w-full')} />
        ))}
      </div>
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="surface-card p-5">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-4 h-8 w-20" />
          <Skeleton className="mt-3 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="surface-card overflow-hidden" role="status" aria-label="Loading table">
      <div className="hidden border-b border-ink-200/70 px-5 py-3.5 dark:border-white/[0.07] md:flex md:gap-6">
        {Array.from({ length: columns }).map((_, index) => (
          <Skeleton key={index} className="h-3 flex-1" />
        ))}
      </div>
      <div className="divide-y divide-ink-200/70 dark:divide-white/[0.07]">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="flex items-center gap-6 px-5 py-4">
            <Skeleton className="h-9 w-9 shrink-0 rounded-full" />
            {Array.from({ length: columns - 1 }).map((_, columnIndex) => (
              <Skeleton key={columnIndex} className="hidden h-3.5 flex-1 md:block" />
            ))}
            <div className="flex-1 space-y-2 md:hidden">
              <Skeleton className="h-3.5 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  // Fixed bar heights keep the placeholder from flickering between renders.
  const heights = [45, 70, 55, 85, 60, 92, 48, 78, 66, 88, 52, 74];
  return (
    <div className={cn('flex h-64 items-end gap-2', className)} role="status" aria-label="Loading chart">
      {heights.map((height, index) => (
        <Skeleton key={index} className="flex-1 rounded-t-md" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Full page loader                                                            */
/* -------------------------------------------------------------------------- */

export function PageLoader({ message = 'Loading…' }: { message?: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <span className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-gold-400/30" aria-hidden />
        <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-900 text-gold-400 dark:bg-white/10">
          <Scissors className="h-6 w-6" aria-hidden />
        </span>
      </span>
      <p className="text-sm font-medium text-ink-500 dark:text-ink-400">{message}</p>
    </div>
  );
}

/** Shown while the app boots and restores the stored session. */
export function AppBootLoader() {
  return (
    <div className="flex h-full min-h-screen flex-col items-center justify-center gap-5 bg-[rgb(var(--surface-page))]">
      <span className="flex h-16 w-16 items-center justify-center rounded-3xl bg-ink-900 text-gold-400 shadow-float">
        <Scissors className="h-7 w-7" aria-hidden />
      </span>
      <div className="text-center">
        <p className="font-display text-lg font-bold tracking-tight text-ink-900 dark:text-white">
          {APP_NAME}
        </p>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">Preparing your workspace…</p>
      </div>
      <LoadingSpinner />
    </div>
  );
}
