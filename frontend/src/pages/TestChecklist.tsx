import { useState, useEffect } from 'react';

interface TestItem {
  id: string;
  category: string;
  test: string;
  steps: string[];
  expected: string;
}

export const TestChecklist = () => {
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  // Load checked items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('testChecklist');
    if (saved) {
      setCheckedItems(new Set(JSON.parse(saved)));
    }
    // Expand all categories by default
    setExpandedCategories(new Set(testItems.map(item => item.category)));
  }, []);

  // Save checked items to localStorage
  useEffect(() => {
    localStorage.setItem('testChecklist', JSON.stringify(Array.from(checkedItems)));
  }, [checkedItems]);

  const toggleItem = (id: string) => {
    const newChecked = new Set(checkedItems);
    if (newChecked.has(id)) {
      newChecked.delete(id);
    } else {
      newChecked.add(id);
    }
    setCheckedItems(newChecked);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const resetAll = () => {
    if (confirm('Are you sure you want to reset all checkboxes?')) {
      setCheckedItems(new Set());
      localStorage.removeItem('testChecklist');
    }
  };

  const testItems: TestItem[] = [
    // Authentication Tests
    {
      id: 'auth-1',
      category: 'Authentication',
      test: 'User Registration',
      steps: [
        'Go to Register page',
        'Try registering with weak password (should fail)',
        'Try registering with mismatched passwords (should fail)',
        'Try registering with existing email (should fail)',
        'Register with valid credentials'
      ],
      expected: 'Account created, auto-login, redirected to feed'
    },
    {
      id: 'auth-2',
      category: 'Authentication',
      test: 'User Login',
      steps: [
        'Go to Login page',
        'Try logging in with wrong credentials (should fail)',
        'Login with correct credentials'
      ],
      expected: 'Successfully logged in, redirected to feed'
    },
    {
      id: 'auth-3',
      category: 'Authentication',
      test: 'Protected Routes',
      steps: [
        'Logout',
        'Try accessing /feed, /share, /playlists, /settings',
      ],
      expected: 'Redirected to login for all protected routes'
    },
    {
      id: 'auth-4',
      category: 'Authentication',
      test: 'Session Persistence',
      steps: [
        'Login',
        'Refresh the page',
        'Close and reopen browser'
      ],
      expected: 'Should stay logged in across refreshes'
    },

    // Video Sharing Tests
    {
      id: 'video-1',
      category: 'Video Sharing',
      test: 'Share Video with Valid URL',
      steps: [
        'Go to Share Video page',
        'Paste a valid YouTube URL',
        'Add title and description',
        'Click Share Video'
      ],
      expected: 'Video shared successfully, redirected to video detail page'
    },
    {
      id: 'video-2',
      category: 'Video Sharing',
      test: 'Share Video with Invalid URL',
      steps: [
        'Try sharing with invalid URL',
        'Try sharing with non-YouTube URL'
      ],
      expected: 'Error messages shown, video not shared'
    },
    {
      id: 'video-3',
      category: 'Video Sharing',
      test: 'Share Video with Auto-filled Metadata',
      steps: [
        'Paste YouTube URL',
        'Wait for title/description to auto-fill'
      ],
      expected: 'Title and description populate automatically from YouTube'
    },

    // Video Detail Tests
    {
      id: 'video-detail-1',
      category: 'Video Detail',
      test: 'View Video Details',
      steps: [
        'Click on any video',
        'Check if video player loads',
        'Check if title, description, username display'
      ],
      expected: 'All video information displays correctly'
    },
    {
      id: 'video-detail-2',
      category: 'Video Detail',
      test: 'Video Player Functionality',
      steps: [
        'Click play on video',
        'Adjust volume',
        'Go fullscreen',
        'Use YouTube controls'
      ],
      expected: 'YouTube player works perfectly'
    },

    // Comments Tests
    {
      id: 'comment-1',
      category: 'Comments',
      test: 'Post Comment',
      steps: [
        'Go to any video detail page',
        'Write a comment',
        'Click Post Comment'
      ],
      expected: 'Comment appears immediately, push notification sent to video owner'
    },
    {
      id: 'comment-2',
      category: 'Comments',
      test: 'View Comments',
      steps: [
        'Check comment section shows all comments',
        'Check usernames and timestamps display'
      ],
      expected: 'Comments listed with user info and time'
    },
    {
      id: 'comment-3',
      category: 'Comments',
      test: 'Comment Validation',
      steps: [
        'Try posting empty comment (should fail)',
        'Try posting comment > 280 chars (should fail)'
      ],
      expected: 'Validation errors shown'
    },

    // Playlist Tests
    {
      id: 'playlist-1',
      category: 'Playlists',
      test: 'Create Playlist',
      steps: [
        'Go to Playlists page',
        'Click Create New Playlist',
        'Enter name and description',
        'Select public/private',
        'Click Create'
      ],
      expected: 'Playlist created and appears in list'
    },
    {
      id: 'playlist-2',
      category: 'Playlists',
      test: 'Add Video to Playlist',
      steps: [
        'Go to video detail page',
        'Click "Add to Playlist"',
        'Check/uncheck playlists',
        'Click Save Changes'
      ],
      expected: 'Video added to selected playlists, removed from unchecked ones'
    },
    {
      id: 'playlist-3',
      category: 'Playlists',
      test: 'Playlist Multi-Select',
      steps: [
        'Open playlist modal',
        'Check multiple playlists',
        'Uncheck some',
        'Save'
      ],
      expected: 'Correct add/remove operations, detailed toast feedback'
    },
    {
      id: 'playlist-4',
      category: 'Playlists',
      test: 'View Playlist',
      steps: [
        'Click on a playlist',
        'Check videos display',
        'Check playlist info shows'
      ],
      expected: 'Playlist detail page shows all videos and info'
    },
    {
      id: 'playlist-5',
      category: 'Playlists',
      test: 'Delete Playlist',
      steps: [
        'Go to playlist detail',
        'Click delete',
        'Confirm deletion'
      ],
      expected: 'Playlist deleted, redirected to playlists page'
    },

    // Search Tests
    {
      id: 'search-1',
      category: 'Search',
      test: 'Search Petflix Videos',
      steps: [
        'Go to Search page',
        'Enter search query',
        'Check results'
      ],
      expected: 'Shows videos from Petflix database matching query'
    },
    {
      id: 'search-2',
      category: 'Search',
      test: 'Search Empty Results',
      steps: [
        'Search for gibberish that won\'t match'
      ],
      expected: 'Shows "No results found" message'
    },
    {
      id: 'search-3',
      category: 'Search',
      test: 'Search Video Links',
      steps: [
        'Click on search result'
      ],
      expected: 'Navigates to correct video detail page'
    },

    // Feed Tests
    {
      id: 'feed-1',
      category: 'Feed',
      test: 'Following Feed',
      steps: [
        'Go to Feed page',
        'Select "Following" tab',
        'Check videos show from followed users'
      ],
      expected: 'Shows videos only from users you follow'
    },
    {
      id: 'feed-2',
      category: 'Feed',
      test: 'For You Feed',
      steps: [
        'Select "For You" tab',
        'Check all videos show'
      ],
      expected: 'Shows all videos from all users'
    },
    {
      id: 'feed-3',
      category: 'Feed',
      test: 'Feed Switching',
      steps: [
        'Toggle between Following and For You multiple times'
      ],
      expected: 'Smooth transitions, correct videos in each feed'
    },
    {
      id: 'feed-4',
      category: 'Feed',
      test: 'Empty Following Feed',
      steps: [
        'Create new account that follows no one',
        'Check Following feed'
      ],
      expected: 'Shows message to follow users'
    },

    // Profile Tests
    {
      id: 'profile-1',
      category: 'Profile',
      test: 'View Own Profile',
      steps: [
        'Click profile icon in navbar',
        'Check profile info displays',
        'Check videos show',
        'Check follower/following counts'
      ],
      expected: 'All profile data displays correctly'
    },
    {
      id: 'profile-2',
      category: 'Profile',
      test: 'View Other User Profile',
      steps: [
        'Click on another user\'s name',
        'Check their profile loads',
        'Check their videos show'
      ],
      expected: 'Other user\'s profile displays correctly'
    },
    {
      id: 'profile-3',
      category: 'Profile',
      test: 'Profile Edit Button',
      steps: [
        'On own profile, check for "Edit Profile" button',
        'Click it'
      ],
      expected: 'Navigates to Settings page'
    },

    // Follow System Tests
    {
      id: 'follow-1',
      category: 'Follow System',
      test: 'Follow User',
      steps: [
        'Go to another user\'s profile',
        'Click Follow button',
        'Check notification sent'
      ],
      expected: 'Follow button changes to Unfollow, follower count increases, notification sent'
    },
    {
      id: 'follow-2',
      category: 'Follow System',
      test: 'Unfollow User',
      steps: [
        'Click Unfollow button',
        'Check counts update'
      ],
      expected: 'Button changes back to Follow, follower count decreases'
    },
    {
      id: 'follow-3',
      category: 'Follow System',
      test: 'Follow from Feed',
      steps: [
        'In Feed, click username',
        'Follow from profile',
        'Return to Feed',
        'Check Following tab updates'
      ],
      expected: 'Followed user\'s videos now appear in Following feed'
    },

    // Settings Tests
    {
      id: 'settings-1',
      category: 'Settings',
      test: 'Update Profile',
      steps: [
        'Go to Settings',
        'Update bio',
        'Update profile picture URL',
        'Click Save Profile'
      ],
      expected: 'Profile updated successfully, changes reflected on profile page'
    },
    {
      id: 'settings-2',
      category: 'Settings',
      test: 'Update Email',
      steps: [
        'Enter new email',
        'Click Update Email'
      ],
      expected: 'Email updated, warning about 7-day cooldown shown'
    },
    {
      id: 'settings-3',
      category: 'Settings',
      test: 'Change Password',
      steps: [
        'Enter current password',
        'Enter new password',
        'Confirm new password',
        'Click Change Password',
        'Logout and login with new password'
      ],
      expected: 'Password changed, can login with new password'
    },
    {
      id: 'settings-4',
      category: 'Settings',
      test: 'Password Validation',
      steps: [
        'Try weak password (should fail)',
        'Try mismatched passwords (should fail)',
        'Try wrong current password (should fail)'
      ],
      expected: 'Appropriate error messages shown'
    },
    {
      id: 'settings-5',
      category: 'Settings',
      test: 'Toggle Theme',
      steps: [
        'Toggle Dark Mode switch',
        'Check entire site switches themes',
        'Refresh page'
      ],
      expected: 'Theme persists across refreshes'
    },

    // Push Notifications Tests
    {
      id: 'push-1',
      category: 'Push Notifications',
      test: 'Enable Push Notifications',
      steps: [
        'Go to Settings',
        'Toggle Push Notifications ON',
        'Allow browser permission'
      ],
      expected: 'Success toast, toggle turns green'
    },
    {
      id: 'push-2',
      category: 'Push Notifications',
      test: 'Follow Notification',
      steps: [
        'Have another account follow you',
        'Check for notification'
      ],
      expected: 'Notification appears: "New Follower! 🎉"'
    },
    {
      id: 'push-3',
      category: 'Push Notifications',
      test: 'New Video Notification',
      steps: [
        'Share a video',
        'Check if your followers get notified'
      ],
      expected: 'Followers get: "New video from @username 🎬"'
    },
    {
      id: 'push-4',
      category: 'Push Notifications',
      test: 'Comment Notification',
      steps: [
        'Have someone comment on your video',
        'Check for notification'
      ],
      expected: 'Notification appears: "New comment from @username 💬"'
    },
    {
      id: 'push-5',
      category: 'Push Notifications',
      test: 'Notification Click',
      steps: [
        'Click on a notification'
      ],
      expected: 'Opens Petflix to relevant page (profile/video)'
    },
    {
      id: 'push-6',
      category: 'Push Notifications',
      test: 'Disable Notifications',
      steps: [
        'Toggle Push Notifications OFF'
      ],
      expected: 'No more notifications received'
    },

    // PWA Tests
    {
      id: 'pwa-1',
      category: 'PWA',
      test: 'Install Prompt',
      steps: [
        'Visit site (may need to wait/refresh)',
        'Check for install prompt'
      ],
      expected: 'PWA install button appears'
    },
    {
      id: 'pwa-2',
      category: 'PWA',
      test: 'Install PWA',
      steps: [
        'Click install button',
        'Confirm installation',
        'Open installed app'
      ],
      expected: 'App installs, opens as standalone app'
    },
    {
      id: 'pwa-3',
      category: 'PWA',
      test: 'Offline Access',
      steps: [
        'Open PWA',
        'Disconnect internet',
        'Try navigating to visited pages'
      ],
      expected: 'App shell loads, previously visited pages work'
    },

    // Theme Tests
    {
      id: 'theme-1',
      category: 'Theme',
      test: 'Light Mode Contrast',
      steps: [
        'Switch to Light Mode',
        'Check all pages for readability',
        'Check text on all backgrounds'
      ],
      expected: 'All text readable, good contrast everywhere'
    },
    {
      id: 'theme-2',
      category: 'Theme',
      test: 'Dark Mode Contrast',
      steps: [
        'Switch to Dark Mode',
        'Check all pages',
        'Check inputs and cards'
      ],
      expected: 'All elements visible, proper contrast'
    },
    {
      id: 'theme-3',
      category: 'Theme',
      test: 'Theme Persistence',
      steps: [
        'Switch theme',
        'Refresh page',
        'Close and reopen browser'
      ],
      expected: 'Theme preference persists'
    },

    // Video Reporting Tests
    {
      id: 'report-1',
      category: 'Video Reporting',
      test: 'Report Video',
      steps: [
        'Go to video detail page',
        'Click "Report Video"',
        'Select reason',
        'Add details',
        'Type DELETE to confirm (wait no, wrong modal!)',
        'Click Submit Report'
      ],
      expected: 'Report submitted successfully'
    },
    {
      id: 'report-2',
      category: 'Video Reporting',
      test: 'Report Validation',
      steps: [
        'Try submitting without selecting reason (should fail)'
      ],
      expected: 'Validation error shown'
    },

    // Account Deletion Tests
    {
      id: 'delete-1',
      category: 'Account Deletion',
      test: 'Delete Account Flow',
      steps: [
        'Create a test account',
        'Add some data (videos, comments, follows)',
        'Go to Settings → Danger Zone',
        'Click Delete Account',
        'Read warning',
        'Try deleting without typing DELETE (should fail)',
        'Type "DELETE"',
        'Confirm deletion'
      ],
      expected: 'Account deleted, logged out, redirected to home'
    },
    {
      id: 'delete-2',
      category: 'Account Deletion',
      test: 'Verify Account Deleted',
      steps: [
        'Try logging in with deleted account'
      ],
      expected: 'Login fails, account no longer exists'
    },

    // UI/UX Tests
    {
      id: 'ui-1',
      category: 'UI/UX',
      test: 'Navbar Links',
      steps: [
        'Click each navbar link',
        'Check navigation works'
      ],
      expected: 'All links navigate correctly'
    },
    {
      id: 'ui-2',
      category: 'UI/UX',
      test: 'Toast Notifications',
      steps: [
        'Perform actions that trigger toasts',
        'Check success, error, and info toasts'
      ],
      expected: 'Toasts appear, auto-dismiss, look good'
    },
    {
      id: 'ui-3',
      category: 'UI/UX',
      test: 'Loading States',
      steps: [
        'Check for loading indicators on slow actions',
        'Check button disabled states during API calls'
      ],
      expected: 'Clear feedback during loading'
    },
    {
      id: 'ui-4',
      category: 'UI/UX',
      test: 'Empty States',
      steps: [
        'Check empty playlists',
        'Check empty Following feed',
        'Check search with no results'
      ],
      expected: 'Helpful empty state messages'
    },
    {
      id: 'ui-5',
      category: 'UI/UX',
      test: 'Responsive Design',
      steps: [
        'Resize browser window',
        'Test on mobile viewport',
        'Check all pages'
      ],
      expected: 'Site works well at all sizes'
    },

    // Error Handling Tests
    {
      id: 'error-1',
      category: 'Error Handling',
      test: 'Network Errors',
      steps: [
        'Stop backend server',
        'Try performing actions',
        'Check error messages'
      ],
      expected: 'Graceful error messages, no crashes'
    },
    {
      id: 'error-2',
      category: 'Error Handling',
      test: 'Invalid Routes',
      steps: [
        'Navigate to /invalid-route'
      ],
      expected: 'Shows 404 or redirects gracefully'
    },
    {
      id: 'error-3',
      category: 'Error Handling',
      test: 'Invalid Video ID',
      steps: [
        'Go to /video/invalid-id'
      ],
      expected: 'Shows "Video not found" message'
    },
  ];

  const categories = Array.from(new Set(testItems.map(item => item.category)));
  const getProgress = (category: string) => {
    const categoryItems = testItems.filter(item => item.category === category);
    const checkedCount = categoryItems.filter(item => checkedItems.has(item.id)).length;
    return { checked: checkedCount, total: categoryItems.length };
  };

  const totalProgress = {
    checked: checkedItems.size,
    total: testItems.length
  };

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-4 md:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">
            🧪 Testing Checklist
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Comprehensive test suite for Petflix. Check off each test as you complete it.
          </p>
          
          {/* Progress Bar */}
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-transparent">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-charcoal dark:text-white">
                Overall Progress
              </span>
              <span className="text-lg font-semibold text-charcoal dark:text-white">
                {totalProgress.checked} / {totalProgress.total}
              </span>
            </div>
            <div className="w-full h-4 bg-gray-200 dark:bg-petflix-gray rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(totalProgress.checked / totalProgress.total) * 100}%` }}
              />
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={resetAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
              >
                Reset All
              </button>
              {totalProgress.checked === totalProgress.total && (
                <div className="flex-1 flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                    🎉 All tests complete!
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Categories */}
        <div className="space-y-4">
          {categories.map(category => {
            const categoryItems = testItems.filter(item => item.category === category);
            const progress = getProgress(category);
            const isExpanded = expandedCategories.has(category);

            return (
              <div key={category} className="bg-white dark:bg-petflix-dark rounded-lg border border-gray-200 dark:border-transparent overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-petflix-gray transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{isExpanded ? '▼' : '▶'}</span>
                    <h2 className="text-xl font-bold text-charcoal dark:text-white">
                      {category}
                    </h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {progress.checked} / {progress.total}
                    </span>
                    <div className="w-32 h-2 bg-gray-200 dark:bg-petflix-gray rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${(progress.checked / progress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Category Items */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {categoryItems.map(item => (
                      <div 
                        key={item.id}
                        className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0 hover:bg-gray-50 dark:hover:bg-petflix-gray/50 transition"
                      >
                        <label className="flex items-start gap-4 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checkedItems.has(item.id)}
                            onChange={() => toggleItem(item.id)}
                            className="mt-1 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <h3 className={`font-semibold text-lg mb-2 ${checkedItems.has(item.id) ? 'line-through text-gray-500 dark:text-gray-600' : 'text-charcoal dark:text-white'}`}>
                              {item.test}
                            </h3>
                            <div className="mb-2">
                              <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                Steps:
                              </p>
                              <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                {item.steps.map((step, idx) => (
                                  <li key={idx}>{step}</li>
                                ))}
                              </ol>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                              <p className="text-sm font-medium text-green-800 dark:text-green-400">
                                ✅ Expected: {item.expected}
                              </p>
                            </div>
                          </div>
                        </label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

