import { useContext } from 'react'

import { AuthContext } from './AuthContext.jsx'

/**
 * Returns the current authentication state and actions.
 *
 * @returns {import('./AuthContext.jsx').AuthContextValue}
 */
export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.')
  }

  return context
}

export default useAuth

