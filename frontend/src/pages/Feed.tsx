import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoGridSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
