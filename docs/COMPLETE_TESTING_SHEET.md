# Petflix Complete Testing Sheet
**Date:** November 24, 2025  
**Tester:** _______________  
**Environment:** ☐ Development  ☐ Production  
**Browser:** _______________  
**Device:** _______________

---

## Pre-Test Setup

### Prerequisites Checklist
- [ ] Backend running on port 5002
- [ ] Frontend running on port 5173 (or deployed URL)
- [ ] Database migrations run successfully
- [ ] YouTube API key configured
- [ ] At least 2 test accounts created for social features

### Test Accounts
**Account 1 (Primary):**
- Username: _______________
- Email: _______________
- Password: _______________

**Account 2 (For social testing):**
- Username: _______________
- Email: _______________
- Password: _______________

**Admin Account:**
- Username: _______________
- Email: _______________
- Is Admin: [ ] Yes

---

## Test Status Legend
- ✅ **PASS** - Feature works as expected
- ❌ **FAIL** - Feature broken or not working
- ⚠️ **PARTIAL** - Works but has issues
- ⏭️ **SKIP** - Not tested (note reason)

---

# 1. AUTHENTICATION & ONBOARDING

## 1.1 User Registration

**Test ID:** AUTH-001  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open app in incognito mode | Landing page loads | [ ] | |
| 2 | Click "Get Started" or "Register" | Registration form appears | [ ] | |
| 3 | Enter username: "test123" | Field accepts input | [ ] | |
| 4 | Enter email: "test@example.com" | Field accepts input | [ ] | |
| 5 | Enter password: "short" | Validation error shown | [ ] | |
| 6 | Enter password: "ValidPassword123!" | No error | [ ] | |
| 7 | Submit form | Registration successful | [ ] | |
| 8 | Check for welcome email | Email received (if configured) | [ ] | |
| 9 | Verify auto-login | Redirected to Feed page | [ ] | |
| 10 | Check localStorage | Token saved | [ ] | |
| 11 | Check navbar | Shows "Feed", "Profile", "Logout" | [ ] | |
| 12 | Check onboarding tutorial | Tutorial appears | [ ] | |

**Registration Validation Tests:**

| Test Case | Input | Expected | Status | Notes |
|-----------|-------|----------|--------|-------|
| Empty username | "" | Error: "Username required" | [ ] | |
| Short username | "ab" | Error: "Min 3 characters" | [ ] | |
| Duplicate username | (existing) | Error: "Username taken" | [ ] | |
| Invalid email | "notanemail" | Error: "Invalid email" | [ ] | |
| Duplicate email | (existing) | Error: "Registration failed" | [ ] | |
| Weak password | "12345" | Error: "Min 8 characters" | [ ] | |
| Valid inputs | Valid data | Success + auto-login | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 1.2 User Login

**Test ID:** AUTH-002  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Logout if logged in | Return to landing page | [ ] | |
| 2 | Click "Login" | Login form appears | [ ] | |
| 3 | Enter wrong password | Error message shown | [ ] | |
| 4 | Repeat wrong password 4 more times | Account locked message | [ ] | |
| 5 | Try correct password | "Account locked for 30 min" | [ ] | |
| 6 | Wait or use different account | - | [ ] | |
| 7 | Enter correct credentials | Login successful | [ ] | |
| 8 | Check redirect | Redirected to Feed | [ ] | |
| 9 | Check navbar | User-specific links shown | [ ] | |
| 10 | Refresh page | Still logged in (token valid) | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 1.3 Password Reset

**Test ID:** AUTH-003  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Logout | Return to landing | [ ] | |
| 2 | Click "Forgot Password" | Password reset form | [ ] | |
| 3 | Enter registered email | Success message | [ ] | |
| 4 | Check email | Reset email received | [ ] | |
| 5 | Click reset link | Reset password form | [ ] | |
| 6 | Enter new password | Password updated | [ ] | |
| 7 | Login with new password | Successful login | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 1.4 Email Verification

**Test ID:** AUTH-004  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Register new account | Verification email sent | [ ] | |
| 2 | Check email | Verification link received | [ ] | |
| 3 | Click verification link | Email verified message | [ ] | |
| 4 | Check user profile | Email verified status shown | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 1.5 Onboarding Tutorial

**Test ID:** AUTH-005  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Register new account | Tutorial modal appears | [ ] | |
| 2 | Check tutorial steps | Shows "Step 1 of 5" | [ ] | |
| 3 | Click "Next" | Progress to step 2 | [ ] | |
| 4 | Click "Previous" | Back to step 1 | [ ] | |
| 5 | Click "Skip" | Tutorial closes | [ ] | |
| 6 | Refresh page | Tutorial doesn't reappear | [ ] | |
| 7 | Complete all 5 steps | Tutorial completes | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 2. VIDEO FEATURES

## 2.1 Share Video

**Test ID:** VIDEO-001  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login as test user | Logged in successfully | [ ] | |
| 2 | Navigate to "Share Video" | Share form appears | [ ] | |
| 3 | Enter invalid URL: "notaurl" | Error: "Invalid YouTube URL" | [ ] | |
| 4 | Enter valid YouTube URL | URL accepted | [ ] | |
| 5 | Wait for metadata loading | Video title/thumbnail shown | [ ] | |
| 6 | Add custom title (optional) | Title field works | [ ] | |
| 7 | Add description (optional) | Description field works | [ ] | |
| 8 | Click "Share" | Success message | [ ] | |
| 9 | Check video appears in profile | Video listed | [ ] | |
| 10 | Try sharing same video again | Error: "Already shared" | [ ] | |

**Rate Limiting Test:**
| Step | Action | Expected | Status | Notes |
|------|--------|----------|--------|-------|
| 1 | Share 10 videos in 1 hour | All succeed | [ ] | |
| 2 | Try to share 11th video | Rate limit error | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 2.2 Search Videos (Petflix)

**Test ID:** VIDEO-002  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Search page | Search page loads | [ ] | |
| 2 | Check dropdown shows "🐾 Petflix" | Petflix mode active | [ ] | |
| 3 | Leave search empty, click Search | Browse all videos | [ ] | |
| 4 | Enter search term: "dog" | Results appear | [ ] | |
| 5 | Change sort to "Most Recent" | Results reorder | [ ] | |
| 6 | Change sort to "View Count" | Results reorder | [ ] | |
| 7 | Change sort to "Engagement" | Results reorder | [ ] | |
| 8 | Select category: "🐱 Cats" | Results filtered | [ ] | |
| 9 | Click "Clear Filters" | Filters reset | [ ] | |
| 10 | Click on a video | Video detail page opens | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 2.3 Search Videos (YouTube)

**Test ID:** VIDEO-003  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Search page | Search page loads | [ ] | |
| 2 | Click dropdown, select "▶️ YouTube" | YouTube mode active | [ ] | |
| 3 | Check sort/filter controls | Hidden (YouTube mode) | [ ] | |
| 4 | Leave search empty | No results (query required) | [ ] | |
| 5 | Search for "cute" | Pet videos appear | [ ] | |
| 6 | Search for "funny" | Pet videos appear | [ ] | |
| 7 | Verify all results are pet-related | All pet content | [ ] | |
| 8 | Check video cards have "YouTube" badge | Red badge visible | [ ] | |
| 9 | Click on a video | Opens YouTube in new tab | [ ] | |
| 10 | Check backend console | No notification spam | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 2.4 Video Detail Page

**Test ID:** VIDEO-004  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Click on a Petflix video | Detail page loads | [ ] | |
| 2 | Check YouTube player | Embedded player works | [ ] | |
| 3 | Check video title | Correct title shown | [ ] | |
| 4 | Check video description | Description shown | [ ] | |
| 5 | Check uploader info | Username shown | [ ] | |
| 6 | Check view count | View count displayed | [ ] | |
| 7 | Check like count | Like count displayed | [ ] | |
| 8 | Check comments section | Comments loaded | [ ] | |
| 9 | Play video | Video plays correctly | [ ] | |
| 10 | Check share button | Share modal opens | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 2.5 Edit Video

**Test ID:** VIDEO-005  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to own video detail page | Edit button visible | [ ] | |
| 2 | Click "Edit" | Edit form appears | [ ] | |
| 3 | Change title | New title saved | [ ] | |
| 4 | Change description | New description saved | [ ] | |
| 5 | Try editing another user's video | No edit button / 403 error | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 2.6 Delete Video

**Test ID:** VIDEO-006  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to own video detail page | Delete button visible | [ ] | |
| 2 | Click "Delete" | Confirmation dialog | [ ] | |
| 3 | Confirm deletion | Video deleted | [ ] | |
| 4 | Check profile | Video no longer listed | [ ] | |
| 5 | Try accessing deleted video | 404 error | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 2.7 Like/Unlike Video

**Test ID:** VIDEO-007  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to video detail page | Like button visible | [ ] | |
| 2 | Click like button | Button becomes "liked" | [ ] | |
| 3 | Check like count | Count increases by 1 | [ ] | |
| 4 | Click like button again | Unlike (toggle off) | [ ] | |
| 5 | Check like count | Count decreases by 1 | [ ] | |
| 6 | Refresh page | Like status persists | [ ] | |
| 7 | Check as different user | Can like independently | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 2.8 View Tracking

**Test ID:** VIDEO-008  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Note initial view count | Count = N | [ ] | |
| 2 | Watch video for a few seconds | View count increases | [ ] | |
| 3 | Refresh and watch again | View count doesn't double | [ ] | |
| 4 | Check as different user | View count increases | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 3. COMMENT FEATURES

## 3.1 Create Comment

**Test ID:** COMMENT-001  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to video detail page | Comment form visible | [ ] | |
| 2 | Try empty comment | Error or disabled submit | [ ] | |
| 3 | Enter comment (>280 chars) | Error: "Max 280 characters" | [ ] | |
| 4 | Enter valid comment | Comment posted | [ ] | |
| 5 | Check comment appears | Comment in list | [ ] | |
| 6 | Check comment author | Your username shown | [ ] | |
| 7 | Check timestamp | Time shown (e.g., "2m ago") | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 3.2 Reply to Comment

**Test ID:** COMMENT-002  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Find existing comment | Comment visible | [ ] | |
| 2 | Click "Reply" | Reply form appears | [ ] | |
| 3 | Enter reply text | Text accepted | [ ] | |
| 4 | Submit reply | Reply posted | [ ] | |
| 5 | Check reply appears nested | Indented under parent | [ ] | |
| 6 | Check reply shows "@username" | Mention visible | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 3.3 Edit Comment

**Test ID:** COMMENT-003  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Find your own comment | Edit button visible | [ ] | |
| 2 | Click "Edit" | Edit form appears | [ ] | |
| 3 | Change text | New text saved | [ ] | |
| 4 | Check timestamp | Shows "edited" indicator | [ ] | |
| 5 | Try editing others' comments | No edit button | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 3.4 Delete Comment

**Test ID:** COMMENT-004  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Find your own comment | Delete button visible | [ ] | |
| 2 | Click "Delete" | Confirmation dialog | [ ] | |
| 3 | Confirm deletion | Comment removed | [ ] | |
| 4 | Check replies | Replies also removed | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 3.5 Like/Unlike Comment

**Test ID:** COMMENT-005  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Find a comment | Like button visible | [ ] | |
| 2 | Click like | Button becomes "liked" | [ ] | |
| 3 | Check like count | Count increases | [ ] | |
| 4 | Click again | Unlike (toggle) | [ ] | |
| 5 | Check like count | Count decreases | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 4. SOCIAL FEATURES

## 4.1 Follow/Unfollow User

**Test ID:** SOCIAL-001  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login as Account 1 | Logged in | [ ] | |
| 2 | Visit Account 2's profile | Profile page loads | [ ] | |
| 3 | Check follow button | "Follow" button visible | [ ] | |
| 4 | Click "Follow" | Button changes to "Following" | [ ] | |
| 5 | Check follower count | Count increases | [ ] | |
| 6 | Click "Following" | Unfollows (button back to "Follow") | [ ] | |
| 7 | Check follower count | Count decreases | [ ] | |
| 8 | Try following yourself | No follow button on own profile | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 4.2 Personalized Feed

**Test ID:** SOCIAL-002  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login as Account 1 | Logged in | [ ] | |
| 2 | Follow Account 2 | Following confirmed | [ ] | |
| 3 | Login as Account 2 | Logged in | [ ] | |
| 4 | Share a video | Video shared | [ ] | |
| 5 | Login back as Account 1 | Logged in | [ ] | |
| 6 | Navigate to Feed | Feed page loads | [ ] | |
| 7 | Check for Account 2's video | Video appears in feed | [ ] | |
| 8 | Unfollow Account 2 | Unfollowed | [ ] | |
| 9 | Refresh feed | Account 2's videos gone | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 4.3 User Profile

**Test ID:** SOCIAL-003  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Visit a user profile | Profile loads | [ ] | |
| 2 | Check profile picture | Picture displayed | [ ] | |
| 3 | Check bio | Bio text shown | [ ] | |
| 4 | Check follower count | Count displayed | [ ] | |
| 5 | Check following count | Count displayed | [ ] | |
| 6 | Check "Videos" tab | User's videos listed | [ ] | |
| 7 | Check "Playlists" tab | User's playlists listed | [ ] | |
| 8 | Click on a video | Video detail opens | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 4.4 Follower/Following Lists

**Test ID:** SOCIAL-004  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to profile page | Profile loads | [ ] | |
| 2 | Click follower count | Follower list opens | [ ] | |
| 3 | Check follower list | Followers shown with usernames | [ ] | |
| 4 | Click following count | Following list opens | [ ] | |
| 5 | Check following list | Following users shown | [ ] | |
| 6 | Click on a user | Navigate to their profile | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 5. PLAYLIST FEATURES

## 5.1 Create Playlist

**Test ID:** PLAYLIST-001  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Navigate to Playlists page | Playlists page loads | [ ] | |
| 2 | Click "Create Playlist" | Create form appears | [ ] | |
| 3 | Enter playlist name: "My Favorites" | Name accepted | [ ] | |
| 4 | Enter description (optional) | Description accepted | [ ] | |
| 5 | Select visibility: "Public" | Public selected | [ ] | |
| 6 | Click "Create" | Playlist created | [ ] | |
| 7 | Check playlist appears in list | Playlist visible | [ ] | |
| 8 | Try creating duplicate name | Error: "Already exists" | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 5.2 Add Videos to Playlist

**Test ID:** PLAYLIST-002  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to video detail page | Page loads | [ ] | |
| 2 | Click "Add to Playlist" | Playlist selection appears | [ ] | |
| 3 | Select a playlist | Video added | [ ] | |
| 4 | Check success message | "Added to playlist" shown | [ ] | |
| 5 | Go to playlist detail | Video appears in playlist | [ ] | |
| 6 | Try adding same video again | Error or already added message | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 5.3 Reorder Playlist Videos

**Test ID:** PLAYLIST-003  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to playlist with 3+ videos | Playlist loads | [ ] | |
| 2 | Check video order | Videos in order | [ ] | |
| 3 | Drag video to new position | Order changes | [ ] | |
| 4 | Refresh page | New order persists | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 5.4 Playlist Tags

**Test ID:** PLAYLIST-004  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to playlist detail | Playlist loads | [ ] | |
| 2 | Click "Add Tag" on a video | Tag input appears | [ ] | |
| 3 | Enter tag: "funny" | Tag added | [ ] | |
| 4 | Add another tag: "cute" | Tag added | [ ] | |
| 5 | Filter by tag: "funny" | Only tagged videos shown | [ ] | |
| 6 | Remove filter | All videos shown | [ ] | |
| 7 | Delete a tag | Tag removed | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 5.5 Edit/Delete Playlist

**Test ID:** PLAYLIST-005  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to own playlist | Playlist loads | [ ] | |
| 2 | Click "Edit" | Edit form appears | [ ] | |
| 3 | Change name | Name updated | [ ] | |
| 4 | Change description | Description updated | [ ] | |
| 5 | Change visibility to "Private" | Visibility updated | [ ] | |
| 6 | Click "Delete" | Confirmation dialog | [ ] | |
| 7 | Confirm deletion | Playlist deleted | [ ] | |
| 8 | Check playlists list | Playlist no longer there | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 6. SETTINGS & PROFILE

## 6.1 Update Profile Picture

**Test ID:** SETTINGS-001  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to Settings page | Settings loads | [ ] | |
| 2 | Click "Upload Profile Picture" | File picker opens | [ ] | |
| 3 | Select a JPEG image (<5MB) | Image uploads | [ ] | |
| 4 | Check preview | New picture shown | [ ] | |
| 5 | Check profile page | Picture updated | [ ] | |
| 6 | Try uploading 10MB file | Error: "File too large" | [ ] | |
| 7 | Try uploading PDF | Error: "Invalid file type" | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 6.2 Update Bio

**Test ID:** SETTINGS-002  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to Settings page | Settings loads | [ ] | |
| 2 | Find bio field | Bio textarea visible | [ ] | |
| 3 | Enter bio text | Text accepted | [ ] | |
| 4 | Click "Save" | Bio saved | [ ] | |
| 5 | Go to profile page | Bio displayed | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 6.3 Change Email

**Test ID:** SETTINGS-003  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to Settings page | Settings loads | [ ] | |
| 2 | Click "Change Email" | Email change form appears | [ ] | |
| 3 | Enter new email | Email accepted | [ ] | |
| 4 | Click "Update" | Email updated | [ ] | |
| 5 | Try changing again immediately | Error: "Wait 24 hours" | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 6.4 Change Password

**Test ID:** SETTINGS-004  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to Settings page | Settings loads | [ ] | |
| 2 | Click "Change Password" | Password form appears | [ ] | |
| 3 | Enter wrong current password | Error: "Incorrect password" | [ ] | |
| 4 | Enter correct current password | Accepted | [ ] | |
| 5 | Enter new password | New password accepted | [ ] | |
| 6 | Confirm new password | Password updated | [ ] | |
| 7 | Logout and login with new password | Successful login | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 6.5 Delete Account

**Test ID:** SETTINGS-005  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to Settings page | Settings loads | [ ] | |
| 2 | Scroll to "Danger Zone" | Delete button visible | [ ] | |
| 3 | Click "Delete Account" | Confirmation dialog (warning) | [ ] | |
| 4 | Confirm deletion | Account deleted | [ ] | |
| 5 | Redirected to landing | Logged out | [ ] | |
| 6 | Try logging in with deleted account | Error: "Invalid credentials" | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 7. NOTIFICATIONS

## 7.1 Push Notification Subscription

**Test ID:** NOTIF-001  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to Settings page | Settings loads | [ ] | |
| 2 | Find "Enable Notifications" toggle | Toggle visible | [ ] | |
| 3 | Click toggle | Browser permission prompt | [ ] | |
| 4 | Allow notifications | Subscription successful | [ ] | |
| 5 | Check toggle state | Shows "Enabled" | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 7.2 In-App Notification Bell

**Test ID:** NOTIF-002  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login as Account 1 | Logged in | [ ] | |
| 2 | Check notification bell (navbar) | Bell icon visible | [ ] | |
| 3 | Check unread count badge | Shows count or nothing | [ ] | |
| 4 | Login as Account 2 | Logged in | [ ] | |
| 5 | Like Account 1's video | Like registered | [ ] | |
| 6 | Login back as Account 1 | Logged in | [ ] | |
| 7 | Check bell badge | Shows "1" (or grouped count) | [ ] | |
| 8 | Click bell icon | Notification dropdown opens | [ ] | |
| 9 | Check notification content | Shows who liked what | [ ] | |
| 10 | Click notification | Navigates to video | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 7.3 Mark Notification as Read

**Test ID:** NOTIF-003  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open notification dropdown | Dropdown visible | [ ] | |
| 2 | Find unread notification | Bold/highlighted | [ ] | |
| 3 | Click "Mark as Read" | Notification marked read | [ ] | |
| 4 | Check badge count | Count decreases | [ ] | |
| 5 | Refresh page | Read status persists | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 7.4 Delete Notification

**Test ID:** NOTIF-004  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open notification dropdown | Dropdown visible | [ ] | |
| 2 | Find a notification | Notification visible | [ ] | |
| 3 | Click "Delete" or X icon | Notification removed | [ ] | |
| 4 | Refresh page | Still gone | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 7.5 Notification Grouping

**Test ID:** NOTIF-005  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Have Account 2 & 3 | Both active | [ ] | |
| 2 | Both like same video quickly | 2 likes registered | [ ] | |
| 3 | Login as video owner | Logged in | [ ] | |
| 4 | Wait 5+ minutes | Notification grouping window | [ ] | |
| 5 | Check notification bell | Grouped notification | [ ] | |
| 6 | Open dropdown | Shows "2 people liked your video" | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 8. ADMIN FEATURES

## 8.1 Admin Access

**Test ID:** ADMIN-001  
**Priority:** 🔴 CRITICAL (if admin exists)

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login as admin user | Logged in | [ ] | |
| 2 | Check navbar | "Admin" link visible | [ ] | |
| 3 | Login as regular user | Logged in | [ ] | |
| 4 | Check navbar | No "Admin" link | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 8.2 View Reports

**Test ID:** ADMIN-002  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Create a video report (as regular user) | Report submitted | [ ] | |
| 2 | Login as admin | Logged in | [ ] | |
| 3 | Navigate to Admin Reports | Reports page loads | [ ] | |
| 4 | Check report appears | Report listed with status "pending" | [ ] | |
| 5 | Filter by status: "Pending" | Only pending shown | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 8.3 Error Log Dashboard

**Test ID:** ADMIN-003  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login as admin | Logged in | [ ] | |
| 2 | Go to Admin Error Dashboard | Dashboard loads | [ ] | |
| 3 | Check error logs listed | Errors shown (if any) | [ ] | |
| 4 | Filter by level: "error" | Only errors shown | [ ] | |
| 5 | Filter by date range | Filtered results | [ ] | |
| 6 | Click "Export" | CSV download | [ ] | |
| 7 | Delete an error log | Log removed | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 8.4 Configure Search Weights

**Test ID:** ADMIN-004  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login as admin | Logged in | [ ] | |
| 2 | Go to Admin Settings | Settings page loads | [ ] | |
| 3 | Check relevance weight sliders | Sliders visible | [ ] | |
| 4 | Adjust title weight | Slider moves | [ ] | |
| 5 | Click "Save" | Weights saved | [ ] | |
| 6 | Test search | Results reflect new weights | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 9. PWA FEATURES

## 9.1 Install PWA

**Test ID:** PWA-001  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open app in Chrome/Edge | App loads | [ ] | |
| 2 | Check for install prompt | Browser shows install button | [ ] | |
| 3 | Click install | PWA install dialog | [ ] | |
| 4 | Confirm install | App installed | [ ] | |
| 5 | Check desktop/home screen | App icon appears | [ ] | |
| 6 | Open installed app | Opens standalone window | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 9.2 Offline Support

**Test ID:** PWA-002  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open app and browse videos | Videos loaded | [ ] | |
| 2 | Turn off internet | Offline | [ ] | |
| 3 | Navigate to previously viewed video | Metadata shown from cache | [ ] | |
| 4 | Try viewing new content | Error or offline message | [ ] | |
| 5 | Turn internet back on | App reconnects | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 9.3 Pull to Refresh

**Test ID:** PWA-003  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open Feed or Search page | Page loads | [ ] | |
| 2 | Pull down from top of page | Refresh indicator appears | [ ] | |
| 3 | Release | Page refreshes content | [ ] | |
| 4 | Check for updated content | New content loaded | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 9.4 TV Casting (if device supports)

**Test ID:** PWA-004  
**Priority:** 🔵 LOW

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Open video detail page | Video loads | [ ] | |
| 2 | Check for cast button | Cast icon visible (if supported) | [ ] | |
| 3 | Click cast button | Cast device list appears | [ ] | |
| 4 | Select device | Video starts casting | [ ] | |
| 5 | Control from phone | Controls work | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL  [ ] SKIP (no device)

---

# 10. UI/UX FEATURES

## 10.1 Dark Mode

**Test ID:** UI-001  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Check navbar | Theme toggle visible | [ ] | |
| 2 | Click theme toggle | Switches to dark/light mode | [ ] | |
| 3 | Check colors | Proper color scheme applied | [ ] | |
| 4 | Refresh page | Theme preference persists | [ ] | |
| 5 | Test on all pages | Consistent theming | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 10.2 Responsive Design

**Test ID:** UI-002  
**Priority:** 🟡 HIGH

| Test | Device | Status | Notes |
|------|--------|--------|-------|
| Desktop (1920x1080) | Layout works | [ ] | |
| Laptop (1366x768) | Layout adapts | [ ] | |
| Tablet (768x1024) | Mobile-friendly | [ ] | |
| Mobile (375x667) | Touch-optimized | [ ] | |
| Mobile landscape | Usable | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 10.3 Search Dropdown UI

**Test ID:** UI-003  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Go to Search page | Page loads | [ ] | |
| 2 | Check dropdown in search bar | Dropdown visible left side | [ ] | |
| 3 | Click dropdown | Menu opens with 2 options | [ ] | |
| 4 | Check options | "🐾 Petflix" and "▶️ YouTube" | [ ] | |
| 5 | Check arrow icon | Rotates when open | [ ] | |
| 6 | Select option | Dropdown closes | [ ] | |
| 7 | Click outside | Dropdown closes | [ ] | |
| 8 | Check visual design | Clean, not cramped | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 10.4 Error Handling

**Test ID:** UI-004  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Try accessing invalid URL | 404 page or redirect | [ ] | |
| 2 | Submit invalid form data | Clear error messages | [ ] | |
| 3 | Lose internet connection | Offline indicator | [ ] | |
| 4 | Trigger React error | Error boundary catches it | [ ] | |
| 5 | API returns 500 error | User-friendly error message | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 11. SECURITY TESTING

## 11.1 Authentication Security

**Test ID:** SEC-001  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Try accessing /feed without login | Redirect to login | [ ] | |
| 2 | Try accessing /settings without login | Redirect to login | [ ] | |
| 3 | Copy JWT token | Token obtained | [ ] | |
| 4 | Logout | Token cleared | [ ] | |
| 5 | Try using old token | 401 Unauthorized | [ ] | |
| 6 | Trigger 5 failed login attempts | Account locked for 30 min | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 11.2 Authorization Security

**Test ID:** SEC-002  
**Priority:** 🔴 CRITICAL

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Login as Account 1 | Logged in | [ ] | |
| 2 | Get Account 2's video ID | ID obtained | [ ] | |
| 3 | Try editing Account 2's video | 403 Forbidden | [ ] | |
| 4 | Try deleting Account 2's video | 403 Forbidden | [ ] | |
| 5 | Try deleting Account 2's comment | 403 Forbidden | [ ] | |
| 6 | Try accessing admin endpoints (non-admin) | 403 Forbidden | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 11.3 Input Validation

**Test ID:** SEC-003  
**Priority:** 🔴 CRITICAL

| Test | Input | Expected | Status | Notes |
|------|-------|----------|--------|-------|
| XSS attempt | `<script>alert('xss')</script>` | Escaped/sanitized | [ ] | |
| SQL injection | `' OR '1'='1` | Rejected/escaped | [ ] | |
| Very long string | 10,000 character text | Rejected (length limit) | [ ] | |
| Special characters | `!@#$%^&*()` | Handled properly | [ ] | |
| Emoji | `😀🐶🐱` | Accepted and displayed | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 11.4 Rate Limiting

**Test ID:** SEC-004  
**Priority:** 🟡 HIGH

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Make 100 API requests quickly | All succeed | [ ] | |
| 2 | Make 101st request | Rate limit error | [ ] | |
| 3 | Wait 15 minutes | Rate limit resets | [ ] | |
| 4 | Share 10 videos in 1 hour | All succeed | [ ] | |
| 5 | Try to share 11th video | Upload rate limit error | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 11.5 HTTPS & Security Headers

**Test ID:** SEC-005  
**Priority:** 🔴 CRITICAL (Production only)

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Visit site via HTTP | Redirect to HTTPS | [ ] | |
| 2 | Check browser dev tools | HTTPS padlock shown | [ ] | |
| 3 | Check response headers | HSTS header present | [ ] | |
| 4 | Check headers | X-Frame-Options: DENY | [ ] | |
| 5 | Check headers | X-Content-Type-Options: nosniff | [ ] | |
| 6 | Check headers | Content-Security-Policy present | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 12. PERFORMANCE TESTING

## 12.1 Page Load Times

**Test ID:** PERF-001  
**Priority:** 🟢 MEDIUM

| Page | Load Time | Target | Status | Notes |
|------|-----------|--------|--------|-------|
| Landing | ___s | <2s | [ ] | |
| Feed | ___s | <3s | [ ] | |
| Search | ___s | <2s | [ ] | |
| Video Detail | ___s | <3s | [ ] | |
| Profile | ___s | <2s | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

## 12.2 Search Performance

**Test ID:** PERF-002  
**Priority:** 🟢 MEDIUM

| Step | Action | Expected Result | Status | Notes |
|------|--------|----------------|--------|-------|
| 1 | Search with common term | Results <2s | [ ] | |
| 2 | Search with rare term | Results <2s | [ ] | |
| 3 | Search with filters | Results <3s | [ ] | |
| 4 | YouTube search | Results <3s | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# 13. CROSS-BROWSER TESTING

## 13.1 Browser Compatibility

**Test ID:** BROWSER-001  
**Priority:** 🟡 HIGH

| Browser | Version | Core Features | UI/UX | Status | Notes |
|---------|---------|---------------|-------|--------|-------|
| Chrome | Latest | [ ] | [ ] | [ ] | |
| Firefox | Latest | [ ] | [ ] | [ ] | |
| Safari | Latest | [ ] | [ ] | [ ] | |
| Edge | Latest | [ ] | [ ] | [ ] | |
| Mobile Safari | Latest | [ ] | [ ] | [ ] | |
| Chrome Android | Latest | [ ] | [ ] | [ ] | |

**Overall Result:** [ ] PASS  [ ] FAIL  [ ] PARTIAL

---

# FINAL SUMMARY

## Critical Issues Found
**Count:** ___  

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |
| | | | |
| | | | |

---

## High Priority Issues
**Count:** ___

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |
| | | | |

---

## Medium/Low Priority Issues
**Count:** ___

| Issue ID | Description | Severity | Status |
|----------|-------------|----------|--------|
| | | | |
| | | | |

---

## Test Statistics

**Total Tests:** 100+  
**Tests Executed:** ___  
**Tests Passed:** ___  
**Tests Failed:** ___  
**Tests Skipped:** ___  
**Pass Rate:** ___%  

---

## Recommendation

[ ] **APPROVED FOR PRODUCTION** - All critical and high-priority tests passed  
[ ] **APPROVED WITH MINOR FIXES** - Fix medium issues before launch  
[ ] **NOT APPROVED** - Critical issues must be resolved  

---

## Sign-Off

**Tester:** _______________  
**Date:** _______________  
**Signature:** _______________

---

**END OF TESTING SHEET**

