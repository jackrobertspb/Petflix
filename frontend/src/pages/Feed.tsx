import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

export const Feed = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      // Try /api/v1/videos first (if baseURL doesn't include /api/v1)
      // Otherwise try /videos if baseURL already includes /api/v1
      const response = await api.get('/api/v1/videos').catch(() => 
        api.get('/videos')
      );
      
      // Handle different response structures
      const videos = response.data?.videos || response.data || [];
      setVideos(Array.isArray(videos) ? videos : []);
    } catch (error: any) {
      console.error('Failed to fetch videos:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        baseURL: api.defaults.baseURL
      });
      // Set empty array on error so we show the "no videos" message
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center">
        <div className="text-petflix-orange text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-charcoal dark:text-cream-light mb-8">
          Petflix Feed
        </h1>
        
        {videos.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-charcoal dark:text-cream-light text-lg">
              No videos yet. Be the first to share a video!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <Link
                key={video.id}
                to={`/video/${video.id}`}
                className="block bg-white dark:bg-petflix-dark rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-charcoal dark:text-cream-light mb-2 line-clamp-2">
                    {video.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-petflix-gray line-clamp-2">
                    {video.description}
                  </p>
                  {video.username && (
                    <p className="text-xs text-petflix-orange mt-2">
                      by {video.username}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

