import { Outlet } from 'react-router-dom'
import { AppHeader } from './AppHeader.jsx'
import { MobileNavigation } from './MobileNavigation.jsx'

/**
 * Shared authenticated layout.
 *
 * `children` is supported for isolated rendering and tests. Route usage falls
 * back to React Router's Outlet.
 *
 * @param {Object} props
 * @param {{nome?: string, email?: string} | null} [props.user]
 * @param {number} [props.pendingCount=0]
 * @param {() => void} [props.onLogout]
 * @param {import('react').ReactNode} [props.children]
 */
export function AppShell({
  user = null,
  pendingCount = 0,
  onLogout,
  children,
}) {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Pular para o conteúdo
      </a>
      <AppHeader
        onLogout={onLogout}
        pendingCount={pendingCount}
        user={user}
      />
      <main className="app-shell__main" id="main-content" tabIndex="-1">
        {children ?? <Outlet />}
      </main>
      <MobileNavigation pendingCount={pendingCount} />
    </div>
  )
}
