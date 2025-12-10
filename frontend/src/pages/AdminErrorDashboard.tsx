import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { formatRelativeTime } from '../lib/dateUtils';

interface ErrorLog {
  id: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  stack?: string;
  context?: Record<string, any>;
  user_id?: string;
  endpoint?: string;
  method?: string;
  status_code?: number;
  created_at: string;
}

interface ErrorStats {
  summary: {
    total: number;
    byLevel: {
      error: number;
      warn: number;
      info: number;
    };
    days: number;
  };
  hourlyRate: Array<{
    hour: string;
    error: number;
    warn: number;
    info: number;
  }>;
  topEndpoints: Array<{
    endpoint: string;
    count: number;
  }>;
}

export const AdminErrorDashboard = () => {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [stats, setStats] = useState<ErrorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  const [selectedError, setSelectedError] = useState<ErrorLog | null>(null);

  // Filters
  const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warn' | 'info'>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Check if user is admin
  useEffect(() => {
    if (!user?.is_admin) {
      toast.error('Admin access required');
      navigate('/');
    } else {
      loadErrors();
      loadStats();
    }
  }, [user, navigate, toast, levelFilter, page]);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (levelFilter !== 'all') {
        params.append('level', levelFilter);
      }

      const response = await api.get(`/admin/errors?${params.toString()}`);
      setErrors(response.data.errors);
      setTotalPages(response.data.pagination.totalPages);
    } catch (error: any) {
      console.error('Failed to load errors:', error);
      toast.error('Failed to load error logs');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const response = await api.get('/admin/errors/stats?days=7');
      setStats(response.data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    try {
      const response = await api.post('/admin/errors/export', {
        format,
        level: levelFilter !== 'all' ? levelFilter : undefined,
      }, {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `error-logs-${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success(`Exported as ${format.toUpperCase()}`);
    } catch (error: any) {
      console.error('Failed to export:', error);
      toast.error('Failed to export error logs');
    }
  };

  const handleClearOldLogs = async () => {
    if (!confirm('Delete error logs older than 30 days?')) return;

    try {
      const response = await api.delete('/admin/errors?olderThan=30');
      toast.success(`Deleted ${response.data.deleted} old error logs`);
      loadErrors();
      loadStats();
    } catch (error: any) {
      console.error('Failed to clear logs:', error);
      toast.error('Failed to clear old logs');
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/20';
      case 'warn': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/20';
      case 'info': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  if (loading && !errors.length) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-petflix-orange dark:border-petflix-orange border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 md:px-16 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">
            Error Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Monitor application errors and performance issues
          </p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Total Errors"
              value={stats.summary.total}
              subtitle={`Last ${stats.summary.days} days`}
              color="gray"
            />
            <StatsCard
              title="Errors"
              value={stats.summary.byLevel.error}
              subtitle="Critical issues"
              color="red"
            />
            <StatsCard
              title="Warnings"
              value={stats.summary.byLevel.warn}
              subtitle="Potential issues"
              color="yellow"
            />
            <StatsCard
              title="Info"
              value={stats.summary.byLevel.info}
              subtitle="Informational"
              color="blue"
            />
          </div>
        )}

        {/* Top Endpoints */}
        {stats && stats.topEndpoints.length > 0 && (
          <div className="bg-white dark:bg-petflix-dark-gray rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-charcoal dark:text-white mb-4">
              Top Error-Prone Endpoints
            </h2>
            <div className="space-y-2">
              {stats.topEndpoints.map((endpoint, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="font-mono text-sm text-charcoal dark:text-white">
                    {endpoint.endpoint}
                  </span>
                  <span className="font-bold text-red-600 dark:text-red-400">
                    {endpoint.count} errors
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-petflix-dark-gray rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Level Filter */}
            <div className="flex items-center gap-2">
              <label className="font-medium text-charcoal dark:text-white">Filter:</label>
              <select
                value={levelFilter}
                onChange={(e) => {
                  setLevelFilter(e.target.value as any);
                  setPage(1);
                }}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-charcoal dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
              >
                <option value="all">All Levels</option>
                <option value="error">Errors Only</option>
                <option value="warn">Warnings Only</option>
                <option value="info">Info Only</option>
              </select>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleExport('json')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
              >
                📥 Export JSON
              </button>
              <button
                onClick={() => handleExport('csv')}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
              >
                📥 Export CSV
              </button>
              <button
                onClick={handleClearOldLogs}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Clear Old
              </button>
            </div>
          </div>
        </div>

        {/* Error List */}
        <div className="bg-white dark:bg-petflix-dark-gray rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 dark:bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Message
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {errors.map((error) => (
                  <tr key={error.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${getLevelColor(error.level)}`}>
                        {error.level.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-charcoal dark:text-white max-w-md truncate">
                        {error.message}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-mono text-gray-600 dark:text-gray-400">
                        {error.endpoint || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                      {formatRelativeTime(new Date(error.created_at))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedError(error)}
                        className="text-petflix-orange dark:text-petflix-orange hover:underline"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-charcoal dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600 dark:text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-charcoal dark:text-white rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </div>

        {/* Error Detail Modal */}
        {selectedError && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-8 z-50" onClick={() => setSelectedError(null)}>
            <div className="bg-white dark:bg-petflix-dark-gray rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-charcoal dark:text-white">
                  Error Details
                </h2>
                <button
                  onClick={() => setSelectedError(null)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <DetailRow label="Level" value={selectedError.level.toUpperCase()} />
                <DetailRow label="Message" value={selectedError.message} />
                <DetailRow label="Endpoint" value={selectedError.endpoint || 'N/A'} />
                <DetailRow label="Method" value={selectedError.method || 'N/A'} />
                <DetailRow label="Status Code" value={selectedError.status_code?.toString() || 'N/A'} />
                <DetailRow label="Time" value={new Date(selectedError.created_at).toLocaleString()} />
                
                {selectedError.stack && (
                  <div>
                    <label className="font-bold text-charcoal dark:text-white mb-2 block">Stack Trace:</label>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto text-charcoal dark:text-white">
                      {selectedError.stack}
                    </pre>
                  </div>
                )}

                {selectedError.context && Object.keys(selectedError.context).length > 0 && (
                  <div>
                    <label className="font-bold text-charcoal dark:text-white mb-2 block">Context:</label>
                    <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-xs overflow-x-auto text-charcoal dark:text-white">
                      {JSON.stringify(selectedError.context, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, subtitle, color }: { title: string; value: number; subtitle: string; color: string }) => {
  const colorClasses = {
    gray: 'border-gray-300 dark:border-gray-700',
    red: 'border-red-500 dark:border-red-400',
    yellow: 'border-yellow-500 dark:border-yellow-400',
    blue: 'border-blue-500 dark:border-blue-400',
  };

  return (
    <div className={`bg-white dark:bg-petflix-dark-gray rounded-lg shadow-lg p-6 border-l-4 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{title}</div>
      <div className="text-3xl font-bold text-charcoal dark:text-white mb-1">{value.toLocaleString()}</div>
      <div className="text-xs text-gray-500 dark:text-gray-500">{subtitle}</div>
    </div>
  );
};

// Detail Row Component
const DetailRow = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="font-bold text-charcoal dark:text-white">{label}:</label>
    <div className="text-gray-700 dark:text-gray-300 mt-1">{value}</div>
  </div>
);

export default AdminErrorDashboard;

