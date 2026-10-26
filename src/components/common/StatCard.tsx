import type { ReactNode } from 'react';
import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { Skeleton } from './Loading';

export interface StatCardProps {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
  /** Signed percentage movement; omit for cards with no comparison. */
  changePercent?: number;
  caption?: string;
  /** Inverts the colour scale for metrics where "down" is good. */
  invertTrend?: boolean;
  accent?: 'gold' | 'blue' | 'green' | 'violet';
  loading?: boolean;
  className?: string;
}

const ACCENTS = {
  gold: 'bg-gold-50 text-gold-600 dark:bg-gold-400/10 dark:text-gold-300',
  blue: 'bg-info-50 text-info-600 dark:bg-info-500/10 dark:text-info-100',
  green: 'bg-success-50 text-success-600 dark:bg-success-500/10 dark:text-success-100',
  violet: 'bg-[#f4f2ff] text-[#6941c6] dark:bg-[#9b8afb]/10 dark:text-[#c7bcfd]',
};

export function StatCard({
  label,
  value,
  icon: Icon,
  changePercent,
  caption,
  invertTrend = false,
  accent = 'gold',
  loading = false,
  className,
}: StatCardProps) {
  const hasTrend = typeof changePercent === 'number';
  const positive = hasTrend && (invertTrend ? changePercent! < 0 : changePercent! > 0);
  const neutral = hasTrend && changePercent === 0;
  const TrendIcon = neutral ? Minus : positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div
      className={cn(
        'surface-card group relative overflow-hidden p-5 transition-shadow duration-200 hover:shadow-card-hover',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-ink-500 dark:text-ink-400">{label}</p>
        <span
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-105',
            ACCENTS[accent],
          )}
        >
          <Icon className="h-[18px] w-[18px]" aria-hidden />
        </span>
      </div>

      {loading ? (
        <>
          <Skeleton className="mt-4 h-8 w-24" />
          <Skeleton className="mt-3 h-3 w-32" />
        </>
      ) : (
        <>
          <p className="mt-3 font-display text-[28px] font-bold leading-none tracking-tight text-ink-900 dark:text-white">
            {value}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px]">
            {hasTrend && (
              <span
                className={cn(
                  'inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium',
                  neutral
                    ? 'bg-ink-100 text-ink-600 dark:bg-white/10 dark:text-ink-300'
                    : positive
                      ? 'bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-100'
                      : 'bg-danger-50 text-danger-700 dark:bg-danger-500/10 dark:text-danger-100',
                )}
              >
                <TrendIcon className="h-3 w-3" aria-hidden />
                {/* The arrow already carries the direction, so the number stays unsigned. */}
                {`${Number(Math.abs(changePercent!).toFixed(1))}%`}
              </span>
            )}
            {caption && <span className="text-ink-500 dark:text-ink-400">{caption}</span>}
          </div>
        </>
      )}
    </div>
  );
}
