/**
 * @typedef {Object} BookLike
 * @property {number | string} [id]
 * @property {string} [titulo]
 * @property {string} [autor]
 * @property {string} [nomeDono]
 */

export const BOOK_VISUALS = Object.freeze([
  Object.freeze({ from: '#0d9488', via: '#14b8a6', to: '#f43f5e', accent: '#ccfbf1', motif: 'orbit' }),
  Object.freeze({ from: '#3b0764', via: '#7e22ce', to: '#f59e0b', accent: '#fde68a', motif: 'sun' }),
  Object.freeze({ from: '#241442', via: '#431f77', to: '#e11d48', accent: '#fda4af', motif: 'dots' }),
  Object.freeze({ from: '#fb7185', via: '#f43f5e', to: '#06b6d4', accent: '#cffafe', motif: 'waves' }),
  Object.freeze({ from: '#78350f', via: '#c2410c', to: '#f43f5e', accent: '#fde68a', motif: 'arches' }),
  Object.freeze({ from: '#d97706', via: '#eab308', to: '#0284c7', accent: '#fef3c7', motif: 'rays' }),
  Object.freeze({ from: '#4f46e5', via: '#9333ea', to: '#ec4899', accent: '#fbcfe8', motif: 'spark' }),
  Object.freeze({ from: '#0f172a', via: '#334155', to: '#f59e0b', accent: '#fde68a', motif: 'grid' }),
])

/**
 * Produces comparable text for client-side searches while retaining words and
 * whitespace boundaries.
 *
 * @param {unknown} value
 * @returns {string}
 */
export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Filters books by the API-backed title, author, or owner name.
 *
 * @param {BookLike[] | null | undefined} books
 * @param {unknown} term
 * @returns {BookLike[]}
 */
export function filterBooks(books, term) {
  const safeBooks = Array.isArray(books) ? books : []
  const query = normalizeSearchText(term)

  if (!query) {
    return safeBooks
  }

  return safeBooks.filter((book) =>
    [book?.titulo, book?.autor, book?.nomeDono].some((value) =>
      normalizeSearchText(value).includes(query),
    ),
  )
}

/**
 * Gets at most two initials from a person's first and last names.
 *
 * @param {unknown} value A name or an object containing `nome`.
 * @returns {string}
 */
export function getInitials(value) {
  const rawName = typeof value === 'string' ? value : value?.nome
  const parts = String(rawName ?? '').trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) {
    return '?'
  }

  const selectedParts = parts.length === 1 ? parts : [parts[0], parts.at(-1)]

  return selectedParts
    .map((part) => Array.from(part)[0] ?? '')
    .join('')
    .toLocaleUpperCase('pt-BR')
}

function hashString(value) {
  let hash = 2166136261

  for (const character of Array.from(value.normalize('NFC'))) {
    hash ^= character.codePointAt(0)
    hash = Math.imul(hash, 16777619)
  }

  return hash >>> 0
}

/**
 * Maps a book deterministically to one of the local graphical-cover palettes.
 * The id is preferred so edits to a title do not unexpectedly recolor a book.
 *
 * @param {BookLike | string | number | null | undefined} book
 * @returns {{index: number, from: string, via: string, to: string, accent: string, motif: string}}
 */
export function getBookVisual(book) {
  const isBookObject = book !== null && typeof book === 'object'
  const hasId = isBookObject && book.id !== null && book.id !== undefined
  const seed = hasId
    ? `id:${book.id}`
    : `title:${normalizeSearchText(isBookObject ? book.titulo : book)}`
  const index = hashString(seed) % BOOK_VISUALS.length

  return { index, ...BOOK_VISUALS[index] }
}
