-- ===================================================
-- STEP 1: CHECK IF MIGRATION IS NEEDED
-- ===================================================
-- Copy and paste this into Supabase SQL Editor and click RUN
-- It will show you if the columns exist

SELECT 
    column_name, 
    data_type
FROM information_schema.columns 
WHERE table_name = 'users' 
  AND column_name IN ('failed_login_attempts', 'locked_until')
ORDER BY column_name;

-- ===================================================
-- EXPECTED RESULT:
-- If you see 2 rows, the migration is already done ✅
-- If you see 0 rows, YOU MUST RUN STEP 2 below ⚠️
-- ===================================================


-- ===================================================
-- STEP 2: RUN THIS MIGRATION (if Step 1 showed 0 rows)
-- ===================================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);


-- ===================================================
-- STEP 3: VERIFY IT WORKED
-- ===================================================
-- Run Step 1 query again. You should now see 2 rows.


-- ===================================================
-- HOW TO ACCESS SUPABASE SQL EDITOR:
-- ===================================================
-- 1. Go to: https://supabase.com/dashboard/project/zxsyidsgvingbexobmqg
-- 2. Click "SQL Editor" in the left sidebar
-- 3. Click "New Query"
-- 4. Copy/paste Step 1 above and click RUN
-- 5. If it shows 0 rows, copy/paste Step 2 and click RUN
-- 6. Run Step 1 again to verify
-- ===================================================

