import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../modules/auth/auth-context';

export function RequireAuth() {
  const { session, isReady } = useAuth();
  const location = useLocation();

  if (!isReady) {
    return null;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
