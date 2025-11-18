# Petflix 🐾

A pet video sharing platform built with React, Express, and Supabase.

## Project Structure

- `backend/` - Express.js API server (TypeScript)
- `frontend/` - React frontend application (TypeScript + Vite)
- `docs/` - Project documentation and guides

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Backend Setup
```bash
cd backend
npm install
# Create .env file with your Supabase credentials (see ENV_TEMPLATE.md)
npm run dev
```
Backend runs on: `http://localhost:5001` (or PORT from .env)

### Frontend Setup
```bash
cd frontend
npm install
# Create .env file with VITE_API_URL pointing to backend
npm run dev
```
Frontend runs on: `http://localhost:5173` (or Vite default port)

## Documentation

See `docs/` folder for:
- `NEXT_STEPS.md` - Setup, testing, and deployment guide
- `IMPLEMENTATION_SUMMARY.md` - Complete feature list
- Other project documentation

## Features

✅ User authentication & authorization  
✅ Video sharing from YouTube  
✅ Social features (follow, comments, likes)  
✅ Playlists & custom tags  
✅ Push notifications  
✅ PWA support  
✅ Admin moderation system  
✅ Email service integration  
✅ Trackable share URLs  
✅ And more...

See `docs/IMPLEMENTATION_SUMMARY.md` for complete list.

## Development

### Backend
- TypeScript + Express
- Supabase (PostgreSQL)
- JWT authentication
- Rate limiting
- Input validation

### Frontend
- React 19 + TypeScript
- Vite
- TailwindCSS + Shadcn UI
- React Router
- PWA support

## Next Steps

1. Run SQL migrations in Supabase (see `docs/NEXT_STEPS.md`)
2. Configure environment variables
3. Assign admin user
4. Test features

See `docs/NEXT_STEPS.md` for detailed instructions.

