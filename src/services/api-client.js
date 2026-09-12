const DEFAULT_API_BASE_URL = '/api'

/**
 * @typedef {Object} ApiRequestOptions
 * @property {string} [method='GET'] HTTP method.
 * @property {unknown} [body] Value serialized as JSON when supplied.
 * @property {string | null} [token] JWT used by protected requests.
 * @property {AbortSignal} [signal] Signal used to cancel the request.
 * @property {boolean} [protectedRequest=false] Whether a 401 must expire the session.
 * @property {HeadersInit} [headers] Additional request headers.
 */

/**
 * Error returned for HTTP, protocol, and connection failures.
 */
export class ApiError extends Error {
  /**
   * @param {string} message User-facing error message.
   * @param {Object} [details]
   * @param {number} [details.status=0] HTTP status, or zero for a network failure.
   * @param {unknown} [details.data=null] Parsed response body, when available.
   * @param {string} [details.code='API_ERROR'] Stable client-side error code.
   * @param {string} [details.url=''] Requested URL.
   * @param {string} [details.method='GET'] Requested HTTP method.
   * @param {unknown} [details.cause] Original error.
   */
  constructor(
    message,
    {
      status = 0,
      data = null,
      code = 'API_ERROR',
      url = '',
      method = 'GET',
      cause,
    } = {},
  ) {
    super(message, cause === undefined ? undefined : { cause })
    this.name = 'ApiError'
    this.status = status
    this.data = data
    this.code = code
    this.url = url
    this.method = method
  }
}

/** @type {null | ((error: ApiError) => void | Promise<void>)} */
let unauthorizedHandler = null

/**
 * Removes trailing slashes from an API base URL.
 *
 * An empty or invalid value intentionally falls back to `/api`, which activates
 * the Vite development proxy and avoids the backend's current CORS limitation.
 *
 * @param {unknown} value Candidate base URL.
 * @returns {string}
 */
export function normalizeApiBaseUrl(value) {
  const candidate = typeof value === 'string' ? value.trim() : ''
  const baseUrl = candidate || DEFAULT_API_BASE_URL

  if (baseUrl === '/') {
    return ''
  }

  return baseUrl.replace(/\/+$/, '')
}

/**
 * Uses the same-origin Vite proxy for the documented local backend during
 * development, even when `.env.example` was copied verbatim. Other configured
 * URLs remain untouched for deployments and alternate environments.
 *
 * @param {unknown} value
 * @param {boolean} [isDevelopment=false]
 * @returns {string}
 */
export function resolveApiBaseUrl(value, isDevelopment = false) {
  const normalized = normalizeApiBaseUrl(value)
  const documentedLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1):8080\/intercambio-livros\/api$/i

  if (isDevelopment && documentedLocalApi.test(normalized)) {
    return DEFAULT_API_BASE_URL
  }

  return normalized
}

export const API_BASE_URL = resolveApiBaseUrl(
  import.meta.env?.VITE_API_BASE_URL,
  import.meta.env?.MODE === 'development',
)

/**
 * Builds an API URL while preventing duplicate separators.
 *
 * @param {string} path API path, with or without a leading slash.
 * @param {string} [baseUrl=API_BASE_URL] Base URL, injectable for tests.
 * @returns {string}
 */
export function buildApiUrl(path, baseUrl = API_BASE_URL) {
  const normalizedBaseUrl = normalizeApiBaseUrl(baseUrl)
  const normalizedPath = String(path ?? '').replace(/^\/+/, '')

  if (!normalizedPath) {
    return normalizedBaseUrl || '/'
  }

  return `${normalizedBaseUrl}/${normalizedPath}`
}

/**
 * Registers the callback used when a protected request receives a 401.
 * The returned function only removes the handler installed by this call.
 *
 * @param {null | ((error: ApiError) => void | Promise<void>)} handler
 * @returns {() => void}
 */
export function setUnauthorizedHandler(handler) {
  if (handler !== null && typeof handler !== 'function') {
    throw new TypeError('O tratador de sessão expirada deve ser uma função.')
  }

  unauthorizedHandler = handler

  return () => {
    if (unauthorizedHandler === handler) {
      unauthorizedHandler = null
    }
  }
}

/**
 * @param {Response} response
 * @returns {Promise<{data: unknown, isJson: boolean}>}
 */
async function readResponse(response) {
  if (response.status === 204) {
    return { data: null, isJson: true }
  }

  const text = await response.text()

  if (!text.trim()) {
    return { data: null, isJson: true }
  }

  try {
    return { data: JSON.parse(text), isJson: true }
  } catch {
    return { data: null, isJson: false }
  }
}

/**
 * @param {unknown} data
 * @returns {string | null}
 */
function getApiMessage(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return null
  }

  if (typeof data.erro === 'string' && data.erro.trim()) {
    return data.erro.trim()
  }

  if (typeof data.mensagem === 'string' && data.mensagem.trim()) {
    return data.mensagem.trim()
  }

  return null
}

/**
 * @param {number} status
 * @returns {string}
 */
function getFallbackHttpMessage(status) {
  if (status === 400) {
    return 'Não foi possível processar os dados enviados.'
  }

  if (status === 401) {
    return 'Sua sessão não é válida. Entre novamente.'
  }

  if (status === 403) {
    return 'Você não tem permissão para realizar esta ação.'
  }

  if (status === 404) {
    return 'O recurso solicitado não foi encontrado.'
  }

  if (status === 405) {
    return 'Esta operação ainda não está disponível.'
  }

  if (status >= 500) {
    return 'O servidor não conseguiu concluir a solicitação. Tente novamente.'
  }

  return 'Não foi possível concluir a solicitação. Tente novamente.'
}

/**
 * Executes a request against the configured REST API.
 *
 * Successful JSON payloads are returned as-is. A 204 response resolves to
 * `null`. Error payloads shaped as `{ erro: string }` become `ApiError`s, and a
 * protected 401 invokes the registered session-expiration handler.
 *
 * @template T
 * @param {string} path API path.
 * @param {ApiRequestOptions} [options]
 * @returns {Promise<T | null>}
 * @throws {ApiError}
 */
export async function apiRequest(
  path,
  {
    method = 'GET',
    body,
    token = null,
    signal,
    protectedRequest = false,
    headers: customHeaders,
  } = {},
) {
  const url = buildApiUrl(path)
  const normalizedMethod = method.toUpperCase()
  const headers = new Headers(customHeaders)
  const hasBody = body !== undefined

  headers.set('Accept', 'application/json')

  if (hasBody) {
    headers.set('Content-Type', 'application/json')
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  /** @type {Response} */
  let response

  try {
    response = await fetch(url, {
      method: normalizedMethod,
      headers,
      body: hasBody ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
      throw error
    }

    throw new ApiError(
      'Não foi possível conectar à API. Verifique sua conexão e tente novamente.',
      {
        status: 0,
        code: 'NETWORK_ERROR',
        url,
        method: normalizedMethod,
        cause: error,
      },
    )
  }

  const { data, isJson } = await readResponse(response)
  const apiMessage = getApiMessage(data)

  if (!response.ok || apiMessage && typeof data === 'object' && 'erro' in data) {
    const error = new ApiError(
      apiMessage || getFallbackHttpMessage(response.status),
      {
        status: response.status,
        data,
        code: isJson ? 'HTTP_ERROR' : 'INVALID_RESPONSE',
        url,
        method: normalizedMethod,
      },
    )

    if (response.status === 401 && protectedRequest && unauthorizedHandler) {
      try {
        await unauthorizedHandler(error)
      } catch {
        // Session cleanup must never replace the original request error.
      }
    }

    throw error
  }

  if (!isJson) {
    throw new ApiError('A API retornou uma resposta inválida. Tente novamente.', {
      status: response.status,
      code: 'INVALID_RESPONSE',
      url,
      method: normalizedMethod,
    })
  }

  return /** @type {T | null} */ (data)
}

export default apiRequest
