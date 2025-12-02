import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { VideoDetail } from './pages/VideoDetail'
import { VerifyEmailChange } from './pages/VerifyEmailChange'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider } from './contexts/ToastContext'

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/video/:id" element={<VideoDetail />} />
            <Route path="/verify-email" element={<VerifyEmailChange />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}

export default App

