import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { EmptyState } from '../components/EmptyState';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  user_id: string;
  created_at: string;
  video_count?: number;
}

export const Playlists = () => {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'private'>('public');
  const [creating, setCreating] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    if (user) {
      fetchPlaylists();
    }
  }, [user]);

  const fetchPlaylists = async () => {
    if (!user) return;
    
    try {
      const response = await api.get(`/playlists/user/${user.id}`);
      setPlaylists(response.data.playlists || []);
    } catch (error) {
      console.error('Failed to load playlists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    setCreating(true);
    try {
      await api.post('/playlists', {
        name: newPlaylistName,
        description: newPlaylistDescription || null,
        visibility: visibility,
      });

      // Reset form and close modal
      setNewPlaylistName('');
      setNewPlaylistDescription('');
      setVisibility('public');
      setShowCreateModal(false);

      // Refresh playlists
      fetchPlaylists();
      toast.success('Playlist created successfully');
    } catch (error) {
      console.error('Failed to create playlist:', error);
      toast.error('Failed to create playlist');
    } finally {
      setCreating(false);
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      await api.delete(`/playlists/${playlistId}`);
      setPlaylists(playlists.filter(p => p.id !== playlistId));
      toast.success('Playlist deleted successfully');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-24">
        <div className="text-center">
          <p className="text-xl text-white mb-4">Sign in to view your playlists</p>
          <Link to="/login" className="text-petflix-orange hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 md:px-16 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">
              My Playlists 📂
            </h1>
            <p className="text-gray-700 dark:text-gray-400">Organize your favorite pet videos</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition"
          >
            + Create Playlist
          </button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-xl text-gray-600 dark:text-gray-400">Loading playlists...</div>
          </div>
        ) : playlists.length === 0 ? (
          <EmptyState
            icon="📂"
            title="No Playlists Yet"
            description="Create your first playlist to start organizing your favorite pet videos!"
            actionText="Create Playlist"
            onAction={() => setShowCreateModal(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playlists.map((playlist) => (
              <div
                key={playlist.id}
                className="bg-gray-50 dark:bg-petflix-dark rounded-lg p-6 hover:bg-gray-100 dark:hover:bg-petflix-dark-gray transition group border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <Link
                      to={`/playlist/${playlist.id}`}
                      className="text-xl font-bold text-charcoal dark:text-white hover:text-lightblue dark:hover:text-petflix-orange transition group-hover:underline"
                    >
                      {playlist.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-700 dark:text-gray-400">
                        {playlist.video_count || 0} videos
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <span className={`text-xs px-2 py-1 rounded ${
                        playlist.visibility === 'public' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-500 dark:bg-gray-600 text-white'
                      }`}>
                        {playlist.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeletePlaylist(playlist.id)}
                    className="text-gray-500 dark:text-gray-400 hover:text-red-500 transition ml-2"
                    title="Delete playlist"
                  >
                    🗑️
                  </button>
                </div>

                {playlist.description && (
                  <p className="text-gray-700 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                    {playlist.description}
                  </p>
                )}

                <Link
                  to={`/playlist/${playlist.id}`}
                  className="inline-block text-sm text-lightblue dark:text-petflix-orange hover:underline"
                >
                  View Playlist →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-6">
              Create New Playlist
            </h2>

            <form onSubmit={handleCreatePlaylist}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Playlist Name *
                </label>
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange focus:outline-none border border-gray-300 dark:border-gray-600"
                  placeholder="My Favorite Pets"
                  required
                  maxLength={100}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={newPlaylistDescription}
                  onChange={(e) => setNewPlaylistDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white rounded focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange focus:outline-none resize-none border border-gray-300 dark:border-transparent"
                  placeholder="A collection of the cutest pet videos..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibility === 'public'}
                    onChange={(e) => setVisibility(e.target.checked ? 'public' : 'private')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Make this playlist public
                  </span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium rounded transition"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating || !newPlaylistName.trim()}
                  className="flex-1 px-4 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

