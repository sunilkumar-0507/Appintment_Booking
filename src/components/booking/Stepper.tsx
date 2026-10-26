import { Check } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface Step {
  label: string;
  description?: string;
}

export interface StepperProps {
  steps: Step[];
  /** Zero-based index of the active step. */
  current: number;
  onStepClick?: (index: number) => void;
  className?: string;
}

/** Horizontal progress rail. Collapses to a compact bar on small screens. */
export function Stepper({ steps, current, onStepClick, className }: StepperProps) {
  return (
    <div className={className}>
      {/* Mobile: progress bar + current label */}
      <div className="sm:hidden">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-ink-900 dark:text-white">{steps[current]?.label}</p>
          <p className="text-[13px] text-ink-500 dark:text-ink-400">
            Step {current + 1} of {steps.length}
          </p>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-200 dark:bg-white/10">
          <div
            className="h-full rounded-full bg-gold-400 transition-[width] duration-500 ease-out"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop: full rail */}
      <ol className="hidden items-center sm:flex">
        {steps.map((step, index) => {
          const done = index < current;
          const active = index === current;
          const clickable = Boolean(onStepClick) && index <= current;

          return (
            <li key={step.label} className={cn('flex items-center', index < steps.length - 1 && 'flex-1')}>
              <button
                type="button"
                disabled={!clickable}
                onClick={() => clickable && onStepClick?.(index)}
                className={cn('flex items-center gap-2.5 text-left', clickable && 'cursor-pointer')}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-all duration-200',
                    done
                      ? 'bg-gold-400 text-ink-950'
                      : active
                        ? 'bg-ink-900 text-white ring-4 ring-gold-400/20 dark:bg-white dark:text-ink-900'
                        : 'surface-muted text-ink-400 ring-1 ring-inset ring-ink-200 dark:ring-white/10',
                  )}
                >
                  {done ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : index + 1}
                </span>
                <span className="hidden lg:block">
                  <span
                    className={cn(
                      'block whitespace-nowrap text-[13px] font-medium',
                      active
                        ? 'text-ink-900 dark:text-white'
                        : done
                          ? 'text-ink-600 dark:text-ink-300'
                          : 'text-ink-400 dark:text-ink-500',
                    )}
                  >
                    {step.label}
                  </span>
                </span>
              </button>

              {index < steps.length - 1 && (
                <span
                  className={cn(
                    'mx-3 h-px flex-1 transition-colors duration-300',
                    done ? 'bg-gold-400' : 'bg-ink-200 dark:bg-white/10',
                  )}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
