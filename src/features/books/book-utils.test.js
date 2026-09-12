import { describe, expect, it } from 'vitest'
import {
  BOOK_VISUALS,
  filterBooks,
  getBookVisual,
  getInitials,
  normalizeSearchText,
} from './book-utils.js'
import { CATALOG_BOOKS } from '../../test/fixtures.js'

describe('normalizeSearchText', () => {
  it('ignora caixa, acentos e espaços redundantes', () => {
    expect(normalizeSearchText('  CEM   Anos de SOLIDÃO  ')).toBe(
      'cem anos de solidao',
    )
  })

  it('tolera valores ausentes', () => {
    expect(normalizeSearchText(null)).toBe('')
    expect(normalizeSearchText(undefined)).toBe('')
  })
})

describe('filterBooks', () => {
  it.each([
    ['título sem acento', 'solidao', 4],
    ['autor em caixa diferente', 'MACHADO DE ASSIS', 3],
    ['proprietário sem acento', 'ana julia', 4],
  ])('filtra por %s', (_case, query, expectedId) => {
    expect(filterBooks(CATALOG_BOOKS, query).map((book) => book.id)).toEqual([
      expectedId,
    ])
  })

  it('retorna todos para busca vazia e uma lista vazia para entrada inválida', () => {
    expect(filterBooks(CATALOG_BOOKS, '   ')).toBe(CATALOG_BOOKS)
    expect(filterBooks(null, 'dom')).toEqual([])
  })
})

describe('getInitials', () => {
  it.each([
    ['Camila Silva', 'CS'],
    ['  Maria  das Dores  ', 'MD'],
    ['Lucas', 'L'],
    [{ nome: 'Ana Júlia' }, 'AJ'],
    [null, '?'],
  ])('gera iniciais para %j', (input, expected) => {
    expect(getInitials(input)).toBe(expected)
  })
})

describe('getBookVisual', () => {
  it('é determinístico e prioriza o id sobre alterações de título', () => {
    const first = getBookVisual({ id: 42, titulo: 'Título antigo' })
    const second = getBookVisual({ id: 42, titulo: 'Título novo' })

    expect(second).toEqual(first)
    expect(first).toEqual({ index: first.index, ...BOOK_VISUALS[first.index] })
  })

  it('normaliza o título usado como fallback', () => {
    expect(getBookVisual({ titulo: 'Ação' })).toEqual(
      getBookVisual({ titulo: 'acao' }),
    )
  })
})
