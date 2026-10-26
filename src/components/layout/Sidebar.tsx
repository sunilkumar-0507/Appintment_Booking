import { NavLink, useNavigate } from 'react-router-dom';
import { ChevronsLeft, HelpCircle, LogOut, PanelLeft } from 'lucide-react';
import { cn } from '@/utils/cn';
import { NAV_ITEMS } from '@/constants/navigation';
import { ROLE_LABELS } from '@/constants/permissions';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Avatar } from '@/components/common/Avatar';
import { Logo } from './Logo';

export interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Mobile slide-out state. */
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ collapsed, onToggleCollapsed, mobileOpen, onCloseMobile }: SidebarProps) {
  const { user, logout, can } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const items = NAV_ITEMS.filter((item) => can(item.permission));

  const handleLogout = async () => {
    await logout();
    toast.info('Signed out', { description: 'You have been signed out of BarberFlow.' });
    navigate('/login', { replace: true });
  };

  return (
    <>
      {/* Mobile scrim */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 animate-fade-in bg-ink-950/50 backdrop-blur-[2px] lg:hidden"
          onClick={onCloseMobile}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-[rgb(var(--surface-card))]',
          'border-ink-200/70 transition-[width,transform] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          'dark:border-white/[0.07]',
          collapsed ? 'w-[76px]' : 'w-[264px]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        {/* Brand */}
        <div
          className={cn(
            'flex h-16 shrink-0 items-center border-b border-ink-200/70 dark:border-white/[0.07]',
            collapsed ? 'justify-center px-3' : 'justify-between px-5',
          )}
        >
          <NavLink to="/dashboard" onClick={onCloseMobile} aria-label="BarberFlow home">
            <Logo showWordmark={!collapsed} />
          </NavLink>
          {!collapsed && (
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Collapse sidebar"
              className="hidden rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800 lg:block dark:hover:bg-white/10 dark:hover:text-white"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            className="mx-auto mt-3 hidden rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-800 lg:block dark:hover:bg-white/10 dark:hover:text-white"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={onCloseMobile}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-ink-900 text-white shadow-card dark:bg-white/[0.10] dark:text-white'
                      : 'text-ink-600 hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn('h-[18px] w-[18px] shrink-0', isActive && 'text-gold-400')}
                      aria-hidden
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-1 border-t border-ink-200/70 p-3 dark:border-white/[0.07]">
          <NavLink
            to="/settings"
            onClick={onCloseMobile}
            title={collapsed ? 'Help & Support' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-ink-600 transition-colors',
              'hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/[0.06] dark:hover:text-white',
              collapsed && 'justify-center px-0',
            )}
          >
            <HelpCircle className="h-[18px] w-[18px] shrink-0" aria-hidden />
            {!collapsed && <span>Help &amp; Support</span>}
          </NavLink>

          <div
            className={cn(
              'mt-2 flex items-center gap-3 rounded-xl p-2',
              'surface-muted',
              collapsed && 'justify-center bg-transparent p-0',
            )}
          >
            <Avatar name={user?.name ?? 'User'} src={user?.avatarUrl} size="sm" />
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-semibold text-ink-900 dark:text-white">
                    {user?.name}
                  </p>
                  <p className="truncate text-[11px] text-ink-500 dark:text-ink-400">
                    {user ? ROLE_LABELS[user.role] : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  aria-label="Log out"
                  title="Log out"
                  className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white hover:text-danger-600 dark:hover:bg-white/10"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          {collapsed && (
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-danger-600 dark:hover:bg-white/[0.06]"
            >
              <LogOut className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </aside>
    </>
  );
}
