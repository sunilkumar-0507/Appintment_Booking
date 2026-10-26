import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'outline';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-ink-900 text-white hover:bg-ink-800 active:bg-ink-950 shadow-card dark:bg-white dark:text-ink-900 dark:hover:bg-ink-100',
  accent:
    'bg-gold-400 text-ink-950 hover:bg-gold-300 active:bg-gold-500 shadow-card font-semibold',
  secondary:
    'bg-ink-100 text-ink-800 hover:bg-ink-200 active:bg-ink-200 dark:bg-white/[0.08] dark:text-ink-100 dark:hover:bg-white/[0.14]',
  outline:
    'border border-ink-200 bg-[rgb(var(--surface-card))] text-ink-700 hover:bg-ink-50 hover:border-ink-300 dark:border-white/10 dark:text-ink-200 dark:hover:bg-white/[0.06]',
  ghost:
    'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-300 dark:hover:bg-white/[0.08] dark:hover:text-white',
  danger: 'bg-danger-600 text-white hover:bg-danger-500 active:bg-danger-700 shadow-card',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    leftIcon,
    rightIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex select-none items-center justify-center whitespace-nowrap font-medium',
        'transition-all duration-150 active:scale-[0.98]',
        'disabled:pointer-events-none disabled:opacity-50 disabled:active:scale-100',
        VARIANTS[variant],
        SIZES[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin" aria-hidden />
      ) : (
        leftIcon && <span className="shrink-0" aria-hidden>{leftIcon}</span>
      )}
      {children}
      {!loading && rightIcon && <span className="shrink-0" aria-hidden>{rightIcon}</span>}
    </button>
  );
});
