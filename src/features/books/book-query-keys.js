/** Centralized TanStack Query keys for the books domain. */
export const bookKeys = {
  all: ['livros'],
  detail: (id) => ['livros', 'detail', id],
  mine: (userId) => ['meus-livros', userId],
}

