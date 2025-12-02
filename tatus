import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { OnboardingTutorial } from './components/OnboardingTutorial';

// Lazy load pages for better performance
const Landing = lazy(() => import('./pages/Landing').then(m => ({ default: m.Landing })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Search = lazy(() => import('./pages/Search').then(m => ({ default: m.Search })));
const Feed = lazy(() => import('./pages/Feed').then(m => ({ default: m.Feed })));
const VideoDetail = lazy(() => import('./pages/VideoDetail').then(m => ({ default: m.VideoDetail })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.Profile })));
const ShareVideo = lazy(() => import('./pages/ShareVideo').then(m => ({ default: m.ShareVideo })));
const Playlists = lazy(() => import('./pages/Playlists').then(m => ({ default: m.Playlists })));
const PlaylistDetail = lazy(() => import('./pages/PlaylistDetail').then(m => ({ default: m.PlaylistDetail })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const TestChecklist = lazy(() => import('./pages/TestChecklist').then(m => ({ default: m.TestChecklist })));
const ShareRedirect = lazy(() => import('./pages/ShareRedirect').then(m => ({ default: m.ShareRedirect })));
const RecentlyViewed = lazy(() => import('./pages/RecentlyViewed').then(m => ({ default: m.RecentlyViewed })));
const AdminSettings = lazy(() => import('./pages/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminErrorDashboard = lazy(() => import('./pages/AdminErrorDashboard').then(m => ({ default: m.AdminErrorDashboard })));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              <div className="min-h-screen bg-cream-light dark:bg-petflix-black transition-colors duration-200">
                <Navbar />
                <PWAInstallPrompt />
                <OnboardingTutorial />
              <Suspense 
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-cream-light dark:bg-petflix-black">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-lightblue dark:border-petflix-orange border-t-transparent"></div>
                      <p className="mt-4 text-charcoal dark:text-white">Loading...</p>
                    </div>
                  </div>
                }
              >
                <Routes>
            {/* Public Routes - Auth pages, landing page, search, and share links */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/search" element={<Search />} />
            <Route path="/s/:shareCode" element={<ShareRedirect />} />

            {/* Protected Routes - Everything else requires authentication */}
            <Route
              path="/video/:id"
              element={
                <ProtectedRoute>
                  <VideoDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/:userId"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feed"
              element={
                <ProtectedRoute>
                  <Feed />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recently-viewed"
              element={
                <ProtectedRoute>
                  <RecentlyViewed />
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
              path="/playlists/:playlistId"
              element={
                <ProtectedRoute>
                  <PlaylistDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/test-checklist"
              element={
                <ProtectedRoute>
                  <TestChecklist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <AdminSettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/errors"
              element={
                <ProtectedRoute>
                  <AdminErrorDashboard />
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

