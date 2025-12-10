import { useState, useEffect, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useDebounce } from '../hooks/useDebounce';
import { usePullToRefresh } from '../hooks/usePullToRefresh';
import { VideoGridSkeleton, VideoCardSkeleton } from '../components/LoadingSkeleton';
import { EmptyState } from '../components/EmptyState';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface Video {
  id: string; // Petflix video ID
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
  is_available?: boolean; // Whether video is still available
  username?: string; // From YouTube search
  profile_picture_url?: string;
  users?: { // From follow feed API
    id: string;
    username: string;
    profile_picture_url: string | null;
  };
  user?: { // From Petflix search API
    id: string;
    username: string;
    profile_picture_url: string | null;
  };
}

type SortOption = 'relevance' | 'recency' | 'view_count' | 'engagement';
type SearchSource = 'petflix' | 'youtube';

export const Search = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params to retain search when navigating back
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!searchParams.get('q'));
  const [sortBy, setSortBy] = useState<SortOption>((searchParams.get('sort') as SortOption) || 'relevance');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [searchSource, setSearchSource] = useState<SearchSource>((searchParams.get('source') as SearchSource) || 'petflix');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [followedVideos, setFollowedVideos] = useState<Video[]>([]);
  const [loadingFollowed, setLoadingFollowed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user } = useAuth();
  const toast = useToast();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  
  // Debounce search query to reduce API calls
  const debouncedQuery = useDebounce(query, 500);

  // Track window size for responsive placeholder
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch videos from followed users on mount
  useEffect(() => {
    const fetchFollowedVideos = async () => {
      if (!user) return; // Don't fetch if not logged in
      
      setLoadingFollowed(true);
      try {
        const response = await api.get(`/follows/${user.id}/feed`);
        setFollowedVideos(response.data.videos || []);
      } catch (error) {
        console.error('Failed to fetch followed videos:', error);
        // Silently fail - not critical
      } finally {
        setLoadingFollowed(false);
      }
    };

    fetchFollowedVideos();
  }, [user]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
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
  }, [debouncedQuery, sortBy, selectedTags.join(','), searchSource]);

  const performSearch = async (searchQuery: string) => {
    setLoading(true);
    setSearched(true);

    // Update URL params to retain search state
    const params = new URLSearchParams();
    if (searchQuery) params.set('q', searchQuery);
    if (sortBy !== 'relevance') params.set('sort', sortBy);
    if (searchSource !== 'petflix') params.set('source', searchSource);
    setSearchParams(params);

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
    <div ref={containerRef} className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16">
      <div className="max-w-5xl mx-auto mb-8 sm:mb-12">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal dark:text-white mb-4 sm:mb-6 md:mb-8 flex items-center gap-3">
          Search Petflix
          <svg className="w-7 h-7 sm:w-8 sm:h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </h1>

        <form onSubmit={handleSearch}>
          {/* Search Bar with Integrated Dropdown */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4 sm:mb-6">
            <div className="flex-1 relative">
              <div className="flex items-center bg-white dark:bg-petflix-dark-gray rounded-lg border border-gray-300 dark:border-gray-700 shadow-sm focus-within:ring-2 focus-within:ring-petflix-orange dark:focus-within:ring-petflix-orange">
                {/* Custom Dropdown inside search bar */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center justify-between gap-4 px-4 py-4 text-charcoal dark:text-white font-medium border-r border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm min-w-[180px]"
                  >
                    <span className="flex items-center gap-2">
                      {searchSource === 'petflix' ? (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
                          <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87c-11.84 43.42 3.64 85.22 34.58 93.36z"/>
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                      )}
                      {searchSource === 'petflix' ? 'Petflix' : 'YouTube'}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform flex-shrink-0 ${dropdownOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-petflix-dark-gray border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchSource('petflix');
                          setVideos([]);
                          setSearched(false);
                          setDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors first:rounded-t-lg ${
                          searchSource === 'petflix' ? 'bg-petflix-orange/10 dark:bg-petflix-orange/10' : ''
                        }`}
                      >
                        <svg className="w-5 h-5 text-charcoal dark:text-white" fill="currentColor" viewBox="0 0 512 512">
                          <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87c-11.84 43.42 3.64 85.22 34.58 93.36z"/>
                        </svg>
                        <div>
                          <div className="font-medium text-charcoal dark:text-white text-sm">Petflix</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">Videos shared by users</div>
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
                        <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <div>
                          <div className="font-medium text-charcoal dark:text-white text-sm">YouTube</div>
                          <div className="text-[11px] text-gray-500 dark:text-gray-400">Search YouTube</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Search Input */}
                <Input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={
                    searchSource === 'petflix'
                      ? isMobile ? 'Search Petflix...' : 'Search for cute cats, funny dogs, adorable bunnies...'
                      : isMobile ? 'Search YouTube...' : 'Search YouTube for pet videos...'
                  }
                  className="flex-1 px-6 py-4 bg-transparent border-0 text-charcoal dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-base shadow-none h-full"
                />
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={loading}
              className="px-6 sm:px-10 py-4 bg-petflix-orange hover:bg-blue-400 dark:bg-petflix-orange dark:hover:bg-orange-500 text-white font-semibold shadow-md hover:shadow-lg text-sm sm:text-base h-full"
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          {/* Sort Controls - Only for Petflix search */}
          {searchSource === 'petflix' && (
            <div className="flex flex-wrap gap-3 items-center">
              {/* Sort Dropdown */}
              <div className="relative" ref={sortDropdownRef}>
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center justify-between gap-4 px-4 py-2 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm min-w-[180px]"
                >
                  <span>
                    {sortBy === 'relevance' && 'Sort: Relevance'}
                    {sortBy === 'recency' && 'Sort: Most Recent'}
                    {sortBy === 'view_count' && 'Sort: View Count'}
                    {sortBy === 'engagement' && 'Sort: Engagement'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform flex-shrink-0 ${sortDropdownOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {sortDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-petflix-dark-gray border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-50">
                    {(['relevance', 'recency', 'view_count', 'engagement'] as SortOption[]).map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSortBy(option);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                          sortBy === option ? 'bg-petflix-orange/10 dark:bg-petflix-orange/10 text-petflix-orange font-medium' : 'text-charcoal dark:text-white'
                        }`}
                      >
                        {option === 'relevance' && 'Relevance'}
                        {option === 'recency' && 'Most Recent'}
                        {option === 'view_count' && 'View Count'}
                        {option === 'engagement' && 'Engagement'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>
          )}
        </form>
      </div>

      {/* Videos from Followed Users Section */}
      {!searched && loadingFollowed && (
        <div className="max-w-5xl mx-auto mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Videos from People You Follow
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        </div>
      )}
      {!searched && !loadingFollowed && followedVideos.length > 0 && (
        <div className="max-w-5xl mx-auto mb-12">
          <h2 className="text-xl sm:text-2xl font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
            <svg className="w-6 h-6 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Videos from People You Follow
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
            {followedVideos.map((video) => (
              <Card
                key={video.id}
                className="group relative overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10 border-gray-200/50 dark:border-gray-800/30 p-0"
              >
                <Link to={`/video/${video.id}`} className="block">
                  <CardContent className="p-0">
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
                          Shared by @{video.users?.username || video.user?.username || video.username || 'Unknown'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
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
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
          {videos.map((video) => {
            // For YouTube search results, link to YouTube watch page
            const isYouTubeResult = searchSource === 'youtube';
            const linkProps = isYouTubeResult
              ? {
                  as: Link,
                  to: `/watch/${video.youtube_video_id}`
                }
              : {
                  as: Link,
                  to: `/video/${video.id}`
                };

            const Component = linkProps.as;
            
            return (
              <Card
                key={video.id}
                className="group relative overflow-hidden transition-transform duration-200 ease-out hover:scale-105 hover:z-10 border-gray-200/50 dark:border-gray-800/30 p-0"
              >
                <Component
                  to={linkProps.to}
                  className="block"
                >
                  <CardContent className="p-0">
                    {/* YouTube Badge for YouTube results */}
                    {isYouTubeResult && (
                      <div className="absolute top-2 right-2 z-10 bg-red-600 text-white text-xs px-2 py-1 rounded font-bold shadow-lg">
                        YouTube
                      </div>
                    )}
                    
                    {/* Unavailable Badge for unavailable videos */}
                    {!isYouTubeResult && video.is_available === false && (
                      <div className="absolute top-2 left-2 z-10 bg-gray-600 text-white text-xs px-2 py-1 rounded font-bold shadow-lg flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        Unavailable
                      </div>
                    )}
                    
                    {/* Thumbnail Container with 16:9 Aspect Ratio */}
                    <div className="relative w-full pb-[56.25%] bg-white dark:bg-petflix-dark-gray">
                      <img
                        src={`https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`}
                        alt={video.title}
                        className={`absolute inset-0 w-full h-full object-cover ${video.is_available === false ? 'opacity-50 grayscale' : ''}`}
                        loading="lazy"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('mqdefault')) {
                            target.src = `https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`;
                          }
                        }}
                      />
                      {/* Gray overlay for unavailable videos */}
                      {video.is_available === false && (
                        <div className="absolute inset-0 bg-black/30" />
                      )}
                    </div>
                    
                    {/* Info Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className="font-bold text-white text-xs md:text-sm line-clamp-2 mb-1">
                          {video.title}
                        </h3>
                        <p className="text-xs text-gray-300">
                          {isYouTubeResult ? `By ${video.username || video.users?.username || video.user?.username || 'Unknown'}` : `Shared by @${video.users?.username || video.user?.username || video.username || 'Unknown'}`}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Component>
              </Card>
            );
          })}
          </div>
        </div>
      )}
    </div>
  );
};
