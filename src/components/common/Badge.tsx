import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { APPOINTMENT_STATUS_META, BARBER_STATUS_META, CUSTOMER_STATUS_META } from '@/constants/domain';
import type { AppointmentStatus, BarberStatus, CustomerStatus } from '@/types';

export interface BadgeProps {
  children: ReactNode;
  className?: string;
  /** Draws a leading status dot. */
  dotClassName?: string;
  size?: 'sm' | 'md';
}

export function Badge({ children, className, dotClassName, size = 'md' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        className ??
          'bg-ink-100 text-ink-700 ring-1 ring-inset ring-ink-500/20 dark:bg-white/10 dark:text-ink-100',
      )}
    >
      {dotClassName && <span className={cn('h-1.5 w-1.5 rounded-full', dotClassName)} aria-hidden />}
      {children}
    </span>
  );
}

export function AppointmentStatusBadge({
  status,
  size = 'md',
  withDot = true,
}: {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
  withDot?: boolean;
}) {
  const meta = APPOINTMENT_STATUS_META[status];
  return (
    <Badge className={meta.badge} dotClassName={withDot ? meta.dot : undefined} size={size}>
      {meta.label}
    </Badge>
  );
}

export function CustomerStatusBadge({ status, size = 'md' }: { status: CustomerStatus; size?: 'sm' | 'md' }) {
  const meta = CUSTOMER_STATUS_META[status];
  return (
    <Badge className={meta.badge} dotClassName={meta.dot} size={size}>
      {meta.label}
    </Badge>
  );
}

export function BarberStatusBadge({ status, size = 'md' }: { status: BarberStatus; size?: 'sm' | 'md' }) {
  const meta = BARBER_STATUS_META[status];
  return (
    <Badge className={meta.badge} dotClassName={meta.dot} size={size}>
      {meta.label}
    </Badge>
  );
}
