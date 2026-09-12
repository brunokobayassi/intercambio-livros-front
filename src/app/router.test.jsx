import { screen, waitFor } from '@testing-library/react'
import { useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { renderWithProviders, seedSession } from '../test/test-utils.jsx'
import { AppRouter } from './router.jsx'

function RouterWithLocationProbe() {
  const location = useLocation()

  return (
    <>
      <AppRouter />
      <output data-testid="current-location">{location.pathname}</output>
    </>
  )
}

function renderRouter(initialEntry) {
  return renderWithProviders(<RouterWithLocationProbe />, {
    initialEntries: [initialEntry],
  })
}

describe('AppRouter', () => {
  it('exibe fallback enquanto a página autenticada é carregada sob demanda', async () => {
    seedSession()

    renderRouter('/livros')

    expect(screen.getByText('Carregando página')).toBeInTheDocument()
    expect(
      await screen.findByRole('heading', {
        name: 'Encontre sua próxima leitura',
      }),
    ).toBeVisible()
  })

  it('mantém /login público para visitantes', async () => {
    renderRouter('/login')

    expect(
      await screen.findByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeVisible()
    expect(screen.getByTestId('current-location')).toHaveTextContent('/login')
  })

  it.each([
    ['a raiz', '/'],
    ['uma rota desconhecida', '/pagina-inexistente'],
    ['uma rota protegida', '/trocas'],
  ])('redireciona %s para /login sem sessão', async (_case, initialEntry) => {
    renderRouter(initialEntry)

    expect(
      await screen.findByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeVisible()
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent('/login')
    })
  })

  it.each([
    ['a raiz', '/'],
    ['a página de login', '/login'],
    ['uma rota desconhecida', '/pagina-inexistente'],
  ])('redireciona %s para /livros com sessão', async (_case, initialEntry) => {
    seedSession()
    renderRouter(initialEntry)

    expect(
      await screen.findByRole('heading', {
        name: 'Encontre sua próxima leitura',
      }),
    ).toBeVisible()
    await waitFor(() => {
      expect(screen.getByTestId('current-location')).toHaveTextContent('/livros')
    })
  })
})

