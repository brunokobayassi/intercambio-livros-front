import { Navigate, Outlet } from 'react-router-dom'

import { useAuth } from './useAuth.js'

/**
 * Keeps authenticated users out of public-only routes such as login.
 *
 * @param {{children?: import('react').ReactNode}} props
 */
export function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth()

  if (isAuthenticated) {
    return <Navigate to="/livros" replace />
  }

  return children ?? <Outlet />
}

export default PublicOnlyRoute

