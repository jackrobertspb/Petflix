# Deploying Petflix to Vercel

This guide will help you deploy the Petflix frontend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. Your backend API deployed and accessible (see Backend Deployment section)

## Frontend Deployment to Vercel

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Import Project to Vercel**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Click "Import Project"
   - Select your Git repository
   - Vercel will auto-detect it's a Vite project

3. **Configure Project Settings**
   - **Root Directory**: Set to `frontend`
   - **Framework Preset**: Vite (should be auto-detected)
   - **Build Command**: `npm run build` (default)
   - **Output Directory**: `dist` (default)
   - **Install Command**: `npm install` (default)

4. **Environment Variables**
   Add these in Vercel Dashboard → Settings → Environment Variables:
   ```
   VITE_API_URL=https://your-backend-url.com/api/v1
   ```
   Replace `https://your-backend-url.com/api/v1` with your actual backend API URL.

5. **Deploy**
   - Click "Deploy"
   - Wait for the build to complete
   - Your app will be live at `https://your-project.vercel.app`

### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

4. **Deploy**
   ```bash
   vercel
   ```
   - Follow the prompts
   - When asked for root directory, confirm it's `frontend` or `.`
   - Add environment variables when prompted

5. **Set Environment Variables**
   ```bash
   vercel env add VITE_API_URL
   ```
   Enter your backend API URL when prompted.

6. **Deploy to Production**
   ```bash
   vercel --prod
   ```

## Backend Deployment

Vercel is optimized for frontend and serverless functions. For a full Express.js backend, consider:

### Option A: Railway (Recommended for Express apps)
1. Go to [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Select your repository
4. Set root directory to `backend`
5. Add environment variables from your `.env` file
6. Railway will auto-detect Node.js and deploy

### Option B: Render
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect your repository
4. Set:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables
6. Deploy

### Option C: Vercel Serverless Functions (Advanced)
You can convert your Express routes to Vercel serverless functions, but this requires refactoring.

## Environment Variables Checklist

### Frontend (Vercel)
- `VITE_API_URL` - Your backend API URL (e.g., `https://your-backend.railway.app/api/v1`)

### Backend (Railway/Render)
- `PORT` - Server port (usually auto-set by platform)
- `JWT_SECRET` - Your JWT secret key
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
- `YOUTUBE_API_KEY` - Your YouTube API key
- `CORS_ORIGIN` - Your frontend URL (e.g., `https://your-project.vercel.app`)
- `EMAIL_PROVIDER` - Email provider (`console`, `resend`, or `sendgrid`)
- `RESEND_API_KEY` - (if using Resend)
- `SENDGRID_API_KEY` - (if using SendGrid)
- `VAPID_PUBLIC_KEY` - Push notification public key
- `VAPID_PRIVATE_KEY` - Push notification private key
- `VAPID_SUBJECT` - Push notification subject (your email)

## Post-Deployment Steps

1. **Update CORS in Backend**
   - Make sure your backend's `CORS_ORIGIN` includes your Vercel frontend URL
   - Update Supabase redirect URLs if needed

2. **Test the Deployment**
   - Visit your Vercel URL
   - Test login/register
   - Test video sharing
   - Test all major features

3. **Set up Custom Domain (Optional)**
   - In Vercel Dashboard → Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

4. **Enable Automatic Deployments**
   - Vercel automatically deploys on every push to main branch
   - Configure branch protection in your Git provider

## Troubleshooting

### Build Fails
- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version (Vercel uses Node 18+ by default)

### API Calls Fail
- Verify `VITE_API_URL` is set correctly
- Check backend CORS settings
- Ensure backend is deployed and accessible

### Environment Variables Not Working
- Make sure variables start with `VITE_` for Vite to expose them
- Redeploy after adding new environment variables
- Check variable names match exactly (case-sensitive)

### 404 Errors on Routes
- Verify `vercel.json` has the rewrite rule for SPA routing
- Check that `index.html` is in the `dist` folder

## Quick Deploy Checklist

- [ ] Code pushed to Git repository
- [ ] Backend deployed and accessible
- [ ] Frontend environment variables set in Vercel
- [ ] Backend environment variables set
- [ ] CORS configured in backend
- [ ] Build succeeds
- [ ] App loads and functions correctly
- [ ] Custom domain configured (if applicable)

## Support

- Vercel Docs: [vercel.com/docs](https://vercel.com/docs)
- Railway Docs: [docs.railway.app](https://docs.railway.app)
- Render Docs: [render.com/docs](https://render.com/docs)


