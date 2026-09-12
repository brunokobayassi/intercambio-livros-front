export const TEST_API_BASE_URL =
  'http://localhost:8080/intercambio-livros/api'

export const TEST_TOKEN = 'jwt-de-teste'

export const TEST_USER = Object.freeze({
  id: 1,
  nome: 'Camila Silva',
  email: 'camila@email.com',
})

export const TEST_SESSION = Object.freeze({
  token: TEST_TOKEN,
  user: TEST_USER,
})

export const LOGIN_RESPONSE = Object.freeze({
  token: TEST_TOKEN,
  id: TEST_USER.id,
  nome: TEST_USER.nome,
  email: TEST_USER.email,
})

export const CATALOG_BOOKS = Object.freeze([
  Object.freeze({
    id: 3,
    titulo: 'Dom Casmurro',
    autor: 'Machado de Assis',
    usuarioId: 2,
    nomeDono: 'Lucas Mendes',
  }),
  Object.freeze({
    id: 4,
    titulo: 'Cem Anos de Solidão',
    autor: 'Gabriel García Márquez',
    usuarioId: 3,
    nomeDono: 'Ana Júlia',
  }),
])

export const OWN_BOOKS = Object.freeze([
  Object.freeze({
    id: 7,
    titulo: 'O Alquimista',
    autor: 'Paulo Coelho',
    usuarioId: TEST_USER.id,
    nomeDono: TEST_USER.nome,
  }),
  Object.freeze({
    id: 8,
    titulo: 'Torto Arado',
    autor: 'Itamar Vieira Junior',
    usuarioId: TEST_USER.id,
    nomeDono: TEST_USER.nome,
  }),
])

export const RECEIVED_EXCHANGES = Object.freeze([
  Object.freeze({
    id: 5,
    tituloLivroOferecido: 'O Alquimista',
    tituloLivroRecebido: 'Dom Casmurro',
    nomeProponente: 'Maria',
    nomeSolicitado: TEST_USER.nome,
    status: 'PENDENTE',
  }),
])

export const SENT_EXCHANGES = Object.freeze([
  Object.freeze({
    id: 6,
    tituloLivroOferecido: 'Torto Arado',
    tituloLivroRecebido: 'Cem Anos de Solidão',
    nomeProponente: TEST_USER.nome,
    nomeSolicitado: 'Ana Júlia',
    status: 'ACEITA',
  }),
])

export const EXCHANGES_RESPONSE = Object.freeze({
  pendentes: RECEIVED_EXCHANGES,
  propostas: SENT_EXCHANGES,
})
