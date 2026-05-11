import { Navigate } from 'react-router-dom';
import { ReactNode } from 'react';
import { useAuth, Role } from './AuthContext';

interface Props {
  children: ReactNode;
  roles?: Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return <>{children}</>;
}
