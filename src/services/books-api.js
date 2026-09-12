import { ApiError, apiRequest } from './api-client.js'

/**
 * @typedef {Object} Book
 * @property {number} id
 * @property {string} titulo
 * @property {string} autor
 * @property {number} usuarioId
 * @property {string} [nomeDono]
 */

/**
 * @typedef {Object} BookInput
 * @property {string} titulo
 * @property {string} autor
 */

/**
 * @typedef {Object} RequestOptions
 * @property {AbortSignal} [signal]
 */

/**
 * @typedef {Object} ConfirmationResponse
 * @property {string} mensagem
 */

export const OWN_BOOKS_UNAVAILABLE_MESSAGE =
  'Seus livros estão temporariamente indisponíveis porque a API ainda não oferece esta consulta.'

/**
 * Explicit error used while `GET /livros/me` is missing from the backend.
 */
export class OwnBooksUnavailableError extends ApiError {
  /** @param {ApiError} cause */
  constructor(cause) {
    super(OWN_BOOKS_UNAVAILABLE_MESSAGE, {
      status: cause.status,
      data: cause.data,
      code: 'OWN_BOOKS_UNAVAILABLE',
      url: cause.url,
      method: cause.method,
      cause,
    })
    this.name = 'OwnBooksUnavailableError'
  }
}

/**
 * @param {unknown} error
 * @returns {error is OwnBooksUnavailableError}
 */
export function isOwnBooksUnavailableError(error) {
  return error instanceof OwnBooksUnavailableError
    || error?.code === 'OWN_BOOKS_UNAVAILABLE'
}

/**
 * Keeps book mutations aligned with the API contract and database limits by
 * sending only trimmed `titulo` and `autor` fields.
 *
 * @param {BookInput} input
 * @returns {BookInput}
 */
export function normalizeBookInput(input) {
  return {
    titulo: typeof input?.titulo === 'string' ? input.titulo.trim() : input?.titulo,
    autor: typeof input?.autor === 'string' ? input.autor.trim() : input?.autor,
  }
}

/**
 * @param {unknown} value
 * @param {string} message
 * @returns {asserts value is Book[]}
 */
function assertBookList(value, message) {
  if (!Array.isArray(value)) {
    throw new ApiError(message, {
      status: 200,
      data: value,
      code: 'INVALID_RESPONSE',
    })
  }
}

/**
 * Lists books owned by other users.
 *
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<Book[]>}
 */
export async function listBooks(token, { signal } = {}) {
  const books = await apiRequest('/livros', {
    token,
    signal,
    protectedRequest: true,
  })

  assertBookList(books, 'A API retornou uma lista de livros inválida.')
  return books
}

/**
 * Gets one book by id.
 *
 * @param {number | string} id
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<Book>}
 */
export async function getBook(id, token, { signal } = {}) {
  return apiRequest(`/livros/${encodeURIComponent(id)}`, {
    token,
    signal,
    protectedRequest: true,
  })
}

/**
 * Lists books owned by the authenticated user.
 *
 * The current backend maps `/livros/me` as a numeric id and answers 400. A
 * future implementation may initially answer 404 or 405, so all three statuses
 * are converted to a stable, explicit availability error for the UI.
 *
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<Book[]>}
 * @throws {OwnBooksUnavailableError}
 */
export async function listMyBooks(token, { signal } = {}) {
  try {
    const books = await apiRequest('/livros/me', {
      token,
      signal,
      protectedRequest: true,
    })

    assertBookList(books, 'A API retornou uma lista de livros inválida.')
    return books
  } catch (error) {
    if (error instanceof ApiError && [400, 404, 405, 501].includes(error.status)) {
      throw new OwnBooksUnavailableError(error)
    }

    throw error
  }
}

/**
 * Creates a book owned by the authenticated user.
 *
 * @param {BookInput} input
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<ConfirmationResponse>}
 */
export function createBook(input, token, { signal } = {}) {
  return apiRequest('/livros', {
    method: 'POST',
    body: normalizeBookInput(input),
    token,
    signal,
    protectedRequest: true,
  })
}

/**
 * Updates the title and author of a book owned by the authenticated user.
 *
 * @param {number | string} id
 * @param {BookInput} input
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<ConfirmationResponse>}
 */
export function updateBook(id, input, token, { signal } = {}) {
  return apiRequest(`/livros/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: normalizeBookInput(input),
    token,
    signal,
    protectedRequest: true,
  })
}

/**
 * Deletes a book owned by the authenticated user. A successful 204 resolves to
 * `null` and must not be parsed as JSON.
 *
 * @param {number | string} id
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<null>}
 */
export function deleteBook(id, token, { signal } = {}) {
  return apiRequest(`/livros/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    token,
    signal,
    protectedRequest: true,
  })
}

export const booksApi = {
  listBooks,
  getBook,
  listMyBooks,
  createBook,
  updateBook,
  deleteBook,
}
