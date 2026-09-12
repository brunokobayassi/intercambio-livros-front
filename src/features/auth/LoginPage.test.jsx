import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { LOGIN_RESPONSE, TEST_API_BASE_URL } from '../../test/fixtures.js'
import { server } from '../../test/server.js'
import { renderWithProviders } from '../../test/test-utils.jsx'
import { LoginPage } from './LoginPage.jsx'
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from './session.js'

function renderLogin() {
  return renderWithProviders(
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/livros" element={<h1>Catálogo autenticado</h1>} />
    </Routes>,
    { initialEntries: ['/login'] },
  )
}

async function fillCredentials(user) {
  await user.type(screen.getByRole('textbox', { name: 'E-mail' }), '  camila@email.com  ')
  await user.type(screen.getByLabelText('Senha'), '123456')
}

describe('LoginPage', () => {
  it('valida os campos localmente sem enviar uma requisição', async () => {
    let requests = 0
    server.use(
      http.post(`${TEST_API_BASE_URL}/login`, () => {
        requests += 1
        return HttpResponse.json(LOGIN_RESPONSE)
      }),
    )
    const { user } = renderLogin()

    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByText('Informe seu e-mail.')).toBeVisible()
    expect(screen.getByText('Informe sua senha.')).toBeVisible()
    expect(requests).toBe(0)
  })

  it('persiste a sessão e navega para o catálogo após login bem-sucedido', async () => {
    let receivedBody
    server.use(
      http.post(`${TEST_API_BASE_URL}/login`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(LOGIN_RESPONSE)
      }),
    )
    const { user } = renderLogin()

    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('heading', { name: 'Catálogo autenticado' })).toBeVisible()
    expect(receivedBody).toEqual({ email: 'camila@email.com', senha: '123456' })
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(LOGIN_RESPONSE.token)
    expect(JSON.parse(localStorage.getItem(USER_STORAGE_KEY))).toEqual({
      id: LOGIN_RESPONSE.id,
      nome: LOGIN_RESPONSE.nome,
      email: LOGIN_RESPONSE.email,
    })
  })

  it('mantém a tela e mostra o erro devolvido para credenciais inválidas', async () => {
    server.use(
      http.post(`${TEST_API_BASE_URL}/login`, () =>
        HttpResponse.json({ erro: 'Email ou senha incorretos' }, { status: 401 }),
      ),
    )
    const { user } = renderLogin()

    await fillCredentials(user)
    await user.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Email ou senha incorretos')
    expect(screen.getByRole('heading', { name: 'Entre na sua conta' })).toBeVisible()
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
  })

  it('revela a senha sem tirar o foco do campo', async () => {
    const { user } = renderLogin()
    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
    expect(screen.getByRole('textbox', { name: 'E-mail' })).toHaveAttribute('autocomplete', 'email')

    await user.click(password)
    await user.type(password, 'segredo')
    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(password).toHaveAttribute('type', 'text')
    await waitFor(() => expect(password).toHaveFocus())
  })
})
