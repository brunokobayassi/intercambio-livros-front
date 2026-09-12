import { http, HttpResponse } from 'msw'
import {
  CATALOG_BOOKS,
  EXCHANGES_RESPONSE,
  LOGIN_RESPONSE,
  OWN_BOOKS,
  TEST_API_BASE_URL,
} from './fixtures.js'

export const handlers = [
  http.post(`${TEST_API_BASE_URL}/login`, () =>
    HttpResponse.json(LOGIN_RESPONSE),
  ),

  // Keep this route before `/livros/:id`, mirroring the intended API routing.
  http.get(`${TEST_API_BASE_URL}/livros/me`, () =>
    HttpResponse.json(OWN_BOOKS),
  ),
  http.get(`${TEST_API_BASE_URL}/livros`, () =>
    HttpResponse.json(CATALOG_BOOKS),
  ),
  http.get(`${TEST_API_BASE_URL}/livros/:id`, ({ params }) => {
    const book = [...CATALOG_BOOKS, ...OWN_BOOKS].find(
      (item) => String(item.id) === String(params.id),
    )

    return book
      ? HttpResponse.json(book)
      : HttpResponse.json({ erro: 'Livro não encontrado.' }, { status: 404 })
  }),
  http.post(`${TEST_API_BASE_URL}/livros`, () =>
    HttpResponse.json({ mensagem: 'Livro cadastrado com sucesso.' }, { status: 201 }),
  ),
  http.put(`${TEST_API_BASE_URL}/livros/:id`, () =>
    HttpResponse.json({ mensagem: 'Livro atualizado com sucesso.' }),
  ),
  http.delete(
    `${TEST_API_BASE_URL}/livros/:id`,
    () => new HttpResponse(null, { status: 204 }),
  ),

  http.get(`${TEST_API_BASE_URL}/trocas`, () =>
    HttpResponse.json(EXCHANGES_RESPONSE),
  ),
  http.get(`${TEST_API_BASE_URL}/trocas/pendentes`, () =>
    HttpResponse.json(EXCHANGES_RESPONSE.pendentes),
  ),
  http.get(`${TEST_API_BASE_URL}/trocas/propostas`, () =>
    HttpResponse.json(EXCHANGES_RESPONSE.propostas),
  ),
  http.post(`${TEST_API_BASE_URL}/trocas`, () =>
    HttpResponse.json({ mensagem: 'Proposta enviada com sucesso.' }, { status: 201 }),
  ),
  http.put(`${TEST_API_BASE_URL}/trocas/:id`, () =>
    HttpResponse.json({ mensagem: 'Proposta respondida com sucesso.' }),
  ),
]
