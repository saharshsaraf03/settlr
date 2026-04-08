import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { SetupProfilePage } from '@/pages/SetupProfilePage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { GroupDetailPage } from '@/pages/GroupDetailPage'
import { MyExpensesPage } from '@/pages/MyExpensesPage'
import { JoinGroupPage } from '@/pages/JoinGroupPage'
import { useAuth } from '@/context/AuthContext'

function RootRoute() {
  const { user, loading } = useAuth()
  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/10 border-t-[#1cc29f] rounded-full animate-spin" />
      </div>
    )
  }
  return user ? <Navigate to="/dashboard" replace /> : <LandingPage />
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route path="/login" element={<Navigate to="/" replace />} />
      <Route path="/signup" element={<Navigate to="/" replace />} />
      <Route
        path="/setup-profile"
        element={
          <ProtectedRoute requireProfile={false}>
            <SetupProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
      </Route>
      <Route
        path="/groups/:id"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<GroupDetailPage />} />
      </Route>
      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<div className="p-8 text-white">Recent Activity coming soon</div>} />
      </Route>
      <Route
        path="/expenses"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<MyExpensesPage />} />
      </Route>
      {/* Public route — handles both authed and unauthed users */}
      <Route path="/join/:inviteCode" element={<JoinGroupPage />} />
    </Routes>
  )
}

export default App
