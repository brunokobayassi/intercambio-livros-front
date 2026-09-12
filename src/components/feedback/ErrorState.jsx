import { useId } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '../ui/Button.jsx'

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

export function ErrorState({
  className = '',
  description,
  message,
  onRetry,
  retryLabel = 'Tentar novamente',
  title = 'Não foi possível carregar o conteúdo',
  variant = 'default',
}) {
  const generatedTitleId = useId()
  const titleId = `error-state-title-${generatedTitleId.replaceAll(':', '')}`
  const detail = description || message

  return (
    <section
      className={joinClassNames(
        'error-state',
        `error-state--${variant}`,
        className,
      )}
      role="alert"
      aria-labelledby={titleId}
    >
      <AlertCircle className="error-state__icon" size={28} aria-hidden="true" />
      <h2 id={titleId} className="error-state__title">
        {title}
      </h2>
      {detail ? <p className="error-state__description">{detail}</p> : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </section>
  )
}
