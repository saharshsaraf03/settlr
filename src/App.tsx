import { Routes, Route, Navigate } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { SetupProfilePage } from '@/pages/SetupProfilePage'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/components/AppLayout'
import { DashboardPage } from '@/pages/DashboardPage'
import { GroupDetailPage } from '@/pages/GroupDetailPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
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
        <Route index element={<div className="p-8 text-white">All Expenses coming soon</div>} />
      </Route>
    </Routes>
  )
}

export default App
