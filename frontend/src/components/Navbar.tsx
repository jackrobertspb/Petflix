import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { NotificationBell } from './NotificationBell';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  return (
    <nav className="fixed top-0 w-full z-50 transition-all duration-300 bg-navbar-light dark:bg-petflix-navbar-dark border-b border-gray-200 dark:border-gray-800 shadow-lg">
      <div className="px-4 sm:px-6 md:px-8 py-3 md:py-4 max-w-full overflow-visible">
        <div className="flex items-center justify-between w-full overflow-visible">
          {/* Logo */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/" className="flex items-center gap-1 sm:gap-2 hover:opacity-80 transition flex-shrink-0" onClick={() => setMobileMenuOpen(false)}>
              <span 
                className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-petflix-orange dark:text-petflix-orange whitespace-nowrap" 
                style={{ 
                  letterSpacing: '-0.05em',
                  transform: 'scaleY(1.15) scaleX(0.95)',
                  display: 'inline-block'
                }}
              >
                PETFLIX
              </span>
            </Link>
            {user && (
              <Link
                to="/share"
                className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Share video"
              >
                <svg className="w-5 h-5 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-sm font-medium text-charcoal dark:text-white">Share</span>
              </Link>
            )}
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-4 xl:gap-6 overflow-visible">
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
                <Link to="/search" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-petflix-orange dark:hover:text-gray-300 transition font-medium">
                  Search
                </Link>
                <Link to="/feed" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-petflix-orange dark:hover:text-gray-300 transition font-medium">
                  My Feed
                </Link>
                <Link to="/share" className="text-sm xl:text-base text-petflix-orange dark:text-petflix-orange hover:opacity-80 transition font-medium">
                  Share
                </Link>
                
                {/* User Profile Menu */}
                <div className="relative" ref={userMenuRef} style={{ minWidth: 'fit-content' }}>
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center justify-center w-10 h-10 rounded-full overflow-hidden border-2 border-gray-300 dark:border-gray-600 hover:border-petflix-orange dark:hover:border-white transition"
                    aria-label="User menu"
                  >
                    {user.profile_picture_url ? (
                      <img
                        src={user.profile_picture_url}
                        alt={user.username || 'Profile'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#e5e7eb] dark:bg-[#e5e7eb] flex items-center justify-center">
                        <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 512 512">
                          <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87c-11.84 43.42 3.64 85.22 34.58 93.36z"/>
                        </svg>
                      </div>
                    )}
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 min-w-[12rem] bg-white dark:bg-petflix-dark-gray border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[100] overflow-visible">
                      <Link
                        to={`/profile/${user.id}`}
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-petflix-gray transition"
                      >
                        Profile
                      </Link>
                      <Link
                        to="/playlists"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-petflix-gray transition"
                      >
                        Playlists
                      </Link>
                      {isOffline && (
                        <Link
                          to="/recently-viewed"
                          onClick={() => setUserMenuOpen(false)}
                          className="block px-4 py-3 text-sm text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-petflix-gray transition"
                        >
                          Recently Viewed
                        </Link>
                      )}
                      <Link
                        to="/settings"
                        onClick={() => setUserMenuOpen(false)}
                        className="block px-4 py-3 text-sm text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-petflix-gray transition"
                      >
                        Settings
                      </Link>
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            handleLogout();
                          }}
                          className="w-full text-left px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-petflix-gray transition font-medium"
                        >
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/search" className="text-sm xl:text-base text-charcoal dark:text-white hover:text-petflix-orange dark:hover:text-gray-300 transition font-medium">
                  Browse
                </Link>
                <Link
                  to="/login"
                  className="px-4 xl:px-6 py-1.5 xl:py-2 bg-petflix-orange dark:bg-petflix-orange hover:opacity-90 text-white dark:text-white font-bold rounded transition text-sm xl:text-base"
                >
                  Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <>
                <Link
                  to="/search"
                  className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                  aria-label="Search"
                >
                  <svg className="w-6 h-6 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </Link>
                <NotificationBell />
              </>
            )}
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
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition self-start"
                aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
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
                  <Link to="/feed" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    My Feed
                  </Link>
                  <Link to={`/profile/${user.id}`} onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    Profile
                  </Link>
                  <Link to="/playlists" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    Playlists
                  </Link>
                  {isOffline && (
                    <Link to="/recently-viewed" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                      Recently Viewed
                    </Link>
                  )}
                  <Link to="/settings" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-charcoal dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition">
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-petflix-orange dark:bg-petflix-orange text-white dark:text-white font-bold rounded-lg transition text-left"
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
                    className="px-4 py-2 bg-petflix-orange dark:bg-petflix-orange text-white dark:text-white font-bold rounded-lg transition text-center"
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
