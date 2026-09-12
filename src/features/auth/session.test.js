import { describe, expect, it, vi } from 'vitest'
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  clearSession,
  isValidSession,
  isValidSessionUser,
  loadSession,
  saveSession,
} from './session.js'
import { TEST_SESSION } from '../../test/fixtures.js'

describe('validação estrutural da sessão', () => {
  it('aceita somente usuário completo com id inteiro positivo', () => {
    expect(isValidSessionUser(TEST_SESSION.user)).toBe(true)
    expect(isValidSession(TEST_SESSION)).toBe(true)

    expect(isValidSessionUser({ ...TEST_SESSION.user, id: 0 })).toBe(false)
    expect(isValidSessionUser({ ...TEST_SESSION.user, id: 1.5 })).toBe(false)
    expect(isValidSessionUser({ ...TEST_SESSION.user, nome: '   ' })).toBe(false)
    expect(isValidSessionUser({ ...TEST_SESSION.user, email: '' })).toBe(false)
    expect(isValidSessionUser([])).toBe(false)
    expect(isValidSession({ ...TEST_SESSION, token: ' ' })).toBe(false)
  })
})

describe('persistência da sessão', () => {
  it('salva e restaura apenas token, id, nome e email', () => {
    const canonical = saveSession({
      ...TEST_SESSION,
      refreshToken: 'não deve persistir',
      user: { ...TEST_SESSION.user, admin: true, avatar: 'externo.png' },
    })

    expect(canonical).toEqual(TEST_SESSION)
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBe(TEST_SESSION.token)
    expect(JSON.parse(localStorage.getItem(USER_STORAGE_KEY))).toEqual(
      TEST_SESSION.user,
    )
    expect(loadSession()).toEqual(TEST_SESSION)
  })

  it('não decodifica o JWT para reconstruir perfil', () => {
    const atob = vi.fn(() => {
      throw new Error('JWT não deve ser decodificado')
    })
    vi.stubGlobal('atob', atob)
    saveSession(TEST_SESSION)

    expect(loadSession()).toEqual(TEST_SESSION)
    expect(atob).not.toHaveBeenCalled()
  })

  it.each([
    ['token ausente', null, JSON.stringify(TEST_SESSION.user)],
    ['usuário ausente', TEST_SESSION.token, null],
    ['usuário corrompido', TEST_SESSION.token, '{json'],
    [
      'usuário incompleto',
      TEST_SESSION.token,
      JSON.stringify({ id: 1, nome: 'Camila' }),
    ],
  ])('limpa ambas as chaves quando há %s', (_case, token, user) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, token ?? '')
    if (user !== null) {
      localStorage.setItem(USER_STORAGE_KEY, user)
    }
    localStorage.setItem('preferencia_visual', 'preservar')

    expect(loadSession()).toBeNull()
    expect(localStorage.getItem(TOKEN_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem(USER_STORAGE_KEY)).toBeNull()
    expect(localStorage.getItem('preferencia_visual')).toBe('preservar')
  })

  it('tenta remover as duas chaves mesmo se a primeira remoção falhar', () => {
    const storage = {
      removeItem: vi.fn((key) => {
        if (key === TOKEN_STORAGE_KEY) {
          throw new Error('storage bloqueado')
        }
      }),
    }

    expect(() => clearSession(storage)).not.toThrow()
    expect(storage.removeItem).toHaveBeenNthCalledWith(1, TOKEN_STORAGE_KEY)
    expect(storage.removeItem).toHaveBeenNthCalledWith(2, USER_STORAGE_KEY)
  })

  it('remove dados parciais se a gravação falhar', () => {
    const storage = {
      setItem: vi.fn(() => {
        throw new Error('quota excedida')
      }),
      removeItem: vi.fn(),
    }

    expect(() => saveSession(TEST_SESSION, storage)).toThrow(/manter sua sessão/i)
    expect(storage.removeItem).toHaveBeenCalledWith(TOKEN_STORAGE_KEY)
    expect(storage.removeItem).toHaveBeenCalledWith(USER_STORAGE_KEY)
  })
})
