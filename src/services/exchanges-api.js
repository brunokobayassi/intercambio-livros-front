import { ApiError, apiRequest } from './api-client.js'

/**
 * @typedef {'PENDENTE' | 'ACEITA' | 'RECUSADA' | string} ExchangeStatus
 */

/**
 * @typedef {Object} DetailedExchange
 * @property {number} id
 * @property {string} tituloLivroOferecido
 * @property {string} tituloLivroRecebido
 * @property {string} nomeProponente
 * @property {string} nomeSolicitado
 * @property {ExchangeStatus} status
 */

/**
 * @typedef {Object} ExchangesResponse
 * @property {DetailedExchange[]} pendentes
 * @property {DetailedExchange[]} propostas
 */

/**
 * @typedef {Object} ExchangeProposalInput
 * @property {number} livroOferecidoId
 * @property {number} livroRecebidoId
 */

/**
 * @typedef {'aceitar' | 'recusar'} ExchangeAction
 */

/**
 * @typedef {Object} RequestOptions
 * @property {AbortSignal} [signal]
 */

/**
 * @typedef {Object} ConfirmationResponse
 * @property {string} mensagem
 */

/**
 * @param {unknown} value
 * @param {string} message
 * @returns {asserts value is DetailedExchange[]}
 */
function assertExchangeList(value, message) {
  if (!Array.isArray(value)) {
    throw new ApiError(message, {
      status: 200,
      data: value,
      code: 'INVALID_RESPONSE',
    })
  }
}

/**
 * Gets received pending exchanges and all sent proposals in one request.
 *
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<ExchangesResponse>}
 */
export async function listExchanges(token, { signal } = {}) {
  const exchanges = await apiRequest('/trocas', {
    token,
    signal,
    protectedRequest: true,
  })

  if (!exchanges || typeof exchanges !== 'object' || Array.isArray(exchanges)) {
    throw new ApiError('A API retornou uma lista de trocas inválida.', {
      status: 200,
      data: exchanges,
      code: 'INVALID_RESPONSE',
    })
  }

  assertExchangeList(
    exchanges.pendentes,
    'A API retornou propostas recebidas inválidas.',
  )
  assertExchangeList(
    exchanges.propostas,
    'A API retornou propostas enviadas inválidas.',
  )

  return exchanges
}

/**
 * Gets only pending proposals received by the authenticated user.
 *
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<DetailedExchange[]>}
 */
export async function listPendingExchanges(token, { signal } = {}) {
  const exchanges = await apiRequest('/trocas/pendentes', {
    token,
    signal,
    protectedRequest: true,
  })

  assertExchangeList(exchanges, 'A API retornou propostas recebidas inválidas.')
  return exchanges
}

/**
 * Gets all proposals sent by the authenticated user.
 *
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<DetailedExchange[]>}
 */
export async function listSentExchanges(token, { signal } = {}) {
  const exchanges = await apiRequest('/trocas/propostas', {
    token,
    signal,
    protectedRequest: true,
  })

  assertExchangeList(exchanges, 'A API retornou propostas enviadas inválidas.')
  return exchanges
}

/**
 * Proposes an exchange between one owned book and the desired catalog book.
 *
 * @param {ExchangeProposalInput} input
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<ConfirmationResponse>}
 */
export function createExchange(input, token, { signal } = {}) {
  return apiRequest('/trocas', {
    method: 'POST',
    body: {
      livroOferecidoId: input?.livroOferecidoId,
      livroRecebidoId: input?.livroRecebidoId,
    },
    token,
    signal,
    protectedRequest: true,
  })
}

/**
 * Accepts or refuses a received exchange proposal.
 *
 * @param {number | string} id
 * @param {ExchangeAction} action
 * @param {string} token
 * @param {RequestOptions} [options]
 * @returns {Promise<ConfirmationResponse>}
 */
export function respondToExchange(id, action, token, { signal } = {}) {
  return apiRequest(`/trocas/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: { acao: action },
    token,
    signal,
    protectedRequest: true,
  })
}

export const exchangesApi = {
  listExchanges,
  listPendingExchanges,
  listSentExchanges,
  createExchange,
  respondToExchange,
}
