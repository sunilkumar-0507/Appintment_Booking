import { forwardRef } from 'react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

/* -------------------------------------------------------------------------- */
/* Shared wrapper                                                              */
/* -------------------------------------------------------------------------- */

interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function FieldShell({ label, hint, error, required, htmlFor, className, children }: FieldShellProps) {
  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="mb-1.5 block text-[13px] font-medium text-ink-700 dark:text-ink-200"
        >
          {label}
          {required && <span className="ml-0.5 text-danger-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="mt-1.5 text-[13px] text-danger-600 dark:text-danger-500">{error}</p>
      ) : (
        hint && <p className="mt-1.5 text-[13px] text-ink-500 dark:text-ink-400">{hint}</p>
      )}
    </div>
  );
}

const CONTROL_BASE =
  'w-full rounded-xl border bg-[rgb(var(--surface-card))] text-sm text-ink-900 transition-colors duration-150 ' +
  'placeholder:text-ink-400 dark:text-white dark:placeholder:text-ink-500 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 disabled:surface-muted';

const CONTROL_IDLE =
  'border-ink-200 hover:border-ink-300 focus:border-gold-400 focus:ring-4 focus:ring-gold-400/15 ' +
  'dark:border-white/10 dark:hover:border-white/20 dark:focus:border-gold-400';

const CONTROL_ERROR = 'border-danger-400 focus:border-danger-500 focus:ring-4 focus:ring-danger-500/15';

/* -------------------------------------------------------------------------- */
/* Input                                                                       */
/* -------------------------------------------------------------------------- */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  leftIcon?: ReactNode;
  rightSlot?: ReactNode;
  containerClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, leftIcon, rightSlot, className, containerClassName, id, required, ...props },
  ref,
) {
  const inputId = id ?? props.name;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={inputId}
      className={containerClassName}
    >
      <div className="relative">
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" aria-hidden>
            {leftIcon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            CONTROL_BASE,
            error ? CONTROL_ERROR : CONTROL_IDLE,
            'h-10 px-3 outline-none',
            leftIcon && 'pl-9',
            rightSlot && 'pr-10',
            className,
          )}
          {...props}
        />
        {rightSlot && <div className="absolute right-2 top-1/2 -translate-y-1/2">{rightSlot}</div>}
      </div>
    </FieldShell>
  );
});

/* -------------------------------------------------------------------------- */
/* Select                                                                      */
/* -------------------------------------------------------------------------- */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, containerClassName, id, required, children, ...props },
  ref,
) {
  const selectId = id ?? props.name;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={selectId}
      className={containerClassName}
    >
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          aria-invalid={Boolean(error) || undefined}
          className={cn(
            CONTROL_BASE,
            error ? CONTROL_ERROR : CONTROL_IDLE,
            'h-10 appearance-none pl-3 pr-9 outline-none',
            className,
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400"
          aria-hidden
        />
      </div>
    </FieldShell>
  );
});

/* -------------------------------------------------------------------------- */
/* Textarea                                                                    */
/* -------------------------------------------------------------------------- */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, containerClassName, id, required, rows = 4, ...props },
  ref,
) {
  const textareaId = id ?? props.name;

  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      required={required}
      htmlFor={textareaId}
      className={containerClassName}
    >
      <textarea
        ref={ref}
        id={textareaId}
        rows={rows}
        aria-invalid={Boolean(error) || undefined}
        className={cn(CONTROL_BASE, error ? CONTROL_ERROR : CONTROL_IDLE, 'resize-y p-3 outline-none', className)}
        {...props}
      />
    </FieldShell>
  );
});

/* -------------------------------------------------------------------------- */
/* Switch                                                                      */
/* -------------------------------------------------------------------------- */

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
  id?: string;
}

export function Switch({ checked, onChange, label, description, disabled, id }: SwitchProps) {
  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label
              htmlFor={id}
              className="block text-sm font-medium text-ink-800 dark:text-ink-100"
            >
              {label}
            </label>
          )}
          {description && <p className="mt-0.5 text-[13px] text-ink-500 dark:text-ink-400">{description}</p>}
        </div>
      )}
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={typeof label === 'string' ? label : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-200',
          checked ? 'bg-gold-400' : 'bg-ink-200 dark:bg-white/15',
          disabled && 'cursor-not-allowed opacity-50',
        )}
      >
        <span
          className={cn(
            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-[22px]' : 'translate-x-0.5',
          )}
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Checkbox                                                                    */
/* -------------------------------------------------------------------------- */

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, id, ...props },
  ref,
) {
  const checkboxId = id ?? props.name;
  return (
    <label htmlFor={checkboxId} className="inline-flex cursor-pointer items-center gap-2.5">
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        className={cn(
          'h-4 w-4 cursor-pointer rounded border-ink-300 text-gold-500 transition',
          'focus:ring-2 focus:ring-gold-400/40 focus:ring-offset-0 dark:border-white/20 dark:bg-white/5',
          className,
        )}
        {...props}
      />
      {label && <span className="text-sm text-ink-700 dark:text-ink-200">{label}</span>}
    </label>
  );
});
