import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

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
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black flex items-center justify-center pt-24">
        <div className="text-xl text-gray-600 dark:text-gray-400">Loading profile...</div>
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
        <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 border border-gray-200 dark:border-transparent">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
            <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-gray-200 dark:bg-petflix-gray flex items-center justify-center text-4xl sm:text-5xl md:text-6xl flex-shrink-0">
              {profileUser.profile_picture_url ? (
                <img
                  src={profileUser.profile_picture_url}
                  alt={profileUser.username}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                '🐾'
              )}
            </div>

            <div className="flex-1 w-full sm:w-auto text-center sm:text-left">
              {/* Show username from currentUser if viewing own profile, otherwise from profileUser */}
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal dark:text-white mb-2">
                @{(isOwnProfile ? currentUser?.username : profileUser.username) || 'User'}
              </h1>
              
              {/* Only show email on your own profile */}
              {isOwnProfile && currentUser?.email && (
                <p className="text-gray-600 dark:text-gray-400 mb-1 text-sm sm:text-base">
                  <span>📧 {currentUser.email}</span>
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

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center sm:justify-start">
                {currentUser && !isOwnProfile && (
                  <Button
                    onClick={handleFollow}
                    disabled={followLoading}
                    variant={isFollowing ? "outline" : "default"}
                    className={`px-6 py-2.5 sm:py-3 font-bold text-sm sm:text-base ${
                      isFollowing
                        ? 'bg-gray-300 hover:bg-gray-400 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white'
                        : 'bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white'
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
                )}

                {isOwnProfile && (
                  <Button
                    asChild
                    variant="outline"
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-bold"
                  >
                    <Link to="/settings">
                      Edit Profile
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div className="mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-charcoal dark:text-white mb-4 sm:mb-6">
            Shared Videos ({videos.length})
          </h2>

          {videos.length === 0 ? (
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-8 sm:p-12 text-center">
              <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">
                {isOwnProfile ? 'You haven\'t shared any videos yet' : 'No videos shared yet'}
              </p>
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
                className="px-6 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold"
              >
                <Link to="/playlists/create">
                  + Create Playlist
                </Link>
              </Button>
            )}
          </div>

          {playlists.length === 0 ? (
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-12 text-center border border-gray-200 dark:border-transparent">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                {isOwnProfile ? 'You haven\'t created any playlists yet' : 'No playlists yet'}
              </p>
              {isOwnProfile && (
                <Link
                  to="/playlists/create"
                  className="inline-block px-6 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded transition"
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
                  <span className="text-xs bg-lightblue dark:bg-petflix-orange text-charcoal dark:text-white px-3 py-1 rounded-full">
                    {playlist.visibility === 'public' ? '🌍 Public' : '🔒 Private'}
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
