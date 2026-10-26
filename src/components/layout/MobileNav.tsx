import { NavLink } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from '@/constants/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * Bottom tab bar shown below the `md` breakpoint. Carries the four primary
 * destinations plus a prominent "new appointment" action in the middle.
 */
export function MobileNav() {
  const { can } = useAuth();
  const items = NAV_ITEMS.filter((item) => item.primary && can(item.permission)).slice(0, 4);
  const canCreate = can('appointments.manage');

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-ink-200/70 bg-[rgb(var(--surface-card))]/95 backdrop-blur-xl md:hidden dark:border-white/[0.07]"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch justify-around">
        {items.slice(0, 2).map((item) => (
          <MobileNavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}

        {canCreate && (
          <NavLink
            to="/appointments/new"
            aria-label="New appointment"
            className="flex flex-1 items-center justify-center py-2"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gold-400 text-ink-950 shadow-float transition-transform active:scale-95">
              <Plus className="h-5 w-5" />
            </span>
          </NavLink>
        )}

        {items.slice(2, 4).map((item) => (
          <MobileNavItem key={item.to} to={item.to} label={item.label} icon={item.icon} />
        ))}
      </div>
    </nav>
  );
}

function MobileNavItem({
  to,
  label,
  icon: Icon,
}: {
  to: string;
  label: string;
  icon: typeof Plus;
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
          isActive ? 'text-ink-900 dark:text-white' : 'text-ink-400 dark:text-ink-500',
        )
      }
    >
      {({ isActive }) => (
        <>
          <Icon className={cn('h-5 w-5', isActive && 'text-gold-500 dark:text-gold-400')} aria-hidden />
          <span className="truncate">{label}</span>
        </>
      )}
    </NavLink>
  );
}
