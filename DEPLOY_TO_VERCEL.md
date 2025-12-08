# Quick Guide: Deploy Petflix to Vercel

## Prerequisites
- Code pushed to GitHub
- Choose one:
  - **Option A**: Deploy backend on Vercel (this guide)
  - **Option B**: Deploy backend on Railway/Render (see original guide)

## Step 1: Deploy Backend (Railway)

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repository
3. Settings:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
4. Add environment variables from `backend/.env`:
   - `JWT_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `YOUTUBE_API_KEY`
   - `CORS_ORIGIN` (set after frontend deploys)
   - `EMAIL_PROVIDER`, `RESEND_API_KEY` (or `SENDGRID_API_KEY`)
   - `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
5. Copy your backend URL (e.g., `https://petflix-backend.railway.app`)

## Step 2: Deploy Frontend to Vercel

### Via Dashboard (Easiest):

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to Vercel:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Project:**
   - **Root Directory**: `frontend` ⚠️ IMPORTANT
   - **Framework Preset**: Vite (auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)

4. **Add Environment Variable:**
   - Name: `VITE_API_URL`
   - Value: `https://your-backend-url.railway.app/api/v1`
   - Replace with your actual Railway backend URL

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Via CLI:

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to frontend
cd frontend

# Deploy (follow prompts)
vercel

# Add environment variable
vercel env add VITE_API_URL
# Enter: https://your-backend-url.railway.app/api/v1

# Deploy to production
vercel --prod
```

## Step 3: Update Backend CORS

After frontend deploys, update backend `CORS_ORIGIN`:
- Go to Railway/Render dashboard
- Update `CORS_ORIGIN` environment variable to: `https://your-project.vercel.app`
- Redeploy backend

## Step 4: Test

1. Visit your Vercel URL
2. Test login/register
3. Test video sharing
4. Test all features

## Troubleshooting

**Build fails:**
- Check Vercel build logs
- Ensure root directory is set to `frontend`
- Verify Node.js version (Vercel uses Node 18+)

**API calls fail:**
- Verify `VITE_API_URL` is correct
- Check backend CORS settings
- Ensure backend is running

**404 on routes:**
- `vercel.json` should handle SPA routing (already configured)

## Environment Variables Checklist

### Frontend (Vercel):
- ✅ `VITE_API_URL` - Backend API URL

### Backend (Railway/Render):
- ✅ `PORT` - Auto-set by platform
- ✅ `JWT_SECRET` - Your secret key
- ✅ `SUPABASE_URL` - Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
- ✅ `YOUTUBE_API_KEY` - YouTube API key
- ✅ `CORS_ORIGIN` - Frontend URL (after deployment)
- ✅ `EMAIL_PROVIDER` - `console`, `resend`, or `sendgrid`
- ✅ `RESEND_API_KEY` or `SENDGRID_API_KEY`
- ✅ `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed on Railway/Render
- [ ] Backend environment variables set
- [ ] Frontend deployed on Vercel
- [ ] `VITE_API_URL` set in Vercel
- [ ] `CORS_ORIGIN` updated in backend
- [ ] App tested and working

