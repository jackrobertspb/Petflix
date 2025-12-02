# Petflix Documentation

Complete documentation for the Petflix platform - a PWA for discovering, sharing, and engaging with pet videos from YouTube.

---

## Getting Started

**New to Petflix?** Start here:

1. **[Setup Guide](SETUP.md)** - Get Petflix running locally in 20 minutes
2. **[Features List](FEATURES.md)** - See what's implemented
3. **[Testing Guide](TESTING.md)** - Verify everything works

---

## Documentation Index

### Core Documentation

| Document | Description |
|----------|-------------|
| **[SETUP.md](SETUP.md)** | Complete installation and setup instructions |
| **[FEATURES.md](FEATURES.md)** | List of all implemented features |
| **[TESTING.md](TESTING.md)** | Testing guide and test checklist |
| **[PRD_COMPREHENSIVE_AUDIT.md](PRD_COMPREHENSIVE_AUDIT.md)** | Full PRD compliance audit report |

### Setup Guides

Detailed configuration guides for specific features:

| Guide | Description |
|-------|-------------|
| **[YouTube API](setup/youtube-api.md)** | Get YouTube Data API v3 key |
| **[Email Production](setup/email-production.md)** | Configure SendGrid, Resend, or AWS SES |
| **[Push Notifications](setup/push-notifications.md)** | Set up web push with VAPID keys |
| **[PWA Setup](setup/pwa-setup.md)** | Configure Progressive Web App features |
| **[Image Moderation](setup/image-moderation.md)** | Set up ML-based content moderation |
| **[HTTPS Deployment](setup/https-deployment.md)** | Deploy with HTTPS and security headers |
| **[Security Headers](setup/security-headers.md)** | Configure Helmet and CSP |
| **[Profile Pictures](setup/profile-pictures.md)** | Configure image uploads and storage |
| **[Notification Grouping](setup/notification-grouping.md)** | Configure notification batching |
| **[Supabase Notes](setup/supabase-notes.md)** | Supabase-specific tips and tricks |
| **[Database Wipe](setup/database-wipe.md)** | How to reset the database (dev only) |
| **[Account Management](setup/account-management.md)** | User account deletion and password reset |

---

## Quick Reference

### Common Commands

```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Start development servers
cd backend && npm run dev    # Port 5001
cd frontend && npm run dev   # Port 5173

# Build for production
cd frontend && npm run build
```

### Environment Files

- `backend/.env` - Backend configuration
- `frontend/.env` - Frontend configuration
- See [SETUP.md](SETUP.md) for required variables

### Database Migrations

All SQL files located in `backend/src/db/`

Run in Supabase SQL Editor in this order:
1. schema.sql (core tables)
2. add-*.sql (features and enhancements)

See [SETUP.md](SETUP.md) for detailed migration instructions.

---

## Architecture Overview

### Tech Stack

**Frontend:**
- React 18
- TypeScript
- TailwindCSS
- Shadcn/UI
- Vite

**Backend:**
- Express.js
- TypeScript
- Supabase (PostgreSQL)
- JWT authentication
- YouTube Data API v3

**Features:**
- Progressive Web App (PWA)
- Web Push Notifications
- TV Casting (Chromecast/AirPlay)
- Real-time notifications
- Offline support

### Project Structure

```
petflix/
├── backend/
│   ├── src/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # Business logic
│   │   ├── middleware/   # Auth, validation, rate limiting
│   │   ├── db/           # SQL migrations
│   │   └── server.ts     # Express app
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/        # Route components
│   │   ├── components/   # Reusable UI
│   │   ├── contexts/     # Global state (Auth, Theme, Toast)
│   │   ├── services/     # API client, push notifications
│   │   └── lib/          # Utilities
│   ├── public/           # PWA assets
│   └── .env
└── docs/                 # Documentation (you are here!)
```

---

## Feature Categories

### User Management
- Registration with email verification
- Login with account locking (security)
- Password reset via email
- Profile management (picture, bio)
- Admin role system

### Video Features
- Search Petflix videos
- Search YouTube (Pets & Animals)
- View tracking
- Share videos with trackable URLs
- Edit and delete videos
- Like videos and comments
- Comment with threading support

### Social Features
- Follow/unfollow users
- Personalized feed
- User profiles
- Notifications (in-app and push)
- Video reporting system

### Content Curation
- Create public/private playlists
- Add YouTube videos to playlists
- Custom tags for organization
- Playlist ordering
- Admin moderation dashboard

### Advanced Features
- Progressive Web App (installable)
- Web push notifications (grouped)
- TV casting support
- Offline metadata caching
- Dark mode
- Pull-to-refresh
- Search history and personalization

---

## API Documentation

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/verify-email` - Verify email address

### Videos
- `GET /api/v1/videos/search` - Search Petflix videos
- `GET /api/v1/videos/search/youtube` - Search YouTube
- `GET /api/v1/videos/:videoId` - Get video details
- `POST /api/v1/videos` - Share video
- `PATCH /api/v1/videos/:videoId` - Edit video
- `DELETE /api/v1/videos/:videoId` - Delete video

### Social
- `POST /api/v1/follows/:userId` - Follow user
- `DELETE /api/v1/follows/:userId` - Unfollow user
- `GET /api/v1/follows/:userId/feed` - Get feed
- `POST /api/v1/comments` - Create comment
- `GET /api/v1/comments/video/:videoId` - Get comments

### Playlists
- `POST /api/v1/playlists` - Create playlist
- `GET /api/v1/playlists/:playlistId` - Get playlist
- `PATCH /api/v1/playlists/:playlistId` - Update playlist
- `DELETE /api/v1/playlists/:playlistId` - Delete playlist

See code in `backend/src/routes/` for full API reference.

---

## Security

### Implemented Security Measures
- ✅ Bcrypt password hashing (10 rounds)
- ✅ JWT authentication with 7-day expiry
- ✅ Account locking after 5 failed attempts
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS prevention (input sanitization)
- ✅ CSRF protection
- ✅ Rate limiting on all endpoints
- ✅ Helmet security headers
- ✅ HTTPS enforcement (production)
- ✅ Image content moderation
- ✅ Sensitive data in .gitignore

See [Security Headers Guide](setup/security-headers.md) for details.

---

## Monitoring & Logging

### Error Handling
- Winston centralized logging
- Error logs stored in database
- Admin error dashboard with filtering
- Anomaly detection for error spikes
- Storage usage monitoring

### Metrics Tracked
- Error rates and types
- User engagement
- Video views and likes
- Search queries
- System availability

---

## Testing

See **[TESTING.md](TESTING.md)** for:
- Manual testing checklist
- Feature verification
- Security testing
- Performance testing
- Cross-browser compatibility

---

## Deployment

### Production Checklist

Before deploying to production:

1. **Environment Variables**
   - Set all required env vars
   - Use production API keys
   - Set `NODE_ENV=production`

2. **Security**
   - Enable HTTPS (see [HTTPS Deployment](setup/https-deployment.md))
   - Configure security headers
   - Set up email service (see [Email Production](setup/email-production.md))
   - Generate VAPID keys for push notifications

3. **Database**
   - Run all migrations in production Supabase
   - Set up backups
   - Configure storage limits

4. **Monitoring**
   - Configure error logging
   - Set up anomaly detection thresholds
   - Enable storage monitoring alerts

5. **Frontend**
   - Build production bundle: `npm run build`
   - Deploy to Vercel/Netlify/etc
   - Update `FRONTEND_URL` in backend

6. **Backend**
   - Deploy to hosting service
   - Configure load balancing if needed
   - Set up health check endpoint

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Port already in use | Kill Node processes: `taskkill /F /IM node.exe` |
| CORS errors | Check `FRONTEND_URL` in backend `.env` |
| "Table doesn't exist" | Run SQL migrations in Supabase |
| YouTube search fails | Verify `YOUTUBE_API_KEY` is valid |
| Push notifications not working | Check VAPID keys and browser permissions |
| Images not uploading | Configure Supabase storage bucket |

See [SETUP.md](SETUP.md) troubleshooting section for more.

---

## Contributing

### Code Style
- TypeScript for type safety
- ESLint configuration included
- Use async/await for promises
- Follow existing patterns

### Adding Features
1. Update backend routes
2. Add frontend UI
3. Run SQL migrations if needed
4. Update documentation
5. Test thoroughly

---

## Support & Resources

### External Documentation
- [Supabase Docs](https://supabase.com/docs)
- [YouTube Data API](https://developers.google.com/youtube/v3)
- [React Documentation](https://react.dev)
- [Web Push Notifications](https://web.dev/push-notifications/)

### Project Resources
- Backend: `backend/src/`
- Frontend: `frontend/src/`
- Database: `backend/src/db/`
- Documentation: `docs/` (you are here!)

---

## Version Information

**Last Updated:** November 24, 2025  
**Status:** Production Ready ✅  
**PRD Compliance:** 100% (see [PRD Audit](PRD_COMPREHENSIVE_AUDIT.md))

---

**Questions?** Check the relevant guide in `docs/setup/` or refer to the code implementation.
