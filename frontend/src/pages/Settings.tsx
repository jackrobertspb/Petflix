import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  isPushSubscribed,
} from '../services/pushNotifications';

export const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const toast = useToast();
  const navigate = useNavigate();

  // Profile settings
  const [bio, setBio] = useState('');
  const [profilePictureUrl, setProfilePictureUrl] = useState('');
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [profilePictureVersion, setProfilePictureVersion] = useState(0); // Force image reload
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  // Notification preferences
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [checkingNotifications, setCheckingNotifications] = useState(true);
  const [togglingNotifications, setTogglingNotifications] = useState(false);

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  // Account deletion
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  // Load user data and check notification status
  useEffect(() => {
    if (user) {
      loadUserData();
      checkNotificationStatus();
    }
  }, [user]);

  const checkNotificationStatus = async () => {
    try {
      // Force reset toggling state in case it got stuck
      setTogglingNotifications(false);
      
      const isSubscribed = await isPushSubscribed();
      setNotificationsEnabled(isSubscribed);
    } catch (error) {
      console.error('Failed to check notification status:', error);
    } finally {
      setCheckingNotifications(false);
    }
  };

  const loadUserData = async () => {
    if (!user) return;
    
    try {
      const response = await api.get(`/users/${user.id}`);
      const userData = response.data.user;
      setBio(userData.bio || '');
      // Add cache-busting timestamp to profile picture URL when loading from database
      const baseUrl = userData.profile_picture_url || '';
      const urlWithCacheBust = baseUrl ? `${baseUrl.split('?')[0]}?t=${Date.now()}` : '';
      setProfilePictureUrl(urlWithCacheBust);
      setEmail(userData.email || '');
    } catch (error) {
      console.error('Failed to load user data:', error);
      toast.error('Failed to load settings');
    }
  };

  const handleProfilePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only JPEG, PNG, GIF, and WebP images are allowed');
      return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setProfilePictureFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProfilePicturePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadProfilePicture = async () => {
    if (!user || !profilePictureFile) return;

    setUploadingPicture(true);
    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64String = reader.result as string;
          resolve(base64String);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(profilePictureFile);

      const base64Image = await base64Promise;

      // Upload to backend
      const response = await api.post(`/users/${user.id}/profile-picture`, {
        image: base64Image,
        imageType: profilePictureFile.type,
      });

      // Update local state with new URL (backend already includes cache-busting timestamp)
      const newUrl = response.data.profile_picture_url;
      
      // Clear preview and file first
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      
      // Increment version to force image reload
      setProfilePictureVersion(prev => prev + 1);
      
      // Update URL with fresh cache-busting parameter
      const baseUrl = newUrl.split('?')[0];
      const urlWithFreshTimestamp = `${baseUrl}?t=${Date.now()}`;
      setProfilePictureUrl(urlWithFreshTimestamp);
      
      // Update auth context with new profile picture
      if (user && updateUser) {
        updateUser({
          ...user,
          profile_picture_url: urlWithFreshTimestamp,
        });
      }
      
      // Don't reload user data immediately - we already have the new URL
      // The image will reload because of the version change and new timestamp

      toast.success('Profile picture uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      toast.error(error?.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    console.log('💾 Save profile clicked');
    console.log('📊 Current state - user:', user?.id, 'bio:', bio, 'profilePictureUrl:', profilePictureUrl);
    
    if (!user) {
      console.error('❌ No user found, cannot save profile');
      return;
    }

    setSavingProfile(true);
    console.log('📡 Sending PATCH request to:', `/users/${user.id}`);
    console.log('📦 Request body:', { bio, profile_picture_url: profilePictureUrl || null });
    
    try {
      const response = await api.patch(`/users/${user.id}`, {
        bio,
        profile_picture_url: profilePictureUrl || null,
      });
      console.log('✅ Profile update successful:', response.data);
      toast.success('Profile updated successfully!');
      
      // Update user in context if response includes user data
      if (response.data?.user && updateUser) {
        console.log('🔄 Updating user context with new data');
        updateUser(response.data.user);
      }
      
      // Reload user data to ensure sync
      await loadUserData();
    } catch (error: any) {
      console.error('❌ Failed to update profile:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: `/users/${user.id}`
      });
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
      console.log('🏁 Save profile finished');
    }
  };

  const handleSaveEmail = async () => {
    if (!user) return;

    setSavingEmail(true);
    try {
      const response = await api.patch(`/users/${user.id}/email`, { email });
      
      // Email is updated immediately
      const message = response.data?.message || 'Email address updated successfully.';
      toast.success(message);
      
      // Update user in context if provided
      if (response.data?.user) {
        updateUser(response.data.user);
      }
      
      // Reload user data to ensure everything is in sync
      await loadUserData();
    } catch (error: any) {
      console.error('Failed to update email:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to update email';
      toast.error(errorMessage);
    } finally {
      setSavingEmail(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    setChangingPassword(true);
    try {
      await api.patch(`/users/${user.id}/password`, {
        currentPassword,
        newPassword,
      });
      toast.success('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    setDeletingAccount(true);
    try {
      await api.delete(`/users/${user.id}`);
      toast.success('Account deleted successfully');
      // Logout and redirect
      logout();
      navigate('/');
    } catch (error: any) {
      console.error('Failed to delete account:', error);
      toast.error(error.response?.data?.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal dark:text-white mb-4">
            Please sign in to view settings
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-20 sm:pt-24 px-4 sm:px-6 md:px-8 lg:px-16 pb-12 sm:pb-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-charcoal dark:text-white mb-6 sm:mb-8 flex items-center gap-3">
          <svg className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Settings
        </h1>

        {/* Account Information */}
        <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
            Account Information
          </h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Username:</span>
              <span className="ml-2 text-charcoal dark:text-white font-semibold">
                @{user.username}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">User ID:</span>
              <span className="ml-2 text-charcoal dark:text-white font-bold text-lg">
                {user.user_number || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Member Since:</span>
              <span className="ml-2 text-charcoal dark:text-white font-semibold">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('en-GB') : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Settings */}
        <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
            Profile Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal dark:text-white mb-2">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us about yourself and your love for pets..."
                maxLength={255}
                rows={4}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange resize-none"
              />
              <div className="text-right text-sm text-gray-500 dark:text-gray-400 mt-1">
                {bio.length}/255
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-charcoal dark:text-white mb-2">
                Profile Picture
              </label>
              
              {/* Current/Preview Picture */}
              <div className="mb-4">
                {(profilePicturePreview || profilePictureUrl) && (
                  <div className="relative inline-block">
                    <img
                      key={`profile-pic-${profilePictureVersion}-${profilePictureUrl || profilePicturePreview || 'default'}`}
                      src={profilePicturePreview || profilePictureUrl || ''}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                      onError={(e) => {
                        // If image fails to load, try removing cache-busting and reloading
                        const target = e.target as HTMLImageElement;
                        const currentSrc = target.src;
                        if (currentSrc.includes('?t=')) {
                          const baseUrl = currentSrc.split('?')[0];
                          target.src = `${baseUrl}?t=${Date.now()}`;
                        }
                      }}
                    />
                    {profilePicturePreview && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                )}
                {!profilePicturePreview && !profilePictureUrl && (
                  <div className="w-32 h-32 rounded-full bg-[#e5e7eb] dark:bg-[#e5e7eb] flex items-center justify-center">
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 512 512">
                      <path d="M256 224c-79.41 0-192 122.76-192 200.25 0 34.9 26.81 55.75 71.74 55.75 48.84 0 81.09-25.08 120.26-25.08 39.51 0 71.85 25.08 120.26 25.08 44.93 0 71.74-20.85 71.74-55.75C448 346.76 335.41 224 256 224zm-147.28-12.61c-10.4-34.65-42.44-57.09-71.56-50.13-29.12 6.96-44.29 40.69-33.89 75.34 10.4 34.65 42.44 57.09 71.56 50.13 29.12-6.96 44.29-40.69 33.89-75.34zm84.72-20.78c30.94-8.14 46.42-49.94 34.58-93.36s-46.52-72.01-77.46-63.87-46.42 49.94-34.58 93.36c11.84 43.42 46.53 72.02 77.46 63.87zm281.39-29.34c-29.12-6.96-61.15 15.48-71.56 50.13-10.4 34.65 4.77 68.38 33.89 75.34 29.12 6.96 61.15-15.48 71.56-50.13 10.4-34.65-4.77-68.38-33.89-75.34zm-156.27 29.34c30.94 8.14 65.62-20.45 77.46-63.87 11.84-43.42-3.64-85.21-34.58-93.36s-65.62 20.45-77.46 63.87c-11.84 43.42 3.64 85.22 34.58 93.36z"/>
                    </svg>
                  </div>
                )}
              </div>

              {/* File Input */}
              <div className="mb-4">
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleProfilePictureChange}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-petflix-orange file:text-white
                    dark:file:bg-petflix-orange dark:file:text-white
                    hover:file:bg-petflix-orange/80 dark:hover:file:bg-petflix-red
                    file:cursor-pointer
                    cursor-pointer"
                  disabled={uploadingPicture}
                />
                {profilePictureFile && (
                  <Button
                    onClick={handleUploadProfilePicture}
                    disabled={uploadingPicture}
                    className="mt-2 px-4 py-2 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-medium"
                  >
                    {uploadingPicture ? 'Uploading...' : 'Upload Picture'}
                  </Button>
                )}
              </div>

              {/* Or use URL (optional fallback) */}
              <details className="mt-4">
                <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-charcoal dark:hover:text-white">
                  Or enter a URL instead
                </summary>
                <div className="mt-2">
                  <Input
                    type="url"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    placeholder="https://example.com/your-profile-pic.jpg"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-petflix-dark-gray text-charcoal dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
                  />
                </div>
              </details>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload an image (JPEG, PNG, GIF, or WebP, max 5MB) or enter a URL
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </Button>
          </div>
        </div>

        {/* Email Settings */}
        <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
            Email Settings
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-charcoal dark:text-white mb-2">
                Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-petflix-dark-gray text-charcoal dark:text-white border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Your email address will be updated immediately
              </p>
            </div>

            <Button
              onClick={handleSaveEmail}
              disabled={savingEmail}
              className="w-full px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold"
            >
              {savingEmail ? 'Saving...' : 'Update Email'}
            </Button>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
            Change Password
          </h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white focus:ring-2 focus:ring-petflix-orange dark:focus:ring-petflix-orange"
                placeholder="Confirm new password"
              />
            </div>

            <Button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full px-6 py-3 bg-petflix-orange hover:bg-petflix-orange/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-white dark:text-white font-bold"
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
            Notification Preferences
          </h2>
          
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-charcoal dark:text-white mb-1">
                Push Notifications
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Receive notifications for new followers, comments, and videos
              </p>
              {checkingNotifications && (
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Checking notification status...
                </p>
              )}
            </div>
            <button
              onClick={async () => {
                if (togglingNotifications) {
                  console.log('⏳ Already toggling, please wait...');
                  return;
                }

                console.log('🔔 Notification toggle clicked');
                console.log('Current state:', notificationsEnabled);
                setTogglingNotifications(true);
                
                try {
                  if (notificationsEnabled) {
                    console.log('Unsubscribing from notifications...');
                    await unsubscribeFromPushNotifications();
                    setNotificationsEnabled(false);
                    toast.success('Push notifications disabled');
                  } else {
                    console.log('Subscribing to notifications...');
                    console.log('1. Requesting permission...');
                    await subscribeToPushNotifications();
                    console.log('2. Subscription successful!');
                    setNotificationsEnabled(true);
                    toast.success('Push notifications enabled! 🔔');
                  }
                } catch (error: any) {
                  console.error('❌ Failed to toggle notifications:', error);
                  console.error('Error details:', {
                    message: error.message,
                    stack: error.stack,
                    response: error.response?.data
                  });
                  toast.error(error.message || 'Failed to update notification settings');
                  // Make sure state stays false on error
                  setNotificationsEnabled(false);
                } finally {
                  setTogglingNotifications(false);
                }
              }}
              disabled={checkingNotifications || togglingNotifications}
              className={`relative w-16 h-8 rounded-full transition disabled:opacity-50 ${
                togglingNotifications
                  ? 'bg-yellow-500 animate-pulse'
                  : notificationsEnabled
                  ? 'bg-green-500'
                  : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  notificationsEnabled ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 mb-6 border border-gray-200 dark:border-transparent">
          <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-4">
            Appearance
          </h2>
          
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-charcoal dark:text-white mb-1">
                Dark Mode
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Toggle between light and dark theme
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative w-16 h-8 rounded-full transition ${
                theme === 'dark'
                  ? 'bg-petflix-orange'
                  : 'bg-gray-300'
              }`}
            >
              <div
                className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${
                  theme === 'dark' ? 'translate-x-8' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-4">
            Danger Zone
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-charcoal dark:text-white mb-1">
                  Sign Out
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sign out of your account on this device
                </p>
              </div>
              <Button
                onClick={() => {
                  logout();
                  navigate('/');
                  toast.success('Signed out successfully');
                }}
                variant="destructive"
                className="px-6 py-2"
              >
                Sign Out
              </Button>
            </div>

            <div className="border-t border-red-200 dark:border-red-800 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-charcoal dark:text-white mb-1">
                    Delete Account
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Permanently delete your account and all data
                  </p>
                </div>
                <Button
                  onClick={() => setShowDeleteModal(true)}
                  variant="destructive"
                  className="px-6 py-2"
                >
                  Delete Account
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={(open) => {
        if (!open) {
          setShowDeleteModal(false);
          setDeleteConfirmText('');
        }
      }}>
        <DialogContent className="max-w-md border-red-300 dark:border-red-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Delete Account
            </DialogTitle>
          </DialogHeader>

          <div className="mb-6">
            <p className="text-charcoal dark:text-gray-300 mb-4">
              This action is <strong>permanent and irreversible</strong>. All your data will be deleted, including:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 dark:text-gray-400 space-y-1 mb-4">
              <li>Your profile and account information</li>
              <li>All videos you've shared</li>
              <li>All comments and playlists</li>
              <li>Your followers and following lists</li>
            </ul>
            <p className="text-red-600 dark:text-red-400 font-semibold">
              Type <span className="bg-red-100 dark:bg-red-900 px-2 py-1 rounded">DELETE</span> to confirm:
            </p>
          </div>

          <Input
            type="text"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 bg-white dark:bg-petflix-gray text-charcoal dark:text-white focus:ring-2 focus:ring-red-500 mb-6"
            placeholder="Type DELETE to confirm"
          />

          <div className="flex gap-3">
            <Button
              onClick={() => {
                setShowDeleteModal(false);
                setDeleteConfirmText('');
              }}
              variant="outline"
              className="flex-1"
              disabled={deletingAccount}
            >
              Cancel
            </Button>
            <Button
              onClick={handleDeleteAccount}
              disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
              variant="destructive"
              className="flex-1"
            >
              {deletingAccount ? 'Deleting...' : 'Delete Account'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

