# Resend Setup Guide - Easier Alternative to SendGrid

Since SendGrid rejected your account, let's use **Resend** instead. It's easier to get approved and works great!

## Why Resend?

- ✅ **Easier approval** - Less strict than SendGrid
- ✅ **Already implemented** in your code
- ✅ **3,000 emails/month free** (vs SendGrid's 100/day)
- ✅ **No domain needed for testing** - Can use `onboarding@resend.dev`
- ✅ **Modern API** - Better developer experience

## Step 1: Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Fill out the signup form (usually just email + password)
4. Verify your email address (check inbox)

**Note**: Resend approval is usually instant or within minutes, not hours/days like SendGrid.

## Step 2: Get Your API Key

1. Once logged in, go to **API Keys** (or visit https://resend.com/api-keys)
2. Click **"Create API Key"**
3. Give it a name like "Petflix Production"
4. Click **"Add"**
5. **IMPORTANT**: Copy the API key immediately (starts with `re_`)
   - It looks like: `re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Configure Your Backend

1. Open `backend/.env` file
2. Add or update these lines:

```env
# Email Service Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev
```

**Important**: 
- Replace `re_your_actual_api_key_here` with the API key you copied
- Use `onboarding@resend.dev` for now (no domain needed!)

## Step 4: Testing Mode (No Domain Needed!)

Resend has a **testing mode** that works without a domain:

- ✅ Can send to **any email address**
- ✅ Uses `onboarding@resend.dev` as sender
- ✅ No domain verification required
- ⚠️ **Limitation**: In testing mode, you can only send to emails that match your Resend account email

**For testing email change verification:**
- If your Resend account email is `you@gmail.com`
- You can test by changing your email TO `you@gmail.com`
- The verification email will arrive!

## Step 5: Test It!

1. Restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Try changing your email in Settings
3. Check your email inbox
4. You should receive the verification email!

## For Production (Later - When You Get a Domain)

When you're ready for production and have a domain:

1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Add DNS records to your domain
4. Update `RESEND_FROM_EMAIL` to `noreply@yourdomain.com`

But for now, testing mode works perfectly!

## Troubleshooting

### "Testing Mode Restriction" Error

If you see: "You can only send testing emails to your verified email address"

**Solution**: 
- Make sure the email you're sending TO matches your Resend account email
- Or verify a domain (for production)

### API Key Not Working

- Make sure you copied the entire key (it's long)
- Check for extra spaces
- Verify the key is active in Resend dashboard

### Emails Going to Spam

- Normal for new accounts
- Recipients should check spam folder
- Deliverability improves over time

## Free Tier Limits

- **3,000 emails/month** (free tier)
- **100 emails/day** (free tier)
- Much better than SendGrid's 100/day limit!

---

**That's it!** Resend is much easier to set up than SendGrid. Try it now!


