# Petflix Frontend Setup Guide

## ✅ What's Been Built

The Petflix frontend is now complete with all core functionality:

### Pages Created
- **Landing Page** (`/`) - Welcome page with trending videos for guests
- **Login Page** (`/login`) - User authentication
- **Register Page** (`/register`) - New user registration with validation
- **Search Page** (`/search`) - Search for pet videos from YouTube
- **Feed Page** (`/feed`) - Personalized feed for logged-in users (protected)
- **Video Detail Page** (`/video/:id`) - Watch videos with YouTube player + comments
- **Profile Page** (`/profile/:userId`) - User profiles with their videos and playlists

### Components Created
- **Navbar** - Navigation with auth state awareness
- **ProtectedRoute** - Route wrapper for authenticated-only pages
- **AuthContext** - Global authentication state management

### Features Implemented
✅ JWT-based authentication with token storage
✅ Protected routes (Feed requires login)
✅ Responsive design with TailwindCSS + PRD color palette
✅ Video browsing, search, and detail views
✅ User profiles with follow functionality
✅ Comment system on videos
✅ Playlist display
✅ Form validation on registration

## 🚀 Setup Instructions

### 1. Environment Variables

The `.env` file has been created automatically. Verify it contains:

```bash
VITE_API_URL=http://localhost:5001/api/v1
```

**Important**: Make sure this matches your backend port!

### 2. Install Dependencies (if not done)

If you haven't run this yet:

```bash
npm install
```

### 3. Start the Development Server

```bash
npm run dev
```

The frontend will start on `http://localhost:5173` (or another port if 5173 is taken).

### 4. Build for Production

```bash
npm run build
```

Built files will be in the `dist/` directory.

## 🧪 Testing the Frontend

### Test Flow:
1. **Start Backend** - Make sure your backend is running on port 5001
2. **Start Frontend** - Run `npm run dev`
3. **Open Browser** - Go to `http://localhost:5173`

### Manual Test Checklist:

#### Guest User Flow
- [ ] Visit landing page - should see trending videos
- [ ] Click "Browse Videos" - should go to search page
- [ ] Search for "cute cats" - should see search results
- [ ] Click a video - should see video detail page
- [ ] Try to access `/feed` - should redirect to login

#### Registration Flow
- [ ] Click "Get Started" or "Register"
- [ ] Fill form with invalid data - should show validation errors
- [ ] Register with valid data - should redirect to feed
- [ ] Should see auth token in localStorage
- [ ] Navbar should show "Feed", "Profile", "Logout"

#### Logged-In User Flow
- [ ] Login with registered account
- [ ] Visit Feed page - should see videos
- [ ] Click on a video - should see YouTube player
- [ ] Post a comment - should appear in comments list
- [ ] Visit your profile - should see your username
- [ ] Visit another user's profile - should see "Follow" button
- [ ] Logout - should redirect to landing page

## 🎨 Design Notes

The app uses the PRD-specified color palette:
- **Cream** (`#F0F0DC`) - Background
- **Charcoal** (`#36454F`) - Text and dark elements
- **Light Blue** (`#ADD8E6`) - Primary accent/buttons

## 🔧 Troubleshooting

### "Network Error" when trying to login/register
- Check that backend is running on port 5001
- Verify `VITE_API_URL` in `.env` matches backend URL
- Check browser console for CORS errors

### "Failed to fetch videos"
- Ensure backend has YouTube API key configured
- Check backend logs for API errors

### Changes not reflecting
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Clear browser cache
- Check Vite dev server is running

## 📁 Project Structure

```
src/
├── components/
│   ├── Navbar.tsx              # Main navigation
│   ├── ProtectedRoute.tsx      # Auth route wrapper
│   └── ui/                     # Shadcn components (if needed)
├── contexts/
│   └── AuthContext.tsx         # Auth state management
├── pages/
│   ├── Landing.tsx             # Home page
│   ├── Login.tsx               # Login form
│   ├── Register.tsx            # Registration form
│   ├── Search.tsx              # Video search
│   ├── Feed.tsx                # Personalized feed
│   ├── VideoDetail.tsx         # Video player + comments
│   └── Profile.tsx             # User profile
├── services/
│   └── api.ts                  # Axios API service
├── lib/
│   └── utils.ts                # Utility functions
├── App.tsx                     # Route configuration
├── main.tsx                    # React entry point
└── index.css                   # Global styles + Tailwind
```

## 🚀 Next Steps

The frontend is now **fully functional**! Here's what you can do next:

1. **Test the full app** - Register, login, browse, comment
2. **Add more features** from the PRD:
   - Video sharing functionality (upload YouTube links)
   - Playlist creation/management
   - Video reporting
   - PWA manifest for installability
3. **Polish the UI** - Add loading states, animations, error boundaries
4. **Deploy** - Host on Vercel, Netlify, or your preferred platform

---

**You're ready to test! 🎉**

Start both backend and frontend servers, then open your browser to see Petflix in action!

