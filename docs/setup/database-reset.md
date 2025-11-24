# Database Reset for Testing

**Quick guide to completely reset your Petflix database to a fresh state.**

---

## 🔄 Complete Database Reset

### When to Use This:
- Starting fresh testing session
- Need clean slate with no test data
- After major testing that created lots of data
- Before demonstrating features

### What It Does:
- ✅ Deletes ALL users
- ✅ Deletes ALL videos, comments, playlists
- ✅ Deletes ALL notifications, likes, follows
- ✅ Deletes ALL error logs and test data
- ✅ Preserves table structure and schema
- ✅ Database ready for immediate use

---

## 📝 How to Reset

### Step 1: Open Supabase Dashboard
1. Go to [https://supabase.com](https://supabase.com)
2. Select your Petflix project
3. Navigate to **SQL Editor** (left sidebar)

### Step 2: Run Reset Script
1. Open the file: `backend/src/db/reset-database-for-testing.sql`
2. Copy the **entire script**
3. Paste into Supabase SQL Editor
4. Click **"Run"** or press `Ctrl/Cmd + Enter`

### Step 3: Verify Success
You should see output like:
```
========================================
DATABASE RESET - BEFORE
========================================
Users: 25
Videos: 150
Comments: 300
Playlists: 45
Notifications: 200
========================================

========================================
DATABASE RESET - AFTER
========================================
Users: 0
Videos: 0
Comments: 0
Playlists: 0
Notifications: 0
Error Logs: 0
========================================
Total Records: 0
========================================
✅ SUCCESS: Database completely wiped!
✅ All tables are empty and ready for testing
========================================
```

---

## 🎯 After Reset

### The database is now completely fresh:
- ✅ No users exist
- ✅ No videos exist
- ✅ No test data
- ✅ All features work
- ✅ Ready to register new accounts

### Next Steps:
1. **Register a new account** at `http://localhost:5173/register`
2. **Start testing** fresh features
3. **Optionally create test admin** (see below)

---

## 👤 Optional: Create Test Admin

If you want a pre-made admin account after reset, uncomment the section at the bottom of the reset script:

```sql
-- Test admin credentials:
-- Username: testadmin
-- Email: admin@test.com
-- Password: TestAdmin123!

INSERT INTO users (username, email, password_hash, is_admin)
VALUES (
    'testadmin',
    'admin@test.com',
    '$2b$10$...[password hash]...',
    true
);
```

**Note:** You'll need to generate a proper bcrypt hash for your desired password. Use:
```javascript
const bcrypt = require('bcrypt');
const hash = await bcrypt.hash('YourPassword123!', 10);
console.log(hash);
```

---

## ⚠️ Important Warnings

### DO NOT run this script if:
- ❌ You're in **production** environment
- ❌ You have **real user data** you want to keep
- ❌ You haven't **backed up** important data

### This is PERMANENT:
- 🚨 **No undo** - all data is permanently deleted
- 🚨 **No recovery** - cannot restore deleted data
- 🚨 **Complete wipe** - everything is removed

---

## 🔍 Verify Current State

To check what's in your database before resetting:

```sql
-- Count all records
SELECT 
  (SELECT COUNT(*) FROM users) as users,
  (SELECT COUNT(*) FROM videos) as videos,
  (SELECT COUNT(*) FROM comments) as comments,
  (SELECT COUNT(*) FROM playlists) as playlists,
  (SELECT COUNT(*) FROM notifications) as notifications;
```

---

## 🛠️ Alternative: Delete Specific User

If you only need to delete **one test user** (not everything):

```sql
-- Delete specific user by email
DELETE FROM users WHERE email = 'testuser@test.com';

-- Delete all test users
DELETE FROM users WHERE email LIKE '%@test.com';
```

See `backend/src/db/delete-specific-user.sql` for more options.

---

## 📋 Tables Affected

The reset script clears these tables (in order):
1. `error_logs`
2. `anomaly_detection_config`
3. `notification_queue`
4. `notifications`
5. `push_subscriptions`
6. `video_views`
7. `video_likes`
8. `shareable_urls`
9. `search_history`
10. `comment_likes`
11. `comments`
12. `playlist_tags`
13. `playlist_videos`
14. `playlists`
15. `reported_videos`
16. `videos`
17. `followers`
18. `password_reset_tokens`
19. `email_verification_tokens`
20. `relevance_weights`
21. `users` (last, cascades remaining data)

---

## 🎉 Ready to Test!

After reset:
1. ✅ Database is completely clean
2. ✅ All features operational
3. ✅ Ready for fresh testing
4. ✅ No conflicts or old data

**Happy testing!** 🚀

