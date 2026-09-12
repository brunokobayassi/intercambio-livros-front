import { ArrowLeftRight, BookOpen, LibraryBig } from 'lucide-react'
import { NavLink } from 'react-router-dom'

const MOBILE_ITEMS = [
  { Icon: LibraryBig, label: 'Catálogo', to: '/livros' },
  { Icon: BookOpen, label: 'Meus livros', to: '/meus-livros' },
  { Icon: ArrowLeftRight, label: 'Trocas', to: '/trocas', showsPendingCount: true },
]

function formatPendingCount(value) {
  const count = Number(value)

  if (!Number.isFinite(count) || count <= 0) {
    return null
  }

  return count > 99 ? '99+' : String(Math.trunc(count))
}

function getNavigationClassName({ isActive }) {
  return `mobile-navigation__link${isActive ? ' is-active' : ''}`
}

/**
 * Bottom navigation used below the desktop breakpoint.
 *
 * @param {Object} props
 * @param {number} [props.pendingCount=0]
 */
export function MobileNavigation({ pendingCount = 0 }) {
  const pendingCountLabel = formatPendingCount(pendingCount)

  return (
    <nav aria-label="Navegação móvel" className="mobile-navigation">
      <div className="mobile-navigation__inner">
        {MOBILE_ITEMS.map(({ Icon, label, showsPendingCount, to }) => (
          <NavLink className={getNavigationClassName} end key={to} to={to}>
            <span className="mobile-navigation__icon-wrap">
              <Icon aria-hidden="true" className="mobile-navigation__icon" size={21} />
              {showsPendingCount && pendingCountLabel && (
                <span
                  aria-label={`${pendingCountLabel} propostas pendentes`}
                  className="mobile-navigation__pending-count"
                >
                  {pendingCountLabel}
                </span>
              )}
            </span>
            <span className="mobile-navigation__label">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
