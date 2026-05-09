import { Navigate } from 'react-router-dom';
import type { ReactElement } from 'react';

interface ProtectedRouteProps {
  children: ReactElement;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
}
