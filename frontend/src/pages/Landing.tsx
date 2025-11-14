import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';

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
        const response = await api.get('/videos?limit=12');
        setVideos(response.data.videos || []);
      } catch (error) {
        console.error('Failed to load videos:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  return (
    <div className="min-h-screen bg-petflix-black">
      {/* Hero Section - Netflix Style */}
      <div className="relative h-[85vh] flex items-center">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-petflix-black via-petflix-black/70 to-transparent z-10"></div>
        
        {/* Hero content */}
        <div className="relative z-20 px-8 md:px-16 max-w-4xl">
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-petflix-orange/90 text-white font-bold text-sm rounded mb-4">
              #1 Pet Video Platform
            </span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Unlimited pet videos,<br />
            purrs, and paws 🐾
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-2xl">
            Watch anywhere. Share anytime. Discover the cutest pet moments from YouTube.
          </p>

          <div className="flex gap-4">
            <Link
              to="/register"
              className="px-8 py-4 bg-white hover:bg-gray-200 text-petflix-black font-bold text-lg rounded flex items-center gap-2 transition transform hover:scale-105"
            >
              <span>▶</span> Get Started
            </Link>
            <Link
              to="/search"
              className="px-8 py-4 bg-petflix-gray/80 hover:bg-petflix-gray text-white font-bold text-lg rounded flex items-center gap-2 transition"
            >
              ℹ Browse Videos
            </Link>
          </div>
        </div>
      </div>

      {/* Trending Section */}
      <div className="px-8 md:px-16 py-12">
        <h2 className="text-3xl font-bold text-white mb-6">
          Trending Now
        </h2>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-xl text-gray-400">Loading videos...</div>
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-12 bg-petflix-dark rounded-lg">
            <p className="text-xl text-gray-400 mb-4">No videos yet.</p>
            <p className="text-gray-500">Be the first to share a cute pet video!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2">
            {videos.map((video) => (
              <Link
                key={video.id}
                to={`/video/${video.id}`}
                className="group relative aspect-video rounded overflow-hidden transform transition duration-300 hover:scale-110 hover:z-10"
              >
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="font-semibold text-white text-sm line-clamp-2">
                      {video.title}
                    </h3>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="border-t-8 border-petflix-gray px-8 md:px-16 py-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-5xl mb-4">🎬</div>
            <h3 className="text-2xl font-bold text-white mb-2">Watch Anywhere</h3>
            <p className="text-gray-400">
              Stream unlimited pet videos on your phone, tablet, or computer.
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">❤️</div>
            <h3 className="text-2xl font-bold text-white mb-2">Share the Love</h3>
            <p className="text-gray-400">
              Curate your favorite pet moments and share them with the community.
            </p>
          </div>
          <div className="text-center">
            <div className="text-5xl mb-4">🌟</div>
            <h3 className="text-2xl font-bold text-white mb-2">Discover Daily</h3>
            <p className="text-gray-400">
              New adorable pet videos added every day from YouTube.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
