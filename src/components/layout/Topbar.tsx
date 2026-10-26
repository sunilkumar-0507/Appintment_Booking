import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, Menu as MenuIcon, Moon, Plus, Search, Sun } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { useClickOutside } from '@/hooks/useClickOutside';
import { Avatar } from '@/components/common/Avatar';
import { Button } from '@/components/common/Button';
import { ROLE_LABELS } from '@/constants/permissions';

/** Demo notification feed — a real deployment would stream these from the API. */
const NOTIFICATIONS = [
  { id: 'n1', title: 'Appointment confirmed', body: 'James Wilson — Classic Haircut at 10:00 AM', time: '4m ago', unread: true },
  { id: 'n2', title: 'New customer registered', body: 'Jack Morgan booked online for the first time', time: '32m ago', unread: true },
  { id: 'n3', title: 'Appointment reminder scheduled', body: '18 reminders queued for tomorrow morning', time: '1h ago', unread: true },
  { id: 'n4', title: 'Appointment cancelled', body: 'Emma Davis cancelled her 3:30 PM Kids Cut', time: '3h ago', unread: false },
];

export interface TopbarProps {
  onOpenMobileNav: () => void;
  onOpenSearch: () => void;
}

export function Topbar({ onOpenMobileNav, onOpenSearch }: TopbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { user, can } = useAuth();
  const navigate = useNavigate();

  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [seen, setSeen] = useState(false);
  const notificationsRef = useClickOutside<HTMLDivElement>(
    () => setNotificationsOpen(false),
    notificationsOpen,
  );

  const unreadCount = seen ? 0 : NOTIFICATIONS.filter((entry) => entry.unread).length;

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-ink-200/70 bg-[rgb(var(--surface-page))]/85 px-4 backdrop-blur-xl sm:px-6 dark:border-white/[0.07]">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation"
        className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-100 lg:hidden dark:text-ink-300 dark:hover:bg-white/10"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {/* Search — expands to a full field on desktop, an icon on mobile */}
      <button
        type="button"
        onClick={onOpenSearch}
        className={cn(
          'group hidden h-10 w-full max-w-xs items-center gap-2.5 rounded-xl border px-3 text-sm transition-colors md:flex',
          'border-ink-200 bg-[rgb(var(--surface-card))] text-ink-400 hover:border-ink-300',
          'dark:border-white/10 dark:hover:border-white/20',
        )}
      >
        <Search className="h-4 w-4" aria-hidden />
        <span className="flex-1 text-left">Search appointments, customers…</span>
        <kbd className="hidden rounded border border-ink-200 px-1.5 py-0.5 font-sans text-[10px] font-medium text-ink-400 lg:inline dark:border-white/10">
          /
        </kbd>
      </button>

      <button
        type="button"
        onClick={onOpenSearch}
        aria-label="Search"
        className="rounded-lg p-2 text-ink-600 transition-colors hover:bg-ink-100 md:hidden dark:text-ink-300 dark:hover:bg-white/10"
      >
        <Search className="h-5 w-5" />
      </button>

      <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
        {can('appointments.manage') && (
          <Button
            size="sm"
            variant="accent"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => navigate('/appointments/new')}
            className="hidden sm:inline-flex"
          >
            New Appointment
          </Button>
        )}

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          className="rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
        >
          {theme === 'dark' ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>

        {/* Notifications */}
        <div ref={notificationsRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotificationsOpen((value) => !value);
              setSeen(true);
            }}
            aria-label="Notifications"
            aria-expanded={notificationsOpen}
            className="relative rounded-lg p-2 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900 dark:text-ink-400 dark:hover:bg-white/10 dark:hover:text-white"
          >
            <Bell className="h-[18px] w-[18px]" />
            {unreadCount > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 text-[10px] font-bold text-ink-950">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 z-40 mt-2 w-[min(20rem,calc(100vw-2rem))] animate-scale-in origin-top-right overflow-hidden rounded-2xl border border-ink-200/70 bg-[rgb(var(--surface-card))] shadow-float dark:border-white/10">
              <div className="flex items-center justify-between border-b border-ink-200/70 px-4 py-3 dark:border-white/[0.07]">
                <p className="text-sm font-semibold text-ink-900 dark:text-white">Notifications</p>
                <span className="inline-flex items-center gap-1 text-[11px] font-medium text-success-600">
                  <Check className="h-3 w-3" /> All read
                </span>
              </div>
              <ul className="max-h-80 divide-y divide-ink-200/70 overflow-y-auto dark:divide-white/[0.07]">
                {NOTIFICATIONS.map((entry) => (
                  <li key={entry.id} className="px-4 py-3 transition-colors hover:bg-ink-50 dark:hover:bg-white/[0.04]">
                    <p className="text-[13px] font-semibold text-ink-900 dark:text-white">{entry.title}</p>
                    <p className="mt-0.5 text-[13px] text-ink-500 dark:text-ink-400">{entry.body}</p>
                    <p className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">{entry.time}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <Link
          to="/settings"
          className="ml-1 flex items-center gap-2.5 rounded-xl p-1 pr-2 transition-colors hover:bg-ink-100 dark:hover:bg-white/[0.06]"
        >
          <Avatar name={user?.name ?? 'User'} src={user?.avatarUrl} size="sm" />
          <span className="hidden min-w-0 text-left xl:block">
            <span className="block truncate text-[13px] font-semibold leading-tight text-ink-900 dark:text-white">
              {user?.name}
            </span>
            <span className="block truncate text-[11px] leading-tight text-ink-500 dark:text-ink-400">
              {user ? ROLE_LABELS[user.role] : ''}
            </span>
          </span>
        </Link>
      </div>
    </header>
  );
}
