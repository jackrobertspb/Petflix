import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-navbar-light dark:bg-petflix-navbar-dark border-b border-gray-200 dark:border-gray-800 shadow-lg overflow-x-hidden">
      <div className="px-4 sm:px-6 md:px-8 py-3 md:py-4 max-w-full">
        <div className="flex items-center justify-between w-full">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 sm:gap-2 text-lightblue dark:text-petflix-orange hover:opacity-80 transition flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
            <span className="text-2xl sm:text-3xl">🐾</span>
            <span className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-charcoal dark:text-white whitespace-nowrap">PETFLIX</span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle theme"
              title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {theme === 'light' ? (
                <svg className="w-5 h-5 xl:w-6 xl:h-6 text-charcoal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              ) : (
                <svg className="w-5 h-5 xl:w-6 xl:h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              )}
            </button>
            
            {user ? (
              <>
                <NotificationBell />
                <Link to="/search" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  Search
                </Link>
                <Link to="/feed" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  My Feed
                </Link>
                <Link to="/recently-viewed" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  📺 Recent
                </Link>
                <Link to="/playlists" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  📂 Playlists
                </Link>
                <Link to="/share" className="text-sm xl:text-base text-lightblue dark:text-petflix-orange hover:opacity-80 transition font-medium">
                  + Share
                </Link>
                <Link to={`/profile/${user.id}`} className="text-sm xl:text-base text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  Profile
                </Link>
                <Link to="/settings" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  ⚙️ Settings
                </Link>
                <button
                  onClick={handleLogout}
                  className="px-3 xl:px-4 py-1.5 xl:py-2 bg-lightblue dark:bg-petflix-orange hover:opacity-90 text-charcoal dark:text-white font-bold rounded transition text-sm xl:text-base"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link to="/search" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-lightblue dark:hover:text-gray-300 transition font-medium">
                  Browse
                </Link>
                <Link
                  to="/login"
                  className="px-4 xl:px-6 py-1.5 xl:py-2 bg-lightblue dark:bg-petflix-orange hover:opacity-90 text-charcoal dark:text-white font-bold rounded transition text-sm xl:text-base"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && <NotificationBell />}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <svg className="w-6 h-6 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-col gap-3">
              <button
                onClick={toggleTheme}
                className="flex items-center gap-3 px-4 py-2 text-left text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition"
              >
                {theme === 'light' ? '🌙' : '☀️'} {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
              </button>
              
              {user ? (
                <>
                  <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    Search
                  </Link>
                  <Link to="/feed" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    My Feed
                  </Link>
                  <Link to="/recently-viewed" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    📺 Recent
                  </Link>
                  <Link to="/playlists" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    📂 Playlists
                  </Link>
                  <Link to="/share" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-lightblue dark:text-petflix-orange hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    + Share
                  </Link>
                  <Link to={`/profile/${user.id}`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    Profile
                  </Link>
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    ⚙️ Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-lightblue dark:bg-petflix-orange text-charcoal dark:text-white font-bold rounded-lg transition text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link to="/search" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    Browse
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-2 bg-lightblue dark:bg-petflix-orange text-charcoal dark:text-white font-bold rounded-lg transition text-center"
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
