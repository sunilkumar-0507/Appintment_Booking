import type { ReactNode } from 'react';
import { AlertCircle, RefreshCw, WifiOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import type { ApiError } from '@/types';
import { Button } from './Button';

/* -------------------------------------------------------------------------- */
/* Error state                                                                 */
/* -------------------------------------------------------------------------- */

export interface ErrorStateProps {
  /** The normalised error — never a raw Axios message. */
  error?: ApiError;
  title?: string;
  onRetry?: () => void;
  className?: string;
  compact?: boolean;
}

export function ErrorState({ error, title, onRetry, className, compact }: ErrorStateProps) {
  const offline = error?.status === 0;
  const Icon = offline ? WifiOff : AlertCircle;

  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed text-center',
        'border-ink-200 dark:border-white/10',
        compact ? 'gap-3 p-6' : 'gap-4 p-10',
        className,
      )}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-danger-50 text-danger-600 dark:bg-danger-500/10">
        <Icon className="h-5 w-5" aria-hidden />
      </span>
      <div>
        <h3 className="text-base font-semibold text-ink-900 dark:text-white">
          {title ?? 'Unable to load this content'}
        </h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">
          {error?.message ?? 'Something went wrong. Please try again.'}
        </p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} leftIcon={<RefreshCw className="h-4 w-4" />}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  compact,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed text-center',
        'border-ink-200 dark:border-white/10',
        compact ? 'gap-3 p-6' : 'gap-4 p-12',
        className,
      )}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-400 dark:bg-white/[0.06] dark:text-ink-500">
        <Icon className="h-6 w-6" aria-hidden />
      </span>
      <div>
        <h3 className="text-base font-semibold text-ink-900 dark:text-white">{title}</h3>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-sm text-ink-500 dark:text-ink-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
