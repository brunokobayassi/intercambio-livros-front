import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { LoginPage } from '../features/auth/LoginPage.jsx'
import { useAuth } from '../features/auth/useAuth.js'
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '../features/auth/session.js'
import { apiRequest } from '../services/api-client.js'
import { TEST_API_BASE_URL } from '../test/fixtures.js'
import { server } from '../test/server.js'
import {
  createTestQueryClient,
  renderWithProviders,
  seedSession,
} from '../test/test-utils.jsx'
import { AppRouter } from './router.jsx'

function LocationProbe() {
  const location = useLocation()
  return <output data-testid="current-location">{location.pathname}</output>
}

function AppRouterWithLocation() {
  return (
    <>
      <AppRouter />
      <LocationProbe />
    </>
  )
}

function ProtectedRequestProbe() {
  const { token } = useAuth()

  async function requestProtectedResource() {
    try {
      await apiRequest('/livros', {
        token,
        protectedRequest: true,
      })
    } catch {
      // The assertion targets the global session-expiration side effect.
    }
  }

  return (
    <button type="button" onClick={requestProtectedResource}>
      Consultar recurso protegido
    </button>
  )
}

function UnauthorizedFlowRoutes() {
  return (
    <>
      <Routes>
        <Route path="/privado" element={<ProtectedRequestProbe />} />
        <Route path="/login" element={<LoginPage />} />
      </Routes>
      <LocationProbe />
    </>
  )
}

function expectStoredSessionToBeCleared() {
  expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull()
}

describe('ciclo de vida da sessão', () => {
  it('logout limpa storage e cache privado antes de voltar ao login', async () => {
    seedSession()
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['privado', 'perfil'], { segredo: true })

    const { user } = renderWithProviders(<AppRouterWithLocation />, {
      initialEntries: ['/livros'],
      queryClient,
    })

    await screen.findByRole('heading', {
      name: 'Encontre sua próxima leitura',
    })
    expect(queryClient.getQueryCache().getAll().length).toBeGreaterThan(0)

    await user.click(screen.getByRole('button', { name: 'Sair' }))

    expect(
      await screen.findByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeVisible()
    expectStoredSessionToBeCleared()
    expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
    expect(screen.getByTestId('current-location')).toHaveTextContent('/login')
    expect(
      screen.queryByText(/Sua sessão expirou/),
    ).not.toBeInTheDocument()
  })

  it('401 protegido encerra a sessão, limpa cache e mostra o aviso de expiração', async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/livros`, () =>
        HttpResponse.json({ erro: 'Token inválido ou ausente' }, { status: 401 }),
      ),
    )
    seedSession()
    const queryClient = createTestQueryClient()
    queryClient.setQueryData(['privado', 'livros'], [{ id: 99 }])

    const { user } = renderWithProviders(<UnauthorizedFlowRoutes />, {
      initialEntries: ['/privado'],
      queryClient,
    })

    await user.click(
      screen.getByRole('button', { name: 'Consultar recurso protegido' }),
    )

    expect(
      await screen.findByRole('heading', { name: 'Entre na sua conta' }),
    ).toBeVisible()
    expect(
      screen.getByText('Sua sessão expirou. Entre novamente para continuar.'),
    ).toBeVisible()
    expectStoredSessionToBeCleared()
    await waitFor(() => {
      expect(queryClient.getQueryCache().getAll()).toHaveLength(0)
      expect(screen.getByTestId('current-location')).toHaveTextContent('/login')
    })
  })
})

