import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  // Check for persisted error from previous attempt
  useEffect(() => {
    const persistedError = localStorage.getItem('login_error');
    if (persistedError) {
      console.log('🔴 Found persisted error:', persistedError);
      setError(persistedError);
      localStorage.removeItem('login_error');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Clear any previous errors
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting login...');
      await login(email, password);
      console.log('✅ Login successful, navigating to home...');
      localStorage.removeItem('login_error'); // Clear any old errors
      // Always redirect to home after login
      navigate('/', { replace: true });
    } catch (err: any) {
      console.error('❌ Login failed:', err);
      const errorMessage = err.message || 'Invalid email or password. Please try again.';
      console.log('📢 Setting error message:', errorMessage);
      
      // Persist error to localStorage in case of unexpected refresh
      localStorage.setItem('login_error', errorMessage);
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center px-4 pt-20">
      <div className="max-w-md w-full bg-white dark:bg-petflix-dark rounded-lg p-16 backdrop-blur-sm shadow-xl border border-gray-200 dark:border-gray-700">
        <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-8">
          Sign In
        </h1>

        {error && (
          <div className="bg-red-600 text-white px-4 py-3 rounded mb-6 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-4 bg-gray-100 dark:bg-petflix-dark-gray text-charcoal dark:text-white border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
              placeholder="Email"
              required
            />
          </div>

          <div className="relative flex items-center">
            <Input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-4 pr-12 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
              placeholder="Password"
              required
            />
            <button
              type="button"
              onClick={() => password && setShowPassword(!showPassword)}
              disabled={!password}
              className="absolute right-4 text-gray-500 dark:text-gray-400 hover:text-charcoal dark:hover:text-white disabled:opacity-30 transition-colors"
              aria-label="Toggle password visibility"
            >
              {showPassword ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          <div className="flex justify-end">
            <Link 
              to="/forgot-password" 
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-petflix-orange transition"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold py-4"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <span className="text-gray-600 dark:text-gray-400">New to Petflix? </span>
          <Link to="/register" className="text-charcoal dark:text-white hover:underline font-medium">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
};
