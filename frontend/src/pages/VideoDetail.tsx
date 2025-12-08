import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api, videoLikesAPI, commentLikesAPI, commentsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { formatRelativeTime } from '../lib/dateUtils';
import { trackRecentlyViewed, removeRecentlyViewed } from '../lib/indexedDB';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  shared_by_user_id: string;
  username?: string;
  created_at: string;
  view_count?: number;
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
  const [videoLikeLoading, setVideoLikeLoading] = useState(false);
  const [commentLikes, setCommentLikes] = useState<Record<string, { liked: boolean; count: number }>>({});
  const [commentLikeLoading, setCommentLikeLoading] = useState<Record<string, boolean>>({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [titleExpanded, setTitleExpanded] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [generatingShareUrl, setGeneratingShareUrl] = useState(false);
  const [showDeleteVideoModal, setShowDeleteVideoModal] = useState(false);
  const [showDeleteCommentModal, setShowDeleteCommentModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
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

        // Track video as recently viewed (offline storage)
        if (videoRes.data) {
          trackRecentlyViewed({
            videoId: videoRes.data.id,
            youtube_video_id: videoRes.data.youtube_video_id,
            title: videoRes.data.title,
            description: videoRes.data.description || '',
            thumbnail_url: videoRes.data.thumbnail_url,
            shared_by_user_id: videoRes.data.shared_by_user_id,
            username: videoRes.data.username,
            profile_picture_url: videoRes.data.profile_picture_url,
            created_at: videoRes.data.created_at,
          }).catch(err => {
            console.warn('Failed to track recently viewed:', err);
            // Don't show error to user - offline storage is optional
          });
        }
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

    // Validate comment length
    if (newComment.length > 280) {
      toast.error('Comment must be 280 characters or less!');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/comments`, {
        video_id: id,
        text: newComment.trim(),
      });

      // Use current time for display to show "just now" instead of "X seconds ago"
      const commentWithCurrentTime = {
        ...response.data,
        created_at: new Date().toISOString()
      };
      
      setComments([commentWithCurrentTime, ...comments]);
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

    // Validate reply length
    if (replyText.length > 280) {
      toast.error('Reply must be 280 characters or less!');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post(`/comments`, {
        video_id: id,
        text: replyText.trim(),
        parent_comment_id: parentCommentId,
      });

      // Use current time for display to show "just now" instead of "X seconds ago"
      const replyWithCurrentTime = {
        ...response.data,
        created_at: new Date().toISOString()
      };

      setComments([...comments, replyWithCurrentTime]);
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

    if (videoLikeLoading) return; // Prevent spam clicking

    setVideoLikeLoading(true);
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
    } finally {
      setVideoLikeLoading(false);
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!user) {
      toast.warning('Please sign in to like comments');
      return;
    }

    if (commentLikeLoading[commentId]) return; // Prevent spam clicking

    setCommentLikeLoading(prev => ({ ...prev, [commentId]: true }));
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
    } finally {
      setCommentLikeLoading(prev => ({ ...prev, [commentId]: false }));
    }
  };

  const handleDeleteCommentClick = (commentId: string) => {
    console.log('🗑️ Delete comment clicked:', commentId);
    console.log('📊 Current state - showDeleteCommentModal:', showDeleteCommentModal);
    console.log('📊 Current state - commentToDelete:', commentToDelete);
    setCommentToDelete(commentId);
    setShowDeleteCommentModal(true);
    console.log('✅ After setState - showDeleteCommentModal should be true');
  };

  const handleConfirmDeleteComment = async () => {
    console.log('🗑️ Confirm delete comment called, commentToDelete:', commentToDelete);
    if (!commentToDelete) {
      console.error('❌ No commentToDelete set!');
      return;
    }

    try {
      console.log('📡 Sending delete request for comment:', commentToDelete);
      await commentsAPI.deleteComment(commentToDelete);
      console.log('✅ Comment deleted successfully');
      setComments(prev => prev.filter(c => c.id !== commentToDelete));
      toast.success('Comment deleted successfully');
      setShowDeleteCommentModal(false);
      setCommentToDelete(null);
    } catch (error: any) {
      console.error('❌ Failed to delete comment:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      toast.error('Failed to delete comment. Please try again.');
    }
  };

  const handleEditCommentClick = (commentId: string, currentText: string) => {
    setEditingComment(commentId);
    setEditText(currentText);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim() || editText.length > 280) {
      toast.error('Comment must be between 1 and 280 characters');
      return;
    }

    try {
      await commentsAPI.updateComment(commentId, editText.trim());
      setComments(prev => prev.map(c => 
        c.id === commentId ? { ...c, content: editText.trim() } : c
      ));
      toast.success('Comment updated!');
      setEditingComment(null);
      setEditText('');
    } catch (error: any) {
      console.error('Failed to update comment:', error);
      toast.error('Failed to update comment. Please try again.');
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText('');
  };

  const handleOpenEditModal = () => {
    if (!video) return;
    setEditTitle(video.title);
    setEditDescription(video.description);
    setShowEditModal(true);
  };

  const handleSaveVideoEdit = async (e: React.FormEvent) => {
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

  const handleDeleteVideoClick = () => {
    console.log('🗑️ Delete video clicked, video ID:', id);
    console.log('📊 Current state - showDeleteVideoModal:', showDeleteVideoModal);
    console.log('📊 Current user:', user);
    setShowDeleteVideoModal(true);
    console.log('✅ After setState - showDeleteVideoModal should be true');
  };

  const handleConfirmDeleteVideo = async () => {
    console.log('🗑️ Confirm delete video called, video ID:', id);
    if (!id) {
      console.error('❌ No video ID!');
      return;
    }

    try {
      console.log('📡 Sending delete request for video:', id);
      await api.delete(`/videos/${id}`);
      console.log('✅ Video deleted successfully');
      
      // Remove from IndexedDB if it exists there
      try {
        await removeRecentlyViewed(id);
        console.log('✅ Video removed from recently viewed');
      } catch (indexedDBError) {
        // Don't fail if IndexedDB removal fails - it's optional
        console.warn('⚠️ Failed to remove from IndexedDB:', indexedDBError);
      }
      
      toast.success('Video deleted successfully');
      setShowDeleteVideoModal(false);
      // Redirect to profile after a brief delay
      setTimeout(() => {
        navigate(`/profile/${user?.id}`);
      }, 1500);
    } catch (error: any) {
      console.error('❌ Failed to delete video:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: `/videos/${id}`
      });
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
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16 pb-8 sm:pb-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Video Player & Info */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
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
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-transparent">
              <h1 
                className={`text-xl sm:text-2xl md:text-3xl font-bold text-charcoal dark:text-white mb-3 sm:mb-4 cursor-pointer hover:text-petflix-orange transition break-all ${titleExpanded ? '' : 'line-clamp-3'}`}
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
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-transparent">
              <h2 className="text-xl sm:text-2xl font-bold text-charcoal dark:text-white mb-4 sm:mb-6 flex items-center gap-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Comments ({comments.length})
              </h2>

              {user ? (
                <form onSubmit={handleSubmitComment} className="mb-8">
                  <div className="relative">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white focus:ring-2 focus:ring-petflix-orange resize-none placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-transparent break-words overflow-wrap-anywhere"
                      rows={3}
                      maxLength={280}
                      style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                    />
                    <div className="flex justify-between items-center mt-2">
                      <p className={`text-xs ${newComment.length > 280 ? 'text-red-600 dark:text-red-400 font-semibold' : newComment.length > 250 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-500'}`}>
                        {newComment.length}/280 characters
                        {newComment.length > 280 && ' - Comment is too long!'}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    disabled={submitting || !newComment.trim() || newComment.length > 280}
                    className="mt-3 px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold"
                  >
                    {submitting ? 'Posting...' : 'Post Comment'}
                  </Button>
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
                          <div className="flex-1 min-w-0 overflow-hidden">
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
                            {editingComment === comment.id ? (
                              <div className="mb-3">
                                <Textarea
                                  value={editText}
                                  onChange={(e) => setEditText(e.target.value)}
                                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white focus:ring-2 focus:ring-petflix-orange resize-none border border-gray-300 dark:border-transparent break-words overflow-wrap-anywhere"
                                  rows={3}
                                  maxLength={280}
                                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                />
                                <p className={`text-xs mt-2 ${editText.length > 280 ? 'text-red-600 dark:text-red-400 font-semibold' : editText.length > 250 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-500'}`}>
                                  {editText.length}/280 characters
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    onClick={() => handleSaveEdit(comment.id)}
                                    disabled={!editText.trim() || editText.length > 280}
                                    size="sm"
                                    className="px-4 py-2 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold flex items-center gap-2"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                    </svg>
                                    Save
                                  </Button>
                                  <Button
                                    onClick={handleCancelEdit}
                                    size="sm"
                                    variant="outline"
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3 break-all">{comment.content}</p>
                                
                                {/* Comment Actions */}
                                <div className="flex items-center gap-4 mb-3">
                                  <Button
                                    onClick={() => handleCommentLike(comment.id)}
                                    disabled={commentLikeLoading[comment.id]}
                                    variant="ghost"
                                    size="sm"
                                    className={`flex items-center gap-1 text-sm font-medium ${
                                      commentLikes[comment.id]?.liked
                                        ? 'text-petflix-orange hover:text-petflix-red'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-petflix-orange dark:hover:text-petflix-orange'
                                    }`}
                                  >
                                    {commentLikeLoading[comment.id] ? (
                                      <div className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                    ) : commentLikes[comment.id]?.liked ? (
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                      </svg>
                                    ) : (
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                      </svg>
                                    )}
                                    <span>{commentLikes[comment.id]?.count || 0}</span>
                                  </Button>

                                  {user && (
                                    <Button
                                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                      variant="ghost"
                                      size="sm"
                                      className="text-sm text-gray-600 dark:text-gray-400 hover:text-petflix-orange dark:hover:text-petflix-orange font-medium flex items-center gap-1"
                                    >
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                      </svg>
                                      Reply
                                    </Button>
                                  )}

                                  {user && user.id === comment.user_id && (
                                    <>
                                      <Button
                                        onClick={() => handleEditCommentClick(comment.id, comment.content)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Edit
                                      </Button>
                                      <Button
                                        onClick={() => handleDeleteCommentClick(comment.id)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1"
                                      >
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        Delete
                                      </Button>
                                    </>
                                  )}
                                </div>
                              </>
                            )}

                            {/* Reply Input */}
                            {replyingTo === comment.id && (
                              <div className="mt-4 mb-4 pl-4 border-l-2 border-petflix-orange dark:border-petflix-orange">
                                <Textarea
                                  value={replyText}
                                  onChange={(e) => setReplyText(e.target.value)}
                                  placeholder={`Reply to @${comment.username}...`}
                                  className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange resize-none border border-gray-300 dark:border-transparent break-words overflow-wrap-anywhere"
                                  rows={3}
                                  maxLength={280}
                                  style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                />
                                <p className={`text-xs mt-2 ${replyText.length > 280 ? 'text-red-600 dark:text-red-400 font-semibold' : replyText.length > 250 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-500'}`}>
                                  {replyText.length}/280 characters
                                  {replyText.length > 280 && ' - Reply is too long!'}
                                </p>
                                <div className="flex gap-2 mt-2">
                                  <Button
                                    onClick={() => handleSubmitReply(comment.id)}
                                    disabled={submitting || !replyText.trim() || replyText.length > 280}
                                    size="sm"
                                    className="px-4 py-2 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold"
                                  >
                                    {submitting ? 'Posting...' : 'Post Reply'}
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      setReplyingTo(null);
                                      setReplyText('');
                                    }}
                                    size="sm"
                                    variant="outline"
                                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium"
                                  >
                                    Cancel
                                  </Button>
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
                                    <div className="flex-1 min-w-0 overflow-hidden">
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
                                      {editingComment === reply.id ? (
                                        <div className="mb-2">
                                          <Textarea
                                            value={editText}
                                            onChange={(e) => setEditText(e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white focus:ring-2 focus:ring-petflix-orange resize-none border border-gray-300 dark:border-transparent break-words overflow-wrap-anywhere text-sm"
                                            rows={2}
                                            maxLength={280}
                                            style={{ wordBreak: 'break-word', overflowWrap: 'anywhere' }}
                                          />
                                          <p className={`text-xs mt-1 ${editText.length > 280 ? 'text-red-600 dark:text-red-400 font-semibold' : editText.length > 250 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500 dark:text-gray-500'}`}>
                                            {editText.length}/280 characters
                                          </p>
                                          <div className="flex gap-2 mt-2">
                                            <Button
                                              onClick={() => handleSaveEdit(reply.id)}
                                              disabled={!editText.trim() || editText.length > 280}
                                              size="sm"
                                              className="px-3 py-1 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold text-xs flex items-center gap-1"
                                            >
                                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                                              </svg>
                                              Save
                                            </Button>
                                            <Button
                                              onClick={handleCancelEdit}
                                              size="sm"
                                              variant="outline"
                                              className="px-3 py-1 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium text-xs"
                                            >
                                              Cancel
                                            </Button>
                                          </div>
                                        </div>
                                      ) : (
                                        <>
                                          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2 break-all">{reply.content}</p>
                                          
                                          {/* Reply Actions */}
                                          <div className="flex items-center gap-3">
                                            <Button
                                              onClick={() => handleCommentLike(reply.id)}
                                              disabled={commentLikeLoading[reply.id]}
                                              variant="ghost"
                                              size="sm"
                                              className={`flex items-center gap-1 text-xs font-medium ${
                                                commentLikes[reply.id]?.liked
                                                  ? 'text-petflix-orange hover:text-petflix-red'
                                                  : 'text-gray-600 dark:text-gray-400 hover:text-petflix-orange dark:hover:text-petflix-orange'
                                              }`}
                                            >
                                              {commentLikeLoading[reply.id] ? (
                                                <div className="inline-block w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                              ) : commentLikes[reply.id]?.liked ? (
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                                                </svg>
                                              ) : (
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                              )}
                                              <span>{commentLikes[reply.id]?.count || 0}</span>
                                            </Button>

                                            {user && (
                                              <Button
                                                onClick={() => {
                                                  setReplyingTo(comment.id); // Reply to parent comment
                                                  setReplyText(`@${reply.username} `); // Mention the user
                                                }}
                                                variant="ghost"
                                                size="sm"
                                                className="text-xs text-gray-600 dark:text-gray-400 hover:text-petflix-orange dark:hover:text-petflix-orange font-medium flex items-center gap-1"
                                              >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                </svg>
                                                Reply
                                              </Button>
                                            )}

                                            {user && user.id === reply.user_id && (
                                              <>
                                                <Button
                                                  onClick={() => handleEditCommentClick(reply.id, reply.content)}
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium flex items-center gap-1"
                                                >
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                  </svg>
                                                  Edit
                                                </Button>
                                                <Button
                                                  onClick={() => handleDeleteCommentClick(reply.id)}
                                                  variant="ghost"
                                                  size="sm"
                                                  className="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium flex items-center gap-1"
                                                >
                                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                  </svg>
                                                  Delete
                                                </Button>
                                              </>
                                            )}
                                          </div>
                                        </>
                                      )}
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
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 sm:p-6 sticky top-20 sm:top-24 border border-gray-200 dark:border-transparent">
              {/* Stats Section */}
              <div className="mb-6 pb-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-bold text-charcoal dark:text-white text-lg mb-4">Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      Views
                    </span>
                    <span className="font-bold text-charcoal dark:text-white">
                      {video.view_count?.toLocaleString() || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                      </svg>
                      Likes
                    </span>
                    <span className="font-bold text-charcoal dark:text-white">
                      {videoLikeCount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      Comments
                    </span>
                    <span className="font-bold text-charcoal dark:text-white">
                      {comments.length.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-charcoal dark:text-white text-lg mb-4">Actions</h3>
              <div className="space-y-3">
                {/* Owner-only actions */}
                {user && user.id === video?.shared_by_user_id && (
                  <>
                    <button 
                      onClick={handleOpenEditModal}
                      className="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Video
                    </button>
                    <button 
                      onClick={handleDeleteVideoClick}
                      className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete Video
                    </button>
                    <div className="border-t border-gray-300 dark:border-gray-600 my-3"></div>
                  </>
                )}

                <Button 
                  onClick={handleVideoLike}
                  disabled={videoLikeLoading}
                  variant={videoLiked ? 'default' : 'outline'}
                  className={`w-full px-4 py-3 font-medium flex items-center justify-center gap-2 ${
                    videoLiked 
                      ? 'bg-petflix-orange hover:bg-petflix-red text-white' 
                      : 'bg-gray-200 hover:bg-petflix-orange dark:bg-petflix-gray dark:hover:bg-petflix-orange text-charcoal dark:text-white'
                  }`}
                >
                  {videoLikeLoading ? (
                    <div className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                  ) : videoLiked ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                  {videoLiked ? 'Liked' : 'Like'} ({videoLikeCount})
                </Button>
                <Button 
                  onClick={handleOpenPlaylistModal}
                  variant="outline"
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-petflix-orange dark:bg-petflix-gray dark:hover:bg-petflix-orange text-charcoal dark:text-white font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add to Playlist
                </Button>
                <Button 
                  onClick={handleOpenShareModal}
                  variant="outline"
                  className="w-full px-4 py-3 bg-gray-200 hover:bg-petflix-orange dark:bg-petflix-gray dark:hover:bg-petflix-orange text-charcoal dark:text-white font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </Button>
                
                {/* Only show report button if NOT owner */}
                {(!user || user.id !== video?.shared_by_user_id) && (
                  <Button 
                    onClick={handleOpenReportModal}
                    variant="outline"
                    className="w-full px-4 py-3 bg-gray-200 hover:bg-red-500 dark:bg-petflix-gray dark:hover:bg-red-600 text-charcoal dark:text-white font-medium flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Report Video
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add to Playlist Modal */}
      <Dialog open={showPlaylistModal} onOpenChange={setShowPlaylistModal}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Add to Playlist</DialogTitle>
          </DialogHeader>

          {loadingPlaylists ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Loading playlists...
            </div>
          ) : playlists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400 mb-4">You don't have any playlists yet</p>
              <Button
                asChild
                className="bg-petflix-orange hover:bg-petflix-red text-white font-bold"
                onClick={() => setShowPlaylistModal(false)}
              >
                <Link to="/playlists">
                  Create Your First Playlist
                </Link>
              </Button>
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
                      className="mt-1 w-5 h-5 rounded border-gray-300 text-petflix-orange dark:text-petflix-orange focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange cursor-pointer"
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
                <Button
                  onClick={() => setShowPlaylistModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveToPlaylists}
                  disabled={savingPlaylists}
                  className="flex-1 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red"
                >
                  {savingPlaylists ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Video Modal */}
      <Dialog open={showReportModal} onOpenChange={setShowReportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Report Video
            </DialogTitle>
          </DialogHeader>

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
              <Textarea
                value={reportDetails}
                onChange={(e) => setReportDetails(e.target.value)}
                className="w-full px-4 py-3 bg-gray-100 dark:bg-petflix-gray text-charcoal dark:text-white focus:ring-2 focus:ring-red-600 resize-none border border-gray-300 dark:border-transparent"
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
              <Button
                type="button"
                onClick={() => setShowReportModal(false)}
                variant="outline"
                className="flex-1"
                disabled={submittingReport}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingReport || !reportReason}
                variant="destructive"
                className="flex-1"
              >
                {submittingReport ? 'Submitting...' : 'Submit Report'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Share Modal */}
      <Dialog open={showShareModal} onOpenChange={setShowShareModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share Video
            </DialogTitle>
          </DialogHeader>

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
                  <Input
                    type="text"
                    value={shareUrl || `${window.location.origin}/video/${id}`}
                    readOnly
                    className="flex-1 text-sm"
                  />
                  <Button
                    onClick={handleCopyShareLink}
                    className="bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white"
                  >
                    Copy
                  </Button>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                  Share to Social Media
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    onClick={handleShareToFacebook}
                    className="bg-[#1877F2] hover:bg-[#166FE5] text-white flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    <span>Facebook</span>
                  </Button>
                  <Button
                    onClick={handleShareToTwitter}
                    className="bg-[#1DA1F2] hover:bg-[#1A91DA] text-white flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                    </svg>
                    <span>Twitter</span>
                  </Button>
                  <Button
                    onClick={handleShareToInstagram}
                    className="bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCAF45] hover:opacity-90 text-white flex items-center justify-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    <span>Instagram</span>
                  </Button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 text-center">
                  Instagram: Link copied to clipboard. Paste it in your post or story.
                </p>
              </div>

              <Button
                onClick={() => setShowShareModal(false)}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Video Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Video
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveVideoEdit}>
            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                Title *
              </label>
              <Input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full"
                required
                maxLength={255}
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-3">
                Description
              </label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full resize-none"
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                {editDescription.length}/1000 characters
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => setShowEditModal(false)}
                variant="outline"
                className="flex-1"
                disabled={savingEdit}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={savingEdit || !editTitle.trim()}
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                {savingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Video Modal */}
      <Dialog open={showDeleteVideoModal} onOpenChange={setShowDeleteVideoModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Video
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-charcoal dark:text-white mb-4">
              Are you sure you want to delete this video? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  console.log('❌ Delete video cancelled');
                  setShowDeleteVideoModal(false);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteVideo}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Comment Modal */}
      <Dialog open={showDeleteCommentModal} onOpenChange={setShowDeleteCommentModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete Comment
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-charcoal dark:text-white mb-4">
              Are you sure you want to delete this comment? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={() => {
                  console.log('❌ Delete comment cancelled');
                  setShowDeleteCommentModal(false);
                  setCommentToDelete(null);
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleConfirmDeleteComment}
                variant="destructive"
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Delete Comment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

