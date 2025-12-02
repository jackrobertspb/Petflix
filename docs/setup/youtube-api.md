# 📺 How to Get Your YouTube API Key

Follow these steps to get your YouTube Data API v3 key:

## Step 1: Enable YouTube Data API v3

1. In Google Cloud Console, make sure you're in your project
2. In the search bar at the top, type: **"YouTube Data API v3"**
3. Click on **"YouTube Data API v3"** from the results
4. Click the **"ENABLE"** button (if it's not already enabled)

## Step 2: Create API Key

1. In the left sidebar, click **"Credentials"** (or go to: APIs & Services → Credentials)
2. At the top, click **"+ CREATE CREDENTIALS"**
3. Select **"API key"** from the dropdown
4. A popup will appear with your API key - **COPY IT NOW!** (You can't see it again later)
5. Click **"CLOSE"** (or "RESTRICT KEY" if you want to add security restrictions)

## Step 3: (Optional) Restrict the API Key

For better security, you can restrict the key:

1. Click on your newly created API key in the credentials list
2. Under **"API restrictions"**, select **"Restrict key"**
3. Check **"YouTube Data API v3"**
4. Click **"SAVE"**

## Step 4: Add to Your .env File

1. Open `petflix/backend/.env`
2. Add this line:
   ```env
   YOUTUBE_API_KEY=paste-your-key-here
   ```
3. Save the file
4. Restart your backend server

## Quick Navigation Path

If you're lost, here's the exact path:
1. **Google Cloud Console** → Your Project
2. **APIs & Services** → **Library** (left sidebar)
3. Search for **"YouTube Data API v3"** → Click → **ENABLE**
4. **APIs & Services** → **Credentials** (left sidebar)
5. **+ CREATE CREDENTIALS** → **API key**
6. Copy the key!

## Troubleshooting

**Can't find "APIs & Services"?**
- Look in the left sidebar (hamburger menu ☰)
- It might be under "More products" or "All products"

**API key not working?**
- Make sure YouTube Data API v3 is **enabled** (not just created)
- Check that you copied the entire key (no spaces)
- Wait a few minutes after enabling the API - it can take time to propagate

**Getting quota errors?**
- Free tier allows 10,000 units per day
- Each video metadata request uses ~1 unit
- If you hit the limit, you'll need to wait 24 hours or upgrade

---

**That's it!** Once you add the key to your `.env` file and restart the backend, video sharing should work! 🎉



