-- Add account locking fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);

