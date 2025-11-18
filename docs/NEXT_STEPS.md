# Petflix - Next Steps Guide

## 🚀 Immediate Actions Required

### 1. Run SQL Migrations in Supabase

**Location:** `Petflix-1/src/db/`

**Execute these in order in Supabase SQL Editor:**

1. **Account Locking** (`add-account-locking.sql`)
   ```sql
   ALTER TABLE users 
   ADD COLUMN IF NOT EXISTS failed_login_attempts INTEGER DEFAULT 0,
   ADD COLUMN IF NOT EXISTS locked_until TIMESTAMP;

   CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until);
   ```

2. **Password Reset Tokens** (`add-password-reset.sql`)
   ```sql
   CREATE TABLE IF NOT EXISTS password_reset_tokens (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     token TEXT NOT NULL UNIQUE,
     expires_at TIMESTAMP NOT NULL,
     used BOOLEAN DEFAULT FALSE,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
   );

   CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
   CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
   CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);
   ```

3. **Likes Tables** (`add-likes-tables.sql`)
   ```sql
   CREATE TABLE IF NOT EXISTS video_likes (
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (user_id, video_id)
   );

   CREATE TABLE IF NOT EXISTS comment_likes (
     user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     PRIMARY KEY (user_id, comment_id)
   );

   CREATE INDEX IF NOT EXISTS idx_video_likes_video_id ON video_likes(video_id);
   CREATE INDEX IF NOT EXISTS idx_video_likes_user_id ON video_likes(user_id);
   CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);
   CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON comment_likes(user_id);
   ```

4. **Admin Role** (`add-admin-role.sql`)
   ```sql
   ALTER TABLE users 
   ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

   CREATE INDEX IF NOT EXISTS idx_users_is_admin ON users(is_admin) WHERE is_admin = TRUE;
   ```

5. **Shareable URLs** (`add-shareable-urls.sql`)
   ```sql
   CREATE TABLE IF NOT EXISTS shareable_urls (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
     share_code VARCHAR(20) NOT NULL UNIQUE,
     created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
     click_count INTEGER DEFAULT 0
   );

   CREATE INDEX IF NOT EXISTS idx_shareable_urls_share_code ON shareable_urls(share_code);
   CREATE INDEX IF NOT EXISTS idx_shareable_urls_video_id ON shareable_urls(video_id);
   ```

**✅ Verification:** Check that all tables/columns exist in Supabase dashboard.

---

### 2. Assign First Admin User

**Option A: Via SQL (Quick)**
```sql
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'your-admin-email@example.com';
```

**Option B: Via API (After first admin exists)**
```bash
# First, get your user ID
curl -X GET http://localhost:5001/api/v1/users/{userId} \
  -H "Authorization: Bearer YOUR_TOKEN"

# Then assign admin (requires existing admin)
curl -X PATCH http://localhost:5001/api/v1/users/{userId}/admin \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"is_admin": true}'
```

---

### 3. Configure Environment Variables

**Backend (.env in `Petflix-1/`):**
```env
# Existing variables...
FRONTEND_URL=http://localhost:5173  # Update if different

# Email Service (for production)
EMAIL_PROVIDER=console  # Options: console, sendgrid, ses
# For SendGrid:
# SENDGRID_API_KEY=your_key_here
# SENDGRID_FROM_EMAIL=noreply@petflix.com
# For AWS SES:
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# AWS_REGION=us-east-1
```

**Frontend (.env in `Petflix-Frontend/`):**
```env
VITE_API_URL=http://localhost:5001/api/v1  # Verify this matches backend port
```

---

## 🧪 Testing Checklist

### Backend Testing

1. **Admin Role System**
   ```bash
   # Test: Non-admin cannot access moderation
   curl -X GET http://localhost:5001/api/v1/reports \
     -H "Authorization: Bearer NON_ADMIN_TOKEN"
   # Expected: 403 Forbidden

   # Test: Admin can access moderation
   curl -X GET http://localhost:5001/api/v1/reports \
     -H "Authorization: Bearer ADMIN_TOKEN"
   # Expected: 200 OK with reports list
   ```

2. **Email Service**
   - Register a new user → Check console for welcome email
   - Request password reset → Check console for reset email
   - Verify email templates render correctly

3. **Shareable URLs**
   ```bash
   # Generate share URL
   curl -X POST http://localhost:5001/api/v1/videos/{videoId}/share-url \
     -H "Authorization: Bearer TOKEN"
   # Expected: Returns share_url and share_code

   # Test redirect
   curl -I http://localhost:5001/api/v1/videos/share/{shareCode}
   # Expected: 302 redirect to frontend video page
   ```

### Frontend Testing

1. **Onboarding Tutorial**
   - Clear session storage: `sessionStorage.clear()`
   - Visit landing page as guest
   - Verify tutorial appears
   - Test "Skip Tutorial" button
   - Refresh page → Tutorial should NOT appear again

2. **Notification Bell**
   - Log in as user
   - Click notification bell in navbar
   - Verify dropdown opens
   - Test "Mark all as read" (if notifications exist)

3. **Social Media Sharing**
   - Go to any video detail page
   - Click "Share" button
   - Verify share modal opens
   - Test Facebook share (opens new window)
   - Test Twitter share (opens new window)
   - Test Instagram (copies to clipboard)
   - Test copy link button

4. **Search Features**
   - Go to search page
   - Enter search query
   - Test sort dropdown (relevance, recency, view count, engagement)
   - Test category filter
   - Test "Clear Filters" button
   - Verify results update when filters change

5. **Pull-to-Refresh**
   - On Feed page: Pull down from top
   - On Search page: Pull down from top
   - Verify content refreshes
   - Verify visual feedback during pull

6. **Shareable URL Redirect**
   - Generate a share URL from video detail page
   - Copy the share URL (format: `/s/ABC12345`)
   - Visit the share URL in new tab
   - Verify redirects to correct video page

---

## 🔧 Potential Issues & Fixes

### Issue 1: Search Sorting Not Working
**Symptom:** Sort dropdown doesn't change results

**Fix:** Backend search endpoint may need to implement sorting logic:
- Check `Petflix-1/src/routes/videos.ts` search endpoint
- Add sorting logic based on `sort` query parameter

### Issue 2: Category Filter Not Working
**Symptom:** Category filter doesn't filter results

**Fix:** Backend needs to support `categories` and `tags` parameters:
- Update search endpoint to filter by categories/tags
- Or remove filter UI until backend supports it

### Issue 3: Notification Bell Empty
**Symptom:** No notifications showing

**Expected:** Currently uses localStorage. To populate:
- Backend needs notification system
- Or manually add test notifications to localStorage:
  ```javascript
  localStorage.setItem('notifications_USER_ID', JSON.stringify([
    {
      id: '1',
      type: 'follow',
      message: 'John started following you',
      link: '/profile/john-id',
      read: false,
      created_at: new Date().toISOString()
    }
  ]));
  ```

### Issue 4: Email Not Sending
**Symptom:** Emails only log to console

**Fix:** 
- Development: This is expected (console mode)
- Production: Configure `EMAIL_PROVIDER` and credentials

### Issue 5: Share Redirect Not Working
**Symptom:** Share URL doesn't redirect

**Fix:** 
- Verify `FRONTEND_URL` in backend `.env` matches frontend URL
- Check CORS settings if redirecting cross-origin
- Verify share code exists in database

---

## 📋 Code Review Checklist

Before moving to production, review:

- [ ] All SQL migrations executed successfully
- [ ] Admin user assigned
- [ ] Environment variables configured
- [ ] Email service configured (if using in production)
- [ ] All features tested manually
- [ ] No console errors in browser
- [ ] No TypeScript/linter errors
- [ ] Backend API endpoints respond correctly
- [ ] Frontend routes work correctly
- [ ] Authentication flows work
- [ ] Protected routes are protected
- [ ] Admin routes are admin-only

---

## 🚀 Production Deployment Checklist

1. **Environment Variables**
   - Set production `FRONTEND_URL`
   - Configure production email provider
   - Set secure `JWT_SECRET`
   - Configure Supabase production credentials

2. **Security**
   - Verify HTTPS enabled
   - Check CORS settings
   - Review rate limiting
   - Verify admin routes protected

3. **Database**
   - Run all migrations on production database
   - Assign admin users
   - Verify indexes created

4. **Monitoring**
   - Set up error logging
   - Monitor email delivery
   - Track share URL clicks
   - Monitor API performance

---

## 🐛 Common Issues & Quick Fixes

### "Admin access required" error when accessing moderation
- **Fix:** Assign admin role to your user (see step 2)

### Tutorial not showing
- **Fix:** Clear session storage: `sessionStorage.clear()` in browser console

### Share URL returns 404
- **Fix:** Verify share code exists in `shareable_urls` table

### Email not sending in production
- **Fix:** Configure `EMAIL_PROVIDER` and API keys

### Pull-to-refresh not working
- **Fix:** Test on mobile device or enable touch simulation in browser dev tools

---

## 📞 Need Help?

If you encounter issues:

1. Check browser console for errors
2. Check backend logs for errors
3. Verify database migrations ran successfully
4. Verify environment variables are set
5. Test API endpoints directly with curl/Postman
6. Check network tab in browser dev tools

---

## ✅ Success Criteria

You'll know everything is working when:

- ✅ SQL migrations run without errors
- ✅ Admin can access moderation endpoints
- ✅ Non-admin gets 403 on moderation endpoints
- ✅ Tutorial shows for first-time visitors
- ✅ Share modal generates trackable URLs
- ✅ Social sharing buttons work
- ✅ Search sorting changes results
- ✅ Pull-to-refresh refreshes content
- ✅ Notification bell shows in navbar
- ✅ Email service logs emails (or sends in production)

---

**Ready to test! Start with SQL migrations, then work through the testing checklist.**

