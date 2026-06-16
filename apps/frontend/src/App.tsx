import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { queryClient } from './lib/queryClient'
import { Navbar } from './components'
import { Markets, MarketDetails, Portfolio, CreateMarket, Login } from './pages'
import { DepositModal, WithdrawModal, SplitModal, MergeModal } from './components'
import { useSessionStore } from './stores'
import { Sparkles } from 'lucide-react'

function App() {
  const { isAuthenticated, isLoading, initializeAuth } = useSessionStore()

  useEffect(() => {
    initializeAuth()
  }, [])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="p-4 rounded-full bg-linear-to-br from-surface to-surface-elevated border border-border/50 shadow-xl animate-pulse">
            <Sparkles className="h-8 w-8 text-accent" />
          </div>
          <div className="text-secondary-text font-semibold">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-background">
          {isAuthenticated && <Navbar />}
          <Routes>
            <Route
              path="/login"
              element={!isAuthenticated ? <Login /> : <Navigate to="/" />}
            />
            <Route
              path="/"
              element={isAuthenticated ? <Markets /> : <Navigate to="/login" />}
            />
            <Route
              path="/market/:id"
              element={isAuthenticated ? <MarketDetails /> : <Navigate to="/login" />}
            />
            <Route
              path="/portfolio"
              element={isAuthenticated ? <Portfolio /> : <Navigate to="/login" />}
            />
            <Route
              path="/create"
              element={isAuthenticated ? <CreateMarket /> : <Navigate to="/login" />}
            />
          </Routes>
          <DepositModal />
          <WithdrawModal />
          <SplitModal />
          <MergeModal />
          <Toaster position="bottom-right" theme="dark" />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

export default App
