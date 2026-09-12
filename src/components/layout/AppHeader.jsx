import { LogOut } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { getInitials } from '../../features/books/book-utils.js'
import { BrandLogo } from './BrandLogo.jsx'

const NAVIGATION_ITEMS = [
  { label: 'Catálogo', to: '/livros' },
  { label: 'Meus livros', to: '/meus-livros' },
  { label: 'Trocas', to: '/trocas', showsPendingCount: true },
]

function formatPendingCount(value) {
  const count = Number(value)

  if (!Number.isFinite(count) || count <= 0) {
    return null
  }

  return count > 99 ? '99+' : String(Math.trunc(count))
}

function getNavigationClassName({ isActive }) {
  return `app-header__nav-link${isActive ? ' is-active' : ''}`
}

/**
 * Desktop application header. Its central navigation is hidden by the mobile
 * breakpoint in CSS and is replaced by MobileNavigation.
 *
 * @param {Object} props
 * @param {{nome?: string, email?: string} | null} [props.user]
 * @param {number} [props.pendingCount=0]
 * @param {() => void} [props.onLogout]
 */
export function AppHeader({ user = null, pendingCount = 0, onLogout }) {
  const pendingCountLabel = formatPendingCount(pendingCount)
  const userName = typeof user?.nome === 'string' ? user.nome.trim() : ''

  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link aria-label="Ir para o catálogo" className="app-header__brand" to="/livros">
          <BrandLogo compact decorative className="app-header__brand-mark" />
          <span className="app-header__brand-name">Intercâmbio de Livros</span>
        </Link>

        <nav aria-label="Navegação principal" className="app-header__navigation">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              className={getNavigationClassName}
              end
              key={item.to}
              to={item.to}
            >
              <span>{item.label}</span>
              {item.showsPendingCount && pendingCountLabel && (
                <span
                  aria-label={`${pendingCountLabel} propostas pendentes`}
                  className="app-header__pending-count"
                >
                  {pendingCountLabel}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="app-header__account">
          {userName && (
            <div className="app-header__user" title={userName}>
              <span aria-hidden="true" className="app-header__avatar">
                {getInitials(userName)}
              </span>
              <span className="app-header__user-name">{userName}</span>
            </div>
          )}

          {typeof onLogout === 'function' && (
            <button className="app-header__logout" onClick={onLogout} type="button">
              <LogOut aria-hidden="true" className="app-header__logout-icon" size={18} />
              <span>Sair</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
