import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { useLocation } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import {
  CATALOG_BOOKS,
  TEST_API_BASE_URL,
} from '../../test/fixtures.js'
import { server } from '../../test/server.js'
import { renderWithProviders, seedSession } from '../../test/test-utils.jsx'
import { ProposeExchangeModal } from './ProposeExchangeModal.jsx'

function LocationProbe() {
  const location = useLocation()
  return (
    <output data-testid="current-location">
      {JSON.stringify({ pathname: location.pathname, state: location.state })}
    </output>
  )
}

function renderProposalModal({ onClose = vi.fn() } = {}) {
  seedSession()
  const result = renderWithProviders(
    <>
      <ProposeExchangeModal
        open
        desiredBook={CATALOG_BOOKS[0]}
        onClose={onClose}
      />
      <LocationProbe />
    </>,
    { initialEntries: ['/livros'] },
  )

  return { ...result, onClose }
}

describe('ProposeExchangeModal', () => {
  it('exige seleção e envia somente os dois IDs da proposta', async () => {
    let postRequests = 0
    let receivedBody
    server.use(
      http.post(`${TEST_API_BASE_URL}/trocas`, async ({ request }) => {
        postRequests += 1
        receivedBody = await request.json()
        return HttpResponse.json(
          { mensagem: 'Proposta enviada com sucesso.' },
          { status: 201 },
        )
      }),
    )
    const { onClose, user } = renderProposalModal()

    const radios = await screen.findAllByRole('radio')
    const submitButton = screen.getByRole('button', {
      name: 'Enviar proposta',
    })
    expect(radios).toHaveLength(2)
    expect(submitButton).toBeDisabled()
    expect(postRequests).toBe(0)

    await user.click(radios[1])
    expect(radios[1]).toBeChecked()
    expect(submitButton).toBeEnabled()
    await user.click(submitButton)

    await waitFor(() => {
      expect(postRequests).toBe(1)
      expect(receivedBody).toEqual({
        livroOferecidoId: 8,
        livroRecebidoId: 3,
      })
    })
    expect(onClose).toHaveBeenCalledOnce()
    expect(
      await screen.findByText('Proposta enviada com sucesso.'),
    ).toBeVisible()
  })

  it('leva o estado vazio para Meus livros abrindo o cadastro', async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/livros/me`, () => HttpResponse.json([])),
    )
    const { onClose, user } = renderProposalModal()

    expect(
      await screen.findByRole('heading', {
        name: 'Cadastre um livro para oferecer',
      }),
    ).toBeVisible()
    await user.click(screen.getByRole('button', { name: 'Adicionar livro' }))

    expect(onClose).toHaveBeenCalledOnce()
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent(
        '"pathname":"/meus-livros"',
      )
      expect(screen.getByTestId('current-location')).toHaveTextContent(
        '"openBookForm":true',
      )
    })
  })
})

