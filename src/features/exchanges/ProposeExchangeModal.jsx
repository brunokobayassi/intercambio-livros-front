import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowDownUp, BookOpen, Check, Send, UserRound } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton'
import { useToast } from '../../components/feedback/ToastProvider'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { booksApi, OwnBooksUnavailableError } from '../../services/books-api'
import { exchangesApi } from '../../services/exchanges-api'
import { useAuth } from '../auth/useAuth'
import { BookCover } from '../books/BookCover'
import { bookKeys } from '../books/book-query-keys'
import { getInitials } from '../books/book-utils'
import { exchangeKeys } from './exchange-query-keys'

function isUnavailable(error) {
  return error instanceof OwnBooksUnavailableError || error?.code === 'OWN_BOOKS_UNAVAILABLE'
}

export function ProposeExchangeModal({ open, desiredBook, onClose }) {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [selectedBookId, setSelectedBookId] = useState(null)
  const [requestError, setRequestError] = useState('')

  const ownBooksQuery = useQuery({
    queryKey: bookKeys.mine(user.id),
    queryFn: ({ signal }) => booksApi.listMyBooks(token, { signal }),
    enabled: open,
  })

  const proposalMutation = useMutation({
    mutationFn: () => exchangesApi.createExchange({
      livroOferecidoId: selectedBookId,
      livroRecebidoId: desiredBook.id,
    }, token),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: exchangeKeys.all(user.id) })
      setRequestError('')
      onClose()
      toast.success(response?.mensagem || 'Proposta enviada com sucesso.')
    },
    onError: (error) => setRequestError(error?.message || 'Não foi possível enviar a proposta.'),
  })

  const selectedBook = ownBooksQuery.data?.find((book) => book.id === selectedBookId)

  function goToMyBooks() {
    onClose()
    navigate('/meus-livros', { state: { openBookForm: true } })
  }

  function handleSubmit(event) {
    event.preventDefault()
    if (!selectedBookId || proposalMutation.isPending) return
    proposalMutation.mutate()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      closeDisabled={proposalMutation.isPending}
      title="Propor uma troca"
      size="large"
    >
      <form className="proposal-form" onSubmit={handleSubmit}>
        <p className="eyebrow">Intercâmbio direto</p>

        <section className="proposal-section" aria-labelledby="desired-book-title">
          <div className="proposal-section__heading">
            <h3 id="desired-book-title">Você recebe</h3>
            <span className="soft-badge"><BookOpen /> Livro desejado</span>
          </div>
          <div className="desired-book">
            <BookCover book={desiredBook} size="exchange" />
            <div>
              <h4>{desiredBook.titulo}</h4>
              <p>{desiredBook.autor}</p>
              <div className="owner-row owner-row--compact">
                <span className="avatar" aria-hidden="true">{getInitials(desiredBook.nomeDono)}</span>
                <span><UserRound aria-hidden="true" /> Proprietário: <strong>{desiredBook.nomeDono}</strong></span>
              </div>
            </div>
          </div>
        </section>

        <div className="exchange-divider" aria-hidden="true"><span><ArrowDownUp /></span></div>

        <section className="proposal-section" aria-labelledby="offered-book-title">
          <div className="proposal-section__heading proposal-section__heading--stacked">
            <h3 id="offered-book-title">Você oferece</h3>
            <p>Selecione exatamente um dos seus livros.</p>
          </div>

          {ownBooksQuery.isPending ? <LoadingSkeleton variant="options" count={3} /> : null}

          {ownBooksQuery.isError && isUnavailable(ownBooksQuery.error) ? (
            <ErrorState
              variant="unavailable"
              title="Sua estante ainda não está disponível"
              description="A API precisa liberar a consulta dos seus livros antes que você possa oferecer um deles."
            />
          ) : null}

          {ownBooksQuery.isError && !isUnavailable(ownBooksQuery.error) ? (
            <ErrorState
              title="Não foi possível carregar seus livros"
              description={ownBooksQuery.error?.message}
              onRetry={() => ownBooksQuery.refetch()}
            />
          ) : null}

          {ownBooksQuery.isSuccess && ownBooksQuery.data.length === 0 ? (
            <EmptyState
              icon={<BookOpen />}
              title="Cadastre um livro para oferecer"
              description="Você precisa ter pelo menos um livro na sua estante para propor uma troca."
              actionLabel="Adicionar livro"
              onAction={goToMyBooks}
            />
          ) : null}

          {ownBooksQuery.isSuccess && ownBooksQuery.data.length > 0 ? (
            <fieldset className="book-options">
              <legend className="sr-only">Livro oferecido</legend>
              {ownBooksQuery.data.map((book) => {
                const selected = selectedBookId === book.id
                return (
                  <label className={`book-option${selected ? ' book-option--selected' : ''}`} key={book.id}>
                    <input
                      type="radio"
                      name="offered-book"
                      value={book.id}
                      checked={selected}
                      onChange={() => {
                        setSelectedBookId(book.id)
                        setRequestError('')
                      }}
                    />
                    <BookCover book={book} size="option" />
                    <span className="book-option__copy">
                      <strong>{book.titulo}</strong>
                      <small>{book.autor}</small>
                    </span>
                    <span className="book-option__indicator" aria-hidden="true">
                      {selected ? <Check /> : null}
                    </span>
                  </label>
                )
              })}
            </fieldset>
          ) : null}
        </section>

        {selectedBook ? (
          <div className="proposal-summary" aria-live="polite">
            <p>Resumo da troca</p>
            <div>
              <span><small>Você oferece</small><strong>{selectedBook.titulo}</strong></span>
              <ArrowDownUp aria-hidden="true" />
              <span><small>Você recebe</small><strong>{desiredBook.titulo}</strong></span>
            </div>
          </div>
        ) : null}

        {requestError ? <p className="inline-error" role="alert">{requestError}</p> : null}

        <div className="modal-actions proposal-actions">
          <Button type="button" variant="ghost" onClick={onClose} disabled={proposalMutation.isPending}>
            Cancelar
          </Button>
          <Button
            type="submit"
            leftIcon={<Send />}
            disabled={!selectedBookId || proposalMutation.isPending}
            isLoading={proposalMutation.isPending}
          >
            {proposalMutation.isPending ? 'Enviando…' : 'Enviar proposta'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
