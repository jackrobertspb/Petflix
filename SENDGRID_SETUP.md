# SendGrid Setup Guide - No Domain Required

This guide will help you set up SendGrid to send emails in production without needing your own domain.

## Step 1: Sign Up for SendGrid

1. Go to [https://sendgrid.com](https://sendgrid.com)
2. Click "Start for Free"
3. Fill out the signup form
4. **VERIFY YOUR EMAIL ADDRESS** - Check your inbox and click the verification link
5. **Complete account setup** - You may need to:
   - Verify your phone number
   - Complete your profile
   - Accept terms and conditions
   - Wait for account approval (can take a few minutes to hours)

**Troubleshooting "Not authorized" error:**
- Make sure you clicked the email verification link
- Check if SendGrid sent you any additional verification emails
- Try creating a new account with a different email if issues persist
- Contact SendGrid support if account is stuck

## Step 2: Create API Key

1. Once logged in, go to **Settings** → **API Keys** (or visit https://app.sendgrid.com/settings/api_keys)
2. Click **"Create API Key"** button
3. Give it a name like "Petflix Production"
4. Choose **"Restricted Access"**
5. Under **"Mail Send"**, enable the permission
6. Click **"Create & View"**
7. **IMPORTANT**: Copy the API key immediately (you won't be able to see it again!)
   - It will look like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## Step 3: Verify Single Sender (No Domain Needed!)

**IMPORTANT**: If you see a page asking for a domain, you're in the wrong place!

1. Go to **Settings** → **Sender Authentication** (or visit https://app.sendgrid.com/settings/sender_auth)
2. You should see two options:
   - **"Authenticate Your Domain"** ← Skip this (requires domain)
   - **"Verify a Single Sender"** ← Click this one!
3. If you only see domain authentication:
   - Look for a tab or menu that says "Single Sender" or "Email Address"
   - Or try this direct link: https://app.sendgrid.com/settings/sender_auth/senders/new
   - You might need to click "Skip" or "Cancel" on the domain page first
4. Click **"Verify a Single Sender"** or **"Create a Sender"** button
3. Fill out the form:
   - **From Email Address**: Use your personal email (e.g., `yourname@gmail.com`)
   - **From Name**: Your name or "Petflix" (this is what recipients will see)
   - **Reply To**: Same as From Email Address
   - **Company Address**: Your address (required)
   - **City**: Your city
   - **State**: Your state
   - **Country**: Your country
   - **Zip Code**: Your zip code
4. Click **"Create"**
5. **Check your email inbox** - SendGrid will send you a verification email
6. Click the verification link in the email
7. Wait for verification (usually instant, but can take a few minutes)

## Step 4: Configure Your Backend

1. Open `backend/.env` file
2. Add or update these lines:

```env
# Email Service Configuration
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_actual_api_key_here
SENDGRID_FROM_EMAIL=your-verified-email@example.com
```

**Important**: 
- Replace `SG.your_actual_api_key_here` with the API key you copied in Step 2
- Replace `your-verified-email@example.com` with the exact email address you verified in Step 3

## Step 5: Install SendGrid Package (if needed)

The package should already be installed, but if you get errors, run:

```bash
cd backend
npm install @sendgrid/mail
```

## Step 6: Test It!

1. Restart your backend server:
   ```bash
   cd backend
   npm run dev
   ```

2. Try changing your email in the Settings page
3. Check your email inbox (the new email address you're changing to)
4. You should receive the verification email!

## Troubleshooting

### "Invalid API Key"
- Make sure you copied the entire API key (it's very long)
- Check there are no extra spaces
- Verify the API key is still active in SendGrid dashboard

### "Sender not verified"
- Make sure `SENDGRID_FROM_EMAIL` matches EXACTLY the email you verified
- Check that you clicked the verification link in your email
- Wait a few minutes if you just verified

### "Permission denied"
- Make sure your API key has "Mail Send" permission enabled
- Create a new API key if needed

### Emails going to spam
- This is normal for new SendGrid accounts
- Recipients should check spam folder
- Deliverability improves over time as you send more emails

## Free Tier Limits

- **100 emails per day** (free tier)
- Perfect for testing and small apps
- Upgrade if you need more

## Important Note About Single Sender

**Single Sender Verification** works for production, but:
- ✅ You can send to any email address
- ✅ No domain required
- ⚠️ Some emails might go to spam (less deliverability than domain authentication)
- ⚠️ You can only send FROM the verified email address

For better deliverability later, you can always add domain authentication when you get a domain. But Single Sender works fine for now!

## Next Steps

Once everything works:
- Test welcome emails (register a new account)
- Test password reset emails
- Test email change verification
- Monitor your SendGrid dashboard for delivery stats

---

**Need Help?**
- SendGrid Support: https://support.sendgrid.com
- Check SendGrid dashboard for delivery logs
- Look at backend console for error messages

