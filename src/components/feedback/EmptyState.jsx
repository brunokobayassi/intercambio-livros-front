import { useId } from 'react'
import { Button } from '../ui/Button.jsx'

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

export function EmptyState({
  action,
  actionLabel,
  className = '',
  description,
  eyebrow,
  icon,
  onAction,
  title,
}) {
  const generatedTitleId = useId()
  const titleId = `empty-state-title-${generatedTitleId.replaceAll(':', '')}`

  return (
    <section
      className={joinClassNames('empty-state', className)}
      aria-labelledby={titleId}
    >
      {icon ? (
        <div className="empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      ) : null}
      {eyebrow ? <p className="empty-state__eyebrow">{eyebrow}</p> : null}
      <h2 id={titleId} className="empty-state__title">
        {title}
      </h2>
      {description ? (
        <p className="empty-state__description">{description}</p>
      ) : null}
      {action || (actionLabel && onAction) ? (
        <div className="empty-state__action">
          {action || (
            <Button variant="secondary" onClick={onAction}>
              {actionLabel}
            </Button>
          )}
        </div>
      ) : null}
    </section>
  )
}
