import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { ToastProvider } from '../components/feedback/ToastProvider'
import { AuthProvider } from '../features/auth/AuthContext'
import { appQueryClient } from './query-client'

export function AppProviders({ children, queryClient = appQueryClient }) {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider queryClient={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  )
}
