export const TOKEN_STORAGE_KEY = 'intercambio_token'
export const USER_STORAGE_KEY = 'intercambio_usuario'

/**
 * @typedef {Object} SessionUser
 * @property {number} id
 * @property {string} nome
 * @property {string} email
 */

/**
 * @typedef {Object} Session
 * @property {string} token
 * @property {SessionUser} user
 */

/**
 * @param {Storage | null | undefined} storage
 * @returns {Storage | null}
 */
function resolveStorage(storage) {
  if (storage !== undefined) {
    return storage
  }

  if (typeof window === 'undefined') {
    return null
  }

  try {
    return window.localStorage
  } catch {
    return null
  }
}

/**
 * Checks only the profile fields supplied by the login API. The JWT is never
 * decoded to reconstruct missing profile data.
 *
 * @param {unknown} value
 * @returns {value is SessionUser}
 */
export function isValidSessionUser(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Number.isInteger(value.id)
    && value.id > 0
    && typeof value.nome === 'string'
    && value.nome.trim()
    && typeof value.email === 'string'
    && value.email.trim(),
  )
}

/**
 * @param {unknown} value
 * @returns {value is Session}
 */
export function isValidSession(value) {
  return Boolean(
    value
    && typeof value === 'object'
    && typeof value.token === 'string'
    && value.token.trim()
    && isValidSessionUser(value.user),
  )
}

/**
 * Removes all persisted private session data.
 *
 * @param {Storage | null} [storage]
 */
export function clearSession(storage) {
  const target = resolveStorage(storage)

  if (!target) {
    return
  }

  try {
    target.removeItem(TOKEN_STORAGE_KEY)
  } catch {
    // Storage can be disabled by browser privacy settings.
  }

  try {
    target.removeItem(USER_STORAGE_KEY)
  } catch {
    // Keep cleanup best-effort even if one key cannot be removed.
  }
}

/**
 * Restores a structurally valid session. Missing, partial, or corrupt values
 * cause both private keys to be removed.
 *
 * @param {Storage | null} [storage]
 * @returns {Session | null}
 */
export function loadSession(storage) {
  const target = resolveStorage(storage)

  if (!target) {
    return null
  }

  try {
    const token = target.getItem(TOKEN_STORAGE_KEY)
    const serializedUser = target.getItem(USER_STORAGE_KEY)

    if (!token || !token.trim() || !serializedUser) {
      clearSession(target)
      return null
    }

    const user = JSON.parse(serializedUser)
    const session = { token, user }

    if (!isValidSession(session)) {
      clearSession(target)
      return null
    }

    return {
      token,
      user: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
    }
  } catch {
    clearSession(target)
    return null
  }
}

/**
 * Persists only the JWT and the public `id`, `nome`, and `email` profile fields.
 *
 * @param {Session} session
 * @param {Storage | null} [storage]
 * @returns {Session} Canonical session stored by the application.
 */
export function saveSession(session, storage) {
  if (!isValidSession(session)) {
    throw new TypeError('Não foi possível salvar uma sessão inválida.')
  }

  const canonicalSession = {
    token: session.token,
    user: {
      id: session.user.id,
      nome: session.user.nome,
      email: session.user.email,
    },
  }
  const target = resolveStorage(storage)

  if (!target) {
    return canonicalSession
  }

  try {
    target.setItem(TOKEN_STORAGE_KEY, canonicalSession.token)
    target.setItem(USER_STORAGE_KEY, JSON.stringify(canonicalSession.user))
  } catch (error) {
    clearSession(target)
    throw new Error('Não foi possível manter sua sessão neste navegador.', {
      cause: error,
    })
  }

  return canonicalSession
}

