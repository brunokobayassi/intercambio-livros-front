import { forwardRef, useId } from 'react'

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

function joinIds(...ids) {
  return ids.filter(Boolean).join(' ') || undefined
}

export const TextField = forwardRef(function TextField(
  {
    className = '',
    containerClassName = '',
    endAdornment,
    error,
    helperText,
    icon,
    id,
    label,
    required,
    ...inputProps
  },
  ref,
) {
  const generatedId = useId()
  const inputId = id || `field-${generatedId.replaceAll(':', '')}`
  const helperId = helperText ? `${inputId}-helper` : undefined
  const errorId = error ? `${inputId}-error` : undefined
  const describedBy = joinIds(
    inputProps['aria-describedby'],
    helperId,
    errorId,
  )

  return (
    <div
      className={joinClassNames(
        'text-field',
        error && 'text-field--error',
        inputProps.disabled && 'text-field--disabled',
        containerClassName,
      )}
    >
      {label ? (
        <label className="text-field__label" htmlFor={inputId}>
          {label}
          {required ? (
            <span className="text-field__required" aria-hidden="true">
              {' '}*
            </span>
          ) : null}
        </label>
      ) : null}

      <div className="text-field__control">
        {icon ? (
          <span className="text-field__icon" aria-hidden="true">
            {icon}
          </span>
        ) : null}

        <input
          {...inputProps}
          ref={ref}
          id={inputId}
          className={joinClassNames('text-field__input', className)}
          required={required}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : inputProps['aria-invalid']}
        />

        {endAdornment ? (
          <span className="text-field__end-adornment">{endAdornment}</span>
        ) : null}
      </div>

      {helperText ? (
        <p id={helperId} className="text-field__helper">
          {helperText}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="text-field__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
})
