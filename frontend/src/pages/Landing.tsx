import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
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
      <div className="relative h-[70vh] sm:h-[80vh] md:h-[85vh] flex items-center overflow-hidden">
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
            <span className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-lightblue dark:bg-petflix-orange/90 text-charcoal dark:text-white font-bold text-xs sm:text-sm rounded-lg mb-3 sm:mb-4 border border-lightblue/30 dark:border-petflix-orange/30 shadow-sm whitespace-nowrap">
              #1 Pet Video Platform
            </span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-charcoal dark:text-white mb-3 sm:mb-4 md:mb-6 leading-tight break-words">
            Unlimited pet videos,<br />
            purrs, and paws 🐾
          </h1>
          
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 md:mb-8 max-w-2xl break-words">
            Watch anywhere. Share anytime. Discover the cutest pet moments from YouTube.
          </p>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full sm:w-auto">
            <Button
              asChild
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 md:py-4 bg-lightblue hover:bg-lightblue/80 dark:bg-white dark:hover:bg-gray-200 text-charcoal dark:text-petflix-black font-bold text-sm sm:text-base md:text-lg shadow-md hover:shadow-lg border border-lightblue/30 dark:border-gray-300"
            >
              <Link to="/register">
                <span>▶</span> Get Started
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 md:py-4 bg-white/80 hover:bg-white dark:bg-petflix-gray/80 dark:hover:bg-petflix-gray text-charcoal dark:text-white font-bold text-sm sm:text-base md:text-lg shadow-md hover:shadow-lg border border-gray-200 dark:border-gray-700"
            >
              <Link to="/search">
                ℹ Browse Videos
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <div className="px-4 sm:px-6 md:px-8 lg:px-16 py-8 sm:py-12">
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
            <div className="text-5xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Watch Anywhere</h3>
            <p className="text-gray-700 dark:text-gray-400">
              Stream unlimited pet videos on your phone, tablet, or computer.
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-petflix-dark rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2">Share the Love</h3>
            <p className="text-gray-700 dark:text-gray-400">
              Curate your favorite pet moments and share them with the community.
            </p>
          </div>
          <div className="text-center p-6 bg-white dark:bg-petflix-dark rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="text-5xl mb-4">🌟</div>
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
