import { describe, expect, it } from 'vitest'
import {
  BOOK_LIMITS,
  sanitizeBookPayload,
  validateBook,
} from './book-validation.js'

describe('sanitizeBookPayload', () => {
  it('aplica trim e envia somente título e autor', () => {
    expect(
      sanitizeBookPayload({
        titulo: '  Dom Casmurro  ',
        autor: '  Machado de Assis ',
        categoria: 'Clássico',
        usuarioId: 99,
      }),
    ).toEqual({ titulo: 'Dom Casmurro', autor: 'Machado de Assis' })
  })

  it('normaliza valores ausentes para strings vazias', () => {
    expect(sanitizeBookPayload()).toEqual({ titulo: '', autor: '' })
  })
})

describe('validateBook', () => {
  it('exige título e autor depois de aplicar trim', () => {
    expect(validateBook({ titulo: '   ', autor: '\n' })).toEqual({
      titulo: expect.stringMatching(/título/i),
      autor: expect.stringMatching(/autor/i),
    })
  })

  it('aceita exatamente os limites do banco', () => {
    expect(
      validateBook({
        titulo: 'T'.repeat(BOOK_LIMITS.title),
        autor: 'A'.repeat(BOOK_LIMITS.author),
      }),
    ).toEqual({})
  })

  it('recusa valores acima dos limites e cita os limites na mensagem', () => {
    const errors = validateBook({
      titulo: 'T'.repeat(BOOK_LIMITS.title + 1),
      autor: 'A'.repeat(BOOK_LIMITS.author + 1),
    })

    expect(errors.titulo).toContain(String(BOOK_LIMITS.title))
    expect(errors.autor).toContain(String(BOOK_LIMITS.author))
  })
})
