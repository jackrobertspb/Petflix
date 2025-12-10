-- Add sequential user numbers to make User IDs more user-friendly
-- Users will be displayed as #1, #2, #3, etc. instead of UUIDs

-- Add user_number column
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS user_number SERIAL;

-- Backfill existing users with sequential numbers based on creation date
-- This ensures earlier users get lower numbers
DO $$
DECLARE
    user_record RECORD;
    counter INTEGER := 1;
BEGIN
    -- Loop through users ordered by creation date
    FOR user_record IN 
        SELECT id FROM users ORDER BY created_at ASC
    LOOP
        UPDATE users 
        SET user_number = counter 
        WHERE id = user_record.id;
        
        counter := counter + 1;
    END LOOP;
END $$;

-- Make user_number NOT NULL after backfilling
ALTER TABLE users 
ALTER COLUMN user_number SET NOT NULL;

-- Create unique index on user_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_number ON users(user_number);

-- Add comment
COMMENT ON COLUMN users.user_number IS 'Sequential user number for display (e.g., User #1, #2, #3)';


