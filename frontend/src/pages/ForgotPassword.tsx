import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSubmitted(true);
      toast.success('Check your email for password reset instructions');
    } catch (error: any) {
      console.error('Password reset request failed:', error);
      toast.error(error.response?.data?.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cream-light dark:bg-petflix-black px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            No worries, we'll send you reset instructions.
          </p>
        </div>

        {!submitted ? (
          <div className="bg-white dark:bg-petflix-dark rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:bg-petflix-dark-gray dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
                  placeholder="you@example.com"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-petflix-orange hover:bg-petflix-red text-white font-bold py-3"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link
                to="/login"
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-petflix-orange transition"
              >
                ← Back to Login
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-petflix-dark rounded-lg shadow-md p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <div className="text-5xl mb-4">✉️</div>
              <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
                Check Your Email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                We've sent password reset instructions to <strong>{email}</strong>
              </p>

              <div className="space-y-3">
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Didn't receive the email? Check your spam folder.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="text-sm text-petflix-orange hover:text-petflix-red font-medium transition"
                >
                  Try a different email address
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to="/login"
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-petflix-orange transition"
                >
                  ← Back to Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

