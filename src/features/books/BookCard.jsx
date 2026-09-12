import { ArrowLeftRight, Eye, Pencil, Trash2 } from 'lucide-react'
import { BookCover } from './BookCover.jsx'
import { getInitials } from './book-utils.js'

function joinClassNames(...classNames) {
  return classNames.filter(Boolean).join(' ')
}

/**
 * Shared catalog/owned-book card. Only fields supplied by the API are shown.
 *
 * @param {Object} props
 * @param {{id?: number|string, titulo?: string, autor?: string, nomeDono?: string}} props.book
 * @param {(book: Object) => void} [props.onPropose]
 * @param {(book: Object) => void} [props.onDetails]
 * @param {boolean} [props.owned=false]
 * @param {'catalog'|'owned'} [props.variant] Compatibility alias for `owned`.
 * @param {(book: Object) => void} [props.onEdit]
 * @param {(book: Object) => void} [props.onDelete]
 * @param {string} [props.className='']
 */
export function BookCard({
  book,
  onPropose,
  onDetails,
  owned = false,
  variant,
  onEdit,
  onDelete,
  className = '',
}) {
  const isOwned = owned || variant === 'owned'
  const title = typeof book?.titulo === 'string' ? book.titulo.trim() : ''
  const author = typeof book?.autor === 'string' ? book.autor.trim() : ''
  const ownerName = typeof book?.nomeDono === 'string' ? book.nomeDono.trim() : ''

  return (
    <article
      className={joinClassNames(
        'book-card',
        isOwned ? 'book-card--owned' : 'book-card--catalog',
        className,
      )}
    >
      <BookCover book={book} size={isOwned ? 'shelf' : 'card'} />

      <div className="book-card__body">
        <div className="book-card__metadata">
          <h2 className="book-card__title">{title || 'Livro'}</h2>
          {author && <p className="book-card__author">{author}</p>}
        </div>

        {!isOwned && ownerName && (
          <div className="book-card__owner">
            <span aria-hidden="true" className="book-card__owner-avatar">
              {getInitials(ownerName)}
            </span>
            <span className="book-card__owner-label">
              Disponibilizado por <strong>{ownerName}</strong>
            </span>
          </div>
        )}

        {isOwned ? (
          <div className="book-card__actions book-card__actions--owned">
            <button
              className="book-card__action book-card__action--edit"
              onClick={() => onEdit?.(book)}
              type="button"
            >
              <Pencil aria-hidden="true" size={18} />
              <span>Editar</span>
            </button>
            <button
              aria-label={title ? `Excluir ${title}` : 'Excluir livro'}
              className="book-card__action book-card__action--delete"
              onClick={() => onDelete?.(book)}
              type="button"
            >
              <Trash2 aria-hidden="true" size={18} />
              <span>Excluir</span>
            </button>
          </div>
        ) : (
          <div className="book-card__actions book-card__actions--catalog">
            <button
              className="book-card__action book-card__action--primary"
              onClick={() => onPropose?.(book)}
              type="button"
            >
              <ArrowLeftRight aria-hidden="true" size={18} />
              <span>Propor troca</span>
            </button>
            <button
              className="book-card__action book-card__action--details"
              onClick={() => onDetails?.(book)}
              type="button"
            >
              <Eye aria-hidden="true" size={17} />
              <span>Ver detalhes</span>
            </button>
          </div>
        )}
      </div>
    </article>
  )
}
