-- Test if account locking columns exist
-- Run this in your Supabase SQL Editor

-- Check if columns exist
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('failed_login_attempts', 'locked_until')
ORDER BY column_name;

-- This should return 2 rows:
-- failed_login_attempts | integer | YES
-- locked_until | timestamp without time zone | YES

-- If it returns 0 rows, run the migration below:
-- =====================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

-- After running the migration, run the SELECT query again to verify.

