import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useToast } from '@/context/ToastContext';
import type { ToastVariant } from '@/context/ToastContext';

const VARIANTS: Record<ToastVariant, { icon: LucideIcon; iconClass: string; accent: string }> = {
  success: {
    icon: CheckCircle2,
    iconClass: 'text-success-600 bg-success-50 dark:bg-success-500/10',
    accent: 'bg-success-500',
  },
  error: {
    icon: XCircle,
    iconClass: 'text-danger-600 bg-danger-50 dark:bg-danger-500/10',
    accent: 'bg-danger-500',
  },
  warning: {
    icon: AlertTriangle,
    iconClass: 'text-warning-600 bg-warning-50 dark:bg-warning-500/10',
    accent: 'bg-warning-500',
  },
  info: {
    icon: Info,
    iconClass: 'text-info-600 bg-info-50 dark:bg-info-500/10',
    accent: 'bg-info-500',
  },
};

/** Fixed stack rendered once at the app root, fed by `ToastContext`. */
export function ToastViewport() {
  const { toasts, dismiss } = useToast();
  if (toasts.length === 0) return null;

  return createPortal(
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex flex-col items-center gap-2.5 p-4 sm:inset-x-auto sm:right-0 sm:items-end"
    >
      {toasts.map((toast) => {
        const variant = VARIANTS[toast.variant];
        const Icon = variant.icon;

        return (
          <div
            key={toast.id}
            className={cn(
              'pointer-events-auto relative w-full max-w-sm animate-toast-in overflow-hidden',
              'rounded-2xl border border-ink-200/70 bg-[rgb(var(--surface-card))] p-3.5 shadow-float',
              'dark:border-white/10',
            )}
          >
            <span className={cn('absolute inset-y-0 left-0 w-1', variant.accent)} aria-hidden />
            <div className="flex items-start gap-3 pl-1.5">
              <span
                className={cn(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg',
                  variant.iconClass,
                )}
              >
                <Icon className="h-4 w-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">{toast.title}</p>
                {toast.description && (
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-500 dark:text-ink-400">
                    {toast.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="-mr-1 -mt-0.5 rounded-lg p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>,
    document.body,
  );
}
