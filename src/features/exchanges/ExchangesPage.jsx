import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftRight, CheckCircle2, Inbox, Send, XCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EmptyState } from '../../components/feedback/EmptyState'
import { ErrorState } from '../../components/feedback/ErrorState'
import { LoadingSkeleton } from '../../components/feedback/LoadingSkeleton'
import { useToast } from '../../components/feedback/ToastProvider'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { exchangesApi } from '../../services/exchanges-api'
import { useAuth } from '../auth/useAuth'
import { getInitials } from '../books/book-utils'
import { exchangeKeys } from './exchange-query-keys'
import { StatusBadge } from './StatusBadge'

function ExchangePair({ offeredTitle, requestedTitle }) {
  return (
    <div className="exchange-pair">
      <div className="exchange-book exchange-book--offered">
        <small>Livro oferecido</small>
        <strong>{offeredTitle}</strong>
      </div>
      <span className="exchange-pair__icon" aria-hidden="true"><ArrowLeftRight /></span>
      <div className="exchange-book exchange-book--requested">
        <small>Livro solicitado</small>
        <strong>{requestedTitle}</strong>
      </div>
    </div>
  )
}

function ReceivedExchangeCard({ exchange, onRespond }) {
  return (
    <article className="exchange-card">
      <header className="exchange-card__header">
        <span className="avatar avatar--large" aria-hidden="true">{getInitials(exchange.nomeProponente)}</span>
        <span className="exchange-card__person">
          <small>Proposta enviada por</small>
          <strong>{exchange.nomeProponente}</strong>
        </span>
        <StatusBadge status={exchange.status} />
      </header>
      <ExchangePair
        offeredTitle={exchange.tituloLivroOferecido}
        requestedTitle={exchange.tituloLivroRecebido}
      />
      <footer className="exchange-card__actions">
        <Button variant="danger-ghost" leftIcon={<XCircle />} onClick={() => onRespond(exchange, 'recusar')}>
          Recusar
        </Button>
        <Button leftIcon={<CheckCircle2 />} onClick={() => onRespond(exchange, 'aceitar')}>
          Aceitar troca
        </Button>
      </footer>
    </article>
  )
}

function SentExchangeCard({ exchange }) {
  return (
    <article className="sent-exchange-card">
      <div className="sent-exchange-card__person">
        <span className="avatar avatar--large" aria-hidden="true">{getInitials(exchange.nomeSolicitado)}</span>
        <span><small>Proposta enviada para</small><strong>{exchange.nomeSolicitado}</strong></span>
      </div>
      <ExchangePair
        offeredTitle={exchange.tituloLivroOferecido}
        requestedTitle={exchange.tituloLivroRecebido}
      />
      <StatusBadge status={exchange.status} />
    </article>
  )
}

export default function ExchangesPage() {
  const { token, user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState('received')
  const [confirmation, setConfirmation] = useState(null)
  const [responseError, setResponseError] = useState('')

  const exchangesQuery = useQuery({
    queryKey: exchangeKeys.all(user.id),
    queryFn: ({ signal }) => exchangesApi.listExchanges(token, { signal }),
  })

  const responseMutation = useMutation({
    mutationFn: ({ exchange, action }) => exchangesApi.respondToExchange(exchange.id, action, token),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: exchangeKeys.all(user.id) })
      queryClient.invalidateQueries({ queryKey: ['livros'] })
      queryClient.invalidateQueries({ queryKey: ['meus-livros', user.id] })
      setConfirmation(null)
      setResponseError('')
      toast.success(response?.mensagem || (variables.action === 'aceitar' ? 'Troca aceita com sucesso.' : 'Proposta recusada.'))
    },
    onError: (error) => setResponseError(error?.message || 'Não foi possível responder à proposta.'),
  })

  const received = exchangesQuery.data?.pendentes ?? []
  const sent = exchangesQuery.data?.propostas ?? []
  const currentItems = activeTab === 'received' ? received : sent

  function requestResponse(exchange, action) {
    setResponseError('')
    setConfirmation({ exchange, action })
  }

  function handleTabKeyDown(event) {
    const nextTabByKey = {
      ArrowLeft: activeTab === 'received' ? 'sent' : 'received',
      ArrowRight: activeTab === 'received' ? 'sent' : 'received',
      Home: 'received',
      End: 'sent',
    }
    const nextTab = nextTabByKey[event.key]
    if (!nextTab) return

    event.preventDefault()
    setActiveTab(nextTab)
    document.getElementById(`${nextTab}-tab`)?.focus()
  }

  return (
    <div className="page exchanges-page">
      <header className="page-heading">
        <p className="eyebrow eyebrow--chip"><ArrowLeftRight /> Gestão comunitária</p>
        <h1>Minhas trocas</h1>
        <p>Acompanhe propostas recebidas e consulte todas as propostas que você enviou.</p>
      </header>

      <div className="exchange-tabs" role="tablist" aria-label="Tipos de proposta">
        <button
          role="tab"
          aria-selected={activeTab === 'received'}
          aria-controls="exchange-panel"
          id="received-tab"
          tabIndex={activeTab === 'received' ? 0 : -1}
          className={activeTab === 'received' ? 'is-active' : ''}
          onClick={() => setActiveTab('received')}
          onKeyDown={handleTabKeyDown}
        >
          <Inbox /> Recebidas
          {received.length > 0 ? <span>{received.length}</span> : null}
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'sent'}
          aria-controls="exchange-panel"
          id="sent-tab"
          tabIndex={activeTab === 'sent' ? 0 : -1}
          className={activeTab === 'sent' ? 'is-active' : ''}
          onClick={() => setActiveTab('sent')}
          onKeyDown={handleTabKeyDown}
        >
          <Send /> Enviadas
          {sent.length > 0 ? <span>{sent.length}</span> : null}
        </button>
      </div>

      {exchangesQuery.isPending ? <LoadingSkeleton variant="exchanges" count={2} /> : null}
      {exchangesQuery.isError ? (
        <ErrorState
          title="Não foi possível carregar suas trocas"
          description={exchangesQuery.error?.message}
          onRetry={() => exchangesQuery.refetch()}
        />
      ) : null}

      {exchangesQuery.isSuccess ? (
        <section
          className="exchange-list"
          role="tabpanel"
          id="exchange-panel"
          aria-labelledby={activeTab === 'received' ? 'received-tab' : 'sent-tab'}
        >
          <div className="section-heading">
            <h2>{activeTab === 'received' ? 'Aguardando sua decisão' : 'Propostas enviadas'}</h2>
            <p className="result-count">{currentItems.length} {currentItems.length === 1 ? 'proposta' : 'propostas'}</p>
          </div>
          {currentItems.length === 0 ? (
            <EmptyState
              icon={activeTab === 'received' ? <Inbox /> : <Send />}
              title={activeTab === 'received' ? 'Nenhuma proposta pendente' : 'Você ainda não enviou propostas'}
              description={activeTab === 'received'
                ? 'Quando alguém quiser trocar um livro com você, a proposta aparecerá aqui.'
                : 'Escolha um livro no catálogo para iniciar uma troca.'}
              action={activeTab === 'sent'
                ? <Link className="button button--secondary button--medium" to="/livros">Explorar catálogo</Link>
                : undefined}
            />
          ) : activeTab === 'received' ? (
            received.map((exchange) => (
              <ReceivedExchangeCard key={exchange.id} exchange={exchange} onRespond={requestResponse} />
            ))
          ) : (
            sent.map((exchange) => <SentExchangeCard key={exchange.id} exchange={exchange} />)
          )}
        </section>
      ) : null}

      <ConfirmDialog
        open={Boolean(confirmation)}
        onClose={() => {
          setConfirmation(null)
          setResponseError('')
        }}
        onConfirm={() => responseMutation.mutate(confirmation)}
        title={confirmation?.action === 'aceitar' ? 'Aceitar esta troca?' : 'Recusar esta proposta?'}
        description={confirmation
          ? confirmation.action === 'aceitar'
            ? `Ao confirmar, “${confirmation.exchange.tituloLivroOferecido}” e “${confirmation.exchange.tituloLivroRecebido}” trocarão de proprietários.`
            : `A proposta envolvendo “${confirmation.exchange.tituloLivroOferecido}” será recusada.`
          : ''}
        confirmLabel={confirmation?.action === 'aceitar' ? 'Aceitar troca' : 'Recusar proposta'}
        variant={confirmation?.action === 'aceitar' ? 'primary' : 'danger'}
        isLoading={responseMutation.isPending}
        error={responseError}
      />
    </div>
  )
}
