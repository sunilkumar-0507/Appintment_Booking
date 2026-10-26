import { cn } from '@/utils/cn';

/**
 * Draw-on checkmark shown after a booking is confirmed. Pure SVG/CSS — the
 * `prefers-reduced-motion` rule in `index.css` shortens it automatically.
 */
export function SuccessAnimation({ className }: { className?: string }) {
  return (
    <div className={cn('relative flex h-20 w-20 items-center justify-center', className)}>
      <span className="absolute inset-0 animate-pulse-ring rounded-full bg-success-500/25" aria-hidden />
      <span className="relative flex h-20 w-20 items-center justify-center rounded-full bg-success-50 dark:bg-success-500/15">
        <svg viewBox="0 0 52 52" className="h-10 w-10" aria-hidden>
          <circle
            cx="26"
            cy="26"
            r="23"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            className="text-success-500/40"
          />
          <path
            d="M15 27.5l7.5 7.5L37 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="48"
            className="animate-draw-check text-success-600 dark:text-success-500"
          />
        </svg>
      </span>
    </div>
  );
}
