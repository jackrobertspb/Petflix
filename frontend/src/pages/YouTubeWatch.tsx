import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface YouTubeVideoInfo {
  title: string;
  description: string;
  channelTitle: string;
  thumbnail: string;
}

export const YouTubeWatch = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [videoInfo, setVideoInfo] = useState<YouTubeVideoInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // You could fetch video info from YouTube API here if needed
    // For now, we'll just show the player
    setLoading(false);
  }, [videoId]);

  const handleShareToPetflix = () => {
    if (!user) {
      toast.error('Please sign in to share videos');
      navigate('/login');
      return;
    }
    // Navigate to share page with pre-filled video ID
    navigate(`/share?videoId=${videoId}`);
  };

  if (!videoId) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-24 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-4">Invalid Video</h1>
          <Link to="/search" className="text-petflix-orange hover:underline">
            Back to Search
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 pb-12">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-charcoal dark:hover:text-white transition"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>

        {/* Video Player */}
        <div className="bg-white dark:bg-petflix-dark rounded-lg overflow-hidden shadow-lg mb-6 border border-gray-200 dark:border-transparent">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
        </div>

        {/* Video Info & Actions */}
        <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-transparent">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-red-600 text-white text-xs px-2 py-1 rounded font-bold">
                  YouTube
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Watching from YouTube
                </span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                This video is playing directly from YouTube. Share it to Petflix to add comments, save to playlists, and track views!
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleShareToPetflix}
              className="flex items-center gap-2 px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white font-bold rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Share to Petflix
            </button>

            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-bold rounded-lg transition"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              Watch on YouTube
            </a>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">About YouTube Videos</h3>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Comments, likes, and view counts are not available for YouTube videos until they're shared to Petflix. 
                Click "Share to Petflix" to unlock all features!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

