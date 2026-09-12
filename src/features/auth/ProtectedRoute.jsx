import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from './useAuth.js'

/**
 * Guards authenticated routes and preserves the attempted location for a
 * possible post-login redirect.
 *
 * @param {{children?: import('react').ReactNode}} props
 */
export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    )
  }

  return children ?? <Outlet />
}

export default ProtectedRoute

