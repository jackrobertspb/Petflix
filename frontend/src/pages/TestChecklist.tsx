import { useState, useEffect } from 'react';

interface TestCase {
  id: string;
  category: string;
  testId: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  name: string;
  steps: string[];
  expected: string;
  status: 'pass' | 'fail' | 'partial' | 'skip' | 'pending';
  notes: string;
}

type TestStatus = 'pass' | 'fail' | 'partial' | 'skip' | 'pending';

export const TestChecklist = () => {
  const [testResults, setTestResults] = useState<Map<string, { status: TestStatus; notes: string }>>(new Map());
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Load test results from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('petflixTestResults');
    if (saved) {
      setTestResults(new Map(JSON.parse(saved)));
    }
    // Expand all categories by default
    setExpandedCategories(new Set(testCases.map(t => t.category)));
  }, []);

  // Save test results to localStorage
  useEffect(() => {
    localStorage.setItem('petflixTestResults', JSON.stringify(Array.from(testResults)));
  }, [testResults]);

  const updateTest = (id: string, status: TestStatus, notes: string = '') => {
    const newResults = new Map(testResults);
    newResults.set(id, { status, notes });
    setTestResults(newResults);
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
    if (confirm('Are you sure you want to reset all test results? This cannot be undone.')) {
      setTestResults(new Map());
      localStorage.removeItem('petflixTestResults');
    }
  };

  const exportResults = () => {
    const results = testCases.map(test => {
      const result = testResults.get(test.id) || { status: 'pending', notes: '' };
      return {
        category: test.category,
        testId: test.testId,
        name: test.name,
        status: result.status,
        notes: result.notes
      };
    });
    
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `petflix-test-results-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  const testCases: Omit<TestCase, 'status' | 'notes'>[] = [
    // 1. AUTHENTICATION & ONBOARDING
    {
      id: 'AUTH-001',
      category: '1. Authentication & Onboarding',
      testId: 'AUTH-001',
      priority: 'critical',
      name: 'User Registration',
      steps: [
        'Open app in incognito mode',
        'Click "Get Started" or "Register"',
        'Try invalid inputs (weak password, invalid email)',
        'Register with valid credentials',
        'Check for auto-login and redirect to Feed',
        'Verify token saved in localStorage'
      ],
      expected: 'Account created, auto-login, redirected to feed, welcome email sent (if configured)'
    },
    {
      id: 'AUTH-002',
      category: '1. Authentication & Onboarding',
      testId: 'AUTH-002',
      priority: 'critical',
      name: 'User Login & Account Locking',
      steps: [
        'Logout if logged in',
        'Try login with wrong password 5 times',
        'Verify account locked for 30 minutes',
        'Login with correct credentials (or different account)',
        'Check redirect to Feed',
        'Refresh page and verify still logged in'
      ],
      expected: 'Account locks after 5 failed attempts, successful login redirects to feed'
    },
    {
      id: 'AUTH-003',
      category: '1. Authentication & Onboarding',
      testId: 'AUTH-003',
      priority: 'high',
      name: 'Password Reset',
      steps: [
        'Logout',
        'Click "Forgot Password"',
        'Enter registered email',
        'Check email for reset link',
        'Click link and enter new password',
        'Login with new password'
      ],
      expected: 'Password reset email sent, can reset password and login'
    },
    {
      id: 'AUTH-004',
      category: '1. Authentication & Onboarding',
      testId: 'AUTH-004',
      priority: 'medium',
      name: 'Email Verification',
      steps: [
        'Register new account',
        'Check for verification email',
        'Click verification link',
        'Verify email verified status shown'
      ],
      expected: 'Verification email sent, clicking link verifies email'
    },
    {
      id: 'AUTH-005',
      category: '1. Authentication & Onboarding',
      testId: 'AUTH-005',
      priority: 'medium',
      name: 'Onboarding Tutorial',
      steps: [
        'Register new account',
        'Check tutorial modal appears',
        'Navigate through all 5 steps',
        'Test "Skip" button',
        'Refresh page and verify tutorial doesn\'t reappear'
      ],
      expected: 'Tutorial shows 5 steps with progress, skip works, doesn\'t show again'
    },

    // 2. VIDEO FEATURES
    {
      id: 'VIDEO-001',
      category: '2. Video Features',
      testId: 'VIDEO-001',
      priority: 'critical',
      name: 'Share Video',
      steps: [
        'Navigate to "Share Video"',
        'Enter invalid URL (should fail)',
        'Enter valid YouTube URL',
        'Wait for metadata to load',
        'Optionally add custom title/description',
        'Click "Share"',
        'Try sharing same video again (should fail)'
      ],
      expected: 'Video shared successfully, metadata fetched, prevents duplicates'
    },
    {
      id: 'VIDEO-002',
      category: '2. Video Features',
      testId: 'VIDEO-002',
      priority: 'critical',
      name: 'Search Videos (Petflix)',
      steps: [
        'Go to Search page',
        'Verify dropdown shows "🐾 Petflix"',
        'Search for a term',
        'Try different sort options',
        'Try category filtering',
        'Click "Clear Filters"',
        'Click on a video result'
      ],
      expected: 'Search works, sorting works, filtering works, videos link to detail page'
    },
    {
      id: 'VIDEO-003',
      category: '2. Video Features',
      testId: 'VIDEO-003',
      priority: 'critical',
      name: 'Search Videos (YouTube)',
      steps: [
        'Go to Search page',
        'Click dropdown, select "▶️ YouTube"',
        'Search for "cute" or "funny"',
        'Verify all results are pet-related',
        'Check for "YouTube" badge on results',
        'Click on a result',
        'Verify opens YouTube in new tab'
      ],
      expected: 'YouTube search returns pet videos only, links open YouTube'
    },
    {
      id: 'VIDEO-004',
      category: '2. Video Features',
      testId: 'VIDEO-004',
      priority: 'critical',
      name: 'Video Detail Page',
      steps: [
        'Click on a Petflix video',
        'Check YouTube player loads',
        'Verify title, description shown',
        'Check uploader username',
        'Check view count and like count',
        'Play video',
        'Check comments section loads'
      ],
      expected: 'All video info displays, player works, comments visible'
    },
    {
      id: 'VIDEO-005',
      category: '2. Video Features',
      testId: 'VIDEO-005',
      priority: 'high',
      name: 'Edit Video',
      steps: [
        'Go to own video detail page',
        'Click "Edit"',
        'Change title and description',
        'Save changes',
        'Try editing another user\'s video (should fail)'
      ],
      expected: 'Can edit own videos, cannot edit others\' videos'
    },
    {
      id: 'VIDEO-006',
      category: '2. Video Features',
      testId: 'VIDEO-006',
      priority: 'high',
      name: 'Delete Video',
      steps: [
        'Go to own video detail',
        'Click "Delete"',
        'Confirm deletion',
        'Verify video removed from profile',
        'Try accessing deleted video (404)'
      ],
      expected: 'Video deleted, no longer accessible'
    },
    {
      id: 'VIDEO-007',
      category: '2. Video Features',
      testId: 'VIDEO-007',
      priority: 'high',
      name: 'Like/Unlike Video',
      steps: [
        'Go to video detail',
        'Click like button',
        'Check like count increases',
        'Click again to unlike',
        'Check like count decreases',
        'Refresh page and verify persists'
      ],
      expected: 'Like/unlike works, count updates, persists'
    },
    {
      id: 'VIDEO-008',
      category: '2. Video Features',
      testId: 'VIDEO-008',
      priority: 'medium',
      name: 'View Tracking',
      steps: [
        'Note initial view count',
        'Watch video for a few seconds',
        'Check view count increases',
        'Refresh and watch again (shouldn\'t double count)'
      ],
      expected: 'View count increases per unique user view'
    },

    // 3. COMMENT FEATURES
    {
      id: 'COMMENT-001',
      category: '3. Comment Features',
      testId: 'COMMENT-001',
      priority: 'critical',
      name: 'Create Comment',
      steps: [
        'Go to video detail',
        'Try empty comment (should fail)',
        'Try >280 chars (should fail)',
        'Enter valid comment',
        'Submit',
        'Verify appears in comment list'
      ],
      expected: 'Comment posted, validation works, appears immediately'
    },
    {
      id: 'COMMENT-002',
      category: '3. Comment Features',
      testId: 'COMMENT-002',
      priority: 'high',
      name: 'Reply to Comment',
      steps: [
        'Find existing comment',
        'Click "Reply"',
        'Enter reply text',
        'Submit',
        'Check reply appears nested/indented'
      ],
      expected: 'Reply posted and nested under parent comment'
    },
    {
      id: 'COMMENT-003',
      category: '3. Comment Features',
      testId: 'COMMENT-003',
      priority: 'medium',
      name: 'Edit Comment',
      steps: [
        'Find your own comment',
        'Click "Edit"',
        'Change text',
        'Save',
        'Try editing others\' comments (should fail)'
      ],
      expected: 'Can edit own comments, cannot edit others\''
    },
    {
      id: 'COMMENT-004',
      category: '3. Comment Features',
      testId: 'COMMENT-004',
      priority: 'medium',
      name: 'Delete Comment',
      steps: [
        'Find your own comment',
        'Click "Delete"',
        'Confirm',
        'Verify comment removed'
      ],
      expected: 'Comment deleted, replies also removed'
    },
    {
      id: 'COMMENT-005',
      category: '3. Comment Features',
      testId: 'COMMENT-005',
      priority: 'medium',
      name: 'Like/Unlike Comment',
      steps: [
        'Find a comment',
        'Click like',
        'Check count increases',
        'Click again to unlike',
        'Check count decreases'
      ],
      expected: 'Comment like/unlike works'
    },

    // 4. SOCIAL FEATURES
    {
      id: 'SOCIAL-001',
      category: '4. Social Features',
      testId: 'SOCIAL-001',
      priority: 'critical',
      name: 'Follow/Unfollow User',
      steps: [
        'Visit another user\'s profile',
        'Click "Follow"',
        'Check button changes to "Following"',
        'Check follower count increases',
        'Click "Following" to unfollow',
        'Check counts update'
      ],
      expected: 'Follow/unfollow works, counts update'
    },
    {
      id: 'SOCIAL-002',
      category: '4. Social Features',
      testId: 'SOCIAL-002',
      priority: 'critical',
      name: 'Personalized Feed',
      steps: [
        'Follow a user',
        'Have that user share a video',
        'Check your Feed page',
        'Verify followed user\'s video appears',
        'Unfollow and verify video disappears'
      ],
      expected: 'Feed shows only followed users\' videos'
    },
    {
      id: 'SOCIAL-003',
      category: '4. Social Features',
      testId: 'SOCIAL-003',
      priority: 'high',
      name: 'User Profile',
      steps: [
        'Visit a user profile',
        'Check profile picture, bio, counts',
        'Check "Videos" tab',
        'Check "Playlists" tab',
        'Click on a video'
      ],
      expected: 'All profile data displays correctly'
    },
    {
      id: 'SOCIAL-004',
      category: '4. Social Features',
      testId: 'SOCIAL-004',
      priority: 'medium',
      name: 'Follower/Following Lists',
      steps: [
        'Go to profile',
        'Click follower count',
        'Check follower list',
        'Click following count',
        'Check following list',
        'Click on a user to visit profile'
      ],
      expected: 'Lists display correctly, links work'
    },

    // 5. PLAYLIST FEATURES
    {
      id: 'PLAYLIST-001',
      category: '5. Playlist Features',
      testId: 'PLAYLIST-001',
      priority: 'high',
      name: 'Create Playlist',
      steps: [
        'Go to Playlists page',
        'Click "Create Playlist"',
        'Enter name and description',
        'Select public/private',
        'Click "Create"',
        'Try creating duplicate name (should fail)'
      ],
      expected: 'Playlist created, prevents duplicate names'
    },
    {
      id: 'PLAYLIST-002',
      category: '5. Playlist Features',
      testId: 'PLAYLIST-002',
      priority: 'high',
      name: 'Add Videos to Playlist',
      steps: [
        'Go to video detail',
        'Click "Add to Playlist"',
        'Select playlist(s)',
        'Verify video added',
        'Try adding same video again'
      ],
      expected: 'Videos added to playlist, prevents duplicates'
    },
    {
      id: 'PLAYLIST-003',
      category: '5. Playlist Features',
      testId: 'PLAYLIST-003',
      priority: 'medium',
      name: 'Reorder Playlist Videos',
      steps: [
        'Go to playlist with 3+ videos',
        'Drag video to new position',
        'Refresh page',
        'Verify new order persists'
      ],
      expected: 'Video order can be changed and persists'
    },
    {
      id: 'PLAYLIST-004',
      category: '5. Playlist Features',
      testId: 'PLAYLIST-004',
      priority: 'medium',
      name: 'Playlist Tags',
      steps: [
        'Go to playlist detail',
        'Add tag to a video',
        'Add multiple tags',
        'Filter by tag',
        'Remove tag'
      ],
      expected: 'Tags work for organization and filtering'
    },
    {
      id: 'PLAYLIST-005',
      category: '5. Playlist Features',
      testId: 'PLAYLIST-005',
      priority: 'medium',
      name: 'Edit/Delete Playlist',
      steps: [
        'Go to own playlist',
        'Click "Edit"',
        'Change name, description, visibility',
        'Save',
        'Delete playlist',
        'Verify removed'
      ],
      expected: 'Can edit and delete own playlists'
    },

    // 6. SETTINGS & PROFILE
    {
      id: 'SETTINGS-001',
      category: '6. Settings & Profile',
      testId: 'SETTINGS-001',
      priority: 'high',
      name: 'Update Profile Picture',
      steps: [
        'Go to Settings',
        'Upload JPEG image (<5MB)',
        'Check preview',
        'Verify updated on profile',
        'Try >5MB file (should fail)',
        'Try PDF file (should fail)'
      ],
      expected: 'Profile picture uploads, validation works'
    },
    {
      id: 'SETTINGS-002',
      category: '6. Settings & Profile',
      testId: 'SETTINGS-002',
      priority: 'medium',
      name: 'Update Bio',
      steps: [
        'Go to Settings',
        'Update bio text',
        'Save',
        'Check profile page shows new bio'
      ],
      expected: 'Bio updates successfully'
    },
    {
      id: 'SETTINGS-003',
      category: '6. Settings & Profile',
      testId: 'SETTINGS-003',
      priority: 'high',
      name: 'Change Email',
      steps: [
        'Go to Settings',
        'Enter new email',
        'Update',
        'Try changing again immediately (should fail with cooldown)'
      ],
      expected: 'Email changes, 24h cooldown enforced'
    },
    {
      id: 'SETTINGS-004',
      category: '6. Settings & Profile',
      testId: 'SETTINGS-004',
      priority: 'critical',
      name: 'Change Password',
      steps: [
        'Go to Settings',
        'Enter wrong current password (should fail)',
        'Enter correct current password',
        'Enter new password',
        'Confirm',
        'Logout and login with new password'
      ],
      expected: 'Password changes, can login with new password'
    },
    {
      id: 'SETTINGS-005',
      category: '6. Settings & Profile',
      testId: 'SETTINGS-005',
      priority: 'critical',
      name: 'Delete Account',
      steps: [
        'Go to Settings → Danger Zone',
        'Click "Delete Account"',
        'Read warning',
        'Confirm deletion',
        'Verify logged out and redirected',
        'Try logging in (should fail)'
      ],
      expected: 'Account deleted, can no longer login'
    },

    // 7. NOTIFICATIONS
    {
      id: 'NOTIF-001',
      category: '7. Notifications',
      testId: 'NOTIF-001',
      priority: 'high',
      name: 'Push Notification Subscription',
      steps: [
        'Go to Settings',
        'Toggle "Enable Notifications"',
        'Allow browser permission',
        'Check toggle shows "Enabled"'
      ],
      expected: 'Push notifications subscription successful'
    },
    {
      id: 'NOTIF-002',
      category: '7. Notifications',
      testId: 'NOTIF-002',
      priority: 'high',
      name: 'In-App Notification Bell',
      steps: [
        'Have another user like your video',
        'Check notification bell badge',
        'Click bell',
        'Check dropdown shows notification',
        'Click notification to navigate'
      ],
      expected: 'Notification appears, badge updates, links work'
    },
    {
      id: 'NOTIF-003',
      category: '7. Notifications',
      testId: 'NOTIF-003',
      priority: 'medium',
      name: 'Mark Notification as Read',
      steps: [
        'Open notification dropdown',
        'Find unread notification',
        'Mark as read',
        'Check badge count decreases',
        'Refresh and verify persists'
      ],
      expected: 'Notification marked read, count updates'
    },
    {
      id: 'NOTIF-004',
      category: '7. Notifications',
      testId: 'NOTIF-004',
      priority: 'medium',
      name: 'Delete Notification',
      steps: [
        'Open notification dropdown',
        'Click delete on a notification',
        'Verify removed',
        'Refresh and verify still gone'
      ],
      expected: 'Notification deleted successfully'
    },
    {
      id: 'NOTIF-005',
      category: '7. Notifications',
      testId: 'NOTIF-005',
      priority: 'medium',
      name: 'Notification Grouping',
      steps: [
        'Have 2+ users like same video quickly',
        'Wait 5+ minutes',
        'Check notification',
        'Verify grouped (e.g., "2 people liked your video")'
      ],
      expected: 'Notifications grouped after 5-minute window'
    },

    // 8. ADMIN FEATURES
    {
      id: 'ADMIN-001',
      category: '8. Admin Features',
      testId: 'ADMIN-001',
      priority: 'critical',
      name: 'Admin Access Control',
      steps: [
        'Login as admin user',
        'Check navbar has "Admin" link',
        'Login as regular user',
        'Verify no "Admin" link'
      ],
      expected: 'Admin link only visible to admin users'
    },
    {
      id: 'ADMIN-002',
      category: '8. Admin Features',
      testId: 'ADMIN-002',
      priority: 'high',
      name: 'View Reports',
      steps: [
        'Create video report (as regular user)',
        'Login as admin',
        'Go to Admin Reports',
        'Check report appears',
        'Filter by status'
      ],
      expected: 'Reports visible to admin, filtering works'
    },
    {
      id: 'ADMIN-003',
      category: '8. Admin Features',
      testId: 'ADMIN-003',
      priority: 'high',
      name: 'Error Log Dashboard',
      steps: [
        'Login as admin',
        'Go to Admin Error Dashboard',
        'Check error logs listed',
        'Filter by level and date',
        'Export logs',
        'Delete a log'
      ],
      expected: 'Error logs viewable, filterable, exportable'
    },
    {
      id: 'ADMIN-004',
      category: '8. Admin Features',
      testId: 'ADMIN-004',
      priority: 'medium',
      name: 'Configure Search Weights',
      steps: [
        'Go to Admin Settings',
        'Adjust relevance weight sliders',
        'Save',
        'Test search with new weights'
      ],
      expected: 'Search weights configurable and affect results'
    },

    // 9. PWA FEATURES
    {
      id: 'PWA-001',
      category: '9. PWA Features',
      testId: 'PWA-001',
      priority: 'high',
      name: 'Install PWA',
      steps: [
        'Open app in Chrome/Edge',
        'Check for install prompt',
        'Click install',
        'Confirm installation',
        'Open installed app'
      ],
      expected: 'PWA installs and opens standalone'
    },
    {
      id: 'PWA-002',
      category: '9. PWA Features',
      testId: 'PWA-002',
      priority: 'medium',
      name: 'Offline Support',
      steps: [
        'Browse some pages',
        'Turn off internet',
        'Navigate to previously viewed pages',
        'Try viewing new content'
      ],
      expected: 'Cached pages work offline, new content shows error'
    },
    {
      id: 'PWA-003',
      category: '9. PWA Features',
      testId: 'PWA-003',
      priority: 'medium',
      name: 'Pull to Refresh',
      steps: [
        'Open Feed or Search',
        'Pull down from top',
        'Release',
        'Check content refreshes'
      ],
      expected: 'Pull to refresh works and updates content'
    },
    {
      id: 'PWA-004',
      category: '9. PWA Features',
      testId: 'PWA-004',
      priority: 'low',
      name: 'TV Casting',
      steps: [
        'Open video detail (if device supports casting)',
        'Click cast button',
        'Select device',
        'Verify video casts'
      ],
      expected: 'Video casts to supported devices'
    },

    // 10. UI/UX FEATURES
    {
      id: 'UI-001',
      category: '10. UI/UX Features',
      testId: 'UI-001',
      priority: 'high',
      name: 'Dark Mode',
      steps: [
        'Toggle theme in navbar',
        'Check all pages switch themes',
        'Refresh page',
        'Verify theme persists'
      ],
      expected: 'Dark mode works across all pages and persists'
    },
    {
      id: 'UI-002',
      category: '10. UI/UX Features',
      testId: 'UI-002',
      priority: 'high',
      name: 'Responsive Design',
      steps: [
        'Test on desktop (1920x1080)',
        'Test on laptop (1366x768)',
        'Test on tablet (768x1024)',
        'Test on mobile (375x667)',
        'Test mobile landscape'
      ],
      expected: 'Layout adapts properly at all sizes'
    },
    {
      id: 'UI-003',
      category: '10. UI/UX Features',
      testId: 'UI-003',
      priority: 'high',
      name: 'Search Dropdown UI',
      steps: [
        'Go to Search page',
        'Check dropdown in search bar',
        'Click to open',
        'Check arrow rotates',
        'Select option',
        'Click outside to close'
      ],
      expected: 'Custom dropdown works smoothly, looks clean'
    },
    {
      id: 'UI-004',
      category: '10. UI/UX Features',
      testId: 'UI-004',
      priority: 'critical',
      name: 'Error Handling',
      steps: [
        'Try invalid URL',
        'Submit invalid form',
        'Lose internet connection',
        'Trigger API error',
        'Check error messages'
      ],
      expected: 'Graceful error messages, no crashes'
    },

    // 11. SECURITY TESTING
    {
      id: 'SEC-001',
      category: '11. Security Testing',
      testId: 'SEC-001',
      priority: 'critical',
      name: 'Authentication Security',
      steps: [
        'Try accessing /feed without login',
        'Try accessing /settings without login',
        'Verify redirected to login',
        'Logout and try using old token',
        'Verify 401 Unauthorized'
      ],
      expected: 'Protected routes require auth, old tokens invalid'
    },
    {
      id: 'SEC-002',
      category: '11. Security Testing',
      testId: 'SEC-002',
      priority: 'critical',
      name: 'Authorization Security',
      steps: [
        'Try editing another user\'s video',
        'Try deleting another user\'s video',
        'Try deleting another user\'s comment',
        'Try accessing admin endpoints (non-admin)',
        'Verify all return 403 Forbidden'
      ],
      expected: 'Authorization properly enforced, 403 for unauthorized actions'
    },
    {
      id: 'SEC-003',
      category: '11. Security Testing',
      testId: 'SEC-003',
      priority: 'critical',
      name: 'Input Validation',
      steps: [
        'Try XSS: <script>alert("xss")</script>',
        'Try SQL injection: \' OR \'1\'=\'1',
        'Try very long strings (10k chars)',
        'Try special characters',
        'Check all escaped/rejected'
      ],
      expected: 'XSS/SQLi prevented, input validated'
    },
    {
      id: 'SEC-004',
      category: '11. Security Testing',
      testId: 'SEC-004',
      priority: 'high',
      name: 'Rate Limiting',
      steps: [
        'Make 100+ API requests quickly',
        'Check for rate limit error',
        'Try sharing 10+ videos in 1 hour',
        'Verify rate limits enforced'
      ],
      expected: 'Rate limiting prevents abuse'
    },
    {
      id: 'SEC-005',
      category: '11. Security Testing',
      testId: 'SEC-005',
      priority: 'critical',
      name: 'HTTPS & Security Headers',
      steps: [
        'Visit via HTTP (production only)',
        'Check redirect to HTTPS',
        'Check browser shows padlock',
        'Inspect headers for HSTS, CSP, etc.'
      ],
      expected: 'HTTPS enforced, security headers present'
    },

    // 12. PERFORMANCE TESTING
    {
      id: 'PERF-001',
      category: '12. Performance Testing',
      testId: 'PERF-001',
      priority: 'medium',
      name: 'Page Load Times',
      steps: [
        'Measure Landing page load (<2s)',
        'Measure Feed load (<3s)',
        'Measure Search load (<2s)',
        'Measure Video Detail load (<3s)',
        'Measure Profile load (<2s)'
      ],
      expected: 'All pages load within target times'
    },
    {
      id: 'PERF-002',
      category: '12. Performance Testing',
      testId: 'PERF-002',
      priority: 'medium',
      name: 'Search Performance',
      steps: [
        'Search with common term',
        'Search with rare term',
        'Search with filters',
        'YouTube search',
        'Measure all <3s'
      ],
      expected: 'All searches complete within 3 seconds'
    },

    // 13. CROSS-BROWSER TESTING
    {
      id: 'BROWSER-001',
      category: '13. Cross-Browser Testing',
      testId: 'BROWSER-001',
      priority: 'high',
      name: 'Browser Compatibility',
      steps: [
        'Test core features on Chrome',
        'Test on Firefox',
        'Test on Safari',
        'Test on Edge',
        'Test on Mobile Safari',
        'Test on Chrome Android'
      ],
      expected: 'App works correctly in all major browsers'
    }
  ];

  // Calculate statistics
  const getStats = () => {
    const total = testCases.length;
    const tested = Array.from(testResults.values()).filter(r => r.status !== 'pending').length;
    const passed = Array.from(testResults.values()).filter(r => r.status === 'pass').length;
    const failed = Array.from(testResults.values()).filter(r => r.status === 'fail').length;
    const partial = Array.from(testResults.values()).filter(r => r.status === 'partial').length;
    const skipped = Array.from(testResults.values()).filter(r => r.status === 'skip').length;
    const pending = total - tested;
    
    return { total, tested, passed, failed, partial, skipped, pending, passRate: tested > 0 ? ((passed / tested) * 100).toFixed(1) : '0' };
  };

  const stats = getStats();

  // Filter test cases
  const filteredTests = testCases.filter(test => {
    const result = testResults.get(test.id);
    const status = result?.status || 'pending';
    
    const priorityMatch = filterPriority === 'all' || test.priority === filterPriority;
    const statusMatch = filterStatus === 'all' || status === filterStatus;
    
    return priorityMatch && statusMatch;
  });

  // Group by category
  const categories = Array.from(new Set(filteredTests.map(t => t.category)));
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 dark:text-red-400';
      case 'high': return 'text-orange-600 dark:text-orange-400';
      case 'medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'low': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'critical': return '🔴';
      case 'high': return '🟡';
      case 'medium': return '🟢';
      case 'low': return '🔵';
      default: return '⚪';
    }
  };

  return (
    <div className="min-h-screen bg-cream-light dark:bg-petflix-black pt-24 px-4 md:px-8 pb-16">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-charcoal dark:text-white mb-2">
            🧪 Petflix Comprehensive Testing Suite
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Professional-grade test sheet with 100+ test cases. Mark status and add notes as you test.
          </p>

          {/* Statistics Dashboard */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 border border-gray-200 dark:border-transparent">
              <div className="text-2xl font-bold text-charcoal dark:text-white">{stats.total}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Total Tests</div>
            </div>
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 border border-gray-200 dark:border-transparent">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.tested}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Tested</div>
            </div>
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 border border-gray-200 dark:border-transparent">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.passed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Passed</div>
            </div>
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 border border-gray-200 dark:border-transparent">
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
            </div>
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 border border-gray-200 dark:border-transparent">
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.partial}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Partial</div>
            </div>
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 border border-gray-200 dark:border-transparent">
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.skipped}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Skipped</div>
            </div>
            <div className="bg-white dark:bg-petflix-dark rounded-lg p-4 border border-gray-200 dark:border-transparent">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.passRate}%</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">Pass Rate</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-transparent mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-semibold text-charcoal dark:text-white">Overall Progress</span>
              <span className="text-lg font-semibold text-charcoal dark:text-white">{stats.tested} / {stats.total}</span>
            </div>
            <div className="w-full h-4 bg-gray-200 dark:bg-petflix-gray rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${(stats.tested / stats.total) * 100}%` }}
              />
            </div>
            {stats.tested === stats.total && (
              <div className="mt-4 text-center">
                <span className="text-green-600 dark:text-green-400 font-bold text-xl">
                  🎉 All tests completed! Pass rate: {stats.passRate}%
                </span>
              </div>
            )}
          </div>

          {/* Filters & Actions */}
          <div className="bg-white dark:bg-petflix-dark rounded-lg p-6 border border-gray-200 dark:border-transparent">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Priority:</label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-petflix-gray text-charcoal dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">🔴 Critical</option>
                  <option value="high">🟡 High</option>
                  <option value="medium">🟢 Medium</option>
                  <option value="low">🔵 Low</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 block">Status:</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 bg-gray-50 dark:bg-petflix-gray text-charcoal dark:text-white rounded-lg border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="pass">✅ Pass</option>
                  <option value="fail">❌ Fail</option>
                  <option value="partial">⚠️ Partial</option>
                  <option value="skip">⏭️ Skip</option>
                </select>
              </div>
              <div className="ml-auto flex gap-2">
                <button
                  onClick={exportResults}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition"
                >
                  Export Results
                </button>
                <button
                  onClick={resetAll}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition"
                >
                  Reset All
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Test Categories */}
        <div className="space-y-4">
          {categories.map(category => {
            const categoryTests = filteredTests.filter(t => t.category === category);
            const isExpanded = expandedCategories.has(category);
            const categoryPassed = categoryTests.filter(t => testResults.get(t.id)?.status === 'pass').length;
            const categoryTotal = categoryTests.length;

            return (
              <div key={category} className="bg-white dark:bg-petflix-dark rounded-lg border border-gray-200 dark:border-transparent overflow-hidden">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-petflix-gray/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{isExpanded ? '▼' : '▶'}</span>
                    <h2 className="text-lg font-bold text-charcoal dark:text-white text-left">{category}</h2>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      {categoryPassed} / {categoryTotal}
                    </span>
                    <div className="w-32 h-2 bg-gray-200 dark:bg-petflix-gray rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${categoryTotal > 0 ? (categoryPassed / categoryTotal) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Category Tests */}
                {isExpanded && (
                  <div className="border-t border-gray-200 dark:border-gray-700">
                    {categoryTests.map(test => {
                      const result = testResults.get(test.id) || { status: 'pending', notes: '' };

                      return (
                        <div 
                          key={test.id}
                          className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 last:border-0"
                        >
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-mono bg-gray-100 dark:bg-petflix-gray px-2 py-1 rounded">
                                  {test.testId}
                                </span>
                                <span className="text-lg">{getPriorityBadge(test.priority)}</span>
                                <h3 className="font-semibold text-lg text-charcoal dark:text-white">
                                  {test.name}
                                </h3>
                              </div>
                              
                              <div className="mb-3">
                                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">STEPS:</p>
                                <ol className="list-decimal list-inside text-sm text-gray-700 dark:text-gray-300 space-y-1">
                                  {test.steps.map((step, idx) => (
                                    <li key={idx}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                              
                              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 mb-3">
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                  <strong>Expected:</strong> {test.expected}
                                </p>
                              </div>

                              {/* Status & Notes */}
                              <div className="flex gap-2 mb-2">
                                <button
                                  onClick={() => updateTest(test.id, 'pass', result.notes)}
                                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                                    result.status === 'pass'
                                      ? 'bg-green-600 text-white'
                                      : 'bg-gray-200 dark:bg-petflix-gray text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  ✅ Pass
                                </button>
                                <button
                                  onClick={() => updateTest(test.id, 'fail', result.notes)}
                                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                                    result.status === 'fail'
                                      ? 'bg-red-600 text-white'
                                      : 'bg-gray-200 dark:bg-petflix-gray text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  ❌ Fail
                                </button>
                                <button
                                  onClick={() => updateTest(test.id, 'partial', result.notes)}
                                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                                    result.status === 'partial'
                                      ? 'bg-yellow-600 text-white'
                                      : 'bg-gray-200 dark:bg-petflix-gray text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  ⚠️ Partial
                                </button>
                                <button
                                  onClick={() => updateTest(test.id, 'skip', result.notes)}
                                  className={`px-3 py-1 rounded text-sm font-medium transition ${
                                    result.status === 'skip'
                                      ? 'bg-gray-600 text-white'
                                      : 'bg-gray-200 dark:bg-petflix-gray text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-700'
                                  }`}
                                >
                                  ⏭️ Skip
                                </button>
                              </div>

                              <textarea
                                value={result.notes}
                                onChange={(e) => updateTest(test.id, result.status, e.target.value)}
                                placeholder="Add notes about this test..."
                                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-petflix-gray text-charcoal dark:text-white border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-lightblue dark:focus:ring-petflix-orange"
                                rows={2}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
