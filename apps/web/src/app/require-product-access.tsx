import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../modules/auth/auth-context';
import { canAccessAdmin } from '../modules/admin/permissions';

export function RequireProductAccess() {
  const { session } = useAuth();

  if (!session?.organization) {
    if (canAccessAdmin(session)) {
      return <Navigate replace to="/admin" />;
    }

    return <Navigate replace to="/login" />;
  }

  return <Outlet />;
}
