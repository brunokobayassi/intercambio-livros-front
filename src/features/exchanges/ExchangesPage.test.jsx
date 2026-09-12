import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import {
  EXCHANGES_RESPONSE,
  TEST_API_BASE_URL,
} from '../../test/fixtures.js'
import { server } from '../../test/server.js'
import { renderWithProviders, seedSession } from '../../test/test-utils.jsx'
import ExchangesPage from './ExchangesPage.jsx'

function renderExchangesPage() {
  seedSession()
  return renderWithProviders(<ExchangesPage />, {
    initialEntries: ['/trocas'],
  })
}

describe('ExchangesPage', () => {
  it('usa um GET agregado e oferece ações apenas nas propostas recebidas', async () => {
    let aggregateRequests = 0
    let splitRequests = 0
    server.use(
      http.get(`${TEST_API_BASE_URL}/trocas`, () => {
        aggregateRequests += 1
        return HttpResponse.json(EXCHANGES_RESPONSE)
      }),
      http.get(`${TEST_API_BASE_URL}/trocas/pendentes`, () => {
        splitRequests += 1
        return HttpResponse.json(EXCHANGES_RESPONSE.pendentes)
      }),
      http.get(`${TEST_API_BASE_URL}/trocas/propostas`, () => {
        splitRequests += 1
        return HttpResponse.json(EXCHANGES_RESPONSE.propostas)
      }),
    )
    const { user } = renderExchangesPage()

    expect(await screen.findByText('Maria')).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Aceitar troca' }),
    ).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Recusar' })).toBeEnabled()
    expect(aggregateRequests).toBe(1)
    expect(splitRequests).toBe(0)

    await user.click(screen.getByRole('tab', { name: /Enviadas/ }))

    expect(screen.getByText('Ana Júlia')).toBeVisible()
    expect(screen.getByText('Aceita')).toBeVisible()
    expect(
      screen.queryByRole('button', { name: 'Aceitar troca' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Recusar' }),
    ).not.toBeInTheDocument()
    await waitFor(() => expect(aggregateRequests).toBe(1))
    expect(splitRequests).toBe(0)
  })

  it.each([
    {
      action: 'aceitar',
      openLabel: 'Aceitar troca',
      dialogTitle: 'Aceitar esta troca?',
      confirmLabel: 'Aceitar troca',
      responseMessage: 'Troca aceita com sucesso.',
    },
    {
      action: 'recusar',
      openLabel: 'Recusar',
      dialogTitle: 'Recusar esta proposta?',
      confirmLabel: 'Recusar proposta',
      responseMessage: 'Troca recusada com sucesso.',
    },
  ])(
    'confirma e envia PUT com a ação $action',
    async ({ action, openLabel, dialogTitle, confirmLabel, responseMessage }) => {
      let receivedId
      let receivedBody
      server.use(
        http.put(`${TEST_API_BASE_URL}/trocas/:id`, async ({ params, request }) => {
          receivedId = params.id
          receivedBody = await request.json()
          return HttpResponse.json({ mensagem: responseMessage })
        }),
      )
      const { user } = renderExchangesPage()

      await screen.findByText('Maria')
      await user.click(screen.getByRole('button', { name: openLabel }))
      const dialog = screen.getByRole('dialog', { name: dialogTitle })
      expect(receivedBody).toBeUndefined()

      await user.click(
        within(dialog).getByRole('button', { name: confirmLabel }),
      )

      await waitFor(() => {
        expect(receivedId).toBe('5')
        expect(receivedBody).toEqual({ acao: action })
      })
      expect(await screen.findByText(responseMessage)).toBeVisible()
      await waitFor(() => {
        expect(
          screen.queryByRole('dialog', { name: dialogTitle }),
        ).not.toBeInTheDocument()
      })
    },
  )
})

