# Petflix - Pet Video Sharing Platform

A full-stack web application for sharing and discovering pet videos, built with React, TypeScript, Express, and Supabase.

## 🎯 Features

- **Video Sharing**: Share your favorite pet videos with the community
- **Feed System**: Browse and discover pet videos from other users
- **User Profiles**: Personalized profiles with follow/unfollow functionality
- **Playlists**: Create and manage video playlists
- **Search**: Search for videos and users
- **Comments**: Engage with videos through comments
- **Reports**: Report inappropriate content
- **Theme Support**: Light and dark theme options
- **Responsive Design**: Mobile-friendly interface

## 🏗️ Project Structure

```
petflix/
├── backend/          # Express.js API server
│   ├── src/
│   │   ├── config/   # Configuration files (Supabase)
│   │   ├── middleware/ # Auth & validation middleware
│   │   ├── routes/   # API route handlers
│   │   ├── services/ # External services (YouTube)
│   │   └── server.ts # Express server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/         # React + Vite application
│   ├── src/
│   │   ├── components/ # Reusable React components
│   │   ├── contexts/   # React context providers
│   │   ├── hooks/      # Custom React hooks
│   │   ├── pages/      # Page components
│   │   ├── services/   # API client
│   │   └── App.tsx     # Main app component
│   ├── package.json
│   └── vite.config.ts
│
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_KEY=your_supabase_service_key
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```
   VITE_API_URL=http://localhost:3000/api/v1
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open http://localhost:5173 in your browser

## 🛠️ Tech Stack

### Backend
- **Express.js** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Supabase** - Backend as a Service (Auth, Database, Storage)
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Vite** - Build tool and dev server
- **TailwindCSS v4** - Utility-first CSS framework
- **React Router** - Client-side routing

## 📝 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user

### Videos
- `GET /api/v1/videos` - Get all videos (feed)
- `GET /api/v1/videos/:id` - Get video by ID
- `POST /api/v1/videos` - Share a new video
- `DELETE /api/v1/videos/:id` - Delete video

### Users
- `GET /api/v1/users/:id` - Get user profile
- `PUT /api/v1/users/:id` - Update user profile

### Follows
- `POST /api/v1/follows/:userId` - Follow a user
- `DELETE /api/v1/follows/:userId` - Unfollow a user

### Playlists
- `GET /api/v1/playlists` - Get user's playlists
- `POST /api/v1/playlists` - Create playlist
- `PUT /api/v1/playlists/:id` - Update playlist
- `DELETE /api/v1/playlists/:id` - Delete playlist

### Comments
- `GET /api/v1/comments/video/:videoId` - Get video comments
- `POST /api/v1/comments` - Add comment
- `DELETE /api/v1/comments/:id` - Delete comment

## 📄 License

This project is for educational purposes.

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
