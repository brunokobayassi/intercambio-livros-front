import { ApiError, apiRequest } from './api-client.js'

/**
 * @typedef {Object} LoginCredentials
 * @property {string} email
 * @property {string} senha
 */

/**
 * @typedef {Object} AuthUser
 * @property {number} id
 * @property {string} nome
 * @property {string} email
 */

/**
 * @typedef {Object} AuthSession
 * @property {string} token
 * @property {AuthUser} user
 */

/**
 * @typedef {Object} LoginApiResponse
 * @property {string} token
 * @property {number} id
 * @property {string} nome
 * @property {string} email
 */

/**
 * Authenticates a user and normalizes the API response into a session object.
 * Login is intentionally public, so its 401 response is shown as a credential
 * error and does not invoke the global session-expiration callback.
 *
 * @param {LoginCredentials} credentials
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<AuthSession>}
 */
export async function login(credentials, { signal } = {}) {
  const email = typeof credentials?.email === 'string'
    ? credentials.email.trim()
    : credentials?.email
  const senha = credentials?.senha

  const response = await apiRequest('/login', {
    method: 'POST',
    body: { email, senha },
    signal,
  })

  if (
    !response
    || typeof response !== 'object'
    || typeof response.token !== 'string'
    || !response.token.trim()
    || !Number.isInteger(response.id)
    || typeof response.nome !== 'string'
    || !response.nome.trim()
    || typeof response.email !== 'string'
    || !response.email.trim()
  ) {
    throw new ApiError('A API retornou uma sessão inválida. Tente entrar novamente.', {
      status: 200,
      data: response,
      code: 'INVALID_AUTH_RESPONSE',
      method: 'POST',
    })
  }

  return {
    token: response.token,
    user: {
      id: response.id,
      nome: response.nome,
      email: response.email,
    },
  }
}

export const authApi = { login }
