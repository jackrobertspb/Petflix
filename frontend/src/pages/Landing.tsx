import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  shared_by_user_id: string;
  created_at: string;
}

export const Landing = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Use trending endpoint for landing page
        const response = await api.get('/videos/trending?limit=12');
        setVideos(response.data.videos || []);
      } catch (error) {
        console.error('Failed to load trending videos:', error);
        // Fallback to regular videos if trending fails
        try {
          const fallbackResponse = await api.get('/videos?limit=12');
          setVideos(fallbackResponse.data.videos || []);
        } catch (fallbackError) {
          console.error('Failed to load videos:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black">
      {/* Hero Section - Netflix Style */}
      <div className="relative h-[55vh] sm:h-[70vh] md:h-[80vh] lg:h-[85vh] flex items-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-80 dark:opacity-100"
            style={{
              backgroundImage: 'url(/hero-background.png)',
              filter: 'brightness(0.6) saturate(1.2)'
            }}
          ></div>
          {/* Gradient overlay for text readability - different for light/dark */}
          <div className="absolute inset-0 bg-gradient-to-r from-cream-light/90 via-cream-light/70 to-transparent dark:from-petflix-black dark:via-petflix-black/80 dark:to-transparent"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-cream-light/60 via-transparent to-transparent dark:from-petflix-black dark:via-transparent dark:to-transparent"></div>
        </div>
        
        {/* Hero content */}
        <div className="relative z-20 px-4 sm:px-6 md:px-8 lg:px-16 max-w-4xl w-full">
          <div className="mb-3 sm:mb-4">
            <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-petflix-orange dark:bg-petflix-orange/90 text-white dark:text-white font-bold text-xs sm:text-sm rounded-lg mb-3 sm:mb-4 border border-petflix-orange/30 dark:border-petflix-orange/30 shadow-sm whitespace-nowrap">
              #1 Pet Video Platform
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-charcoal dark:text-white mb-3 sm:mb-4 md:mb-6 leading-tight break-words">
            Unlimited pet videos,<br />
            purrs, and paws
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 md:mb-8 max-w-2xl break-words">
            Watch anywhere. Share anytime. Discover the cutest pet moments from YouTube.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
            {!user && (
              <Button
                asChild
                className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 md:py-4 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-white dark:hover:bg-gray-200 text-white dark:text-petflix-black font-bold text-sm sm:text-base md:text-lg shadow-md hover:shadow-lg border border-petflix-orange/30 dark:border-gray-300"
              >
                <Link to="/register">
                  <span>▶</span> Get Started
                </Link>
              </Button>
            )}
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 md:py-4 bg-white/80 hover:bg-white dark:bg-petflix-gray/80 dark:hover:bg-petflix-gray text-charcoal dark:text-white font-bold text-sm sm:text-base md:text-lg shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <Link to="/search" className="flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Videos
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-16 pt-2 pb-8 sm:pt-4 sm:pb-12 md:pt-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-charcoal dark:text-white mb-4 sm:mb-6">
          Trending Now
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-600 dark:text-gray-400">Loading videos...</div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-petflix-dark rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <p className="text-xl text-gray-700 dark:text-gray-400 mb-4">No videos yet.</p>
            <p className="text-gray-600 dark:text-gray-500">Be the first to share a cute pet video!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3">
            {videos.map((video) => (
              <Card
                key={video.id}
                className="group relative overflow-hidden transition-transform duration-300 hover:scale-105 hover:z-10 border-gray-200/50 dark:border-gray-800/30 shadow-md hover:shadow-xl p-0 aspect-video"
              >
                <Link
                  to={`/video/${video.id}`}
                  className="block h-full"
                >
                  <CardContent className="p-0 h-full">
                    <img
                      src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                      alt={video.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src.includes('mqdefault')) {
                          target.src = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-semibold text-white text-sm line-clamp-2">
                          {video.title}
                        </h3>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="border-t border-gray-300 dark:border-gray-800 bg-white/30 dark:bg-petflix-dark/30 px-4 sm:px-6 md:px-8 lg:px-16 py-12 sm:py-16 md:py-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="text-center p-6 bg-white dark:bg-petflix-dark rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Watch Anywhere</h3>
            <p className="text-gray-700 dark:text-gray-400">
              Stream unlimited pet videos on your phone, tablet, or computer.
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-petflix-dark rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 text-charcoal dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Share the Love</h3>
            <p className="text-gray-700 dark:text-gray-400">
              Curate your favorite pet moments and share them with the community.
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-petflix-dark rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="mb-4 flex justify-center">
              <svg className="w-16 h-16 text-charcoal dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Discover Daily</h3>
            <p className="text-gray-700 dark:text-gray-400">
              New adorable pet videos added every day from YouTube.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
