import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { cn } from '@/utils/cn';

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Renders a back link above the title. */
  backTo?: { to: string; label: string };
  className?: string;
}

export function PageHeader({ title, description, actions, backTo, className }: PageHeaderProps) {
  return (
    <header className={cn('mb-6', className)}>
      {backTo && (
        <Link
          to={backTo.to}
          className="mb-3 inline-flex items-center gap-1 text-[13px] font-medium text-ink-500 transition-colors hover:text-ink-900 dark:text-ink-400 dark:hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          {backTo.label}
        </Link>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold text-ink-900 sm:text-2xl dark:text-white">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </header>
  );
}
