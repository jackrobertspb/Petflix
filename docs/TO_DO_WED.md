# 📋 To Do - Wednesday

## ✅ Completed Today (Tuesday)
- ✅ Fixed video viewing 500 errors (Supabase query builder issues)
- ✅ Fixed rate limiting (429 errors on video uploads)
- ✅ Updated duplicate video policy to match PRD (allow different users, prevent same user)
- ✅ Ran migration: `allow-duplicate-videos-per-user.sql`
- ✅ Added YouTube API key to setup documentation
- ✅ Improved error handling and messages

---

## 🎯 High Priority - Core Features

### 1. Verify High Priority Features Are Working
**Status:** Need to test these were implemented correctly
- [ ] **Email Service Integration** - Test welcome emails, password reset, email verification
  - Check: `petflix/backend/src/services/email.ts`
  - Verify emails are actually being sent (not just console logs)
  - Test with real email service (SendGrid/AWS SES) or verify console fallback works
  
- [ ] **Video View Count Tracking** - Verify views are being tracked
  - Check: `petflix/backend/src/db/add-view-tracking.sql` (migration run?)
  - Test: View a video and check if `view_count` increments
  - Verify: `video_views` table is recording individual views
  
- [ ] **Trending Algorithm** - Verify trending videos endpoint works
  - Check: `GET /api/v1/videos/trending`
  - Test: Landing page should show trending videos
  - Verify: Algorithm calculates based on view velocity, likes, comments
  
- [ ] **Search History Tracking** - Verify search history is being saved
  - Check: `petflix/backend/src/db/add-search-history.sql` (migration run?)
  - Test: Perform searches and check `search_history` table
  - Verify: Personalization based on search history works
  
- [ ] **Playlist Video Reordering** - Verify drag & drop works
  - Check: `petflix/backend/src/db/add-playlist-video-order.sql` (migration run?)
  - Test: Reorder videos in a playlist
  - Verify: `PATCH /api/v1/playlists/:playlistId/videos/reorder` endpoint works

---

## 🔧 Medium Priority - Enhancements

### 2. Notification Improvements
- [ ] **Notification Suppression When Active**
  - Add Page Visibility API check before sending notifications
  - Don't send notifications if user is actively viewing the site
  - Location: `petflix/backend/src/services/push.ts`
  
- [ ] **Notification Grouping/Batching**
  - Group multiple video uploads from same user within 5 minutes
  - Summarize multiple comments on same video within timeframe
  - Location: `petflix/backend/src/services/push.ts`

### 3. User Experience Enhancements
- [ ] **Recently Viewed Page**
  - Create `/recently-viewed` page or section
  - Display videos user has viewed (from `video_views` table)
  - Show when offline using cached metadata
  - Location: `petflix/frontend/src/pages/RecentlyViewed.tsx` (new)

- [ ] **Search Result Pagination**
  - Verify pagination exists in search endpoint
  - Add "Load More" or page numbers if missing
  - Location: `petflix/backend/src/routes/videos.ts` (search endpoint)

- [ ] **Playlist Search/Discovery**
  - Add endpoint to search public playlists by name/tags
  - Add UI to search and discover playlists
  - Location: `petflix/backend/src/routes/playlists.ts` + frontend

### 4. Content Moderation
- [ ] **Profile Picture Content Moderation**
  - Add image size validation (max file size)
  - Add content type validation (only images)
  - Consider content moderation API (optional)
  - Location: `petflix/backend/src/routes/users.ts` (profile picture update)

---

## 🔒 Low Priority - Security & Monitoring

### 5. Security Hardening
- [ ] **HSTS Headers**
  - Add HTTP Strict Transport Security headers
  - Location: `petflix/backend/src/server.ts` (middleware)
  
- [ ] **HTTPS Enforcement**
  - Verify HTTPS redirect in production
  - Add redirect middleware if needed
  - Location: `petflix/backend/src/server.ts`

### 6. Admin Features
- [ ] **Admin Dashboard for Error Analysis**
  - Implement centralized logging (Winston/Pino)
  - Create admin dashboard page
  - Add error trend visualization
  - Add export functionality
  - Location: New admin dashboard page

- [ ] **Anomaly Detection**
  - Implement error rate monitoring
  - Add threshold configuration
  - Add alerting (email/webhook)
  - Location: New monitoring service

### 7. Advanced Features
- [ ] **Search Result Relevance Algorithm Configuration**
  - Create admin settings for relevance weights
  - Implement configurable scoring algorithm
  - Add admin UI for algorithm configuration
  - Location: Admin settings page

---

## 🧪 Testing & Verification

### 8. Test All Features
- [ ] Test video sharing (duplicate policy works correctly)
- [ ] Test video viewing (no 500 errors)
- [ ] Test search functionality
- [ ] Test playlist creation and management
- [ ] Test notifications (push notifications work)
- [ ] Test email flows (registration, password reset, email update)
- [ ] Test admin features (moderation queue)
- [ ] Test responsive design on different screen sizes
- [ ] Test dark/light mode
- [ ] Test offline functionality (PWA)

---

## 📝 Documentation Updates

### 9. Update Documentation
- [ ] Update `PRD_REMAINING_TASKS.md` with completed items
- [ ] Document any new features added
- [ ] Update setup guides if needed
- [ ] Create testing checklist document

---

## 🚀 Deployment Preparation

### 10. Production Readiness
- [ ] Set up production email service (SendGrid or AWS SES)
- [ ] Configure production environment variables
- [ ] Set up production database (Supabase production project)
- [ ] Configure HTTPS/SSL certificates
- [ ] Set up monitoring/logging for production
- [ ] Performance testing
- [ ] Security audit

---

## 📌 Quick Reference

### Important Files to Check:
- `petflix/backend/src/routes/videos.ts` - Video endpoints
- `petflix/backend/src/services/email.ts` - Email service
- `petflix/backend/src/services/push.ts` - Push notifications
- `petflix/backend/src/db/` - All SQL migrations
- `petflix/frontend/src/pages/` - Frontend pages

### Key Endpoints to Test:
- `GET /api/v1/videos/trending` - Trending videos
- `GET /api/v1/videos/search` - Search with history tracking
- `PATCH /api/v1/playlists/:id/videos/reorder` - Playlist reordering
- `POST /api/v1/auth/verify-email` - Email verification

### Migrations to Verify:
- `add-view-tracking.sql` - View count tracking
- `add-view-increment-function.sql` - View increment function
- `add-search-history.sql` - Search history
- `add-playlist-video-order.sql` - Playlist ordering
- `add-email-verification.sql` - Email verification tokens
- `allow-duplicate-videos-per-user.sql` - ✅ Just completed

---

## 🎯 Suggested Order of Work

1. **First:** Verify all high-priority features are working (Section 1)
2. **Second:** Fix any issues found during verification
3. **Third:** Implement medium-priority enhancements (Sections 2-4)
4. **Fourth:** Add low-priority features if time permits (Sections 5-7)
5. **Finally:** Testing and documentation (Sections 8-9)

---

**Last Updated:** Tuesday (after duplicate video migration)
**Next Session:** Wednesday

