# Profile Picture Upload Setup Guide

## Prerequisites

Before using profile picture uploads, you need to set up a Supabase Storage bucket.

## Step 1: Create Storage Bucket in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **"New bucket"**
4. Configure the bucket:
   - **Name:** `profile-pictures`
   - **Public bucket:** ✅ Check this (so images are publicly accessible)
   - **File size limit:** 5 MB (or your preferred limit)
   - **Allowed MIME types:** `image/jpeg, image/jpg, image/png, image/gif, image/webp`
5. Click **"Create bucket"**

## Step 2: Set Up Bucket Policies (Optional but Recommended)

For better security, you can set up RLS (Row Level Security) policies:

1. Go to **Storage** → **Policies** → **profile-pictures**
2. Add policies to allow:
   - **Upload:** Users can upload their own profile pictures
   - **Read:** Public read access (since bucket is public)
   - **Update:** Users can update their own profile pictures
   - **Delete:** Users can delete their own profile pictures

**Example Policy (Upload):**
```sql
-- Allow users to upload their own profile pictures
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

**Note:** For MVP, you can skip policies if the bucket is public and you trust your backend authentication.

## Step 3: Test the Upload

1. Go to **Settings** page in the app
2. Click **"Choose File"** under Profile Picture
3. Select an image (JPEG, PNG, GIF, or WebP, max 5MB)
4. Click **"Upload Picture"**
5. The image should upload and appear as your profile picture

## How It Works

1. **Frontend:** User selects an image file
2. **Frontend:** Image is converted to base64 and sent to backend
3. **Backend:** Validates image type and size
4. **Backend:** Uploads to Supabase Storage bucket `profile-pictures`
5. **Backend:** Gets public URL from Supabase
6. **Backend:** Updates user's `profile_picture_url` in database
7. **Frontend:** Updates UI with new profile picture

## File Structure in Storage

Profile pictures are stored as:
```
profile-pictures/
  {userId}/
    profile-picture.jpg (or .png, .gif, .webp)
```

This allows:
- Easy cleanup (delete user's folder when account is deleted)
- Unique file paths per user
- Automatic replacement when user uploads new picture

## Troubleshooting

### Error: "Bucket not found"
- Make sure you created the `profile-pictures` bucket in Supabase Dashboard
- Check the bucket name matches exactly (case-sensitive)

### Error: "Upload failed"
- Check Supabase Storage is enabled in your project
- Verify bucket is set to "Public"
- Check file size is under 5MB
- Verify image type is allowed (JPEG, PNG, GIF, WebP)

### Image not showing after upload
- Check the public URL is accessible
- Verify bucket is set to "Public"
- Check browser console for CORS errors

## Alternative: Using URL (Fallback)

Users can still enter a URL directly if they prefer:
- Click "Or enter a URL instead" in Settings
- Paste an image URL
- This bypasses the upload system


