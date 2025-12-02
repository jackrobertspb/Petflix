# Petflix Setup Guide

Complete setup instructions to get Petflix running locally.

---

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- YouTube Data API v3 key

---

## Quick Start (20 minutes)

### Step 1: Install Dependencies

Open two terminals for backend and frontend:

**Terminal 1 - Backend:**
```bash
cd backend
npm install
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm install
```

---

### Step 2: Environment Configuration

#### Backend Environment Variables

Create `backend/.env` with:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration  
JWT_SECRET=your-secure-random-jwt-secret-here
JWT_EXPIRES_IN=7d

# YouTube API Key (REQUIRED)
YOUTUBE_API_KEY=your-youtube-api-key-here

# Server Configuration
PORT=5001
NODE_ENV=development

# Frontend URL
FRONTEND_URL=http://localhost:5173

# Email Service (optional - defaults to console logging)
EMAIL_PROVIDER=console
# For production: sendgrid, resend, or ses
```

**Where to find credentials:**
- **Supabase:** Dashboard → Settings → API
  - Copy "Project URL" → `SUPABASE_URL`
  - Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`
- **YouTube API:** [Google Cloud Console](https://console.cloud.google.com/)
  - Enable YouTube Data API v3
  - Create API Key → `YOUTUBE_API_KEY`
  - See `docs/setup/youtube-api.md` for detailed instructions

#### Frontend Environment Variables

Create `frontend/.env` with:

```env
VITE_API_URL=http://localhost:5001/api/v1
```

---

### Step 3: Database Setup

Run SQL migrations in your Supabase dashboard:

1. Go to Supabase Dashboard → SQL Editor
2. Click "New Query"
3. Run these migrations **in order**:

#### Core Schema
```bash
backend/src/db/schema.sql
```

#### Required Migrations
Run each file in this order:
1. `add-account-locking.sql` - Account security
2. `add-password-reset.sql` - Password recovery
3. `add-email-verification.sql` - Email verification
4. `add-likes-tables.sql` - Video and comment likes
5. `add-admin-role.sql` - Admin users
6. `add-shareable-urls.sql` - Share tracking
7. `add-view-tracking.sql` - Video views
8. `add-view-increment-function.sql` - View counter
9. `add-search-history.sql` - Search tracking
10. `add-playlist-video-order.sql` - Playlist ordering
11. `add-relevance-weights.sql` - Search relevance
12. `add-notification-queue.sql` - Push notifications
13. `add-notifications-table.sql` - In-app notifications
14. `add-error-logs.sql` - Error logging
15. `add-anomaly-config.sql` - Monitoring

**How to run:**
- Open each `.sql` file
- Copy ALL contents
- Paste in Supabase SQL Editor
- Click "Run"
- Wait for success confirmation ✅

**Verify:** Go to Table Editor - you should see all tables created.

---

### Step 4: Start the Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Expected output: `Server running on port 5001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
Expected output: `Local: http://localhost:5173`

---

### Step 5: Create Admin User

#### Option A: Via Supabase SQL Editor
```sql
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

#### Option B: Register then promote
1. Register a new account at `http://localhost:5173`
2. Run the SQL above with that email

---

### Step 6: Verify Installation

Open browser to `http://localhost:5173`:

**Quick Tests:**
- ✅ Landing page loads
- ✅ Register new account works
- ✅ Login works  
- ✅ Search page loads
- ✅ No console errors

**Admin Tests:**
- ✅ Login as admin user
- ✅ Access admin endpoints
- ✅ Non-admin gets 403 on admin routes

---

## Troubleshooting

### "Cannot find module" errors
```bash
# Run in affected directory
npm install
```

### Connection refused / CORS errors
- Check backend is running on port 5001
- Verify `VITE_API_URL` matches backend port
- Ensure backend `.env` has correct `FRONTEND_URL`

### "Table doesn't exist" errors
- Run all SQL migrations in Supabase
- Check Table Editor to verify tables exist

### "Admin access required" error
- Assign admin role to your user (Step 5)

### Port already in use
```bash
# Windows: Kill all Node processes
taskkill /F /IM node.exe

# Then restart servers
```

---

## What's Next?

Once everything is running:
- 📚 See `docs/FEATURES.md` for implemented features
- 🧪 See `docs/TESTING.md` for testing guide
- 🚀 See `docs/setup/` for advanced configuration
  - Email setup
  - Push notifications  
  - PWA setup
  - Image moderation
  - HTTPS deployment

---

## Project Structure

```
petflix/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation, etc.
│   │   └── db/           # SQL migrations
│   └── .env              # Backend config
├── frontend/             # React app
│   ├── src/
│   │   ├── pages/        # Route components
│   │   ├── components/   # Reusable UI
│   │   ├── contexts/     # Global state
│   │   └── services/     # API client
│   └── .env              # Frontend config
└── docs/                 # Documentation
```

---

## Port Reference

| Service | Port | URL |
|---------|------|-----|
| Backend API | 5001 | http://localhost:5001 |
| Frontend | 5173 | http://localhost:5173 |

---

## Success Criteria

You're ready when:
- ✅ Backend running on port 5001
- ✅ Frontend running on port 5173
- ✅ Can register and login
- ✅ Videos load on search page
- ✅ No errors in browser console

**Happy coding! 🚀**

