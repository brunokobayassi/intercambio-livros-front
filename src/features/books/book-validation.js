export const BOOK_LIMITS = Object.freeze({ title: 150, author: 100 })

export function sanitizeBookPayload(values) {
  return {
    titulo: String(values?.titulo ?? '').trim(),
    autor: String(values?.autor ?? '').trim(),
  }
}

export function validateBook(values) {
  const payload = sanitizeBookPayload(values)
  const errors = {}

  if (!payload.titulo) {
    errors.titulo = 'Informe o título do livro.'
  } else if (payload.titulo.length > BOOK_LIMITS.title) {
    errors.titulo = `O título deve ter no máximo ${BOOK_LIMITS.title} caracteres.`
  }

  if (!payload.autor) {
    errors.autor = 'Informe o autor do livro.'
  } else if (payload.autor.length > BOOK_LIMITS.author) {
    errors.autor = `O autor deve ter no máximo ${BOOK_LIMITS.author} caracteres.`
  }

  return errors
}
