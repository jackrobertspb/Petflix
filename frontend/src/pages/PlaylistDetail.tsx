import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  user_id: string;
  created_at: string;
}

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  shared_by_user_id: string;
  username?: string;
  created_at: string;
}

export const PlaylistDetail = () => {
  const { playlistId } = useParams<{ playlistId: string }>();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editVisibility, setEditVisibility] = useState<'public' | 'private'>('public');
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isOwner = user?.id === playlist?.user_id;

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistDetails();
    }
  }, [playlistId]);

  const fetchPlaylistDetails = async () => {
    try {
      const [playlistRes, videosRes] = await Promise.all([
        api.get(`/playlists/${playlistId}`),
        api.get(`/playlists/${playlistId}/videos`),
      ]);

      setPlaylist(playlistRes.data.playlist);
      setVideos(videosRes.data.videos || []);
      
      // Set edit form values
      setEditName(playlistRes.data.playlist.name);
      setEditDescription(playlistRes.data.playlist.description || '');
      setEditVisibility(playlistRes.data.playlist.visibility);
    } catch (error) {
      console.error('Failed to load playlist:', error);
      toast.error('Playlist not found');
      navigate('/playlists');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    try {
      await api.patch(`/playlists/${playlistId}`, {
        name: editName,
        description: editDescription || null,
        visibility: editVisibility,
      });

      setPlaylist({
        ...playlist!,
        name: editName,
        description: editDescription || null,
        visibility: editVisibility,
      });
      setEditMode(false);
      toast.success('Playlist updated successfully');
    } catch (error) {
      console.error('Failed to update playlist:', error);
      toast.error('Failed to update playlist');
    }
  };

  const handleRemoveVideo = async (videoId: string) => {
    if (!confirm('Remove this video from the playlist?')) return;

    try {
      await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
      setVideos(videos.filter(v => v.id !== videoId));
      toast.success('Video removed from playlist');
    } catch (error) {
      console.error('Failed to remove video:', error);
      toast.error('Failed to remove video');
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Are you sure you want to delete this entire playlist? This cannot be undone.')) return;

    try {
      await api.delete(`/playlists/${playlistId}`);
      toast.success('Playlist deleted successfully');
      navigate('/playlists');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast.error('Failed to delete playlist');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-24">
        <div className="text-xl text-charcoal dark:text-white">Loading playlist...</div>
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-3xl text-white mb-4">Playlist not found</div>
          <Link to="/playlists" className="text-petflix-orange hover:underline">
            ← Back to Playlists
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 md:px-16 pb-12">
      <div className="max-w-7xl mx-auto">
        {/* Back Button */}
        <Link
          to="/playlists"
          className="inline-flex items-center text-gray-600 dark:text-gray-400 hover:text-white mb-6 transition"
        >
          ← Back to Playlists
        </Link>

        {/* Playlist Header */}
        <div className="bg-petflix-dark rounded-lg p-8 mb-8">
          {!editMode ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold text-white mb-3">
                    {playlist.name}
                  </h1>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`text-sm px-3 py-1 rounded ${
                      playlist.visibility === 'public' 
                        ? 'bg-green-600 text-charcoal dark:text-white' 
                        : 'bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}>
                      {playlist.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                    </span>
                    <span className="text-gray-600 dark:text-gray-400">
                      {videos.length} {videos.length === 1 ? 'video' : 'videos'}
                    </span>
                  </div>
                  {playlist.description && (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {playlist.description}
                    </p>
                  )}
                </div>

                {isOwner && (
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => setEditMode(true)}
                      className="px-4 py-2 bg-petflix-gray hover:bg-petflix-orange text-white rounded transition"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={handleDeletePlaylist}
                      className="px-4 py-2 bg-petflix-gray hover:bg-red-600 text-white rounded transition"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <form onSubmit={handleUpdatePlaylist}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Playlist Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-petflix-gray text-white rounded focus:ring-2 focus:ring-petflix-orange focus:outline-none"
                  required
                  maxLength={100}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-petflix-gray text-white rounded focus:ring-2 focus:ring-petflix-orange focus:outline-none resize-none"
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editVisibility === 'public'}
                    onChange={(e) => setEditVisibility(e.target.checked ? 'public' : 'private')}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Public playlist</span>
                </label>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setEditMode(false)}
                  className="px-6 py-2 bg-petflix-gray hover:bg-opacity-80 text-white rounded transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded transition"
                >
                  Save Changes
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-20 bg-petflix-dark rounded-lg p-12">
            <p className="text-2xl text-white mb-4">No videos in this playlist yet</p>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              Browse videos and add them to this playlist using the "Add to Playlist" button
            </p>
            <Link
              to="/feed"
              className="inline-block px-8 py-4 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded-lg transition"
            >
              Browse Videos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {videos.map((video) => (
              <div key={video.id} className="group relative">
                <Link
                  to={`/video/${video.id}`}
                  className="block rounded overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10"
                >
                  {/* Thumbnail */}
                  <div className="relative w-full pb-[56.25%] bg-white dark:bg-petflix-dark-gray">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`}
                      alt={video.title}
                      className="absolute inset-0 w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('hqdefault')) {
                          target.src = `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`;
                        }
                      }}
                    />
                  </div>

                  {/* Info Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <h3 className="font-bold text-white text-xs md:text-sm line-clamp-2 mb-1">
                        {video.title}
                      </h3>
                      {video.username && (
                        <p className="text-xs text-gray-700 dark:text-gray-300">@{video.username}</p>
                      )}
                    </div>
                  </div>
                </Link>

                {/* Remove Button (only for owner) */}
                {isOwner && (
                  <button
                    onClick={() => handleRemoveVideo(video.id)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Remove from playlist"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

