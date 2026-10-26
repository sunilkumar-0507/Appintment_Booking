import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Permission } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { AppBootLoader } from '@/components/common/Loading';

/** Blocks the dashboard until a session exists, remembering where to return to. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialising } = useAuth();
  const location = useLocation();

  if (initialising) return <AppBootLoader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return <>{children}</>;
}

/** Keeps signed-in users out of the auth pages. */
export function RedirectIfAuthenticated({ children }: { children: ReactNode }) {
  const { isAuthenticated, initialising } = useAuth();

  if (initialising) return <AppBootLoader />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

/**
 * Route-level permission check. A role that cannot see a page is sent to the
 * dashboard rather than shown an empty screen.
 */
export function RequirePermission({
  permission,
  children,
}: {
  permission: Permission;
  children: ReactNode;
}) {
  const { can } = useAuth();
  if (!can(permission)) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}
