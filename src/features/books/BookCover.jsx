import { getBookVisual } from './book-utils.js'

const COVER_SIZES = new Set([
  'card',
  'shelf',
  'thumbnail',
  'compact',
  'details',
  'preview',
  'exchange',
  'option',
])

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

/**
 * Deterministic CSS book cover. It never loads artwork from an external URL.
 *
 * @param {Object} props
 * @param {{id?: number|string, titulo?: string, autor?: string}} props.book
 * @param {'card'|'shelf'|'thumbnail'|'compact'|'details'|'preview'|'exchange'|'option'} [props.size='card']
 * @param {string} [props.className='']
 */
export function BookCover({ book, size = 'card', className = '' }) {
  const visual = getBookVisual(book)
  const normalizedSize = COVER_SIZES.has(size) ? size : 'card'
  const title = typeof book?.titulo === 'string' ? book.titulo.trim() : ''
  const author = typeof book?.autor === 'string' ? book.autor.trim() : ''
  const accessibleLabel = author
    ? `Capa gráfica de ${title || 'livro'}, de ${author}`
    : `Capa gráfica de ${title || 'livro'}`

  return (
    <div
      aria-label={accessibleLabel}
      className={joinClassNames(
        'book-cover',
        `book-cover--${normalizedSize}`,
        `book-cover--motif-${visual.motif}`,
        className,
      )}
      role="img"
      style={{
        '--book-cover-accent': visual.accent,
        '--book-cover-from': visual.from,
        '--book-cover-to': visual.to,
        '--book-cover-via': visual.via,
        backgroundImage: `linear-gradient(135deg, ${visual.from}, ${visual.via} 52%, ${visual.to})`,
      }}
    >
      <span aria-hidden="true" className="book-cover__spine" />
      <span aria-hidden="true" className="book-cover__motif book-cover__motif--primary" />
      <span aria-hidden="true" className="book-cover__motif book-cover__motif--secondary" />
      <span className="book-cover__content">
        <strong className="book-cover__title">{title || 'Livro'}</strong>
        {author && <span className="book-cover__author">{author}</span>}
      </span>
    </div>
  )
}
