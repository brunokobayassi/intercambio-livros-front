import { afterEach, describe, expect, it, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import {
  ApiError,
  apiRequest,
  buildApiUrl,
  normalizeApiBaseUrl,
  resolveApiBaseUrl,
  setUnauthorizedHandler,
} from './api-client.js'
import { server } from '../test/server.js'
import { TEST_API_BASE_URL } from '../test/fixtures.js'

afterEach(() => {
  setUnauthorizedHandler(null)
})

describe('normalizeApiBaseUrl', () => {
  it.each([
    [' http://localhost:8080/api/// ', 'http://localhost:8080/api'],
    ['/api/', '/api'],
    ['', '/api'],
    [undefined, '/api'],
    ['/', ''],
  ])('normaliza %j para %j', (input, expected) => {
    expect(normalizeApiBaseUrl(input)).toBe(expected)
  })
})

describe('resolveApiBaseUrl', () => {
  it('prefere o proxy no desenvolvimento para a API local sem CORS', () => {
    const localApi = 'http://localhost:8080/intercambio-livros/api/'
    expect(resolveApiBaseUrl(localApi, true)).toBe('/api')
    expect(resolveApiBaseUrl(localApi, false)).toBe(
      'http://localhost:8080/intercambio-livros/api',
    )
  })
})

describe('buildApiUrl', () => {
  it('une base e caminho sem duplicar separadores', () => {
    expect(buildApiUrl('/livros', 'http://api.test/base///')).toBe(
      'http://api.test/base/livros',
    )
    expect(buildApiUrl('trocas', 'http://api.test/base')).toBe(
      'http://api.test/base/trocas',
    )
  })

  it('mantém uma URL utilizável quando o caminho está vazio', () => {
    expect(buildApiUrl('', 'http://api.test/base/')).toBe(
      'http://api.test/base',
    )
    expect(buildApiUrl('', '/')).toBe('/')
  })
})

describe('apiRequest', () => {
  it('envia os cabeçalhos obrigatórios sem Content-Type em GET sem body', async () => {
    let capturedRequest
    server.use(
      http.get(`${TEST_API_BASE_URL}/cabecalhos`, ({ request }) => {
        capturedRequest = request
        return HttpResponse.json({ ok: true })
      }),
    )

    await expect(
      apiRequest('/cabecalhos', {
        token: 'token-seguro',
        protectedRequest: true,
      }),
    ).resolves.toEqual({ ok: true })

    expect(capturedRequest.headers.get('accept')).toBe('application/json')
    expect(capturedRequest.headers.get('authorization')).toBe(
      'Bearer token-seguro',
    )
    expect(capturedRequest.headers.has('content-type')).toBe(false)
  })

  it('serializa somente o body JSON informado e preserva cabeçalhos adicionais', async () => {
    let capturedBody
    let capturedHeaders
    server.use(
      http.post(`${TEST_API_BASE_URL}/eco`, async ({ request }) => {
        capturedBody = await request.json()
        capturedHeaders = request.headers
        return HttpResponse.json({ mensagem: 'Recebido.' }, { status: 201 })
      }),
    )

    const result = await apiRequest('/eco', {
      method: 'post',
      body: { titulo: 'Dom Casmurro', autor: 'Machado de Assis' },
      headers: { 'X-Teste': 'ativo' },
    })

    expect(capturedBody).toEqual({
      titulo: 'Dom Casmurro',
      autor: 'Machado de Assis',
    })
    expect(capturedHeaders.get('content-type')).toBe('application/json')
    expect(capturedHeaders.get('x-teste')).toBe('ativo')
    expect(result).toEqual({ mensagem: 'Recebido.' })
  })

  it('retorna null para 204 sem tentar interpretar JSON', async () => {
    server.use(
      http.delete(
        `${TEST_API_BASE_URL}/sem-conteudo`,
        () => new HttpResponse(null, { status: 204 }),
      ),
    )

    await expect(
      apiRequest('/sem-conteudo', { method: 'DELETE' }),
    ).resolves.toBeNull()
  })

  it('transforma o campo erro em ApiError mesmo se o status for 200', async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/erro-de-protocolo`, () =>
        HttpResponse.json({ erro: 'Operação recusada.' }),
      ),
    )

    await expect(apiRequest('/erro-de-protocolo')).rejects.toMatchObject({
      name: 'ApiError',
      message: 'Operação recusada.',
      status: 200,
      code: 'HTTP_ERROR',
      data: { erro: 'Operação recusada.' },
    })
  })

  it('usa uma mensagem amigável para erro HTTP sem JSON', async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/falha-html`,
        () => new HttpResponse('<h1>Indisponível</h1>', { status: 503 }),
      ),
    )

    await expect(apiRequest('/falha-html')).rejects.toMatchObject({
      name: 'ApiError',
      status: 503,
      code: 'INVALID_RESPONSE',
      message: expect.stringMatching(/servidor/i),
    })
  })

  it('recusa resposta de sucesso que não seja JSON', async () => {
    server.use(
      http.get(
        `${TEST_API_BASE_URL}/sucesso-invalido`,
        () => new HttpResponse('ok', { status: 200 }),
      ),
    )

    await expect(apiRequest('/sucesso-invalido')).rejects.toMatchObject({
      name: 'ApiError',
      status: 200,
      code: 'INVALID_RESPONSE',
      message: expect.stringMatching(/resposta inválida/i),
    })
  })

  it('traduz falha de rede e mantém a causa original', async () => {
    server.use(
      http.get(`${TEST_API_BASE_URL}/sem-rede`, () => HttpResponse.error()),
    )

    let receivedError
    try {
      await apiRequest('/sem-rede')
    } catch (error) {
      receivedError = error
    }

    expect(receivedError).toBeInstanceOf(ApiError)
    expect(receivedError).toMatchObject({
      status: 0,
      code: 'NETWORK_ERROR',
      message: expect.stringMatching(/conectar/i),
    })
    expect(receivedError.cause).toBeInstanceOf(Error)
  })

  it('preserva AbortError para que TanStack Query trate o cancelamento', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(
      apiRequest('/livros', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })

  it('aciona expiração somente em 401 protegido e mantém o erro original', async () => {
    const unauthorized = vi.fn(() => {
      throw new Error('falha secundária ao limpar sessão')
    })
    setUnauthorizedHandler(unauthorized)
    server.use(
      http.get(`${TEST_API_BASE_URL}/protegido`, () =>
        HttpResponse.json({ erro: 'Token expirado.' }, { status: 401 }),
      ),
      http.post(`${TEST_API_BASE_URL}/publico`, () =>
        HttpResponse.json({ erro: 'Credenciais inválidas.' }, { status: 401 }),
      ),
    )

    await expect(
      apiRequest('/protegido', { protectedRequest: true }),
    ).rejects.toMatchObject({ status: 401, message: 'Token expirado.' })
    expect(unauthorized).toHaveBeenCalledOnce()

    await expect(
      apiRequest('/publico', { method: 'POST' }),
    ).rejects.toMatchObject({ status: 401, message: 'Credenciais inválidas.' })
    expect(unauthorized).toHaveBeenCalledOnce()
  })
})
