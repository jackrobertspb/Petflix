import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, videoLikesAPI, commentLikesAPI, commentsAPI } from '../services/api';
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
  like_count?: number;
  user_liked?: boolean;
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
  const [selectedPlaylistIds, setSelectedPlaylistIds] = useState<Set<string>>(new Set());
  const [initialPlaylistIds, setInitialPlaylistIds] = useState<Set<string>>(new Set());
  const [savingPlaylists, setSavingPlaylists] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportDetails, setReportDetails] = useState('');
  const [submittingReport, setSubmittingReport] = useState(false);
  const [videoLiked, setVideoLiked] = useState(false);
  const [videoLikeCount, setVideoLikeCount] = useState(0);
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [generatingShareUrl, setGeneratingShareUrl] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        console.log('🎬 Fetching video with ID:', id);
        
        const [videoRes, commentsRes, videoLikesRes, commentLikesRes] = await Promise.all([
          api.get(`/videos/${id}`),
          api.get(`/comments/video/${id}`),
          videoLikesAPI.getStatus(id!).catch(() => ({ data: { like_count: 0, user_liked: false } })),
          commentLikesAPI.getBatchForVideo(id!).catch(() => ({ data: { likes: {} } })),
        ]);

        setVideo(videoRes.data);
        setComments(commentsRes.data.comments || []);
        setVideoLiked(videoLikesRes.data.user_liked);
        setVideoLikeCount(videoLikesRes.data.like_count);
        
        // Map comment likes to state
        const likesMap: Record<string, { liked: boolean; count: number }> = {};
        Object.entries(commentLikesRes.data.likes || {}).forEach(([commentId, data]: [string, any]) => {
          likesMap[commentId] = {
            liked: data.user_liked,
            count: data.like_count
          };
        });
        setCommentLikes(likesMap);
      } catch (error: any) {
        console.error('❌ Failed to load video:', error);
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
      toast.success('Comment posted!');
    } catch (error) {
      console.error('Failed to post comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentCommentId: string) => {
    if (!replyText.trim() || !user) return;

    setSubmitting(true);
    try {
      const response = await api.post(`/comments`, {
        video_id: id,
        text: replyText,
        parent_comment_id: parentCommentId,
      });

      setComments([...comments, response.data]);
      setReplyText('');
      setReplyingTo(null);
      toast.success('Reply posted!');
    } catch (error) {
      console.error('Failed to post reply:', error);
      toast.error('Failed to post reply');
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
      // Fetch user's playlists
      const response = await api.get(`/playlists/user/${user.id}`);
      const userPlaylists = response.data.playlists || [];
      setPlaylists(userPlaylists);

      // Check which playlists already contain this video
      const playlistsWithVideo = new Set<string>();
      await Promise.all(
        userPlaylists.map(async (playlist: Playlist) => {
          try {
            const videosResponse = await api.get(`/playlists/${playlist.id}/videos`);
            const videos = videosResponse.data.videos || [];
            // Check if current video is in this playlist
            if (videos.some((v: any) => v.id === id)) {
              playlistsWithVideo.add(playlist.id);
            }
          } catch (error) {
            console.error(`Failed to check playlist ${playlist.id}:`, error);
          }
        })
      );

      setSelectedPlaylistIds(playlistsWithVideo);
      setInitialPlaylistIds(playlistsWithVideo);
    } catch (error) {
      console.error('Failed to load playlists:', error);
      toast.error('Failed to load playlists');
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const handleTogglePlaylist = (playlistId: string) => {
    setSelectedPlaylistIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  const handleSaveToPlaylists = async () => {
    if (!id) return;

    setSavingPlaylists(true);
    let addedCount = 0;
    let removedCount = 0;
    let errorCount = 0;

    try {
      // Determine which playlists to add to and remove from
      const playlistsToAdd = Array.from(selectedPlaylistIds).filter(
        (playlistId) => !initialPlaylistIds.has(playlistId)
      );
      const playlistsToRemove = Array.from(initialPlaylistIds).filter(
        (playlistId) => !selectedPlaylistIds.has(playlistId)
      );

      // Add video to newly selected playlists
      await Promise.all(
        playlistsToAdd.map(async (playlistId) => {
          try {
            await api.post(`/playlists/${playlistId}/videos`, {
              video_id: id,
            });
            addedCount++;
          } catch (error: any) {
            errorCount++;
            console.error(`Failed to add to playlist ${playlistId}:`, error);
          }
        })
      );

      // Remove video from deselected playlists
      await Promise.all(
        playlistsToRemove.map(async (playlistId) => {
          try {
            await api.delete(`/playlists/${playlistId}/videos/${id}`);
            removedCount++;
          } catch (error: any) {
            errorCount++;
            console.error(`Failed to remove from playlist ${playlistId}:`, error);
          }
        })
      );

      // Show appropriate toast message
      if (addedCount > 0 && removedCount > 0) {
        toast.success(`Added to ${addedCount} and removed from ${removedCount} playlist${addedCount + removedCount > 1 ? 's' : ''}!`);
      } else if (addedCount > 0) {
        toast.success(`Added to ${addedCount} playlist${addedCount > 1 ? 's' : ''}!`);
      } else if (removedCount > 0) {
        toast.success(`Removed from ${removedCount} playlist${removedCount > 1 ? 's' : ''}!`);
      } else if (errorCount === 0) {
        toast.info('No changes made');
      }

      if (errorCount > 0) {
        toast.error(`Failed to update ${errorCount} playlist${errorCount > 1 ? 's' : ''}`);
      }

      // Close modal if successful
      if (errorCount === 0 || addedCount > 0 || removedCount > 0) {
        setShowPlaylistModal(false);
      }
    } finally {
      setSavingPlaylists(false);
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

  const handleOpenShareModal = async () => {
    if (!id) return;
    
    setShowShareModal(true);
    setGeneratingShareUrl(true);
    
    try {
      // Generate or get share URL
      const response = await api.post(`/videos/${id}/share-url`);
      setShareUrl(response.data.share_url);
    } catch (error: any) {
      console.error('Failed to generate share URL:', error);
      // Fallback to direct video URL
      setShareUrl(`${window.location.origin}/video/${id}`);
    } finally {
      setGeneratingShareUrl(false);
    }
  };

  const handleShareToFacebook = () => {
    const url = encodeURIComponent(shareUrl || `${window.location.origin}/video/${id}`);
    const text = encodeURIComponent(video?.title || 'Check out this pet video on Petflix!');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`, '_blank', 'width=600,height=400');
  };

  const handleShareToTwitter = () => {
    const url = encodeURIComponent(shareUrl || `${window.location.origin}/video/${id}`);
    const text = encodeURIComponent(`${video?.title || 'Check out this pet video'} on Petflix! 🐾`);
    const hashtags = encodeURIComponent('Petflix,Pets,Videos');
    window.open(`https://twitter.com/intent/tweet?url=${url}&text=${text}&hashtags=${hashtags}`, '_blank', 'width=600,height=400');
  };

  const handleShareToInstagram = async () => {
    // Instagram doesn't support direct URL sharing, so copy to clipboard
    const text = `Check out this pet video on Petflix! ${shareUrl || `${window.location.origin}/video/${id}`}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Link copied to clipboard! Paste it in your Instagram post or story.');
    } catch (error) {
      toast.error('Failed to copy link. Please copy manually.');
    }
  };

  const handleCopyShareLink = async () => {
    const link = shareUrl || `${window.location.origin}/video/${id}`;
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Share link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
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

  const handleVideoLike = async () => {
    if (!user) {
      toast.warning('Please sign in to like videos');
      return;
    }

    try {
      if (videoLiked) {
        await videoLikesAPI.unlike(id!);
        setVideoLiked(false);
        setVideoLikeCount(prev => Math.max(0, prev - 1));
        toast.success('Video unliked');
      } else {
        await videoLikesAPI.like(id!);
        setVideoLiked(true);
        setVideoLikeCount(prev => prev + 1);
        toast.success('Video liked!');
      }
    } catch (error: any) {
      console.error('Failed to toggle video like:', error);
      toast.error('Failed to update like. Please try again.');
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      toast.warning('Please sign in to like comments');
      return;
    }

    try {
      const currentLiked = commentLikes[commentId]?.liked || false;

      if (currentLiked) {
        await commentLikesAPI.unlike(commentId);
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: {
            liked: false,
            count: Math.max(0, (prev[commentId]?.count || 0) - 1)
          }
        }));
      } else {
        await commentLikesAPI.like(commentId);
        setCommentLikes(prev => ({
          ...prev,
          [commentId]: {
            liked: true,
            count: (prev[commentId]?.count || 0) + 1
          }
        }));
      }
    } catch (error: any) {
      console.error('Failed to toggle comment like:', error);
      toast.error('Failed to update like. Please try again.');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    try {
      await commentsAPI.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast.success('Comment deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete comment:', error);
      toast.error('Failed to delete comment. Please try again.');
    }
  };

  const handleOpenEditModal = () => {
    if (!video) return;
    setEditTitle(video.title);
    setEditDescription(video.description);
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim() || !id) return;

    setSavingEdit(true);
    try {
      const response = await api.patch(`/videos/${id}`, {
        title: editTitle,
        description: editDescription,
      });

      setVideo(prev => prev ? {
        ...prev,
        title: editTitle,
        description: editDescription
      } : null);

      setShowEditModal(false);
      toast.success('Video updated successfully!');
    } catch (error: any) {
      console.error('Failed to update video:', error);
      toast.error('Failed to update video. Please try again.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete(`/videos/${id}`);
      toast.success('Video deleted successfully');
      // Redirect to profile after a brief delay
      setTimeout(() => {
        window.location.href = `/profile/${user?.id}`;
      }, 1500);
    } catch (error: any) {
      console.error('Failed to delete video:', error);
      toast.error('Failed to delete video. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-24">
        <div className="text-xl text-charcoal dark:text-white">Loading video...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-24">
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
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 md:px-16 pb-12">
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
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-transparent">
              <h1 
                className={`text-3xl font-bold text-charcoal dark:text-white mb-4 cursor-pointer hover:text-petflix-orange transition break-all ${titleExpanded ? '' : 'line-clamp-3'}`}
                onClick={() => setTitleExpanded(!titleExpanded)}
                title={titleExpanded ? "Click to collapse" : "Click to see full title"}
              >
                {video.title}
              </h1>
              {video.username && (
                <Link
                  to={`/profile/${video.shared_by_user_id}`}
                  className="inline-flex items-center gap-2 text-charcoal dark:text-gray-300 hover:text-petflix-orange transition mb-4"
                >
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-petflix-gray flex items-center justify-center text-charcoal dark:text-white font-bold">
                    {video.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium">@{video.username}</span>
                </Link>
              )}
              {video.description && (
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words mt-4 leading-relaxed">
                  {video.description}
                </p>
              )}
            </div>

            {/* Comments Section */}
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-transparent">
              <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-6">
                💬 Comments ({comments.length})
              </h2>

              {user ? (
                <form onSubmit={handleSubmitComment} className="mb-8">
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white rounded-lg focus:ring-2 focus:ring-petflix-orange focus:outline-none resize-none placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-transparent"
                    rows={3}
                  />
                  <button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="mt-3 px-6 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </button>
                </form>
              ) : (
                <div className="mb-8 p-4 bg-gray-100 dark:bg-petflix-gray rounded-lg border border-gray-300 dark:border-transparent">
                  <p className="text-charcoal dark:text-gray-300">
                    <Link to="/login" className="text-petflix-orange hover:underline font-medium">
                      Sign in
                    </Link>
                    {' '}to join the conversation
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {comments.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  <>
                    {/* Top-level comments */}
                    {comments.filter(c => !c.parent_comment_id).map((comment) => (
                      <div key={comment.id} className="border-b border-gray-200 dark:border-petflix-gray pb-6 last:border-0">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-petflix-gray flex items-center justify-center text-charcoal dark:text-white font-bold flex-shrink-0">
                            {comment.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Link
                                to={`/profile/${comment.user_id}`}
                                className="font-semibold text-charcoal dark:text-white hover:text-petflix-orange transition"
                              >
                                @{comment.username}
                              </Link>
                              <span className="text-sm text-gray-500 dark:text-gray-500">
                                {formatRelativeTime(comment.created_at)}
                              </span>
                            </div>
                            <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">{comment.content}</p>
                            
                            {/* Comment Actions */}
                            <div className="flex items-center gap-4 mb-3">
                              <button
                                onClick={() => handleCommentLike(comment.id)}
                                className={`flex items-center gap-1 text-sm font-medium transition ${
                                  commentLikes[comment.id]?.liked
                                    ? 'text-petflix-orange hover:text-petflix-red'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-lightblue dark:hover:text-petflix-orange'
                                }`}
                              >
                                {commentLikes[comment.id]?.liked ? '❤️' : '🤍'} 
                                <span>{commentLikes[comment.id]?.count || 0}</span>
                              </button>

                              {user && (
                                <button
                                  onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-lightblue dark:hover:text-petflix-orange font-medium transition"
                                >
                                  💬 Reply
                                </button>
                              )}

                              {user && user.id === comment.user_id && (
                                <button
                                  onClick={() => handleDeleteComment(comment.id)}
                                  className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition"
                                >
                                  🗑️ Delete
                                </button>
                              )}
                            </div>

                            {/* Reply Input */}
                            {replyingTo === comment.id && (
                              <div className="mt-4 mb-4 pl-4 border-l-2 border-petflix-orange dark:border-petflix-orange">
                                <textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Reply to @${comment.username}...`}
                                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white rounded-lg focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange focus:outline-none resize-none border border-gray-300 dark:border-transparent"
                                  rows={3}
                                  maxLength={280}
                                />
                                <div className="flex gap-2 mt-2">
                                  <button
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={submitting || !replyText.trim()}
                                    className="px-4 py-2 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                                  >
                                    {submitting ? 'Posting...' : 'Post Reply'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium rounded-lg transition text-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Replies */}
                            {comments.filter(r => r.parent_comment_id === comment.id).length > 0 && (
                              <div className="mt-4 ml-6 space-y-4 border-l-2 border-gray-300 dark:border-gray-600 pl-4">
                                {comments.filter(r => r.parent_comment_id === comment.id).map((reply) => (
                                  <div key={reply.id} className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-petflix-gray flex items-center justify-center text-charcoal dark:text-white font-bold text-sm flex-shrink-0">
                                      {reply.username.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2 mb-1">
                                        <Link
                                          to={`/profile/${reply.user_id}`}
                                          className="font-semibold text-sm text-charcoal dark:text-white hover:text-petflix-orange transition"
                                        >
                                          @{reply.username}
                                        </Link>
                                        <span className="text-xs text-gray-500 dark:text-gray-500">
                                          {formatRelativeTime(reply.created_at)}
                                        </span>
                                      </div>
                                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">{reply.content}</p>
                                      
                                      {/* Reply Actions */}
                                      <div className="flex items-center gap-3">
                                        <button
                                          onClick={() => handleCommentLike(reply.id)}
                                          className={`flex items-center gap-1 text-xs font-medium transition ${
                                            commentLikes[reply.id]?.liked
                                              ? 'text-petflix-orange hover:text-petflix-red'
                                              : 'text-gray-600 dark:text-gray-400 hover:text-lightblue dark:hover:text-petflix-orange'
                                          }`}
                                        >
                                          {commentLikes[reply.id]?.liked ? '❤️' : '🤍'} 
                                          <span>{commentLikes[reply.id]?.count || 0}</span>
                                        </button>

                                        {user && user.id === reply.user_id && (
                                          <button
                                            onClick={() => handleDeleteComment(reply.id)}
                                            className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium transition"
                                          >
                                            🗑️ Delete
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 sticky top-24 border border-gray-200 dark:border-transparent">
              <h3 className="font-bold text-charcoal dark:text-white text-lg mb-4">Actions</h3>
              <div className="space-y-3">
                {/* Owner-only actions */}
                {user && user.id === video?.shared_by_user_id && (
                  <>
                    <button 
                      onClick={handleOpenEditModal}
                      className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition"
                    >
                      ✏️ Edit Video
                    </button>
                    <button 
                      onClick={handleDeleteVideo}
                      className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                    >
                      🗑️ Delete Video
                    </button>
                    <div className="border-t border-gray-300 dark:border-gray-600 my-3"></div>
                  </>
                )}

                <button 
                  onClick={handleVideoLike}
                  className={`w-full px-4 py-3 font-medium rounded-lg transition ${
                    videoLiked 
                      ? 'bg-petflix-orange hover:bg-petflix-red text-white' 
                      : 'bg-gray-200 hover:bg-lightblue dark:bg-petflix-gray dark:hover:bg-petflix-orange text-charcoal dark:text-white'
                  }`}
                >
                  {videoLiked ? '❤️ Liked' : '🤍 Like'} ({videoLikeCount})
                </button>
                <button 
                  onClick={handleOpenPlaylistModal}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-lightblue dark:bg-petflix-gray dark:hover:bg-petflix-orange text-charcoal dark:text-white font-medium rounded-lg transition"
                >
                  💾 Add to Playlist
                </button>
                <button 
                  onClick={handleOpenShareModal}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-lightblue dark:bg-petflix-gray dark:hover:bg-petflix-orange text-charcoal dark:text-white font-medium rounded-lg transition"
                >
                  🔗 Share
                </button>
                
                {/* Only show report button if NOT owner */}
                {(!user || user.id !== video?.shared_by_user_id) && (
                  <button 
                    onClick={handleOpenReportModal}
                    className="w-full px-4 py-3 bg-gray-200 hover:bg-red-500 dark:bg-petflix-gray dark:hover:bg-red-600 text-charcoal dark:text-white font-medium rounded-lg transition"
                  >
                    🚨 Report Video
                  </button>
                )}
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
              <h2 className="text-2xl font-bold text-charcoal dark:text-white">
                Add to Playlist
              </h2>
              <button
                onClick={() => setShowPlaylistModal(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {loadingPlaylists ? (
              <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                Loading playlists...
              </div>
            ) : playlists.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have any playlists yet</p>
                <Link
                  to="/playlists"
                  className="inline-block px-6 py-3 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded-lg transition"
                  onClick={() => setShowPlaylistModal(false)}
                >
                  Create Your First Playlist
                </Link>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-6">
                  {playlists.map((playlist) => (
                    <label
                      key={playlist.id}
                      className="flex items-start gap-3 px-4 py-3 bg-gray-50 dark:bg-petflix-gray hover:bg-gray-100 dark:hover:bg-petflix-gray/80 rounded-lg cursor-pointer transition"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPlaylistIds.has(playlist.id)}
                        onChange={() => handleTogglePlaylist(playlist.id)}
                        className="mt-1 w-5 h-5 rounded border-gray-300 text-lightblue dark:text-petflix-orange focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="font-semibold text-charcoal dark:text-white">{playlist.name}</div>
                        {playlist.description && (
                          <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                            {playlist.description}
                          </div>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPlaylistModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-200 dark:bg-petflix-gray hover:bg-gray-300 dark:hover:bg-petflix-gray/80 text-charcoal dark:text-white font-bold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveToPlaylists}
                    disabled={savingPlaylists}
                    className="flex-1 px-6 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingPlaylists ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Report Video Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-8 max-w-md w-full border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-charcoal dark:text-white">
                🚨 Report Video
              </h2>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitReport}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-charcoal dark:text-gray-300 mb-3">
                  Why are you reporting this video? *
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white rounded focus:ring-2 focus:ring-red-600 focus:outline-none border border-gray-300 dark:border-transparent"
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
                <label className="block text-sm font-medium text-charcoal dark:text-gray-300 mb-3">
                  Additional Details (Optional)
                </label>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white rounded focus:ring-2 focus:ring-red-600 focus:outline-none resize-none border border-gray-300 dark:border-transparent"
                  rows={4}
                  maxLength={500}
                  placeholder="Provide any additional context that might help us review this report..."
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {reportDetails.length}/500 characters
                </p>
              </div>

              <div className="bg-gray-100 dark:bg-petflix-gray rounded-lg p-4 mb-6 border border-gray-300 dark:border-transparent">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  <strong className="text-charcoal dark:text-white">Note:</strong> False reports may result in account restrictions. 
                  Reports are reviewed by our moderation team within 24-48 hours.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium rounded transition"
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-8 max-w-md w-full border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-charcoal dark:text-white">
                🔗 Share Video
              </h2>
              <button
                onClick={() => setShowShareModal(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {generatingShareUrl ? (
              <div className="text-center py-8">
                <div className="text-gray-600 dark:text-gray-400">Generating share link...</div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                    Share Link
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={shareUrl || `${window.location.origin}/video/${id}`}
                      readOnly
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white rounded border border-gray-300 dark:border-transparent text-sm"
                    />
                    <button
                      onClick={handleCopyShareLink}
                      className="px-4 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-medium rounded transition"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                    Share to Social Media
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={handleShareToFacebook}
                      className="px-4 py-3 bg-[#1877F2] hover:bg-[#166FE5] text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📘</span>
                      <span>Facebook</span>
                    </button>
                    <button
                      onClick={handleShareToTwitter}
                      className="px-4 py-3 bg-[#1DA1F2] hover:bg-[#1A91DA] text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">🐦</span>
                      <span>Twitter</span>
                    </button>
                    <button
                      onClick={handleShareToInstagram}
                      className="px-4 py-3 bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📷</span>
                      <span>Instagram</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                    Instagram: Link copied to clipboard. Paste it in your post or story.
                  </p>
                </div>

                <button
                  onClick={() => setShowShareModal(false)}
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium rounded transition"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-8 max-w-md w-full border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-charcoal dark:text-white">
                ✏️ Edit Video
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-600 dark:text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                  Title *
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange focus:outline-none border border-gray-300 dark:border-gray-600"
                  required
                  maxLength={255}
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                  Description
                </label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange focus:outline-none resize-none border border-gray-300 dark:border-gray-600"
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {editDescription.length}/1000 characters
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium rounded transition"
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit || !editTitle.trim()}
                  className="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

