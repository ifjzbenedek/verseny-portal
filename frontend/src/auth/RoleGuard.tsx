import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import type { Role } from '@/shared/types/api';
import { useAuth } from './AuthContext';

interface Props {
  allow: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function RoleGuard({ allow, children, fallback }: Props) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!allow.includes(user.role)) {
    return fallback ? <>{fallback}</> : <Navigate to="/" replace />;
  }
  return <>{children}</>;
}
