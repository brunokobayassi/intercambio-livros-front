export const EXCHANGE_STATUS = Object.freeze({
  PENDING: 'PENDENTE',
  ACCEPTED: 'ACEITA',
  DECLINED: 'RECUSADA',
})

const STATUS_META = Object.freeze({
  [EXCHANGE_STATUS.PENDING]: Object.freeze({
    label: 'Pendente',
    tone: 'pending',
  }),
  [EXCHANGE_STATUS.ACCEPTED]: Object.freeze({
    label: 'Aceita',
    tone: 'accepted',
  }),
  [EXCHANGE_STATUS.DECLINED]: Object.freeze({
    label: 'Recusada',
    tone: 'declined',
  }),
})

/**
 * Normalizes API status values without assigning meaning to unknown values.
 *
 * @param {unknown} status
 * @returns {string}
 */
export function normalizeExchangeStatus(status) {
  return String(status ?? '').trim().toLocaleUpperCase('pt-BR')
}

/**
 * Converts an API status into display metadata. Unknown values deliberately
 * retain the text received from the API and use a neutral visual treatment.
 *
 * @param {unknown} status
 * @returns {{normalized: string, label: string, tone: 'pending'|'accepted'|'declined'|'neutral'}}
 */
export function getStatusMeta(status) {
  const rawStatus = String(status ?? '').trim()
  const normalized = normalizeExchangeStatus(rawStatus)
  const knownStatus = STATUS_META[normalized]

  if (knownStatus) {
    return { normalized, ...knownStatus }
  }

  return {
    normalized,
    label: rawStatus || 'Não informado',
    tone: 'neutral',
  }
}
