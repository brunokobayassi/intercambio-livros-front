import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BookOpen, Plus } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { useToast } from '../../components/feedback/ToastProvider'
import { booksApi, OwnBooksUnavailableError } from '../../services/books-api'
import { useAuth } from '../auth/useAuth'
import { BookCard } from './BookCard'
import { BookFormModal } from './BookFormModal'
import { bookKeys } from './book-query-keys'

function isOwnBooksUnavailable(error) {
  return error instanceof OwnBooksUnavailableError || error?.code === 'OWN_BOOKS_UNAVAILABLE'
}

export default function MyBooksPage() {
  const { token, user } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [form, setForm] = useState(() => ({
    open: Boolean(location.state?.openBookForm),
    book: null,
  }))
  const [formError, setFormError] = useState('')
  const [bookToDelete, setBookToDelete] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  const booksQuery = useQuery({
    queryKey: bookKeys.mine(user.id),
    queryFn: ({ signal }) => booksApi.listMyBooks(token, { signal }),
  })

  function refreshBooks() {
    queryClient.invalidateQueries({ queryKey: bookKeys.mine(user.id) })
    queryClient.invalidateQueries({ queryKey: bookKeys.all })
  }

  const saveMutation = useMutation({
    mutationFn: ({ book, payload }) => (
      book
        ? booksApi.updateBook(book.id, payload, token)
        : booksApi.createBook(payload, token)
    ),
    onSuccess: (response, variables) => {
      refreshBooks()
      setForm({ open: false, book: null })
      setFormError('')
      toast.success(
        response?.mensagem || (variables.book ? 'Livro atualizado com sucesso.' : 'Livro cadastrado com sucesso.'),
      )
    },
    onError: (error) => setFormError(error?.message || 'Não foi possível salvar o livro.'),
  })

  const deleteMutation = useMutation({
    mutationFn: (book) => booksApi.deleteBook(book.id, token),
    onSuccess: () => {
      refreshBooks()
      setBookToDelete(null)
      setDeleteError('')
      toast.success('Livro excluído com sucesso.')
    },
    onError: (error) => {
      const linked = error?.status === 409 || error?.status >= 500
      setDeleteError(
        linked
          ? 'Este livro está vinculado a uma troca e não pode ser excluído.'
          : error?.message || 'Não foi possível excluir o livro.',
      )
    },
  })

  function openNewBookForm() {
    setFormError('')
    setForm({ open: true, book: null })
    if (location.state?.openBookForm) {
      navigate('/meus-livros', { replace: true, state: null })
    }
  }

  function openEditForm(book) {
    setFormError('')
    setForm({ open: true, book })
  }

  const unavailable = booksQuery.isError && isOwnBooksUnavailable(booksQuery.error)

  return (
    <div className="page my-books-page">
      <header className="page-heading page-heading--actions">
        <div>
          <p className="eyebrow eyebrow--chip"><BookOpen /> Minha estante digital</p>
          <h1>Meus livros</h1>
          <p>Gerencie as histórias que você disponibilizou para a comunidade.</p>
        </div>
        <Button leftIcon={<Plus />} onClick={openNewBookForm} disabled={unavailable}>
          Adicionar livro
        </Button>
      </header>

      {booksQuery.isPending ? <LoadingSkeleton variant="my-books" count={3} /> : null}

      {unavailable ? (
        <ErrorState
          variant="unavailable"
          title="Meus livros ainda não estão disponíveis"
          description="A API precisa disponibilizar a consulta da sua estante antes que seja possível cadastrar, editar ou oferecer livros em troca."
        />
      ) : null}

      {booksQuery.isError && !unavailable ? (
        <ErrorState
          title="Não foi possível carregar seus livros"
          description={booksQuery.error?.message}
          onRetry={() => booksQuery.refetch()}
        />
      ) : null}

      {booksQuery.isSuccess && booksQuery.data.length === 0 ? (
        <EmptyState
          icon={<BookOpen />}
          eyebrow="Sua estante começa aqui"
          title="Você ainda não cadastrou nenhum livro"
          description="Compartilhe histórias com leitores da comunidade e encontre novas aventuras literárias."
          actionLabel="Cadastrar primeiro livro"
          onAction={openNewBookForm}
        />
      ) : null}

      {booksQuery.isSuccess && booksQuery.data.length > 0 ? (
        <section className="page-section" aria-labelledby="my-books-heading">
          <div className="section-heading">
            <h2 id="my-books-heading">Livros na sua estante</h2>
            <p className="result-count">{booksQuery.data.length} {booksQuery.data.length === 1 ? 'livro' : 'livros'}</p>
          </div>
          <div className="owned-book-grid">
            {booksQuery.data.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                variant="owned"
                onEdit={openEditForm}
                onDelete={(selectedBook) => {
                  setDeleteError('')
                  setBookToDelete(selectedBook)
                }}
              />
            ))}
          </div>
        </section>
      ) : null}

      {form.open ? (
        <BookFormModal
          key={form.book?.id ?? 'new-book'}
          open
          book={form.book}
          onClose={() => setForm({ open: false, book: null })}
          onSubmit={(payload) => saveMutation.mutateAsync({ book: form.book, payload })}
          isSubmitting={saveMutation.isPending}
          requestError={formError}
        />
      ) : null}

      <ConfirmDialog
        open={Boolean(bookToDelete)}
        onClose={() => {
          setBookToDelete(null)
          setDeleteError('')
        }}
        onConfirm={() => deleteMutation.mutate(bookToDelete)}
        title="Excluir livro?"
        description={bookToDelete ? `“${bookToDelete.titulo}” será removido da sua estante. Esta ação não pode ser desfeita.` : ''}
        confirmLabel="Excluir livro"
        variant="danger"
        isLoading={deleteMutation.isPending}
        error={deleteError}
      />
    </div>
  )
}
