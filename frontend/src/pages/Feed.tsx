import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoGridSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Simple relative time formatter
const getRelativeTime = (dateString: string): string => {
  const now = new Date();
  const past = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 604800)}w ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

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
    <div ref={containerRef} className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal dark:text-white mb-2 flex items-center gap-3">
              <svg className="w-8 h-8 sm:w-10 sm:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {feedMode === 'following' ? 'Following' : 'Explore'}
            </h1>
            <p className="text-sm sm:text-base text-gray-700 dark:text-gray-400">
              {feedMode === 'following' ? 'Videos from users you follow' : 'Discover videos from the community'}
            </p>
          </div>
          
          {/* Toggle between All and Following */}
          <div className="flex gap-2 bg-white dark:bg-petflix-dark-gray rounded-lg p-1 border border-gray-300 dark:border-gray-700 shadow-sm">
            <Button
              onClick={() => setFeedMode('all')}
              variant={feedMode === 'all' ? 'default' : 'ghost'}
              className={`px-6 py-2 font-medium flex items-center gap-2 ${
                feedMode === 'all'
                  ? 'bg-petflix-orange text-white dark:text-white hover:bg-petflix-orange/90'
                  : ''
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              All Videos
            </Button>
            <Button
              onClick={() => setFeedMode('following')}
              variant={feedMode === 'following' ? 'default' : 'ghost'}
              className={`px-6 py-2 font-medium flex items-center gap-2 ${
                feedMode === 'following'
                  ? 'bg-petflix-orange text-white dark:text-white hover:bg-petflix-orange/90'
                  : ''
              }`}
              disabled={!user}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Following
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <VideoGridSkeleton count={12} />
      ) : videos.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-petflix-dark-gray rounded-lg p-12 max-w-2xl mx-auto border border-gray-200 dark:border-transparent">
          <div className="flex justify-center mb-6">
            {feedMode === 'following' ? (
              <svg className="w-20 h-20 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ) : (
              <svg className="w-20 h-20 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          <h2 className="text-3xl font-bold text-charcoal dark:text-white mb-4">
            {feedMode === 'following' ? 'No Videos from Followed Users' : 'No Videos Yet'}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-8">
            {feedMode === 'following'
              ? 'Follow other users to see their shared videos here!'
              : 'Be the first to share a video from YouTube to get the community started!'}
          </p>
          <Link
            to="/search"
            className="inline-block px-8 py-3 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded transition"
          >
            Browse Videos
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
          {videos.map((video) => (
            <Link
              key={video.id}
              to={`/video/${video.id}`}
              className="block group"
            >
              <Card className="overflow-hidden transition-transform duration-200 ease-out hover:scale-105 border-gray-200/50 dark:border-gray-800/30 shadow-sm hover:shadow-md p-0">
                <CardContent className="p-0">
                  {/* Thumbnail Container with 16:9 Aspect Ratio */}
                  <div className="relative w-full pb-[56.25%] bg-gray-100 dark:bg-petflix-dark-gray">
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
                  
                  {/* Video Info Below Thumbnail - YouTube Style */}
                  <div className="p-3">
                    {/* Title - Fixed height for consistency */}
                    <h3 className="font-semibold text-charcoal dark:text-white text-sm line-clamp-2 mb-2 group-hover:text-petflix-orange dark:group-hover:text-petflix-orange transition-colors h-10">
                      {video.title}
                    </h3>
                    
                    {/* Username and Time */}
                    <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span className="truncate">
                        {video.username ? `@${video.username}` : 'Unknown'}
                      </span>
                      <span className="ml-2 flex-shrink-0">
                        {getRelativeTime(video.created_at)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
