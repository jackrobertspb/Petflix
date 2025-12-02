# Deploy Both Frontend and Backend to Vercel

This guide shows you how to deploy both the frontend and backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)

## Deployment Strategy

You'll deploy the frontend and backend as **separate Vercel projects**:

1. **Backend Project**: Handles all API routes (`/api/v1/*`)
2. **Frontend Project**: Serves the React app

## Step 1: Deploy Backend to Vercel

### Option A: Via Vercel Dashboard (Recommended)

1. **Push your code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Go to Vercel Dashboard:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your GitHub repository

3. **Configure Backend Project:**
   - **Project Name**: `petflix-backend` (or your choice)
   - **Root Directory**: `backend` ⚠️ IMPORTANT
   - **Framework Preset**: Other (or leave blank)
   - **Build Command**: `npm install && npm run build`
   - **Output Directory**: Leave empty (not used for API)
   - **Install Command**: `npm install`

4. **Add Environment Variables:**
   Go to Settings → Environment Variables and add:
   ```
   JWT_SECRET=your-jwt-secret-key
   SUPABASE_URL=your-supabase-url
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   YOUTUBE_API_KEY=your-youtube-api-key
   CORS_ORIGIN=https://your-frontend.vercel.app (set after frontend deploys)
   EMAIL_PROVIDER=console (or resend/sendgrid)
   RESEND_API_KEY=your-resend-key (if using Resend)
   SENDGRID_API_KEY=your-sendgrid-key (if using SendGrid)
   VAPID_PUBLIC_KEY=your-vapid-public-key
   VAPID_PRIVATE_KEY=your-vapid-private-key
   VAPID_SUBJECT=your-email@example.com
   NODE_ENV=production
   ```

5. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Copy your backend URL (e.g., `https://petflix-backend.vercel.app`)

### Option B: Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Navigate to backend directory
cd backend

# Deploy (follow prompts)
vercel

# Set root directory when prompted: backend
# Add environment variables when prompted

# Deploy to production
vercel --prod
```

## Step 2: Deploy Frontend to Vercel

1. **Go to Vercel Dashboard:**
   - Visit [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select the **same** GitHub repository

2. **Configure Frontend Project:**
   - **Project Name**: `petflix-frontend` (or your choice)
   - **Root Directory**: `frontend` ⚠️ IMPORTANT
   - **Framework Preset**: Vite (should auto-detect)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

3. **Add Environment Variable:**
   ```
   VITE_API_URL=https://petflix-backend.vercel.app/api/v1
   ```
   Replace `petflix-backend.vercel.app` with your actual backend URL from Step 1.

4. **Deploy:**
   - Click "Deploy"
   - Wait for build to complete
   - Copy your frontend URL (e.g., `https://petflix-frontend.vercel.app`)

## Step 3: Update Backend CORS

After frontend deploys, update backend CORS:

1. Go to your **backend project** in Vercel Dashboard
2. Settings → Environment Variables
3. Update `CORS_ORIGIN` to your frontend URL:
   ```
   CORS_ORIGIN=https://petflix-frontend.vercel.app
   ```
4. Redeploy backend (or wait for auto-deploy)

## Step 4: Test Deployment

1. Visit your frontend URL
2. Test login/register
3. Test video sharing
4. Test all major features

## Important Notes

### Backend on Vercel (Serverless Functions)

- ✅ **Works**: All API routes, Express.js middleware, database queries
- ⚠️ **Limitations**:
  - Background processes (like notification processor) won't run continuously
  - File system writes are limited (logs won't persist)
  - Cold starts may occur (first request after inactivity is slower)
  - Function timeout: 30 seconds (configurable up to 60s on Pro plan)

### Notification Processor

The notification processor (`startNotificationProcessor()`) won't run in serverless. You have options:

1. **Use Vercel Cron Jobs** (Pro plan): Schedule periodic functions
2. **Use external cron service**: Call an endpoint periodically
3. **Process notifications on-demand**: Trigger processing when needed

## Environment Variables Checklist

### Backend (Vercel):
- ✅ `JWT_SECRET` - Your JWT secret key
- ✅ `SUPABASE_URL` - Supabase project URL
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Supabase service key
- ✅ `YOUTUBE_API_KEY` - YouTube API key
- ✅ `CORS_ORIGIN` - Frontend URL (after deployment)
- ✅ `EMAIL_PROVIDER` - `console`, `resend`, or `sendgrid`
- ✅ `RESEND_API_KEY` or `SENDGRID_API_KEY`
- ✅ `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`
- ✅ `NODE_ENV` - Set to `production`

### Frontend (Vercel):
- ✅ `VITE_API_URL` - Backend API URL

## Troubleshooting

### Backend Build Fails
- Ensure root directory is set to `backend`
- Check build logs in Vercel dashboard
- Verify TypeScript compiles: `cd backend && npm run build`

### Backend Routes Return 404
- Verify `vercel.json` exists in `backend/` directory
- Check that `api/index.js` is built correctly
- Ensure routes start with `/api/v1/`

### CORS Errors
- Verify `CORS_ORIGIN` includes your frontend URL
- Check backend environment variables are set correctly
- Ensure backend is redeployed after changing CORS_ORIGIN

### Frontend Can't Connect to Backend
- Verify `VITE_API_URL` is correct
- Check backend is deployed and accessible
- Test backend health endpoint: `https://your-backend.vercel.app/health`

### Cold Starts
- First request after inactivity may be slow (2-5 seconds)
- This is normal for serverless functions
- Consider Vercel Pro plan for better performance

## Quick Deploy Checklist

- [ ] Code pushed to GitHub
- [ ] Backend deployed on Vercel
- [ ] Backend environment variables set
- [ ] Frontend deployed on Vercel
- [ ] `VITE_API_URL` set in frontend
- [ ] `CORS_ORIGIN` updated in backend
- [ ] Backend redeployed after CORS update
- [ ] App tested and working

## Custom Domains

You can add custom domains to both projects:

1. **Backend**: Settings → Domains → Add domain
   - Example: `api.yourdomain.com`
   - Update `VITE_API_URL` to use custom domain

2. **Frontend**: Settings → Domains → Add domain
   - Example: `yourdomain.com` or `www.yourdomain.com`
   - Update `CORS_ORIGIN` in backend

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Vercel Serverless Functions: [vercel.com/docs/functions](https://vercel.com/docs/functions)
- Express on Vercel: [vercel.com/docs/functions/serverless-functions/runtimes/node-js](https://vercel.com/docs/functions/serverless-functions/runtimes/node-js)

