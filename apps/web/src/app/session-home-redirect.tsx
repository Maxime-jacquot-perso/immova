import { Navigate } from 'react-router-dom';
import { useAuth } from '../modules/auth/auth-context';
import { canAccessAdmin } from '../modules/admin/permissions';

export function SessionHomeRedirect() {
  const { session } = useAuth();

  if (session?.organization) {
    return <Navigate replace to="/dashboard" />;
  }

  if (canAccessAdmin(session)) {
    return <Navigate replace to="/admin" />;
  }

  return <Navigate replace to="/login" />;
}
