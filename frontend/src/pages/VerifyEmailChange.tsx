import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useAuth } from '../contexts/AuthContext';

export const VerifyEmailChange = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  const navigate = useNavigate();
  const toast = useToast();
  const { user, updateUser } = useAuth();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setStatus('error');
      setMessage('Invalid verification link. No token provided.');
      setLoading(false);
      return;
    }

    setToken(tokenParam);
    verifyEmail(tokenParam);
  }, [searchParams]);

  const verifyEmail = async (verificationToken: string) => {
    try {
      const response = await api.post('/auth/verify-email', {
        token: verificationToken,
      });

      setStatus('success');
      setMessage('Your email address has been successfully updated!');
      toast.success('Email address updated successfully!');

      // Update user in context if logged in
      if (user && response.data?.user) {
        updateUser(response.data.user);
      }

      // Redirect to settings after 3 seconds
      setTimeout(() => {
        navigate('/settings');
      }, 3000);
    } catch (error: any) {
      console.error('Email verification failed:', error);
      setStatus('error');
      const errorMessage = error.response?.data?.message || 'Failed to verify email address';
      setMessage(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-light dark:bg-petflix-black px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">
            {status === 'verifying' ? '✉️' : status === 'success' ? '✅' : '❌'}
          </h1>
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-2">
            {status === 'verifying' && 'Verifying Email Change'}
            {status === 'success' && 'Email Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
        </div>

        <div className="bg-white dark:bg-petflix-dark rounded-lg p-8 border border-gray-200 dark:border-transparent">
          {loading && status === 'verifying' ? (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-petflix-orange dark:border-petflix-orange border-t-transparent mb-4"></div>
              <p className="text-charcoal dark:text-white">Verifying your email address...</p>
            </div>
          ) : status === 'success' ? (
            <div className="text-center">
              <p className="text-green-600 dark:text-green-400 mb-4 font-medium">
                {message}
              </p>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Redirecting to settings...
              </p>
              <Link
                to="/settings"
                className="inline-block px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition"
              >
                Go to Settings
              </Link>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-red-600 dark:text-red-400 mb-4 font-medium">
                {message}
              </p>
              <div className="space-y-3">
                <Link
                  to="/settings"
                  className="block px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition text-center"
                >
                  Go to Settings
                </Link>
                <Link
                  to="/"
                  className="block px-6 py-3 bg-gray-200 dark:bg-petflix-gray hover:bg-gray-300 dark:hover:bg-gray-700 text-charcoal dark:text-white font-medium rounded-lg transition text-center"
                >
                  Go Home
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};


