import { describe, expect, it } from 'vitest'
import {
  EXCHANGE_STATUS,
  getStatusMeta,
  normalizeExchangeStatus,
} from './exchange-utils.js'

describe('normalizeExchangeStatus', () => {
  it('remove espaços e normaliza caixa sem inventar um status', () => {
    expect(normalizeExchangeStatus('  pendente ')).toBe('PENDENTE')
    expect(normalizeExchangeStatus(null)).toBe('')
  })
})

describe('getStatusMeta', () => {
  it.each([
    [EXCHANGE_STATUS.PENDING, 'Pendente', 'pending'],
    [EXCHANGE_STATUS.ACCEPTED, 'Aceita', 'accepted'],
    [EXCHANGE_STATUS.DECLINED, 'Recusada', 'declined'],
    [' aceita ', 'Aceita', 'accepted'],
  ])('mapeia %j para label e tom conhecidos', (status, label, tone) => {
    expect(getStatusMeta(status)).toMatchObject({ label, tone })
  })

  it('preserva o texto desconhecido com tratamento neutro', () => {
    expect(getStatusMeta(' Em análise ')).toEqual({
      normalized: 'EM ANÁLISE',
      label: 'Em análise',
      tone: 'neutral',
    })
  })

  it('usa fallback neutro quando o status não foi informado', () => {
    expect(getStatusMeta(undefined)).toEqual({
      normalized: '',
      label: 'Não informado',
      tone: 'neutral',
    })
  })
})
