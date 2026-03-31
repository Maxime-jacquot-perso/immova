import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../modules/auth/auth-context';
import { canAccessAdmin } from '../modules/admin/permissions';

export function RequireAdminAccess() {
  const { session } = useAuth();

  if (!canAccessAdmin(session)) {
    if (session?.organization) {
      return <Navigate replace to="/dashboard" />;
    }

    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
