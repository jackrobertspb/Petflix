import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { EmptyState } from '../components/EmptyState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [playlistToDelete, setPlaylistToDelete] = useState<string | null>(null);
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

  const handleDeletePlaylistClick = (playlistId: string) => {
    setPlaylistToDelete(playlistId);
    setShowDeleteModal(true);
  };

  const handleDeletePlaylist = async () => {
    if (!playlistToDelete) return;

    try {
      await api.delete(`/playlists/${playlistToDelete}`);
      setPlaylists(playlists.filter(p => p.id !== playlistToDelete));
      toast.success('Playlist deleted successfully');
      setShowDeleteModal(false);
      setPlaylistToDelete(null);
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-20 sm:pt-24 px-4">
        <div className="text-center">
          <p className="text-lg sm:text-xl text-charcoal dark:text-white mb-4">Sign in to view your playlists</p>
          <Link to="/login" className="text-petflix-orange hover:underline">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2 flex items-center gap-3">
              <svg className="w-10 h-10 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              My Playlists
            </h1>
            <p className="text-gray-700 dark:text-gray-400">Organize your favorite pet videos</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold"
          >
            + Create Playlist
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-xl text-gray-600 dark:text-gray-400">Loading playlists...</div>
          </div>
        ) : playlists.length === 0 ? (
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-12 text-center border border-gray-200 dark:border-transparent">
            <div className="flex justify-center mb-4">
              <svg className="w-20 h-20 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">No Playlists Yet</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Create your first playlist to start organizing your favorite pet videos!</p>
            <Button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold"
            >
              Create Playlist
            </Button>
          </div>
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
                      to={`/playlists/${playlist.id}`}
                      className="text-xl font-bold text-charcoal dark:text-white hover:text-petflix-orange dark:hover:text-petflix-orange transition group-hover:underline"
                    >
                      {playlist.name}
                    </Link>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-sm text-gray-700 dark:text-gray-400">
                        {playlist.video_count || 0} videos
                      </span>
                      <span className="text-gray-400 dark:text-gray-600">•</span>
                      <span className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                        playlist.visibility === 'public' 
                          ? 'bg-green-600 text-white' 
                          : 'bg-gray-500 dark:bg-gray-600 text-white'
                      }`}>
                        {playlist.visibility === 'public' ? (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                            </svg>
                            Public
                          </>
                        ) : (
                          <>
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                            </svg>
                            Private
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDeletePlaylistClick(playlist.id)}
                    variant="ghost"
                    size="icon"
                    className="text-gray-500 dark:text-gray-400 hover:text-red-500 ml-2"
                    title="Delete playlist"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>

                {playlist.description && (
                  <p className="text-gray-700 dark:text-gray-400 text-sm line-clamp-2 mb-4">
                    {playlist.description}
                  </p>
                )}

                <Link
                  to={`/playlists/${playlist.id}`}
                  className="inline-block text-sm text-petflix-orange dark:text-petflix-orange hover:underline"
                >
                  View Playlist →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Playlist Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Create New Playlist</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreatePlaylist}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Playlist Name *
              </label>
              <Input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-dark-gray text-charcoal dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
                placeholder="My Favorite Pets"
                required
                maxLength={100}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description (Optional)
              </label>
              <Textarea
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange resize-none border border-gray-300 dark:border-transparent"
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
              <Button
                type="button"
                onClick={() => setShowCreateModal(false)}
                variant="outline"
                className="flex-1"
                disabled={creating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={creating || !newPlaylistName.trim()}
                className="flex-1 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white"
              >
                {creating ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Playlist Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Delete Playlist
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this playlist? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setPlaylistToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePlaylist}
            >
              Delete Playlist
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

