import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatRelativeTime } from '../lib/dateUtils';

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  shared_by_user_id: string;
  username?: string;
  created_at: string;
}

interface Comment {
  id: string;
  content: string;
  user_id: string;
  username: string;
  created_at: string;
  parent_comment_id: string | null;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
}

export const VideoDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState<string | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        console.log('🎬 Fetching video with ID:', id);
        console.log('🔗 Full URL path:', `/videos/${id}`);
        console.log('🌐 Complete URL:', `http://localhost:5001/api/v1/videos/${id}`);
        
        const [videoRes, commentsRes] = await Promise.all([
          api.get(`/videos/${id}`),
          api.get(`/comments/video/${id}`),
        ]);

        console.log('✅ Video response:', videoRes.data);
        setVideo(videoRes.data);
        setComments(commentsRes.data.comments || []);
      } catch (error: any) {
        console.error('❌ Failed to load video:', error);
        console.error('❌ Video ID was:', id);
        console.error('❌ Error response:', error.response?.data);
        console.error('❌ Error status:', error.response?.status);
        console.error('❌ Full error:', JSON.stringify(error, null, 2));
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVideoDetails();
    }
  }, [id]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/comments`, {
        video_id: id,
        text: newComment,
      });

      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenPlaylistModal = async () => {
    if (!user) {
      toast.warning('Please sign in to add videos to playlists');
      return;
    }

    setShowPlaylistModal(true);
    setLoadingPlaylists(true);

    try {
      const response = await api.get(`/playlists/user/${user.id}`);
      setPlaylists(response.data.playlists || []);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!id) return;

    setAddingToPlaylist(playlistId);
    try {
      await api.post(`/playlists/${playlistId}/videos`, {
        video_id: id,
      });
      // Success - close modal silently
      setShowPlaylistModal(false);
    } catch (error: any) {
      console.error('Failed to add video to playlist:', error);
      // Only show error if it's not a "video already in playlist" error
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '';
      if (!errorMessage.toLowerCase().includes('already')) {
        toast.error(errorMessage || 'Failed to add video to playlist');
      } else {
        // Video already in playlist - just close modal
        toast.info('Video already in playlist');
        setShowPlaylistModal(false);
      }
    } finally {
      setAddingToPlaylist(null);
    }
  };

  const handleOpenReportModal = () => {
    if (!user) {
      toast.warning('Please sign in to report videos');
      return;
    }
    setShowReportModal(true);
    setReportReason('');
    setReportDetails('');
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason || !id) return;

    setSubmittingReport(true);
    try {
      await api.post('/reports', {
        video_id: id,
        reason: reportReason,
        details: reportDetails || undefined,
      });
      
      setShowReportModal(false);
      setReportReason('');
      setReportDetails('');
      toast.success('Report submitted successfully. Thank you for helping keep Petflix safe.');
    } catch (error: any) {
      console.error('Failed to submit report:', error);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || '';
      if (errorMessage.toLowerCase().includes('already reported')) {
        toast.info('You have already reported this video for this reason.');
        setShowReportModal(false);
      } else {
        toast.error(errorMessage || 'Failed to submit report. Please try again.');
      }
    } finally {
      setSubmittingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-petflix-black flex items-center justify-center pt-24">
        <div className="text-xl text-white">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-petflix-black flex items-center justify-center pt-24">
        <div className="text-center">
          <div className="text-3xl text-white mb-4">Video not found</div>
          <Link to="/feed" className="text-petflix-orange hover:underline">
            ← Back to Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-petflix-black pt-24 px-8 md:px-16 pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video Player & Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* YouTube Player */}
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${video.youtube_video_id}`}
                title={video.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>

            {/* Video Info */}
            <div className="bg-petflix-dark rounded-lg p-6">
              <h1 className="text-3xl font-bold text-white mb-4">
                {video.title}
              </h1>
              {video.username && (
                <Link
                  to={`/profile/${video.shared_by_user_id}`}
                  className="inline-flex items-center gap-2 text-gray-300 hover:text-petflix-orange transition mb-4"
                >
                  <div className="w-10 h-10 rounded-full bg-petflix-gray flex items-center justify-center text-white font-bold">
                    {video.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">@{video.username}</span>
                </Link>
              )}
              {video.description && (
                <p className="text-gray-300 whitespace-pre-wrap mt-4 leading-relaxed">
                  {video.description}
                </p>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-petflix-dark rounded-lg p-6">
              <h2 className="text-2xl font-bold text-white mb-6">
                💬 Comments ({comments.length})
              </h2>

              {user ? (
                <form onSubmit={handleSubmitComment} className="mb-8">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 bg-petflix-gray text-white rounded-lg focus:ring-2 focus:ring-petflix-orange focus:outline-none resize-none placeholder-gray-400"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="mt-3 px-6 py-3 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-petflix-gray rounded-lg">
                  <p className="text-gray-300">
                    <Link to="/login" className="text-petflix-orange hover:underline font-medium">
                      Sign in
                    </Link>
                    {' '}to join the conversation
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border-b border-petflix-gray pb-6 last:border-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-petflix-gray flex items-center justify-center text-white font-bold flex-shrink-0">
                          {comment.username.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Link
                              to={`/profile/${comment.user_id}`}
                              className="font-semibold text-white hover:text-petflix-orange transition"
                            >
                              @{comment.username}
                            </Link>
                            <span className="text-sm text-gray-500">
                              {formatRelativeTime(comment.created_at)}
                            </span>
                          </div>
                          <p className="text-gray-300 leading-relaxed">{comment.content}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="bg-petflix-dark rounded-lg p-6 sticky top-24">
              <h3 className="font-bold text-white text-lg mb-4">Actions</h3>
              <div className="space-y-3">
                <button 
                  onClick={handleOpenPlaylistModal}
                  className="w-full px-4 py-3 bg-petflix-gray hover:bg-petflix-orange text-white font-medium rounded-lg transition"
                >
                  💾 Add to Playlist
                </button>
                <button className="w-full px-4 py-3 bg-petflix-gray hover:bg-petflix-orange text-white font-medium rounded-lg transition">
                  🔗 Share
                </button>
                <button 
                  onClick={handleOpenReportModal}
                  className="w-full px-4 py-3 bg-petflix-gray hover:bg-red-600 text-white font-medium rounded-lg transition"
                >
                  🚨 Report Video
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Playlist Modal */}
      {showPlaylistModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-petflix-dark rounded-lg p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                Add to Playlist
              </h2>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {loadingPlaylists ? (
              <div className="text-center py-8 text-gray-400">
                Loading playlists...
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 mb-4">You don't have any playlists yet</p>
                <Link
                  to="/playlists"
                  className="inline-block px-6 py-3 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded-lg transition"
                  onClick={() => setShowPlaylistModal(false)}
                >
                  Create Your First Playlist
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {playlists.map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => handleAddToPlaylist(playlist.id)}
                    disabled={addingToPlaylist === playlist.id}
                    className="w-full text-left px-4 py-3 bg-petflix-gray hover:bg-petflix-orange text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold">{playlist.name}</div>
                        {playlist.description && (
                          <div className="text-sm text-gray-400 line-clamp-1">
                            {playlist.description}
                          </div>
                        )}
                      </div>
                      {addingToPlaylist === playlist.id ? (
                        <span className="ml-2">⏳</span>
                      ) : (
                        <span className="ml-2">+</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Report Video Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-petflix-dark rounded-lg p-8 max-w-md w-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">
                🚨 Report Video
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Why are you reporting this video? *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-3 bg-petflix-gray text-white rounded focus:ring-2 focus:ring-red-600 focus:outline-none"
                  required
                >
                  <option value="">Select a reason...</option>
                  <option value="hate_speech">Hate Speech</option>
                  <option value="inappropriate_content">Inappropriate Content</option>
                  <option value="spam">Spam</option>
                  <option value="violence">Violence</option>
                  <option value="misleading">Misleading Information</option>
                  <option value="copyright">Copyright Violation</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full px-4 py-3 bg-petflix-gray text-white rounded focus:ring-2 focus:ring-red-600 focus:outline-none resize-none"
                  rows={4}
                  maxLength={500}
                  placeholder="Provide any additional context that might help us review this report..."
                />
                <p className="text-xs text-gray-500 mt-2">
                  {reportDetails.length}/500 characters
                </p>
              </div>

              <div className="bg-petflix-gray rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-300">
                  <strong className="text-white">Note:</strong> False reports may result in account restrictions. 
                  Reports are reviewed by our moderation team within 24-48 hours.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-3 bg-petflix-gray hover:bg-opacity-80 text-white font-medium rounded transition"
                  disabled={submittingReport}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport || !reportReason}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submittingReport ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

