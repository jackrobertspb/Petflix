import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProfileHeaderSkeleton, VideoGridSkeleton } from '../components/LoadingSkeleton';

interface User {
  id: string;
  username: string;
  email: string;
  profile_picture_url: string | null;
  bio: string | null;
  created_at: string;
}

interface FollowStats {
  followersCount: number;
  followingCount: number;
}

interface Video {
  id: string;
  youtube_video_id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  created_at: string;
}

interface Playlist {
  id: string;
  name: string;
  description: string | null;
  visibility: 'public' | 'private';
  created_at: string;
}

export const Profile = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followStats, setFollowStats] = useState<FollowStats>({ followersCount: 0, followingCount: 0 });
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const toast = useToast();

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!userId) {
        setError('No user ID provided');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // If viewing own profile, use current user data as fallback
        if (isOwnProfile && currentUser) {
          setProfileUser({
            id: currentUser.id,
            username: currentUser.username,
            email: currentUser.email,
            profile_picture_url: currentUser.profile_picture_url || null,
            bio: currentUser.bio || null,
            created_at: new Date().toISOString()
          });
          setLoading(false);
        }

        // Try to fetch user details from backend
        try {
          const userRes = await api.get(`/users/${userId}`);
          // Backend returns { user: {...} }, extract the user object
          const fetchedUser = userRes.data.user || userRes.data;
          console.log('✅ Fetched user profile:', fetchedUser);
          setProfileUser(fetchedUser);
        } catch (apiError) {
          console.error('❌ Failed to fetch user profile:', apiError);
          // If API fails and it's own profile, keep using current user data
          if (!isOwnProfile) {
            throw apiError;
          }
          console.log('Using cached user data');
        }

        // Fetch follower/following counts
        try {
          const [followersRes, followingRes] = await Promise.all([
            api.get(`/follows/${userId}/followers`),
            api.get(`/follows/${userId}/following`)
          ]);
          setFollowStats({
            followersCount: followersRes.data.count || 0,
            followingCount: followingRes.data.count || 0
          });
        } catch (err) {
          console.log('Could not load follow stats');
        }

        // Try to fetch videos
        try {
          const videosRes = await api.get(`/videos/user/${userId}`);
          setVideos(videosRes.data.videos || []);
        } catch (err) {
          console.log('Could not load videos');
        }

        // Try to fetch playlists
        try {
          const playlistsRes = await api.get(`/playlists/user/${userId}`);
          setPlaylists(playlistsRes.data.playlists || []);
        } catch (err) {
          console.log('Could not load playlists');
        }

        // Check if following (only if viewing another user's profile)
        if (currentUser && !isOwnProfile) {
          try {
            const followingRes = await api.get(`/follows/${currentUser.id}/following`);
            const followingList = followingRes.data.following || [];
            const isFollowingUser = followingList.some((f: any) => f.following_id === userId);
            setIsFollowing(isFollowingUser);
          } catch (err) {
            console.log('Could not check follow status');
          }
        }
      } catch (error: any) {
        console.error('Failed to load profile:', error);
        setError(error.response?.data?.message || 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId, currentUser, isOwnProfile]);

  const handleFollow = async () => {
    if (!userId || followLoading) return; // Prevent spam clicking
    
    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/follows/${userId}`);
        setIsFollowing(false);
        setFollowStats(prev => ({ ...prev, followersCount: Math.max(0, prev.followersCount - 1) }));
      } else {
        await api.post(`/follows/${userId}`);
        setIsFollowing(true);
        setFollowStats(prev => ({ ...prev, followersCount: prev.followersCount + 1 }));
      }
    } catch (error: any) {
      console.error('❌ Follow error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to update follow status';
      toast.error(errorMessage);
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16">
        <div className="max-w-7xl mx-auto">
          <ProfileHeaderSkeleton />
          
          {/* Videos Section Skeleton */}
          <div className="mb-6 sm:mb-8">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-4 sm:mb-6"></div>
            <VideoGridSkeleton count={12} />
          </div>

          {/* Playlists Section Skeleton */}
          <div className="mb-16">
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-transparent">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3 animate-pulse"></div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full animate-pulse"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 animate-pulse"></div>
                  </div>
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20 animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-24 px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">User Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {error || 'This user does not exist or could not be loaded.'}
          </p>
          <Link
            to="/"
            className="inline-block px-8 py-4 bg-petflix-orange hover:bg-petflix-red text-white font-bold rounded transition"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        {/* Profile Header */}
        <div className="relative bg-white dark:bg-petflix-dark rounded-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-200 dark:border-transparent">
          {isOwnProfile && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
              <Button
                asChild
                variant="outline"
                className="px-4 py-2 sm:px-6 sm:py-3 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-bold text-sm sm:text-base"
              >
                <Link to="/settings">
                  Edit Profile
                </Link>
              </Button>
            </div>
          )}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-[#e5e7eb] dark:bg-[#e5e7eb] flex items-center justify-center flex-shrink-0">
              {profileUser.profile_picture_url ? (
                <img
                  src={profileUser.profile_picture_url}
                  alt={profileUser.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <svg className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 512 512">
                  <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87c-11.84 43.42 3.64 85.22 34.58 93.36z"/>
                </svg>
              )}
            </div>

            <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
              {/* Show username from currentUser if viewing own profile, otherwise from profileUser */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal dark:text-white mb-2">
                {(isOwnProfile ? currentUser?.username : profileUser.username) || 'User'}
              </h1>
              
              {/* Only show email on your own profile */}
              {isOwnProfile && currentUser?.email && (
                <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span>{currentUser.email}</span>
                </p>
              )}
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm sm:text-base">
                {profileUser.bio || 'No bio yet'}
              </p>

              {/* Follower/Following Stats */}
              <div className="flex justify-center sm:justify-start gap-4 sm:gap-6 mb-4 sm:mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal dark:text-white">{followStats.followersCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Followers</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal dark:text-white">{followStats.followingCount}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Following</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-charcoal dark:text-white">{videos.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Videos</div>
                </div>
              </div>

              {currentUser && !isOwnProfile && (
                <div className="flex justify-center sm:justify-start">
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={isFollowing ? "outline" : "default"}
                    className={`px-6 py-2.5 sm:py-3 font-bold text-sm sm:text-base ${
                      isFollowing
                        ? 'bg-gray-300 hover:bg-gray-400 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white'
                        : 'bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white'
                    }`}
                  >
                    {followLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                        {isFollowing ? 'Unfollowing...' : 'Following...'}
                      </span>
                    ) : (
                      isFollowing ? 'Unfollow' : 'Follow'
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-charcoal dark:text-white mb-4 sm:mb-6">
            Shared Videos ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-12 text-center border border-gray-200 dark:border-transparent">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {isOwnProfile ? 'You haven\'t shared any videos yet' : 'No videos shared yet'}
              </p>
              {isOwnProfile && (
                <Link
                  to="/share"
                  className="inline-block px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold rounded transition"
                >
                  Share Your First Video
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
              {videos.map((video) => (
                <Card
                  key={video.id}
                  className="group relative overflow-hidden transition-transform duration-300 hover:scale-110 hover:z-10 border-gray-200/50 dark:border-gray-800/30 shadow-md hover:shadow-xl p-0 aspect-video"
                >
                  <Link
                    to={`/video/${video.id}`}
                    className="block h-full"
                  >
                    <CardContent className="p-0 h-full">
                      <img
                        src={`https://img.youtube.com/vi/${video.youtube_video_id}/hqdefault.jpg`}
                        alt={video.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src.includes('hqdefault')) {
                            target.src = `https://img.youtube.com/vi/${video.youtube_video_id}/mqdefault.jpg`;
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

        {/* Playlists Section */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-charcoal dark:text-white">
              Playlists ({playlists.length})
            </h2>
            {isOwnProfile && (
              <Button
                asChild
                className="px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold"
              >
                <Link to="/playlists/create">
                  + Create Playlist
                </Link>
              </Button>
            )}
          </div>

          {playlists.length === 0 ? (
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-12 text-center border border-gray-200 dark:border-transparent">
              <div className="flex justify-center mb-4">
                <svg className="w-16 h-16 text-charcoal dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {isOwnProfile ? 'You haven\'t created any playlists yet' : 'No playlists yet'}
              </p>
              {isOwnProfile && (
                <Link
                  to="/playlists/create"
                  className="inline-block px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold rounded transition"
                >
                  Create Your First Playlist
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {playlists.map((playlist) => (
                <Link
                  key={playlist.id}
                  to={`/playlists/${playlist.id}`}
                  className="bg-white dark:bg-petflix-dark rounded-lg p-6 hover:bg-gray-50 dark:hover:bg-petflix-gray transition cursor-pointer border border-gray-200 dark:border-transparent"
                >
                  <h3 className="font-bold text-charcoal dark:text-white text-xl mb-2">
                    {playlist.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
                    {playlist.description || 'No description'}
                  </p>
                  <span className="text-xs bg-petflix-orange dark:bg-petflix-orange text-white dark:text-white px-3 py-1 rounded-full flex items-center gap-1">
                    {playlist.visibility === 'public' ? (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                        </svg>
                        Public
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Private
                      </>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
