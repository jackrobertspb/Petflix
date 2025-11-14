import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const Feed = lazy(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const VideoDetail = lazy(() => import('./pages/VideoDetail').then(m => ({ default: m.VideoDetail })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const TestSheet = lazy(() => import('./pages/TestSheet').then(m => ({ default: m.TestSheet })));
const DebugAuth = lazy(() => import('./pages/DebugAuth').then(m => ({ default: m.DebugAuth })));
const ShareVideo = lazy(() => import('./pages/ShareVideo').then(m => ({ default: m.ShareVideo })));
const Playlists = lazy(() => import('./pages/Playlists').then(m => ({ default: m.Playlists })));
const PlaylistDetail = lazy(() => import('./pages/PlaylistDetail').then(m => ({ default: m.PlaylistDetail })));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen bg-cream dark:bg-petflix-black transition-colors duration-200">
                <Navbar />
              <Suspense 
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-cream dark:bg-petflix-black">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-lightblue dark:border-petflix-orange border-t-transparent"></div>
                      <p className="mt-4 text-charcoal dark:text-white">Loading...</p>
                    </div>
                  </div>
                }
              >
                <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<Search />} />
            <Route path="/video/:id" element={<VideoDetail />} />
            <Route path="/profile/:userId" element={<Profile />} />
            <Route path="/test" element={<TestSheet />} />
            <Route path="/debug" element={<DebugAuth />} />

            {/* Protected Routes */}
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/share"
              element={
                <ProtectedRoute>
                  <ShareVideo />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlists"
              element={
                <ProtectedRoute>
                  <Playlists />
                </ProtectedRoute>
              }
            />
            <Route
              path="/playlist/:playlistId"
              element={
                <ProtectedRoute>
                  <PlaylistDetail />
                </ProtectedRoute>
              }
            />
                </Routes>
              </Suspense>
              </div>
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;

