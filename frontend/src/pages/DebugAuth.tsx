import { useAuth } from '../contexts/AuthContext';

export const DebugAuth = () => {
  const { user, token } = useAuth();

  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');

  return (
    <div className="min-h-screen bg-petflix-black pt-24 px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">🐛 Auth Debug Info</h1>

        <div className="space-y-6">
          {/* Current User from Context */}
          <div className="bg-petflix-dark rounded-lg p-6">
            <h2 className="text-xl font-bold text-petflix-orange mb-4">Current User (from Context)</h2>
            <pre className="bg-petflix-gray p-4 rounded text-white text-sm overflow-auto">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>

          {/* Token */}
          <div className="bg-petflix-dark rounded-lg p-6">
            <h2 className="text-xl font-bold text-petflix-orange mb-4">Token (from Context)</h2>
            <pre className="bg-petflix-gray p-4 rounded text-white text-sm overflow-auto break-all">
              {token || 'null'}
            </pre>
          </div>

          {/* LocalStorage User */}
          <div className="bg-petflix-dark rounded-lg p-6">
            <h2 className="text-xl font-bold text-petflix-orange mb-4">Stored User (from localStorage)</h2>
            <pre className="bg-petflix-gray p-4 rounded text-white text-sm overflow-auto">
              {storedUser || 'null'}
            </pre>
          </div>

          {/* LocalStorage Token */}
          <div className="bg-petflix-dark rounded-lg p-6">
            <h2 className="text-xl font-bold text-petflix-orange mb-4">Stored Token (from localStorage)</h2>
            <pre className="bg-petflix-gray p-4 rounded text-white text-sm overflow-auto break-all">
              {storedToken || 'null'}
            </pre>
          </div>

          {/* User Fields Check */}
          {user && (
            <div className="bg-petflix-dark rounded-lg p-6">
              <h2 className="text-xl font-bold text-petflix-orange mb-4">User Fields</h2>
              <div className="space-y-2 text-white">
                <div className="flex gap-4">
                  <span className="font-bold w-32">ID:</span>
                  <span className="text-green-400">{user.id || '❌ undefined'}</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-bold w-32">Username:</span>
                  <span className="text-green-400">{user.username || '❌ undefined'}</span>
                </div>
                <div className="flex gap-4">
                  <span className="font-bold w-32">Email:</span>
                  <span className="text-green-400">{user.email || '❌ undefined'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = '/';
            }}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition"
          >
            Clear All & Logout
          </button>
        </div>
      </div>
    </div>
  );
};

