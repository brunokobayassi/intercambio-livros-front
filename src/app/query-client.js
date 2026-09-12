import { QueryClient } from '@tanstack/react-query'

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 20_000,
        retry: (failureCount, error) => {
          if (error?.status >= 400 && error.status < 500) return false
          return failureCount < 1
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}

export const appQueryClient = createAppQueryClient()
