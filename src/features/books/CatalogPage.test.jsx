import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { CATALOG_BOOKS, TEST_API_BASE_URL } from '../../test/fixtures.js'
import { server } from '../../test/server.js'
import { renderWithProviders, seedSession } from '../../test/test-utils.jsx'
import CatalogPage from './CatalogPage.jsx'

describe('CatalogPage', () => {
  it('renderiza dados da API e filtra localmente sem refazer a consulta', async () => {
    let requests = 0
    server.use(
      http.get(`${TEST_API_BASE_URL}/livros`, () => {
        requests += 1
        return HttpResponse.json(CATALOG_BOOKS)
      }),
    )
    seedSession()

    const { user } = renderWithProviders(<CatalogPage />, {
      initialEntries: ['/livros'],
    })

    expect(
      await screen.findByRole('heading', { name: 'Dom Casmurro' }),
    ).toBeVisible()
    expect(
      screen.getByRole('heading', { name: 'Cem Anos de Solidão' }),
    ).toBeVisible()
    expect(screen.getByText('Lucas Mendes')).toBeVisible()
    expect(screen.getByText('Ana Júlia')).toBeVisible()
    expect(requests).toBe(1)

    await user.type(
      screen.getByRole('searchbox', { name: 'Buscar no catálogo' }),
      'solidao',
    )

    expect(
      screen.getByRole('heading', { name: 'Cem Anos de Solidão' }),
    ).toBeVisible()
    expect(
      screen.queryByRole('heading', { name: 'Dom Casmurro' }),
    ).not.toBeInTheDocument()
    await waitFor(() => expect(requests).toBe(1))
  })

  it('mostra o estado vazio quando não há livros de outros usuários', async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/livros`, () => HttpResponse.json([])),
    )
    seedSession()

    renderWithProviders(<CatalogPage />, { initialEntries: ['/livros'] })

    expect(
      await screen.findByRole('heading', {
        name: 'Nenhum livro disponível agora',
      }),
    ).toBeVisible()
  })

  it('mostra o erro da API e oferece nova tentativa', async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/livros`, () =>
        HttpResponse.json(
          { erro: 'Catálogo temporariamente indisponível.' },
          { status: 503 },
        ),
      ),
    )
    seedSession()

    renderWithProviders(<CatalogPage />, { initialEntries: ['/livros'] })

    expect(
      await screen.findByRole('heading', {
        name: 'Não foi possível carregar o catálogo',
      }),
    ).toBeVisible()
    expect(
      screen.getByText('Catálogo temporariamente indisponível.'),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    ).toBeEnabled()
  })
})

