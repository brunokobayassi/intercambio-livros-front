import { Circle, CircleCheck, CircleX, Clock3 } from 'lucide-react'
import { getStatusMeta } from './exchange-utils.js'

const STATUS_ICONS = {
  accepted: CircleCheck,
  declined: CircleX,
  neutral: Circle,
  pending: Clock3,
}

/**
 * Semantic badge for exchange statuses returned by the API.
 *
 * @param {Object} props
 * @param {unknown} props.status
 * @param {string} [props.className='']
 */
export function StatusBadge({ status, className = '' }) {
  const { label, normalized, tone } = getStatusMeta(status)
  const Icon = STATUS_ICONS[tone]
  const classes = ['status-badge', `status-badge--${tone}`, className]
    .filter(Boolean)
    .join(' ')

  return (
    <span
      aria-label={`Status da troca: ${label}`}
      className={classes}
      data-status={normalized || undefined}
    >
      <Icon aria-hidden="true" className="status-badge__icon" size={14} />
      <span className="status-badge__label">{label}</span>
    </span>
  )
}
