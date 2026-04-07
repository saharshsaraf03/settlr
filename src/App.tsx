import { Routes, Route } from 'react-router-dom'
import { LandingPage } from '@/pages/LandingPage'
import { LoginPage } from '@/pages/LoginPage'
import { SignupPage } from '@/pages/SignupPage'
import { SetupProfilePage } from '@/pages/SetupProfilePage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
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
            <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
              <p className="text-[#8b949e] text-lg">Dashboard coming soon</p>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}

export default App
