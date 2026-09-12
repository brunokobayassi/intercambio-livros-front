import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ToastProvider } from '../components/feedback/ToastProvider.jsx'
import { AuthProvider } from '../features/auth/AuthContext.jsx'
import { saveSession } from '../features/auth/session.js'
import { TEST_SESSION } from './fixtures.js'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}

export function seedSession(session = TEST_SESSION) {
  return saveSession(session)
}

export function renderWithProviders(
  ui,
  {
    initialEntries = ['/'],
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {},
) {
  const user = userEvent.setup()
  const result = render(
    <MemoryRouter initialEntries={initialEntries}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider queryClient={queryClient}>
          <ToastProvider>{ui}</ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </MemoryRouter>,
    renderOptions,
  )

  return { ...result, queryClient, user }
}
