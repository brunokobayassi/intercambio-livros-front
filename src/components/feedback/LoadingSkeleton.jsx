function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

export function LoadingSkeleton({
  className = '',
  count = 3,
  label = 'Carregando conteúdo',
  variant = 'card',
}) {
  const itemCount = Math.max(1, Math.floor(Number(count) || 1))

  return (
    <div
      className={joinClassNames(
        'loading-skeleton',
        `loading-skeleton--${variant}`,
        className,
      )}
      role="status"
    >
      <span className="sr-only">{label}</span>
      <div className="loading-skeleton__items" aria-hidden="true">
        {Array.from({ length: itemCount }, (_, index) => (
          <div className="loading-skeleton__item" key={index}>
            <span className="loading-skeleton__media" />
            <span className="loading-skeleton__line loading-skeleton__line--primary" />
            <span className="loading-skeleton__line loading-skeleton__line--secondary" />
            <span className="loading-skeleton__line loading-skeleton__line--short" />
          </div>
        ))}
      </div>
    </div>
  )
}
