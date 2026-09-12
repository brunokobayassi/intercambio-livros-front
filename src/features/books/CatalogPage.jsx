import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { BookOpen, Search, Sparkles } from 'lucide-react'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton'
import { SearchField } from '../../components/ui/SearchField'
import { booksApi } from '../../services/books-api'
import { useAuth } from '../auth/useAuth'
import { ProposeExchangeModal } from '../exchanges/ProposeExchangeModal'
import { BookCard } from './BookCard'
import { BookDetailsModal } from './BookDetailsModal'
import { bookKeys } from './book-query-keys'
import { filterBooks } from './book-utils'

export default function CatalogPage() {
  const { token } = useAuth()
  const [searchTerm, setSearchTerm] = useState('')
  const [detailsBook, setDetailsBook] = useState(null)
  const [proposalBook, setProposalBook] = useState(null)
  const booksQuery = useQuery({
    queryKey: bookKeys.all,
    queryFn: ({ signal }) => booksApi.listBooks(token, { signal }),
  })

  const filteredBooks = useMemo(
    () => filterBooks(booksQuery.data ?? [], searchTerm),
    [booksQuery.data, searchTerm],
  )

  function updateSearch(eventOrValue) {
    setSearchTerm(typeof eventOrValue === 'string' ? eventOrValue : eventOrValue.target.value)
  }

  function openProposal(book) {
    setDetailsBook(null)
    setProposalBook(book)
  }

  return (
    <div className="page catalog-page">
      <section className="catalog-hero" aria-labelledby="catalog-title">
        <div className="catalog-hero__glow" aria-hidden="true" />
        <p className="eyebrow eyebrow--chip"><Sparkles /> Comunidade ativa</p>
        <h1 id="catalog-title">Encontre sua próxima leitura</h1>
        <p>Todos os livros abaixo pertencem a outros leitores e estão prontos para inspirar uma nova troca.</p>
        <SearchField
          label="Buscar no catálogo"
          value={searchTerm}
          onChange={updateSearch}
          placeholder="Buscar por título, autor ou proprietário…"
        />
      </section>

      <section className="page-section" aria-labelledby="books-heading">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Descubra novas histórias</p>
            <h2 id="books-heading">Livros da comunidade</h2>
          </div>
          {!booksQuery.isPending && !booksQuery.isError ? (
            <p className="result-count" aria-live="polite">
              {filteredBooks.length} {filteredBooks.length === 1 ? 'livro encontrado' : 'livros encontrados'}
            </p>
          ) : null}
        </div>

        {booksQuery.isPending ? <LoadingSkeleton variant="books" count={8} /> : null}

        {booksQuery.isError ? (
          <ErrorState
            title="Não foi possível carregar o catálogo"
            description={booksQuery.error?.message}
            onRetry={() => booksQuery.refetch()}
          />
        ) : null}

        {booksQuery.isSuccess && booksQuery.data.length === 0 ? (
          <EmptyState
            icon={<BookOpen />}
            title="Nenhum livro disponível agora"
            description="Quando outros leitores cadastrarem livros, eles aparecerão aqui."
          />
        ) : null}

        {booksQuery.isSuccess && booksQuery.data.length > 0 && filteredBooks.length === 0 ? (
          <EmptyState
            icon={<Search />}
            title="Nenhum livro encontrado"
            description="Tente buscar por outras palavras ou limpe o campo de busca."
            actionLabel="Limpar busca"
            onAction={() => setSearchTerm('')}
          />
        ) : null}

        {filteredBooks.length > 0 ? (
          <div className="book-grid">
            {filteredBooks.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onPropose={openProposal}
                onDetails={setDetailsBook}
              />
            ))}
          </div>
        ) : null}
      </section>

      <BookDetailsModal
        book={detailsBook}
        open={Boolean(detailsBook)}
        onClose={() => setDetailsBook(null)}
        onPropose={openProposal}
      />

      {proposalBook ? (
        <ProposeExchangeModal
          open
          desiredBook={proposalBook}
          onClose={() => setProposalBook(null)}
        />
      ) : null}
    </div>
  )
}
