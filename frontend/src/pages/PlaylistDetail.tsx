import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent } from '@/components/ui/card';
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
  const [showRemoveVideoModal, setShowRemoveVideoModal] = useState(false);
  const [videoToRemove, setVideoToRemove] = useState<string | null>(null);
  const [showDeletePlaylistModal, setShowDeletePlaylistModal] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const isOwner = user?.id === playlist?.user_id;

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistDetails();
    } else {
      setLoading(false);
    }
  }, [playlistId]);

  const fetchPlaylistDetails = async () => {
    if (!playlistId) return;
    
    setLoading(true);
    try {
      const [playlistRes, videosRes] = await Promise.all([
        api.get(`/playlists/${playlistId}`),
        api.get(`/playlists/${playlistId}/videos`),
      ]);

      if (playlistRes.data?.playlist) {
        setPlaylist(playlistRes.data.playlist);
        setVideos(videosRes.data?.videos || []);
        
        // Set edit form values
        setEditName(playlistRes.data.playlist.name);
        setEditDescription(playlistRes.data.playlist.description || '');
        setEditVisibility(playlistRes.data.playlist.visibility);
      } else {
        throw new Error('Playlist data not found');
      }
    } catch (error: any) {
      console.error('Failed to load playlist:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to load playlist';
      toast.error(errorMessage);
      // Don't navigate away immediately - let user see the error
      setPlaylist(null);
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

  const handleRemoveVideoClick = (videoId: string) => {
    setVideoToRemove(videoId);
    setShowRemoveVideoModal(true);
  };

  const handleRemoveVideo = async () => {
    if (!videoToRemove) return;

    try {
      await api.delete(`/playlists/${playlistId}/videos/${videoToRemove}`);
      setVideos(videos.filter(v => v.id !== videoToRemove));
      toast.success('Video removed from playlist');
      setShowRemoveVideoModal(false);
      setVideoToRemove(null);
    } catch (error) {
      console.error('Failed to remove video:', error);
      toast.error('Failed to remove video');
    }
  };

  const handleDeletePlaylistClick = () => {
    setShowDeletePlaylistModal(true);
  };

  const handleDeletePlaylist = async () => {
    try {
      await api.delete(`/playlists/${playlistId}`);
      toast.success('Playlist deleted successfully');
      navigate('/playlists');
    } catch (error) {
      console.error('Failed to delete playlist:', error);
      toast.error('Failed to delete playlist');
      setShowDeletePlaylistModal(false);
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
                    <span className={`text-sm px-3 py-1 rounded flex items-center gap-1 ${
                      playlist.visibility === 'public' 
                        ? 'bg-green-600 text-charcoal dark:text-white' 
                        : 'bg-gray-600 text-gray-700 dark:text-gray-300'
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
                    <Button
                      onClick={() => setEditMode(true)}
                      variant="outline"
                      size="sm"
                      className="px-4 py-2 bg-petflix-gray hover:bg-petflix-orange text-white"
                    >
                      ✏️ Edit
                    </Button>
                    <Button
                      onClick={handleDeletePlaylistClick}
                      variant="destructive"
                      size="sm"
                      className="px-4 py-2 bg-petflix-gray hover:bg-red-600 text-white"
                    >
                      🗑️ Delete
                    </Button>
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
                <Input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 bg-petflix-gray text-white focus:ring-2 focus:ring-petflix-orange"
                  required
                  maxLength={100}
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <Textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-petflix-gray text-white focus:ring-2 focus:ring-petflix-orange resize-none"
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
                <Button
                  type="button"
                  onClick={() => setEditMode(false)}
                  variant="outline"
                  className="px-6 py-2 bg-petflix-gray hover:bg-opacity-80 text-white"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="px-6 py-2 bg-petflix-orange hover:bg-petflix-red text-white font-bold"
                >
                  Save Changes
                </Button>
              </div>
            </form>
          )}
        </div>

        {/* Videos Grid */}
        {videos.length === 0 ? (
          <div className="text-center py-20 bg-petflix-dark rounded-lg p-12">
            <div className="text-6xl mb-6">📂</div>
            <h3 className="text-2xl font-bold text-white mb-3">This playlist is empty</h3>
            <p className="text-gray-400 mb-2 max-w-md mx-auto">
              Start building your collection! Browse pet videos and add them to this playlist.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-8">
              Look for the "Add to Playlist" button when watching videos
            </p>
            <Button
              asChild
              size="lg"
              className="bg-petflix-orange hover:bg-petflix-red text-white font-bold px-8 py-6 text-lg flex items-center gap-2"
            >
              <Link to="/feed" className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                Browse Videos
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="group relative overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10 border-gray-200/50 dark:border-gray-800/30 shadow-md hover:shadow-xl p-0"
              >
                <Link
                  to={`/video/${video.id}`}
                  className="block"
                >
                  <CardContent className="p-0">
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
                  </CardContent>
                </Link>

                {/* Remove Button (only for owner) */}
                {isOwner && (
                  <Button
                    onClick={() => handleRemoveVideoClick(video.id)}
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2 rounded-full w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                    title="Remove from playlist"
                  >
                    ✕
                  </Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Remove Video Confirmation Modal */}
      <Dialog open={showRemoveVideoModal} onOpenChange={setShowRemoveVideoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Remove Video</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove this video from the playlist?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRemoveVideoModal(false);
                setVideoToRemove(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveVideo}
            >
              Remove Video
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Playlist Confirmation Modal */}
      <Dialog open={showDeletePlaylistModal} onOpenChange={setShowDeletePlaylistModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 dark:text-red-400">⚠️ Delete Playlist</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this entire playlist? This action cannot be undone.
              <br /><br />
              This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The playlist and all its information</li>
                <li>All videos in this playlist (videos themselves won't be deleted)</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeletePlaylistModal(false)}
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

