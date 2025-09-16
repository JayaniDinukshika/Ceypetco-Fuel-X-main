import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function RequireRole({ allowed = [], children }) {
  const { user } = useAuth();
  const role = user?.role?.toLowerCase?.();
  const ok = allowed.map(r => String(r).toLowerCase()).includes(role);

  if (!ok) return <Navigate to="/not-authorized" replace />;
  return children;
}
