# How to Run SQL Migrations in Supabase

## Step-by-Step Guide

### Step 1: Open Supabase SQL Editor

1. **Go to Supabase Dashboard:**
   - Visit: https://supabase.com/dashboard
   - Login to your account

2. **Select Your Project:**
   - Click on your Petflix project (or create one if you haven't)

3. **Open SQL Editor:**
   - In the left sidebar, click **"SQL Editor"**
   - Click **"New Query"** button (top right)

---

### Step 2: Run Each Migration File

Run these migrations **one at a time** in this exact order:

#### Migration 1: View Tracking
1. Open the file: `petflix/backend/src/db/add-view-tracking.sql`
2. **Copy ALL the contents** of the file
3. **Paste into Supabase SQL Editor**
4. Click **"Run"** button (or press Ctrl+Enter)
5. Wait for success message: ✅ "Success. No rows returned" or similar

#### Migration 2: View Increment Function
1. Open: `petflix/backend/src/db/add-view-increment-function.sql`
2. Copy ALL contents
3. Paste into SQL Editor
4. Click **"Run"**
5. Wait for success ✅

#### Migration 3: Search History
1. Open: `petflix/backend/src/db/add-search-history.sql`
2. Copy ALL contents
3. Paste into SQL Editor
4. Click **"Run"**
5. Wait for success ✅

#### Migration 4: Playlist Video Order
1. Open: `petflix/backend/src/db/add-playlist-video-order.sql`
2. Copy ALL contents
3. Paste into SQL Editor
4. Click **"Run"**
5. Wait for success ✅

#### Migration 5: Email Verification
1. Open: `petflix/backend/src/db/add-email-verification.sql`
2. Copy ALL contents
3. Paste into SQL Editor
4. Click **"Run"**
5. Wait for success ✅

---

### Step 3: Verify Migrations

After running all migrations, verify they worked:

1. **Check Tables:**
   - In Supabase, go to **"Table Editor"** (left sidebar)
   - You should see these new tables:
     - `video_views` ✅
     - `search_history` ✅
     - `email_verification_tokens` ✅

2. **Check Columns:**
   - Click on `videos` table
   - Should see `view_count` column ✅
   - Click on `playlist_videos` table
   - Should see `position` column ✅

3. **Check Functions:**
   - Go to **"Database"** → **"Functions"** (left sidebar)
   - Should see `increment_video_view` function ✅

---

## Quick Copy-Paste Method

If you want to run them all at once (not recommended, but faster):

1. Open SQL Editor
2. Copy and paste ALL 5 migration files' contents in order
3. Separate each with a blank line
4. Click **"Run"** once

**Example:**
```sql
-- Migration 1: View Tracking
ALTER TABLE videos ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
-- ... rest of migration 1 ...

-- Migration 2: View Increment Function
CREATE OR REPLACE FUNCTION increment_video_view(video_id_param UUID)
-- ... rest of migration 2 ...

-- Migration 3: Search History
CREATE TABLE IF NOT EXISTS search_history (
-- ... rest of migration 3 ...

-- Migration 4: Playlist Video Order
ALTER TABLE playlist_videos ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;
-- ... rest of migration 4 ...

-- Migration 5: Email Verification
CREATE TABLE IF NOT EXISTS email_verification_tokens (
-- ... rest of migration 5 ...
```

---

## Troubleshooting

### Error: "relation already exists"
- **Meaning:** Table/column already exists
- **Solution:** This is OK! The migrations use `IF NOT EXISTS`, so they're safe to run again

### Error: "function already exists"
- **Meaning:** Function already exists
- **Solution:** This is OK! The function uses `CREATE OR REPLACE`, so it will update if needed

### Error: "permission denied"
- **Meaning:** Don't have permission
- **Solution:** Make sure you're using the correct Supabase project and have admin access

### Error: "syntax error"
- **Meaning:** SQL syntax issue
- **Solution:** 
  - Check you copied the ENTIRE file contents
  - Make sure no text was cut off
  - Try running one migration at a time

---

## Visual Guide

```
Supabase Dashboard
  └─ SQL Editor (left sidebar)
      └─ New Query button
          └─ Paste SQL code
              └─ Click "Run" button
                  └─ ✅ Success!
```

---

## After Running Migrations

Once all migrations are complete:
1. ✅ Restart your backend server (if running)
2. ✅ Test the features using the testing guide
3. ✅ Check that everything works as expected

---

## Need Help?

If you encounter any errors:
1. Check the error message in Supabase
2. Verify you copied the entire file contents
3. Try running migrations one at a time
4. Check that your Supabase project is the correct one

