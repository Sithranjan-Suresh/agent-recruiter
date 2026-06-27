import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function AuthGuard({ role, children }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }
  if (role && user.role !== role) {
    return <Navigate to="/login" replace />;
  }
  return children;
}
