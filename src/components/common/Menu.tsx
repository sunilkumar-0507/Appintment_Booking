import { useState } from 'react';
import type { ReactNode } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useClickOutside } from '@/hooks/useClickOutside';

export interface MenuItem {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  destructive?: boolean;
  disabled?: boolean;
  /** Renders a divider above this item. */
  separated?: boolean;
}

export interface MenuProps {
  items: MenuItem[];
  trigger?: ReactNode;
  align?: 'left' | 'right';
  className?: string;
  buttonLabel?: string;
}

/** Lightweight dropdown used for row actions across every table and card. */
export function Menu({ items, trigger, align = 'right', className, buttonLabel = 'Open menu' }: MenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useClickOutside<HTMLDivElement>(() => setOpen(false), open);

  const visible = items.filter((item) => !item.disabled);
  if (visible.length === 0) return null;

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={buttonLabel}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'inline-flex items-center justify-center rounded-lg transition-colors',
          trigger
            ? ''
            : 'h-8 w-8 text-ink-400 hover:bg-ink-100 hover:text-ink-800 dark:hover:bg-white/10 dark:hover:text-white',
          open && !trigger && 'bg-ink-100 text-ink-800 dark:bg-white/10 dark:text-white',
        )}
      >
        {trigger ?? <MoreHorizontal className="h-4 w-4" />}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-1.5 min-w-[10.5rem] animate-scale-in overflow-hidden rounded-xl p-1',
            'border border-ink-200/70 bg-[rgb(var(--surface-card))] shadow-float dark:border-white/10',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
          )}
        >
          {visible.map((item, index) => (
            <div key={item.label}>
              {item.separated && index > 0 && (
                <div className="my-1 h-px bg-ink-200/70 dark:bg-white/[0.07]" aria-hidden />
              )}
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setOpen(false);
                  item.onClick();
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium transition-colors',
                  item.destructive
                    ? 'text-danger-600 hover:bg-danger-50 dark:text-danger-500 dark:hover:bg-danger-500/10'
                    : 'text-ink-700 hover:bg-ink-100 dark:text-ink-200 dark:hover:bg-white/[0.08]',
                )}
              >
                {item.icon && <span className="shrink-0 opacity-70">{item.icon}</span>}
                {item.label}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
