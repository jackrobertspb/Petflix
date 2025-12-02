import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRecentlyViewed, isIndexedDBSupported, removeRecentlyViewed } from '../lib/indexedDB';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { formatRelativeTime } from '../lib/dateUtils';
import { Card, CardContent } from '@/components/ui/card';
import { videosAPI } from '../services/api';

interface RecentlyViewedVideo {
  videoId: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  shared_by_user_id: string;
  username?: string;
  profile_picture_url?: string;
  created_at: string;
  viewedAt: string;
}

export const RecentlyViewed = () => {
  const [videos, setVideos] = useState<RecentlyViewedVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    // Check if IndexedDB is supported
    if (!isIndexedDBSupported()) {
      setSupported(false);
      setLoading(false);
      return;
    }

    // Monitor online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    loadRecentlyViewed();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadRecentlyViewed = async () => {
    setLoading(true);
    try {
      const recentlyViewed = await getRecentlyViewed();
      
      // If online, verify videos still exist and remove deleted ones
      if (!isOffline && recentlyViewed.length > 0) {
        const validVideos: RecentlyViewedVideo[] = [];
        const deletedVideoIds: string[] = [];
        
        // Check each video in parallel
        await Promise.all(
          recentlyViewed.map(async (video) => {
            try {
              // Try to fetch the video - if it returns 404, it's deleted
              await videosAPI.getVideo(video.videoId);
              validVideos.push(video);
            } catch (error: any) {
              // If 404, video is deleted
              if (error.response?.status === 404) {
                deletedVideoIds.push(video.videoId);
              } else {
                // For other errors (network, etc.), keep the video (might be temporary)
                validVideos.push(video);
              }
            }
          })
        );
        
        // Remove deleted videos from IndexedDB
        if (deletedVideoIds.length > 0) {
          await Promise.all(
            deletedVideoIds.map(videoId => removeRecentlyViewed(videoId))
          );
        }
        
        setVideos(validVideos);
      } else {
        // Offline mode - show all videos from IndexedDB
        setVideos(recentlyViewed);
      }
    } catch (error) {
      console.error('Failed to load recently viewed videos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    await loadRecentlyViewed();
  };

  const containerRef = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: !loading,
  });

  if (!supported) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16">
        <div className="max-w-4xl mx-auto">
          <EmptyState
            icon="⚠️"
            title="Not Supported"
            description="Your browser doesn't support offline storage. Recently viewed videos cannot be saved."
          />
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16"
    >
      <div className="max-w-6xl mx-auto mb-8 sm:mb-12">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white">
            Recently Viewed
          </h1>
          {isOffline && (
            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 rounded-lg">
              <span>📴</span>
              <span className="text-sm font-medium">Viewing offline content</span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
            {[...Array(12)].map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <EmptyState
            icon="📺"
            title="No Recently Viewed Videos"
            description="Videos you watch will appear here. Start watching some videos to see them here!"
          />
        ) : (
          <>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {videos.length} {videos.length === 1 ? 'video' : 'videos'} watched
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
              {videos.map((video) => (
                <Card
                  key={video.videoId}
                  className="group relative overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10 border-gray-200/50 dark:border-gray-800/30 shadow-md hover:shadow-xl p-0"
                >
                  <Link
                    to={`/video/${video.videoId}`}
                    className="block"
                  >
                    <CardContent className="p-0">
                      {/* Thumbnail Container with 16:9 Aspect Ratio */}
                      <div className="relative w-full pb-[56.25%] bg-white dark:bg-petflix-dark-gray">
                        <img
                          src={video.thumbnail_url || `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                          alt={video.title}
                          className="absolute inset-0 w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (target.src.includes('mqdefault')) {
                              target.src = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
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
                          <p className="text-xs text-gray-300 mb-1">
                            {video.username ? `Shared by @${video.username}` : 'Shared by user'}
                          </p>
                          <p className="text-xs text-gray-400">
                            Viewed {formatRelativeTime(new Date(video.viewedAt))}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

