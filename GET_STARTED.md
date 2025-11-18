# 🚀 Get Started - Action Plan

Follow these steps in order to get Petflix running:

## Step 1: Install Dependencies (5 minutes)

### Backend
```bash
cd petflix/backend
npm install
```

### Frontend (new terminal)
```bash
cd petflix/frontend
npm install
```

---

## Step 2: Set Up Environment Variables (5 minutes)

### Backend - Create `petflix/backend/.env`
```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# JWT Configuration
JWT_SECRET=your-secure-random-jwt-secret-here
JWT_EXPIRES_IN=7d

# YouTube API Key (REQUIRED for sharing videos)
# Get from: Google Cloud Console → Enable YouTube Data API v3 → Create API Key
YOUTUBE_API_KEY=your-youtube-api-key-here

# Server Configuration
PORT=5001
NODE_ENV=development

# Frontend URL (for share redirects)
FRONTEND_URL=http://localhost:5173

# Email Service (optional - defaults to console logging)
EMAIL_PROVIDER=console
# For production, use: sendgrid or ses
```

### Frontend - Create `petflix/frontend/.env`
```env
VITE_API_URL=http://localhost:5001/api/v1
```

**Where to find credentials:**
- **Supabase:** Go to your Supabase project dashboard → Settings → API
  - Copy "Project URL" → `SUPABASE_URL`
  - Copy "service_role" key → `SUPABASE_SERVICE_ROLE_KEY`
- **YouTube API Key:** Go to [Google Cloud Console](https://console.cloud.google.com/)
  - Create/select a project
  - Enable **YouTube Data API v3**
  - Create credentials → API Key
  - Copy the key → `YOUTUBE_API_KEY`

---

## Step 3: Run SQL Migrations in Supabase (10 minutes)

Go to your Supabase dashboard → SQL Editor and run these in order:

### 1. Account Locking
Open `petflix/backend/src/db/add-account-locking.sql` and copy/paste into Supabase SQL Editor, then run.

### 2. Password Reset
Open `petflix/backend/src/db/add-password-reset.sql` and copy/paste into Supabase SQL Editor, then run.

### 3. Likes Tables
Open `petflix/backend/src/db/add-likes-tables.sql` and copy/paste into Supabase SQL Editor, then run.

### 4. Admin Role
Open `petflix/backend/src/db/add-admin-role.sql` and copy/paste into Supabase SQL Editor, then run.

### 5. Shareable URLs
Open `petflix/backend/src/db/add-shareable-urls.sql` and copy/paste into Supabase SQL Editor, then run.

**✅ Verify:** Check Supabase Table Editor - you should see new tables and columns.

---

## Step 4: Start the Servers (2 minutes)

### Terminal 1 - Backend
```bash
cd petflix/backend
npm run dev
```
Should see: `Server running on port 5001` (or your PORT)

### Terminal 2 - Frontend
```bash
cd petflix/frontend
npm run dev
```
Should see: `Local: http://localhost:5173`

---

## Step 5: Assign Admin User (2 minutes)

### Option A: Via Supabase SQL Editor (Easiest)
```sql
UPDATE users 
SET is_admin = TRUE 
WHERE email = 'your-email@example.com';
```

### Option B: Create a new admin user
1. Register a new account via the frontend
2. Then run the SQL above with that email

---

## Step 6: Test Everything (10 minutes)

### Quick Tests:
1. ✅ Open `http://localhost:5173` - Should see landing page
2. ✅ Register a new account - Should work
3. ✅ Login - Should work
4. ✅ Go to Search page - Should load
5. ✅ Click Share on a video - Share modal should open
6. ✅ Check browser console - No errors

### Admin Tests:
1. ✅ Login as admin user
2. ✅ Try to access `/api/v1/reports` - Should work (if you have reports)
3. ✅ Non-admin users should get 403 on reports endpoint

---

## 🎉 You're Done!

If everything works:
- ✅ Backend running on port 5001
- ✅ Frontend running on port 5173
- ✅ Can register/login
- ✅ No console errors

**Next:** See `docs/NEXT_STEPS.md` for detailed testing checklist and feature verification.

---

## ❓ Troubleshooting

### "Cannot find module" errors
→ Run `npm install` again in the affected folder

### "Connection refused" or CORS errors
→ Check that backend is running on port 5001
→ Check `VITE_API_URL` in frontend `.env` matches backend port

### "Table doesn't exist" errors
→ Run SQL migrations in Supabase (Step 3)

### "Admin access required" error
→ Assign admin role to your user (Step 5)

### Port already in use
→ Change `PORT` in backend `.env` or kill the process using that port

---

**Ready? Start with Step 1! 🚀**

