import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  shared_by_user_id: string;
  username?: string;
  profile_picture_url?: string;
  created_at: string;
}

type FeedMode = 'all' | 'following';

export const Feed = () => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedMode, setFeedMode] = useState<FeedMode>('all');
  const { user } = useAuth();

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      try {
        let response;
        if (feedMode === 'following' && user) {
          // Fetch videos from followed users
          response = await api.get(`/follows/${user.id}/feed`);
          setVideos(response.data.videos || []);
        } else {
          // Fetch all videos
          response = await api.get('/videos?limit=20');
          setVideos(response.data.videos || []);
        }
      } catch (error) {
        console.error('Failed to load feed:', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchFeed();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedMode, user?.id]);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      let response;
      if (feedMode === 'following' && user) {
        response = await api.get(`/follows/${user.id}/feed`);
        setVideos(response.data.videos || []);
      } else {
        response = await api.get('/videos?limit=20');
        setVideos(response.data.videos || []);
      }
    } catch (error) {
      console.error('Failed to refresh feed:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerRef = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: !loading
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 md:px-16">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">
              Your Feed 🎬
            </h1>
            <p className="text-gray-700 dark:text-gray-400">
              {feedMode === 'following' ? 'Videos from users you follow' : 'All shared videos'}
            </p>
          </div>
          
          {/* Toggle between All and Following */}
          <div className="flex gap-2 bg-white dark:bg-petflix-dark-gray rounded-lg p-1 border border-gray-300 dark:border-gray-700 shadow-sm">
            <button
              onClick={() => setFeedMode('all')}
              className={`px-6 py-2 rounded-md font-medium transition ${
                feedMode === 'all'
                  ? 'bg-petflix-orange text-charcoal dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-charcoal dark:text-white'
              }`}
            >
              All Videos
            </button>
            <button
              onClick={() => setFeedMode('following')}
              className={`px-6 py-2 rounded-md font-medium transition ${
                feedMode === 'following'
                  ? 'bg-petflix-orange text-charcoal dark:text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-charcoal dark:text-white'
              }`}
              disabled={!user}
            >
              Following
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <EmptyState
          icon={feedMode === 'following' ? '👥' : '📺'}
          title={feedMode === 'following' ? 'No Videos from Followed Users' : 'Your Feed is Empty'}
          description={
            feedMode === 'following'
              ? 'Follow other users to see their shared videos here!'
              : 'Be the first to share a video or search for pet videos to add to your feed.'
          }
          actionText="Browse Videos"
          actionLink="/search"
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
          {videos.map((video) => (
            <Link
              key={video.id}
              to={`/video/${video.id}`}
              className="group relative rounded-lg overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10 border border-gray-200/50 dark:border-gray-800/30 shadow-md hover:shadow-xl"
            >
              {/* Thumbnail Container with 16:9 Aspect Ratio */}
              <div className="relative w-full pb-[56.25%] bg-white dark:bg-petflix-dark-gray">
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    // Fallback to medium quality if high quality fails
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
          ))}
        </div>
      )}
    </div>
  );
};
