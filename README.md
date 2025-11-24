# Petflix 🐾

A Progressive Web App for discovering, sharing, and engaging with pet videos from YouTube.

---

## Quick Start

Get Petflix running in 20 minutes. See **[docs/SETUP.md](docs/SETUP.md)** for complete instructions.

```bash
# Install dependencies
cd backend && npm install
cd frontend && npm install

# Configure environment variables
# Create backend/.env and frontend/.env (see docs/SETUP.md)

# Start servers
cd backend && npm run dev    # Port 5001
cd frontend && npm run dev   # Port 5173
```

---

## Project Structure

```
petflix/
├── backend/              # Express.js API (TypeScript)
├── frontend/             # React PWA (TypeScript + Vite)
└── docs/                 # Documentation
```

**Important:** There are **only two main folders** - `backend/` and `frontend/`. No `api/` folder.

---

## Documentation

📚 **[Complete Documentation Index](docs/README.md)**

**Essential Guides:**
- **[Setup Guide](docs/SETUP.md)** - Installation and configuration
- **[Features](docs/FEATURES.md)** - List of all implemented features
- **[Testing Guide](docs/TESTING.md)** - Testing checklist

**Setup Guides** (`docs/setup/`):
- [YouTube API](docs/setup/youtube-api.md)
- [Email Production](docs/setup/email-production.md)
- [Push Notifications](docs/setup/push-notifications.md)
- [PWA Setup](docs/setup/pwa-setup.md)
- [Image Moderation](docs/setup/image-moderation.md)
- [HTTPS Deployment](docs/setup/https-deployment.md)
- And more...

---

## Features

### Core Functionality
✅ User registration and authentication  
✅ Search Petflix videos OR YouTube directly  
✅ Share YouTube videos to Petflix  
✅ Video likes, comments, and replies  
✅ Follow users and personalized feed  
✅ Create and manage playlists  

### Social & Engagement
✅ In-app notifications  
✅ Web push notifications (grouped)  
✅ Video reporting and moderation  
✅ Trackable share URLs  
✅ Admin dashboard  

### Advanced Features
✅ Progressive Web App (installable)  
✅ TV casting support (Chromecast/AirPlay)  
✅ Dark mode  
✅ Offline metadata caching  
✅ Pull-to-refresh  
✅ Email verification  
✅ Password reset  
✅ Account security (locking after failed attempts)  

See **[docs/FEATURES.md](docs/FEATURES.md)** for the complete list.

---

## Tech Stack

### Frontend
- React 18
- TypeScript
- TailwindCSS + Shadcn UI
- Vite
- PWA support

### Backend
- Express.js
- TypeScript
- Supabase (PostgreSQL)
- JWT authentication
- YouTube Data API v3

---

## Key Features Highlight

### 🔍 Dual Search
- **Petflix Videos**: Search videos shared by the community
- **YouTube Search**: Search YouTube's Pets & Animals category directly

### 🔐 Security
- Bcrypt password hashing
- JWT authentication
- Account locking after failed logins
- Rate limiting on all endpoints
- Security headers (Helmet)
- HTTPS enforcement
- Input validation and sanitization

### 📱 PWA Capabilities
- Installable on mobile and desktop
- Push notifications
- Offline metadata caching
- TV casting support

---

## Development

### Backend (Port 5001)
```bash
cd backend
npm install
npm run dev
```

### Frontend (Port 5173)
```bash
cd frontend
npm install
npm run dev
```

---

## Environment Variables

### Backend (`.env`)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
JWT_SECRET=your-jwt-secret
YOUTUBE_API_KEY=your-youtube-api-key
PORT=5001
```

### Frontend (`.env`)
```env
VITE_API_URL=http://localhost:5001/api/v1
```

See **[docs/SETUP.md](docs/SETUP.md)** for detailed configuration.

---

## Database Setup

Run SQL migrations in Supabase SQL Editor (in order):
1. `backend/src/db/schema.sql` - Core tables
2. `backend/src/db/add-*.sql` - Feature migrations

See **[docs/SETUP.md](docs/SETUP.md)** for the complete migration list.

---

## Testing

Run through the testing checklist to verify all features:

```bash
# Open in browser
http://localhost:5173

# Test user flows
1. Register a new account
2. Search for videos (Petflix and YouTube)
3. Share a YouTube video
4. Like and comment on videos
5. Follow users and check feed
6. Create a playlist
```

See **[docs/TESTING.md](docs/TESTING.md)** for the complete checklist.

---

## Deployment

### Production Checklist
- ✅ Set `NODE_ENV=production`
- ✅ Configure HTTPS (see [docs/setup/https-deployment.md](docs/setup/https-deployment.md))
- ✅ Set up email service (see [docs/setup/email-production.md](docs/setup/email-production.md))
- ✅ Generate VAPID keys for push notifications
- ✅ Run all database migrations
- ✅ Build frontend: `npm run build`

See **[docs/README.md](docs/README.md)** for complete deployment guide.

---

## PRD Compliance

✅ **100% PRD Compliant** - All requirements implemented  
See **[docs/PRD_COMPREHENSIVE_AUDIT.md](docs/PRD_COMPREHENSIVE_AUDIT.md)** for detailed audit.

---

## Support

- 📖 **Documentation**: [docs/README.md](docs/README.md)
- 🚀 **Getting Started**: [docs/SETUP.md](docs/SETUP.md)
- 🧪 **Testing**: [docs/TESTING.md](docs/TESTING.md)
- ⚙️ **Setup Guides**: [docs/setup/](docs/setup/)

---

## License

MIT

---

**Ready to get started?** Follow the **[Setup Guide](docs/SETUP.md)**! 🚀
