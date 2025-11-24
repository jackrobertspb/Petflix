import { useState, useEffect, useRef } from 'react';
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
type SearchSource = 'petflix' | 'youtube';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('relevance');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchSource, setSearchSource] = useState<SearchSource>('petflix');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const toast = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query to reduce API calls
  const debouncedQuery = useDebounce(query, 500);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-search when debounced query, sort, filters, or source change
  // Also allow browsing all videos when sort changes (even without query)
  useEffect(() => {
    if (debouncedQuery.trim()) {
      performSearch(debouncedQuery);
    } else if (searched && searchSource === 'petflix') {
      // Only browse all videos for Petflix source
      performSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery, sortBy, selectedCategories.join(','), selectedTags.join(','), searchSource]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setSearched(true);

    try {
      if (searchSource === 'youtube') {
        // YouTube search
        if (!searchQuery.trim()) {
          // YouTube search requires a query
          setVideos([]);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          q: searchQuery,
          maxResults: '50'
        });

        const response = await api.get(`/videos/search/youtube?${params.toString()}`);
        
        // Transform YouTube results to match Petflix video format
        const youtubeVideos = response.data.videos.map((video: any) => ({
          id: video.id,
          youtube_video_id: video.id,
          title: video.title,
          description: video.description,
          thumbnail_url: video.thumbnailUrl,
          created_at: video.publishedAt,
          user: {
            id: 'youtube',
            username: video.channelTitle,
            profile_picture_url: null
          }
        }));
        
        setVideos(youtubeVideos);
      } else {
        // Petflix search
        const params = new URLSearchParams({
          sort: sortBy
        });
        
        // Only add q parameter if there's a search query
        if (searchQuery.trim()) {
          params.append('q', searchQuery);
        }
        
        if (selectedCategories.length > 0) {
          params.append('categories', selectedCategories.join(','));
        }
        if (selectedTags.length > 0) {
          params.append('tags', selectedTags.join(','));
        }

        const response = await api.get(`/videos/search?${params.toString()}`);
        setVideos(response.data.videos || []);
      }
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
    // Allow searching even with empty query (browse all videos)
    performSearch(query);
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
      <div className="max-w-5xl mx-auto mb-12">
        <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-8">
          Search Pet Videos 🔍
        </h1>

        <form onSubmit={handleSearch}>
          {/* Search Bar with Integrated Dropdown */}
          <div className="flex gap-3 mb-6">
            <div className="flex-1 relative">
              <div className="flex items-center bg-white dark:bg-petflix-dark-gray rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-lightblue dark:focus-within:ring-petflix-orange">
                {/* Custom Dropdown inside search bar */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-4 text-charcoal dark:text-white font-medium border-r border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm min-w-[140px]"
                  >
                    <span>{searchSource === 'petflix' ? '🐾 Petflix' : '▶️ YouTube'}</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-petflix-dark-gray border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchSource('petflix');
                          setVideos([]);
                          setSearched(false);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors first:rounded-t-lg ${
                          searchSource === 'petflix' ? 'bg-lightblue/10 dark:bg-petflix-orange/10' : ''
                        }`}
                      >
                        <span className="text-lg">🐾</span>
                        <div>
                          <div className="font-medium text-charcoal dark:text-white text-sm">Petflix</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Videos shared by users</div>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchSource('youtube');
                          setVideos([]);
                          setSearched(false);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors last:rounded-b-lg ${
                          searchSource === 'youtube' ? 'bg-red-50 dark:bg-red-900/20' : ''
                        }`}
                      >
                        <span className="text-lg">▶️</span>
                        <div>
                          <div className="font-medium text-charcoal dark:text-white text-sm">YouTube</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Pets & Animals</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Search Input */}
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchSource === 'petflix'
                      ? 'Search for cute cats, funny dogs, adorable bunnies...'
                      : 'Search YouTube for pet videos...'
                  }
                  className="flex-1 px-6 py-4 bg-transparent text-charcoal dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none text-base"
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-10 py-4 bg-lightblue hover:bg-blue-400 dark:bg-petflix-orange dark:hover:bg-orange-500 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Sort and Filter Controls - Only for Petflix search */}
          {searchSource === 'petflix' && (
            <div className="flex flex-wrap gap-3 items-center">
              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="px-4 py-2 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange text-sm"
              >
                <option value="relevance">Sort: Relevance</option>
                <option value="recency">Sort: Most Recent</option>
                <option value="view_count">Sort: View Count</option>
                <option value="engagement">Sort: Engagement</option>
              </select>

              {/* Category Filter */}
              <select
                value={selectedCategories[0] || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedCategories([e.target.value]);
                  } else {
                    setSelectedCategories([]);
                  }
                }}
                className="px-4 py-2 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange text-sm"
              >
                <option value="">All Categories</option>
                <option value="cats">🐱 Cats</option>
                <option value="dogs">🐶 Dogs</option>
                <option value="birds">🦜 Birds</option>
                <option value="other">🐾 Other Pets</option>
              </select>

              {/* Clear Filters Button */}
              {(selectedCategories.length > 0 || selectedTags.length > 0) && (
                <button
                  onClick={handleClearFilters}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-charcoal dark:hover:text-white font-medium text-sm underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
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
          description={
            searchSource === 'petflix'
              ? "No shared videos match your search. Try different keywords or browse all videos!"
              : "No YouTube videos found. Try different keywords or check your spelling!"
          }
          actionText="Clear Search"
          onAction={() => {
            setQuery('');
            setSearched(false);
            setVideos([]);
          }}
        />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 md:gap-3">
          {videos.map((video) => {
            // For YouTube search results, link to YouTube
            const isYouTubeResult = searchSource === 'youtube';
            const linkProps = isYouTubeResult
              ? {
                  as: 'a' as const,
                  href: `https://www.youtube.com/watch?v=${video.youtube_video_id}`,
                  target: '_blank',
                  rel: 'noopener noreferrer'
                }
              : {
                  as: Link,
                  to: `/video/${video.id}`
                };

            const Component = linkProps.as;
            
            return (
              <Component
                key={video.id}
                {...(isYouTubeResult ? { href: linkProps.href, target: linkProps.target, rel: linkProps.rel } : { to: linkProps.to })}
                className="group relative block rounded overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10"
              >
                {/* YouTube Badge for YouTube results */}
                {isYouTubeResult && (
                  <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold shadow-lg">
                    YouTube
                  </div>
                )}
                
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
                      {isYouTubeResult ? `By ${video.user.username}` : `Shared by @${video.user.username}`}
                    </p>
                  </div>
                </div>
              </Component>
            );
          })}
        </div>
      )}
    </div>
  );
};
