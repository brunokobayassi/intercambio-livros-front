import { lazy, Suspense } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { LoadingSkeleton } from '../components/feedback/LoadingSkeleton'
import { AppShell } from '../components/layout/AppShell'
import { LoginPage } from '../features/auth/LoginPage'
import { ProtectedRoute } from '../features/auth/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/PublicOnlyRoute'
import { useAuth } from '../features/auth/useAuth'
import { exchangeKeys } from '../features/exchanges/exchange-query-keys'
import { exchangesApi } from '../services/exchanges-api'

const CatalogPage = lazy(() => import('../features/books/CatalogPage'))
const MyBooksPage = lazy(() => import('../features/books/MyBooksPage'))
const ExchangesPage = lazy(() => import('../features/exchanges/ExchangesPage'))

function PageFallback() {
  return (
    <div className="page page-fallback">
      <LoadingSkeleton variant="page" count={3} label="Carregando página" />
    </div>
  )
}

function LazyPage({ children }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>
}

function ProtectedLayout() {
  const { user, token, logout } = useAuth()
  const exchangesQuery = useQuery({
    queryKey: exchangeKeys.all(user.id),
    queryFn: ({ signal }) => exchangesApi.listExchanges(token, { signal }),
    staleTime: 30_000,
  })
  const pendingCount = exchangesQuery.data?.pendentes?.length ?? 0

  return (
    <AppShell user={user} pendingCount={pendingCount} onLogout={logout}>
      <Outlet />
    </AppShell>
  )
}

function FallbackRedirect() {
  const { isAuthenticated } = useAuth()
  return <Navigate to={isAuthenticated ? '/livros' : '/login'} replace />
}

export function AppRouter() {
  return (
    <Routes>
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<ProtectedLayout />}>
          <Route path="/livros" element={<LazyPage><CatalogPage /></LazyPage>} />
          <Route path="/meus-livros" element={<LazyPage><MyBooksPage /></LazyPage>} />
          <Route path="/trocas" element={<LazyPage><ExchangesPage /></LazyPage>} />
        </Route>
      </Route>

      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  )
}
