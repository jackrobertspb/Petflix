-- Add admin role column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create index for admin queries
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;

-- Add comment for documentation
COMMENT ON COLUMN users.is_admin IS 'Indicates if user has administrator privileges for moderation tasks';

