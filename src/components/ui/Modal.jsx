import { useCallback, useEffect, useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

function isAvailableForFocus(element) {
  return (
    !element.hidden &&
    !element.matches(':disabled') &&
    element.getAttribute('aria-hidden') !== 'true' &&
    element.getAttribute('inert') === null
  )
}

function getFocusableElements(container) {
  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    isAvailableForFocus,
  )
}

function getPreferredFocusTarget(dialog, initialFocusRef) {
  const initialFocus = initialFocusRef?.current
  if (
    initialFocus &&
    dialog.contains(initialFocus) &&
    isAvailableForFocus(initialFocus)
  ) {
    return initialFocus
  }

  if (
    dialog.contains(document.activeElement)
    && document.activeElement !== dialog
  ) {
    return document.activeElement
  }

  const autofocusElement = dialog.querySelector(
    '[autofocus], [data-autofocus="true"]',
  ) || Array.from(dialog.querySelectorAll('input, select, textarea, button'))
    .find((element) => element.autofocus)
  if (autofocusElement && isAvailableForFocus(autofocusElement)) {
    return autofocusElement
  }

  return getFocusableElements(dialog)[0] || dialog
}

export function Modal({
  children,
  closeDisabled = false,
  closeLabel = 'Fechar',
  closeOnBackdrop = true,
  closeOnEscape = true,
  descriptionId,
  initialFocusRef,
  onClose,
  open,
  showCloseButton = true,
  size = 'medium',
  title,
  titleId,
}) {
  const generatedTitleId = useId()
  const resolvedTitleId = titleId || `modal-title-${generatedTitleId.replaceAll(':', '')}`
  const dialogRef = useRef(null)
  const previouslyFocusedRef = useRef(null)

  useLayoutEffect(() => {
    if (!open) {
      return undefined
    }

    previouslyFocusedRef.current = document.activeElement
    const dialog = dialogRef.current
    const focusTarget = dialog
      ? getPreferredFocusTarget(dialog, initialFocusRef)
      : null

    function keepFocusInside(event) {
      if (!dialog?.contains(event.target)) {
        getPreferredFocusTarget(dialog, initialFocusRef).focus({
          preventScroll: true,
        })
      }
    }

    focusTarget?.focus({ preventScroll: true })
    document.addEventListener('focusin', keepFocusInside)

    return () => {
      document.removeEventListener('focusin', keepFocusInside)
      const previousElement = previouslyFocusedRef.current

      if (previousElement?.isConnected && typeof previousElement.focus === 'function') {
        previousElement.focus({ preventScroll: true })
      }
    }
  }, [initialFocusRef, open])

  const requestClose = useCallback(
    (event) => {
      if (!closeDisabled) {
        onClose?.(event)
      }
    },
    [closeDisabled, onClose],
  )

  const handleKeyDown = useCallback(
    (event) => {
      if (event.key === 'Escape') {
        if (closeOnEscape && !closeDisabled) {
          event.preventDefault()
          event.stopPropagation()
          requestClose(event)
        }
        return
      }

      if (event.key !== 'Tab') {
        return
      }

      const dialog = dialogRef.current
      if (!dialog) {
        return
      }

      const focusableElements = getFocusableElements(dialog)

      if (focusableElements.length === 0) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const firstElement = focusableElements[0]
      const lastElement = focusableElements.at(-1)
      const activeElement = document.activeElement

      if (event.shiftKey) {
        if (activeElement === firstElement || !dialog.contains(activeElement)) {
          event.preventDefault()
          lastElement.focus()
        }
      } else if (
        activeElement === lastElement ||
        !dialog.contains(activeElement)
      ) {
        event.preventDefault()
        firstElement.focus()
      }
    },
    [closeDisabled, closeOnEscape, requestClose],
  )

  const handleBackdropClick = useCallback(
    (event) => {
      if (event.target === event.currentTarget && closeOnBackdrop) {
        requestClose(event)
      }
    },
    [closeOnBackdrop, requestClose],
  )

  useEffect(() => {
    if (!open) {
      return undefined
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown, open])

  if (!open) {
    return null
  }

  return createPortal(
    <div
      className="modal-backdrop"
      data-testid="modal-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        className={`modal modal--${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
        aria-describedby={descriptionId}
        tabIndex={-1}
      >
        <div className="modal__header">
          <h2 id={resolvedTitleId} className="modal__title">
            {title}
          </h2>

          {showCloseButton ? (
            <button
              type="button"
              className="modal__close"
              aria-label={closeLabel}
              disabled={closeDisabled}
              onClick={requestClose}
            >
              <X size={22} aria-hidden="true" />
            </button>
          ) : null}
        </div>

        <div className="modal__content">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
