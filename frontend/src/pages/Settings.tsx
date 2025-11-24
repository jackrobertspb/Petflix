import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
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
      setProfilePictureUrl(userData.profile_picture_url || '');
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

      // Update local state with new URL
      const newUrl = response.data.profile_picture_url;
      setProfilePictureUrl(newUrl);
      setProfilePictureFile(null);
      setProfilePicturePreview(null);
      
      // Update auth context with new profile picture
      if (user && updateUser) {
        updateUser({
          ...user,
          profile_picture_url: newUrl,
        });
      }

      // Reload user data to ensure everything is in sync
      await loadUserData();

      toast.success('Profile picture uploaded successfully!');
    } catch (error: any) {
      console.error('Failed to upload profile picture:', error);
      toast.error(error?.response?.data?.message || 'Failed to upload profile picture');
    } finally {
      setUploadingPicture(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setSavingProfile(true);
    try {
      await api.patch(`/users/${user.id}`, {
        bio,
        profile_picture_url: profilePictureUrl || null,
      });
      toast.success('Profile updated successfully!');
    } catch (error: any) {
      console.error('Failed to update profile:', error);
      toast.error(error?.response?.data?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveEmail = async () => {
    if (!user) return;

    setSavingEmail(true);
    try {
      await api.patch(`/users/${user.id}/email`, { email });
      toast.success('Email updated successfully!');
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
      <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-charcoal dark:text-white mb-4">
            Please sign in to view settings
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-8 pb-16">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-8">
          ⚙️ Settings
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
              <span className="ml-2 text-charcoal dark:text-white font-mono text-sm">
                {user.id}
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
                className="w-full px-4 py-3 bg-gray-50 dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange resize-none"
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
                      src={profilePicturePreview || profilePictureUrl || ''}
                      alt="Profile preview"
                      className="w-32 h-32 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                    />
                    {profilePicturePreview && (
                      <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1 rounded">
                        New
                      </div>
                    )}
                  </div>
                )}
                {!profilePicturePreview && !profilePictureUrl && (
                  <div className="w-32 h-32 rounded-full bg-gray-200 dark:bg-petflix-gray flex items-center justify-center text-6xl">
                    🐾
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
                    file:bg-lightblue file:text-charcoal
                    dark:file:bg-petflix-orange dark:file:text-white
                    hover:file:bg-lightblue/80 dark:hover:file:bg-petflix-red
                    file:cursor-pointer
                    cursor-pointer"
                  disabled={uploadingPicture}
                />
                {profilePictureFile && (
                  <button
                    onClick={handleUploadProfilePicture}
                    disabled={uploadingPicture}
                    className="mt-2 px-4 py-2 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadingPicture ? 'Uploading...' : 'Upload Picture'}
                  </button>
                )}
              </div>

              {/* Or use URL (optional fallback) */}
              <details className="mt-4">
                <summary className="text-sm text-gray-600 dark:text-gray-400 cursor-pointer hover:text-charcoal dark:hover:text-white">
                  Or enter a URL instead
                </summary>
                <div className="mt-2">
                  <input
                    type="url"
                    value={profilePictureUrl}
                    onChange={(e) => setProfilePictureUrl(e.target.value)}
                    placeholder="https://example.com/your-profile-pic.jpg"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange"
                  />
                </div>
              </details>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Upload an image (JPEG, PNG, GIF, or WebP, max 5MB) or enter a URL
              </p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full px-6 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingProfile ? 'Saving...' : 'Save Profile Changes'}
            </button>
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
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-petflix-dark-gray text-charcoal dark:text-white rounded border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                ⚠️ You can only change your email once every 7 days
              </p>
            </div>

            <button
              onClick={handleSaveEmail}
              disabled={savingEmail}
              className="w-full px-6 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingEmail ? 'Saving...' : 'Update Email'}
            </button>
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
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange focus:outline-none"
                placeholder="Enter current password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange focus:outline-none"
                placeholder="Enter new password (min. 8 characters)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-charcoal dark:text-white mb-2">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-petflix-dark-gray text-charcoal dark:text-white focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange focus:outline-none"
                placeholder="Confirm new password"
              />
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword}
              className="w-full px-6 py-3 bg-lightblue hover:bg-lightblue/80 dark:bg-petflix-orange dark:hover:bg-petflix-red text-charcoal dark:text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </button>
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
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                  toast.success('Signed out successfully');
                }}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
              >
                Sign Out
              </button>
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
                <button
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-8 max-w-md w-full border border-red-300 dark:border-red-700">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-red-600 dark:text-red-400">
                ⚠️ Delete Account
              </h2>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

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

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full px-4 py-3 border-2 border-red-300 dark:border-red-700 rounded-lg bg-white dark:bg-petflix-gray text-charcoal dark:text-white focus:ring-2 focus:ring-red-500 focus:outline-none mb-6"
              placeholder="Type DELETE to confirm"
            />

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText('');
                }}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-petflix-gray dark:hover:bg-opacity-80 text-charcoal dark:text-white font-medium rounded-lg transition"
                disabled={deletingAccount}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deletingAccount ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

