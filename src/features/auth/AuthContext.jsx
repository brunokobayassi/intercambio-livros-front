import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'

import { setUnauthorizedHandler } from '../../services/api-client.js'
import { login as requestLogin } from '../../services/auth-api.js'
import { clearSession, loadSession, saveSession } from './session.js'

export const SESSION_EXPIRED_MESSAGE =
  'Sua sessão expirou. Entre novamente para continuar.'

/**
 * @typedef {import('./session.js').SessionUser} SessionUser
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {SessionUser | null} user
 * @property {string | null} token
 * @property {boolean} isAuthenticated
 * @property {(credentials: {email: string, senha: string}, options?: {signal?: AbortSignal}) => Promise<SessionUser>} login
 * @property {() => void} logout
 */

// Context and provider intentionally share this domain module.
// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext(undefined)

/**
 * Restores and owns the authenticated session for the application.
 * This provider must be rendered inside the router so expired sessions can be
 * redirected with navigation state for the login notice.
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.children
 * @param {{clear?: () => void}} [props.queryClient] TanStack Query client.
 */
export function AuthProvider({ children, queryClient }) {
  const navigate = useNavigate()
  const activeQueryClient = useQueryClient(queryClient)
  const [session, setSession] = useState(() => loadSession())

  const clearPrivateState = useCallback(() => {
    clearSession()
    setSession(null)
    activeQueryClient.clear()
  }, [activeQueryClient])

  const handleUnauthorized = useCallback(() => {
    clearPrivateState()
    navigate('/login', {
      replace: true,
      state: {
        sessionExpired: true,
        message: SESSION_EXPIRED_MESSAGE,
      },
    })
  }, [clearPrivateState, navigate])

  useEffect(() => setUnauthorizedHandler(handleUnauthorized), [handleUnauthorized])

  const login = useCallback(async (credentials, options = {}) => {
    const nextSession = await requestLogin(credentials, options)
    const storedSession = saveSession(nextSession)

    // Prevent cached private data from a previous user leaking into this login.
    activeQueryClient.clear()
    setSession(storedSession)

    return storedSession.user
  }, [activeQueryClient])

  const logout = useCallback(() => {
    clearPrivateState()
    navigate('/login', { replace: true })
  }, [clearPrivateState, navigate])

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: Boolean(session),
      login,
      logout,
    }),
    [login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
