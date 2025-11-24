import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-navbar-light dark:bg-petflix-navbar-dark border-b border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-lightblue dark:text-petflix-orange hover:opacity-80 transition">
            <span className="text-3xl">🐾</span>
            <span className="text-3xl font-bold tracking-tight text-charcoal dark:text-white">PETFLIX</span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-6">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg className="w-6 h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            
            {user ? (
              <>
                <NotificationBell />
                <Link to="/search" className="text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  Search
                </Link>
                <Link to="/feed" className="text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  My Feed
                </Link>
                <Link to="/recently-viewed" className="text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  📺 Recent
                </Link>
                <Link to="/playlists" className="text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  📂 Playlists
                </Link>
                <Link to="/share" className="text-lightblue dark:text-petflix-orange hover:opacity-80 transition font-medium">
                  + Share
                </Link>
                <Link to={`/profile/${user.id}`} className="text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  Profile
                </Link>
                <Link to="/settings" className="text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  ⚙️ Settings
                </Link>
                {user.is_admin && (
                  <Link to="/admin/settings" className="text-purple-600 dark:text-purple-400 hover:opacity-80 transition font-medium">
                    👑 Admin
                  </Link>
                )}
                <Link to="/test-checklist" className="text-green-600 dark:text-green-400 hover:opacity-80 transition font-medium">
                  🧪 Tests
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-lightblue dark:bg-petflix-orange hover:opacity-90 text-charcoal dark:text-white font-bold rounded transition"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/search" className="text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  Browse
                </Link>
                <Link to="/test-checklist" className="text-green-600 dark:text-green-400 hover:opacity-80 transition font-medium">
                  🧪 Tests
                </Link>
                <Link
                  to="/login"
                  className="px-6 py-2 bg-lightblue dark:bg-petflix-orange hover:opacity-90 text-charcoal dark:text-white font-bold rounded transition"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
