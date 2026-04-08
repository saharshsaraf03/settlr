import { StrictMode, Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/context/AuthContext'
import { AppProvider } from '@/context/AppContext'
import { Toaster } from '@/components/ui/sonner'
import './index.css'
import App from './App.tsx'

// Force dark mode globally
document.documentElement.classList.add('dark')

// Error boundary to catch render errors and show a visible message
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Settlr] Render error:', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-8">
          <div className="max-w-md w-full bg-[#161b27] border border-white/10 rounded-2xl p-6 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h1 className="text-white font-bold text-lg mb-2">Something went wrong</h1>
            <p className="text-white/50 text-sm mb-4">{this.state.error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-[#1cc29f] hover:bg-[#16a589] text-white px-5 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              Reload page
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <AppProvider>
              <App />
              <Toaster position="bottom-right" />
            </AppProvider>
          </AuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>,
)
