import { Navigate } from 'react-router-dom';

export default function ProtectedRoute({ role, allowedRoles, fallbackPath = '/access', children }) {
  if (!role) {
    console.log('[ProtectedRoute] No role found. Redirecting to access.');
    return <Navigate to={fallbackPath} replace />;
  }

  if (allowedRoles?.length && !allowedRoles.includes(role)) {
    console.log(`[ProtectedRoute] Blocked role "${role}" for route. Redirecting to ${fallbackPath}.`);
    return <Navigate to={fallbackPath} replace />;
  }

  return children;
}