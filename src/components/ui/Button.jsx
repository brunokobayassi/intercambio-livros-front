import { forwardRef } from 'react'

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

export const Button = forwardRef(function Button(
  {
    children,
    className = '',
    disabled = false,
    isLoading = false,
    leftIcon,
    loadingLabel = 'Carregando',
    rightIcon,
    size = 'medium',
    type = 'button',
    variant = 'primary',
    ...buttonProps
  },
  ref,
) {
  const accessibleLabel = isLoading
    ? loadingLabel
    : buttonProps['aria-label']

  return (
    <button
      {...buttonProps}
      ref={ref}
      type={type}
      className={joinClassNames(
        'button',
        `button--${variant}`,
        `button--${size}`,
        isLoading && 'button--loading',
        className,
      )}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      aria-label={accessibleLabel}
    >
      {isLoading ? (
        <span className="button__spinner" aria-hidden="true" />
      ) : null}

      <span
        className="button__content"
        aria-hidden={isLoading || undefined}
      >
        {leftIcon ? (
          <span className="button__icon" aria-hidden="true">
            {leftIcon}
          </span>
        ) : null}
        <span className="button__label">{children}</span>
        {rightIcon ? (
          <span className="button__icon button__icon--right" aria-hidden="true">
            {rightIcon}
          </span>
        ) : null}
      </span>
    </button>
  )
})
