import { useId, useRef } from 'react'
import { Button } from './Button.jsx'
import { Modal } from './Modal.jsx'

export function ConfirmDialog({
  cancelLabel = 'Cancelar',
  confirmLabel = 'Confirmar',
  description,
  error,
  isLoading = false,
  onClose,
  onConfirm,
  open,
  title,
  variant = 'danger',
}) {
  const cancelButtonRef = useRef(null)
  const generatedDescriptionId = useId()
  const descriptionId = description
    ? `confirm-description-${generatedDescriptionId.replaceAll(':', '')}`
    : undefined
  const errorId = error
    ? `confirm-error-${generatedDescriptionId.replaceAll(':', '')}`
    : undefined

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="small"
      initialFocusRef={cancelButtonRef}
      descriptionId={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
      closeDisabled={isLoading}
    >
      {description ? (
        <p id={descriptionId} className="confirm-dialog__description">
          {description}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="confirm-dialog__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="confirm-dialog__actions">
        <Button
          ref={cancelButtonRef}
          variant="secondary"
          onClick={onClose}
          disabled={isLoading}
        >
          {cancelLabel}
        </Button>
        <Button
          variant={variant}
          onClick={onConfirm}
          isLoading={isLoading}
          loadingLabel={`${confirmLabel}…`}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
