import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'

import { TEST_API_BASE_URL } from '../../test/fixtures.js'
import { server } from '../../test/server.js'
import { renderWithProviders, seedSession } from '../../test/test-utils.jsx'
import MyBooksPage from './MyBooksPage.jsx'

function renderMyBooksPage() {
  seedSession()
  return renderWithProviders(<MyBooksPage />, {
    initialEntries: ['/meus-livros'],
  })
}

async function getOwnedBookCard(title = 'O Alquimista') {
  const heading = await screen.findByRole('heading', { name: title })
  return heading.closest('article')
}

describe('MyBooksPage', () => {
  it('mostra indisponibilidade explícita quando GET /livros/me responde 400', async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/livros/me`, () =>
        HttpResponse.json({ erro: 'ID inválido' }, { status: 400 }),
      ),
    )

    renderMyBooksPage()

    expect(
      await screen.findByRole('heading', {
        name: 'Meus livros ainda não estão disponíveis',
      }),
    ).toBeVisible()
    expect(
      screen.getByRole('button', { name: 'Adicionar livro' }),
    ).toBeDisabled()
    expect(screen.queryByText('ID inválido')).not.toBeInTheDocument()
  })

  it('cadastra enviando somente título e autor normalizados', async () => {
    let receivedBody
    server.use(
      http.post(`${TEST_API_BASE_URL}/livros`, async ({ request }) => {
        receivedBody = await request.json()
        return HttpResponse.json(
          { mensagem: 'Livro cadastrado com sucesso.' },
          { status: 201 },
        )
      }),
    )
    const { user } = renderMyBooksPage()
    await getOwnedBookCard()

    await user.click(screen.getByRole('button', { name: 'Adicionar livro' }))
    const dialog = screen.getByRole('dialog', { name: 'Adicionar livro' })
    await user.type(
      within(dialog).getByRole('textbox', { name: /Título do livro/ }),
      '  Vidas Secas  ',
    )
    await user.type(
      within(dialog).getByRole('textbox', { name: /Autor/ }),
      '  Graciliano Ramos  ',
    )
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar livro' }),
    )

    await waitFor(() => {
      expect(receivedBody).toEqual({
        titulo: 'Vidas Secas',
        autor: 'Graciliano Ramos',
      })
    })
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Adicionar livro' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText('Livro cadastrado com sucesso.')).toBeVisible()
  })

  it('edita o livro correto com o payload previsto pelo contrato', async () => {
    let receivedId
    let receivedBody
    server.use(
      http.put(`${TEST_API_BASE_URL}/livros/:id`, async ({ params, request }) => {
        receivedId = params.id
        receivedBody = await request.json()
        return HttpResponse.json({ mensagem: 'Livro atualizado com sucesso.' })
      }),
    )
    const { user } = renderMyBooksPage()
    const card = await getOwnedBookCard()

    await user.click(within(card).getByRole('button', { name: 'Editar' }))
    const dialog = screen.getByRole('dialog', { name: 'Editar livro' })
    const titleInput = within(dialog).getByRole('textbox', {
      name: /Título do livro/,
    })
    const authorInput = within(dialog).getByRole('textbox', { name: /Autor/ })

    expect(titleInput).toHaveValue('O Alquimista')
    expect(authorInput).toHaveValue('Paulo Coelho')
    await user.clear(titleInput)
    await user.type(titleInput, '  O Alquimista — edição revista  ')
    await user.clear(authorInput)
    await user.type(authorInput, '  Paulo Coelho  ')
    await user.click(
      within(dialog).getByRole('button', { name: 'Salvar alterações' }),
    )

    await waitFor(() => {
      expect(receivedId).toBe('7')
      expect(receivedBody).toEqual({
        titulo: 'O Alquimista — edição revista',
        autor: 'Paulo Coelho',
      })
    })
    expect(
      await screen.findByText('Livro atualizado com sucesso.'),
    ).toBeVisible()
  })

  it('só envia DELETE após confirmação e aceita a resposta 204', async () => {
    let deletedId
    let deleteRequests = 0
    server.use(
      http.delete(`${TEST_API_BASE_URL}/livros/:id`, ({ params }) => {
        deleteRequests += 1
        deletedId = params.id
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderMyBooksPage()
    const card = await getOwnedBookCard()

    await user.click(
      within(card).getByRole('button', { name: 'Excluir O Alquimista' }),
    )
    const dialog = screen.getByRole('dialog', { name: 'Excluir livro?' })
    expect(deleteRequests).toBe(0)
    expect(within(dialog).getByText(/O Alquimista/)).toBeVisible()

    await user.click(
      within(dialog).getByRole('button', { name: 'Excluir livro' }),
    )

    await waitFor(() => {
      expect(deleteRequests).toBe(1)
      expect(deletedId).toBe('7')
    })
    await waitFor(() => {
      expect(
        screen.queryByRole('dialog', { name: 'Excluir livro?' }),
      ).not.toBeInTheDocument()
    })
    expect(screen.getByText('Livro excluído com sucesso.')).toBeVisible()
  })
})

