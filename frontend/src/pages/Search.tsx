import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';

interface Video {
  id: string; // Petflix video ID
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  user: {
    id: string;
    username: string;
    profile_picture_url: string | null;
  };
}

type SortOption = 'relevance' | 'recency' | 'view_count' | 'engagement';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const toast = useToast();
  
  // Debounce search query to reduce API calls
  const debouncedQuery = useDebounce(query, 500);

  // Auto-search when debounced query, sort, or filters change
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, sortBy, selectedCategories.join(','), selectedTags.join(',')]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setSearched(true);

    try {
      const params = new URLSearchParams({
        q: searchQuery,
        sort: sortBy
      });
      
      if (selectedCategories.length > 0) {
        params.append('categories', selectedCategories.join(','));
      }
      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      const response = await api.get(`/videos/search?${params.toString()}`);
      setVideos(response.data.videos || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedCategories([]);
    setSelectedTags([]);
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query);
    }
  };

  const handleRefresh = async () => {
    if (query.trim()) {
      await performSearch(query);
    }
  };

  const containerRef = usePullToRefresh({
    onRefresh: handleRefresh,
    enabled: searched && !loading
  });

  return (
    <div ref={containerRef} className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 md:px-16">
      <div className="max-w-4xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-6">
          Search Pet Videos 🔍
        </h1>

        <form onSubmit={handleSearch}>
          <div className="flex gap-4 mb-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for cute cats, funny dogs, adorable bunnies..."
              className="flex-1 px-6 py-4 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded-lg placeholder-gray-500 dark:placeholder-gray-400 border border-gray-300 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange text-lg"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition disabled:opacity-50 shadow-md hover:shadow-lg border border-lightblue/30 dark:border-petflix-orange/30"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Sort and Filter Controls */}
          <div className="flex flex-wrap gap-4 items-center">
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-charcoal dark:text-white">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange"
              >
                <option value="relevance">Relevance</option>
                <option value="recency">Most Recent</option>
                <option value="view_count">View Count</option>
                <option value="engagement">Engagement</option>
              </select>
            </div>

            {/* Category Filter (Placeholder - would connect to actual categories) */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-charcoal dark:text-white">Category:</label>
              <select
                value={selectedCategories[0] || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedCategories([e.target.value]);
                  } else {
                    setSelectedCategories([]);
                  }
                }}
                className="px-4 py-2 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange"
              >
                <option value="">All Categories</option>
                <option value="cats">Cats</option>
                <option value="dogs">Dogs</option>
                <option value="birds">Birds</option>
                <option value="other">Other Pets</option>
              </select>
            </div>

            {/* Clear Filters Button */}
            {(selectedCategories.length > 0 || selectedTags.length > 0) && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium rounded transition text-sm"
              >
                Clear Filters
              </button>
            )}
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
          description="No shared videos match your search. Try different keywords or browse all videos!"
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
            <Link
              key={video.id}
              to={`/video/${video.id}`}
              className="group relative block rounded overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10"
            >
              {/* Thumbnail Container with 16:9 Aspect Ratio */}
              <div className="relative w-full pb-[56.25%] bg-white dark:bg-petflix-dark-gray">
                <img
                  src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
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
                  <p className="text-xs text-gray-300">
                    Shared by @{video.user.username}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
