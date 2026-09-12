import { ArrowLeftRight, UserRound } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { booksApi } from '../../services/books-api'
import { useAuth } from '../auth/useAuth'
import { BookCover } from './BookCover'
import { bookKeys } from './book-query-keys'
import { getInitials } from './book-utils'

export function BookDetailsModal({ book = null, bookId, open, onClose, onPropose }) {
  const { token } = useAuth()
  const resolvedBookId = book?.id ?? bookId
  const detailsQuery = useQuery({
    queryKey: bookKeys.detail(resolvedBookId),
    queryFn: ({ signal }) => booksApi.getBook(resolvedBookId, token, { signal }),
    enabled: open && !book && resolvedBookId !== undefined && resolvedBookId !== null,
  })
  const resolvedBook = book ?? detailsQuery.data

  return (
    <Modal open={open} onClose={onClose} title="Detalhes do livro" size="medium">
      {detailsQuery.isPending && !book ? (
        <LoadingSkeleton variant="details" count={1} />
      ) : null}
      {detailsQuery.isError && !book ? (
        <ErrorState
          title="Não foi possível carregar este livro"
          description={detailsQuery.error?.message}
          onRetry={() => detailsQuery.refetch()}
        />
      ) : null}
      {resolvedBook ? <div className="book-details">
        <BookCover book={resolvedBook} size="details" />
        <div className="book-details__content">
          <p className="eyebrow">Livro da comunidade</p>
          <h2>{resolvedBook.titulo}</h2>
          <p className="book-details__author">{resolvedBook.autor}</p>
          <div className="owner-row">
            <span className="avatar avatar--medium" aria-hidden="true">
              {getInitials(resolvedBook.nomeDono)}
            </span>
            <span>
              <small>Disponibilizado por</small>
              <strong>{resolvedBook.nomeDono}</strong>
            </span>
          </div>
          <Button leftIcon={<ArrowLeftRight />} onClick={() => onPropose(resolvedBook)}>
            Propor troca
          </Button>
          <Button variant="ghost" leftIcon={<UserRound />} onClick={onClose}>
            Voltar ao catálogo
          </Button>
        </div>
      </div> : null}
    </Modal>
  )
}
