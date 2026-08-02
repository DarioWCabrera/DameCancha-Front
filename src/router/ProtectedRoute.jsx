import { Navigate, Outlet } from 'react-router-dom';

/**
 * Wrapper component that ensures the user matches the auth condition.
 * - `isAllowed`: A boolean expression defining if the user can access this route.
 * - `redirectTo`: The path to redirect the user to if they are not allowed.
 */
export const RequireAuth = ({ isAllowed, redirectTo = '/' }) => {
  if (!isAllowed) {
    return <Navigate to={redirectTo} replace />;
  }
  return <Outlet />;
};
