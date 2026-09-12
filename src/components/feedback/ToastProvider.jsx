import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'

const DEFAULT_DURATION = 4500
const ToastContext = createContext(null)

const TOAST_ICONS = {
  error: AlertCircle,
  info: Info,
  success: CheckCircle2,
}

function normalizeToast(input, fallbackType, options = {}) {
  if (typeof input === 'string') {
    return {
      ...options,
      message: input,
      type: fallbackType || options.type || 'info',
    }
  }

  return {
    ...input,
    type: input?.type || fallbackType || 'info',
  }
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const nextIdRef = useRef(0)
  const timersRef = useRef(new Map())

  const dismissToast = useCallback((toastId) => {
    const timer = timersRef.current.get(toastId)
    if (timer) {
      window.clearTimeout(timer)
      timersRef.current.delete(toastId)
    }

    setToasts((currentToasts) =>
      currentToasts.filter((toast) => toast.id !== toastId),
    )
  }, [])

  const showToast = useCallback(
    (input) => {
      const toast = normalizeToast(input)
      if (!toast.message) {
        return null
      }

      const id = `toast-${++nextIdRef.current}`
      const duration = toast.duration ?? DEFAULT_DURATION
      const nextToast = { ...toast, id, duration }

      setToasts((currentToasts) => [...currentToasts, nextToast])

      if (duration > 0) {
        const timer = window.setTimeout(() => {
          timersRef.current.delete(id)
          setToasts((currentToasts) =>
            currentToasts.filter((currentToast) => currentToast.id !== id),
          )
        }, duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [],
  )

  const success = useCallback(
    (message, options) =>
      showToast(normalizeToast(message, 'success', options)),
    [showToast],
  )
  const error = useCallback(
    (message, options) => showToast(normalizeToast(message, 'error', options)),
    [showToast],
  )
  const info = useCallback(
    (message, options) => showToast(normalizeToast(message, 'info', options)),
    [showToast],
  )

  useEffect(
    () => () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer))
      timersRef.current.clear()
    },
    [],
  )

  const contextValue = useMemo(
    () => ({ dismissToast, error, info, showToast, success }),
    [dismissToast, error, info, showToast, success],
  )

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div
        className="toast-region"
        aria-live="polite"
        aria-relevant="additions text"
      >
        {toasts.map((toast) => {
          const Icon = TOAST_ICONS[toast.type] || Info
          const isError = toast.type === 'error'

          return (
            <div
              key={toast.id}
              className={`toast toast--${toast.type}`}
              role={isError ? 'alert' : 'status'}
            >
              <Icon className="toast__icon" size={20} aria-hidden="true" />
              <div className="toast__content">
                {toast.title ? (
                  <p className="toast__title">{toast.title}</p>
                ) : null}
                <p className="toast__message">{toast.message}</p>
              </div>
              <button
                type="button"
                className="toast__close"
                aria-label="Fechar notificação"
                onClick={() => dismissToast(toast.id)}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// Contexto e hook convivem aqui para manter a API pública do provider em um arquivo.
// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider.')
  }

  return context
}
