import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { VideoCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

interface Video {
  id: string; // YouTube video ID
  title: string;
  description: string;
  thumbnailUrl: string; // Note: camelCase from YouTube API
  channelTitle: string;
  publishedAt: string;
}

export const Search = () => {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const toast = useToast();
  
  // Debounce search query to reduce API calls
  const debouncedQuery = useDebounce(query, 500);

  // Auto-search when debounced query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    }
  }, [debouncedQuery]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setSearched(true);

    try {
      const response = await api.get(`/videos/search/youtube?q=${encodeURIComponent(searchQuery)}`);
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  return (
    <div className="min-h-screen bg-petflix-black pt-24 px-8 md:px-16">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-white mb-6">
          Search Pet Videos 🔍
        </h1>

        <form onSubmit={handleSearch}>
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for cute cats, funny dogs, adorable bunnies..."
              className="flex-1 px-6 py-4 bg-petflix-gray text-white rounded placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-petflix-orange text-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded transition disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
          {[...Array(12)].map((_, i) => (
            <VideoCardSkeleton key={i} />
          ))}
        </div>
      ) : searched && videos.length === 0 ? (
        <EmptyState
          icon="🔍"
          title="No Videos Found"
          description="We couldn't find any videos matching your search. Try different keywords like 'cute cats' or 'funny dogs'!"
          actionText="Clear Search"
          onAction={() => {
            setQuery('');
            setSearched(false);
            setVideos([]);
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
          {videos.map((video) => (
            <a
              key={video.id}
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10"
            >
              {/* Thumbnail Container with 16:9 Aspect Ratio */}
              <div className="relative w-full pb-[56.25%] bg-petflix-dark-gray">
                <img
                  src={video.thumbnailUrl}
                  alt={video.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
              
              {/* Info Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <h3 className="font-bold text-white text-xs md:text-sm line-clamp-2 mb-1">
                    {video.title}
                  </h3>
                  <p className="text-xs text-gray-300">{video.channelTitle}</p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
