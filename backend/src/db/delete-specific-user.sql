-- Delete a specific user by email or username
-- Replace 'user@example.com' with the actual email or username you want to delete

-- Option 1: Delete by EMAIL
-- Replace 'user@example.com' with the email address
DELETE FROM users WHERE email = 'user@example.com';

-- Option 2: Delete by USERNAME
-- Replace 'username' with the username
-- DELETE FROM users WHERE username = 'username';

-- Option 3: Delete by USER ID (if you know the UUID)
-- Replace 'user-id-here' with the actual UUID
-- DELETE FROM users WHERE id = 'user-id-here';

-- Note: This will CASCADE delete:
-- - All videos shared by this user
-- - All playlists created by this user
-- - All comments made by this user
-- - All likes given by this user
-- - All followers/following relationships
-- - All push subscriptions
-- - All reports made by this user
-- - All search history
-- - All shareable URLs for their videos
-- - All password reset tokens
-- - All email verification tokens

-- Verify deletion
SELECT 
  id,
  username,
  email,
  created_at
FROM users
WHERE email = 'user@example.com';
-- Should return 0 rows if deleted successfully

