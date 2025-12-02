# 🔧 Setting Up Your .env File

## Quick Setup

1. **Copy the template:**
   ```bash
   cd petflix/backend
   copy .env.example .env
   ```
   Or manually create `.env` file

2. **Get your Supabase credentials:**
   - Go to your Supabase project dashboard
   - Click **Settings** → **API**
   - Copy **Project URL** → paste as `SUPABASE_URL`
   - Copy **service_role** key → paste as `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Important:** Use the `service_role` key, NOT the `anon` key!

3. **Generate JWT Secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste as `JWT_SECRET`

4. **Get YouTube API Key (REQUIRED for sharing videos):**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or select existing)
   - Enable **YouTube Data API v3**
   - Go to **Credentials** → **Create Credentials** → **API Key**
   - Copy the API key
   - (Optional) Restrict the key to YouTube Data API v3 for security

5. **Fill in your `.env` file:**
   ```env
   SUPABASE_URL=https://xxxxx.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET=your-generated-secret-here
   YOUTUBE_API_KEY=your-youtube-api-key-here
   PORT=5002
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173
   EMAIL_PROVIDER=console
   ```

6. **Save the file and try again:**
   ```bash
   npm run dev
   ```

## Where to Find Supabase Credentials

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon) in the left sidebar
4. Click **API** in the settings menu
5. You'll see:
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role** key (under "Project API keys") → This is your `SUPABASE_SERVICE_ROLE_KEY`
     - ⚠️ Keep this secret! It has admin access to your database.

## Security Notes

- ✅ Never commit `.env` to git (it's already in `.gitignore`)
- ✅ Never share your `SUPABASE_SERVICE_ROLE_KEY` publicly
- ✅ Use different credentials for development and production
- ✅ The `service_role` key bypasses Row Level Security - use carefully!

## Troubleshooting

**Error: "Missing Supabase environment variables"**
- Make sure `.env` file exists in `petflix/backend/` folder
- Check that `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set
- Make sure there are no spaces around the `=` sign
- Restart the dev server after creating/editing `.env`

**Error: "Invalid API key" (Supabase)**
- Double-check you copied the full `service_role` key
- Make sure there are no extra spaces or line breaks
- Verify the key in Supabase dashboard

**Error: "YouTube API key not configured" or 500 error when sharing videos**
- Make sure `YOUTUBE_API_KEY` is set in your `.env` file
- Verify the API key is valid in Google Cloud Console
- Ensure YouTube Data API v3 is enabled for your project
- Restart the backend server after adding the key

