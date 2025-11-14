import { useState } from 'react';
import { Link } from 'react-router-dom';

interface Test {
  id: number;
  name: string;
  url: string;
  steps: string[];
  expected: string[];
  status: 'pending' | 'passed' | 'failed';
}

export const TestSheet = () => {
  const [tests, setTests] = useState<Test[]>([
    {
      id: 1,
      name: 'Landing Page',
      url: '/',
      steps: [
        'Open http://localhost:5173',
        'Observe the page'
      ],
      expected: [
        'Dark Netflix-style theme loads',
        'Navbar shows "PETFLIX" logo with paw emoji 🐾',
        'Hero section displays "Unlimited pet videos, purrs, and paws 🐾"',
        'Two buttons visible: "Get Started" and "Browse Videos"',
        '"Trending Now" section at bottom',
        'Message: "No videos yet" (database is empty)'
      ],
      status: 'pending'
    },
    {
      id: 2,
      name: 'Navigation (Guest)',
      url: '/',
      steps: [
        'Click "Browse" in navbar',
        'Note what happens',
        'Try to manually navigate to /feed'
      ],
      expected: [
        '"Browse" takes you to /search',
        'Manually going to /feed redirects to /login (protected route)'
      ],
      status: 'pending'
    },
    {
      id: 3,
      name: 'User Registration',
      url: '/register',
      steps: [
        'Click "Get Started" or go to /register',
        'Fill in: Username: testpet123',
        'Fill in: Email: testpet123@example.com',
        'Fill in: Password: Test1234!',
        'Fill in: Confirm Password: Test1234!',
        'Click eye icon to verify toggle works',
        'Click "Sign Up"'
      ],
      expected: [
        'Form loads with dark theme',
        'Eye icon grayed out when empty',
        'Eye icon clickable when typing',
        'Password toggles visibility',
        'Shows loading: "Creating Account..."',
        'Redirects to /feed after success',
        'Navbar shows "My Feed", "Profile", "Sign Out"'
      ],
      status: 'pending'
    },
    {
      id: 4,
      name: 'Logout & Login',
      url: '/login',
      steps: [
        'Click "Sign Out" in navbar',
        'Verify logout',
        'Click "Sign In" in navbar',
        'Enter: testpet123@example.com',
        'Enter: Test1234!',
        'Click "Sign In"'
      ],
      expected: [
        'After logout, navbar shows "Browse" and "Sign In"',
        'Redirected to home page',
        'Login form appears',
        'After login, redirected to /feed',
        'Navbar shows authenticated options'
      ],
      status: 'pending'
    },
    {
      id: 5,
      name: 'Protected Route Access',
      url: '/feed',
      steps: [
        'Make sure you\'re logged OUT',
        'Navigate directly to /feed'
      ],
      expected: [
        'Automatically redirected to /login',
        'Login form appears'
      ],
      status: 'pending'
    },
    {
      id: 6,
      name: 'Feed Page (Empty State)',
      url: '/feed',
      steps: [
        'Login if needed',
        'Navigate to "My Feed"'
      ],
      expected: [
        'Dark theme loads',
        'Shows "Your Feed 🎬" heading',
        'Shows "Your feed is empty!" message',
        'Shows "Browse Videos" button',
        'No videos displayed'
      ],
      status: 'pending'
    },
    {
      id: 7,
      name: 'Search Page',
      url: '/search',
      steps: [
        'Click "Browse" or "Search" in navbar',
        'Type: "cute cats"',
        'Click "Search" button'
      ],
      expected: [
        'Search page loads',
        'Shows "Search Pet Videos 🔍"',
        'Shows "Searching..." loading state',
        '⚠️ WILL FAIL - Needs YouTube API key',
        'Expected: Error or "No videos found"'
      ],
      status: 'pending'
    },
    {
      id: 8,
      name: 'Profile Page',
      url: '/profile/YOUR_USER_ID',
      steps: [
        'While logged in, click "Profile"',
        'Observe the page'
      ],
      expected: [
        'Profile page loads',
        'Shows your username',
        'Shows placeholder 🐾',
        'Shows "Edit Profile" button',
        'Shows "Shared Videos (0)"',
        'Message: "No videos shared yet"'
      ],
      status: 'pending'
    },
    {
      id: 9,
      name: 'Backend Health Check',
      url: 'http://localhost:5001/health',
      steps: [
        'Open this URL in a new tab',
        'Check response'
      ],
      expected: [
        'Shows JSON: {"status":"ok","timestamp":"..."}',
        'If fails: Backend not running'
      ],
      status: 'pending'
    }
  ]);

  const updateTestStatus = (id: number, status: 'passed' | 'failed') => {
    setTests(tests.map(test => 
      test.id === id ? { ...test, status } : test
    ));
  };

  const passedCount = tests.filter(t => t.status === 'passed').length;
  const failedCount = tests.filter(t => t.status === 'failed').length;

  return (
    <div className="min-h-screen bg-petflix-black pt-24 px-8 md:px-16 pb-12">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            🧪 Petflix Test Sheet
          </h1>
          <p className="text-gray-400">
            Systematic testing guide - Go through each test in order
          </p>
        </div>

        {/* Progress Bar */}
        <div className="bg-petflix-dark rounded-lg p-6 mb-8">
          <div className="flex gap-8">
            <div>
              <div className="text-3xl font-bold text-green-500">{passedCount}</div>
              <div className="text-sm text-gray-400">Passed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-red-500">{failedCount}</div>
              <div className="text-sm text-gray-400">Failed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-400">{tests.length - passedCount - failedCount}</div>
              <div className="text-sm text-gray-400">Pending</div>
            </div>
          </div>
        </div>

        {/* Pre-Testing Checklist */}
        <div className="bg-petflix-dark rounded-lg p-6 mb-8 border-2 border-petflix-orange">
          <h2 className="text-2xl font-bold text-white mb-4">📋 Pre-Testing Checklist</h2>
          <div className="space-y-2 text-gray-300">
            <div>✅ Backend running: <code className="bg-petflix-gray px-2 py-1 rounded text-sm">Server running on port 5001</code></div>
            <div>✅ Frontend running: <code className="bg-petflix-gray px-2 py-1 rounded text-sm">Local: http://localhost:5173/</code></div>
            <div>✅ Browser open to Petflix</div>
          </div>
        </div>

        {/* Tests */}
        <div className="space-y-6">
          {tests.map((test) => (
            <div 
              key={test.id} 
              className={`bg-petflix-dark rounded-lg p-6 border-2 ${
                test.status === 'passed' ? 'border-green-500' :
                test.status === 'failed' ? 'border-red-500' :
                'border-petflix-gray'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-white mb-1">
                    Test {test.id}: {test.name}
                  </h3>
                  <div className="text-sm text-gray-400">
                    URL: {test.url.startsWith('http') ? (
                      <a href={test.url} target="_blank" rel="noopener noreferrer" className="text-petflix-orange hover:underline">
                        {test.url}
                      </a>
                    ) : (
                      <Link to={test.url} className="text-petflix-orange hover:underline">
                        {test.url}
                      </Link>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateTestStatus(test.id, 'passed')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition text-sm font-medium"
                  >
                    ✓ Pass
                  </button>
                  <button
                    onClick={() => updateTestStatus(test.id, 'failed')}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition text-sm font-medium"
                  >
                    ✗ Fail
                  </button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-bold text-petflix-orange mb-2">Steps:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-300">
                    {test.steps.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-petflix-orange mb-2">Expected Results:</h4>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {test.expected.map((exp, i) => (
                      <li key={i} className="flex gap-2">
                        <span className="text-green-500">□</span>
                        <span>{exp}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="mt-12 bg-petflix-dark rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-4">📊 Testing Complete?</h2>
          <p className="text-gray-400 mb-6">
            Once you've gone through all tests, let me know which ones failed!
          </p>
          <div className="text-sm text-gray-500">
            <p>Report format: "Test #X failed: [error message]"</p>
            <p>Include browser console errors (F12 → Console)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

