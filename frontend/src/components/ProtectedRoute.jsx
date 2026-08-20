import { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

/**
 * allowedRoles: array of role strings that can access the route.
 * Defaults to ['admin'] to match existing behaviour.
 * Pass ['admin', 'volunteer'] for volunteer-accessible pages.
 */
const ProtectedRoute = ({ children, allowedRoles = ['admin'] }) => {
  const { isAuthenticated, role } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(role)) {
    // Authenticated but wrong role — send them to the right place
    if (role === 'volunteer') return <Navigate to="/volunteer/scan" replace />;
    return <Navigate to="/admin" replace />;
  }

  return children;
};

export default ProtectedRoute;
