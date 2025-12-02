# Production Email Service Setup Guide

## Overview

Petflix includes a complete email service infrastructure that sends:
- **Welcome emails** when users register
- **Password reset emails** for account recovery
- **Email verification** when users change their email address

In development, emails are logged to the console. For production, you need to configure a real email service provider.

---

## Supported Providers

### 1. Resend (Recommended)
- **Best for**: Modern apps, great DX, Supabase integration
- **Free tier**: 3,000 emails/month, 100 emails/day
- **Pros**: Easy setup, excellent deliverability, modern API
- **Cons**: Newer service (but very reliable)

### 2. SendGrid
- **Best for**: High volume, established service
- **Free tier**: 100 emails/day
- **Pros**: Mature, reliable, lots of features
- **Cons**: More complex setup, older API

### 3. AWS SES
- **Best for**: AWS ecosystem, very high volume
- **Pricing**: Pay as you go ($0.10 per 1,000 emails)
- **Pros**: Cheapest at scale, AWS integration
- **Cons**: Complex setup, needs verification

---

## Setup Instructions

### Option 1: Resend (Recommended)

#### Step 1: Sign up and get API key
1. Go to [resend.com](https://resend.com)
2. Create an account
3. Go to **API Keys** section
4. Click "Create API Key"
5. Copy your API key

#### Step 2: Configure environment variables

Add to `backend/.env`:
```env
# Email Service Configuration
EMAIL_PROVIDER=resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxx

# For testing (no domain setup needed):
RESEND_FROM_EMAIL=onboarding@resend.dev

# For production (after verifying your domain):
# RESEND_FROM_EMAIL=noreply@yourdomain.com
```

#### Step 3: Testing mode (Free)
In testing mode, you can send to **any email address that matches your Resend account email**:
- If your Resend account email is `you@example.com`, you can send to `you@example.com`
- Use `onboarding@resend.dev` as the FROM address
- No domain verification needed!

#### Step 4: Production mode (Verify domain)
For production, to send to any email address:
1. Go to [resend.com/domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `petflix.com`)
4. Add the DNS records to your domain provider:
   - TXT record for domain verification
   - MX records (optional, for receiving replies)
5. Wait for verification (usually 1-5 minutes)
6. Update `RESEND_FROM_EMAIL` to use your domain:
   ```env
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   ```

#### Step 5: Test emails
```bash
cd backend
npm run dev
```

Register a new user and check:
- Console logs show email was sent
- Check your email inbox (if in testing mode, use your Resend account email)
- Verify welcome email arrived

---

### Option 2: SendGrid

#### Step 1: Sign up and get API key
1. Go to [sendgrid.com](https://sendgrid.com)
2. Create an account
3. Go to **Settings → API Keys**
4. Click "Create API Key"
5. Choose "Restricted Access" and enable "Mail Send" permission
6. Copy your API key

#### Step 2: Verify sender identity
SendGrid requires sender verification:
1. Go to **Settings → Sender Authentication**
2. Choose either:
   - **Single Sender Verification** (easier, for testing)
   - **Domain Authentication** (better, for production)
3. Follow the verification steps

#### Step 3: Configure environment variables

Add to `backend/.env`:
```env
# Email Service Configuration
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

Make sure `SENDGRID_FROM_EMAIL` matches your verified sender.

#### Step 4: Test emails
```bash
cd backend
npm run dev
```

Register a new user and check your email inbox.

---

### Option 3: AWS SES

#### Step 1: Set up AWS SES
1. Go to [AWS SES Console](https://console.aws.amazon.com/ses/)
2. Choose your region
3. Request production access (starts in sandbox mode)
4. Verify your email or domain

#### Step 2: Get AWS credentials
1. Create IAM user with SES permissions
2. Get Access Key ID and Secret Access Key

#### Step 3: Implement AWS SES in code
Currently, AWS SES requires implementation in `backend/src/services/email.ts`:
```typescript
// Add AWS SDK
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

async function sendViaSES(options: EmailOptions): Promise<void> {
  const client = new SESClient({
    region: process.env.AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  });

  const command = new SendEmailCommand({
    Source: process.env.AWS_SES_FROM_EMAIL || 'noreply@petflix.com',
    Destination: {
      ToAddresses: [options.to],
    },
    Message: {
      Subject: {
        Data: options.subject,
      },
      Body: {
        Html: {
          Data: options.html,
        },
        Text: {
          Data: options.text || options.html.replace(/<[^>]*>/g, ''),
        },
      },
    },
  });

  await client.send(command);
}
```

Add to `backend/.env`:
```env
EMAIL_PROVIDER=ses
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_SES_FROM_EMAIL=noreply@yourdomain.com
```

---

## Email Templates

Petflix includes three pre-built email templates:

### 1. Welcome Email
**Trigger**: New user registration  
**Function**: `sendWelcomeEmail(email, username)`  
**Content**:
- Welcome message
- Getting started tips
- Link to explore feed

### 2. Password Reset Email
**Trigger**: User requests password reset  
**Function**: `sendPasswordResetEmail(email, username, resetToken)`  
**Content**:
- Reset password link
- Expiration time (1 hour)
- Security warning

### 3. Email Verification Email
**Trigger**: User changes email address  
**Function**: `sendEmailVerificationEmail(email, username, verificationToken)`  
**Content**:
- Verification link
- Expiration time (24 hours)
- Security notice

---

## Troubleshooting

### Problem: Emails not sending

**Check 1: Environment variables**
```bash
# In backend directory
cat .env | grep EMAIL
```
Should show:
```
EMAIL_PROVIDER=resend  # or sendgrid, ses
RESEND_API_KEY=re_xxx...  # (if using Resend)
RESEND_FROM_EMAIL=onboarding@resend.dev  # or your domain
```

**Check 2: Console logs**
```bash
cd backend
npm run dev
# Register a user and watch logs
```

Look for:
- `✅ Email sent via Resend` (success)
- `⚠️ Resend Testing Mode Restriction` (need to send to verified email)
- `Failed to send email` (error - check API key)

**Check 3: API key validity**
- Log into your email provider dashboard
- Verify API key is active and not expired
- Check rate limits haven't been exceeded

### Problem: Resend "Testing Mode Restriction"

**Error**: "You can only send testing emails to your verified email address"

**Solution**:
- Option 1: Send test emails to your Resend account email
- Option 2: Verify a domain (see Resend production setup above)

### Problem: SendGrid sender verification failed

**Solution**:
1. Check email for verification link
2. Or go to SendGrid dashboard → Sender Authentication
3. Complete verification process
4. Make sure `SENDGRID_FROM_EMAIL` matches verified sender

---

## Testing Checklist

Before going to production:

- [ ] Environment variables configured correctly
- [ ] API key tested and valid
- [ ] Welcome email sends on registration
- [ ] Password reset email sends (test forgot password flow)
- [ ] Email verification sends (test email change flow)
- [ ] FROM address looks professional (use your domain, not default)
- [ ] Email deliverability tested (check spam folder)
- [ ] Rate limits understood (won't exceed free tier)
- [ ] Monitoring set up (check email provider dashboard regularly)

---

## Production Best Practices

1. **Use your own domain**
   - Verify your domain with your email provider
   - Use `noreply@yourdomain.com` instead of default addresses
   - Improves deliverability and looks professional

2. **Monitor email metrics**
   - Check provider dashboard weekly
   - Watch for bounce rates > 5%
   - Monitor spam complaints
   - Track delivery rates

3. **Handle failures gracefully**
   - Current implementation logs errors but doesn't break user flow
   - Users can still log in even if welcome email fails
   - Consider adding retry logic for critical emails

4. **Set up email forwarding**
   - For `noreply@` addresses, consider forwarding to support inbox
   - Users may reply to emails even if marked "no-reply"

5. **Respect email limits**
   - Resend free tier: 3,000/month, 100/day
   - SendGrid free tier: 100/day
   - Upgrade plan before hitting limits

---

## Cost Estimation

### Small app (< 1,000 users):
- **Resend**: Free (< 3,000 emails/month)
- **SendGrid**: Free (< 100 emails/day)
- **AWS SES**: ~$1/month

### Medium app (< 10,000 users):
- **Resend**: $20/month (50,000 emails)
- **SendGrid**: $19.95/month (40,000 emails)
- **AWS SES**: ~$10/month

### Large app (> 100,000 users):
- **Resend**: $110/month (1M emails)
- **SendGrid**: $89.95/month (1.5M emails)
- **AWS SES**: ~$100/month (1M emails)

---

## Support

- **Resend**: [docs.resend.com](https://resend.com/docs) | support@resend.com
- **SendGrid**: [docs.sendgrid.com](https://docs.sendgrid.com) | Live chat available
- **AWS SES**: [AWS SES Docs](https://docs.aws.amazon.com/ses/) | AWS Support

---

## Quick Start (TL;DR)

```bash
# 1. Sign up at resend.com
# 2. Get API key from dashboard
# 3. Add to backend/.env:
echo "EMAIL_PROVIDER=resend" >> backend/.env
echo "RESEND_API_KEY=your_key_here" >> backend/.env
echo "RESEND_FROM_EMAIL=onboarding@resend.dev" >> backend/.env

# 4. Restart server
cd backend
npm run dev

# 5. Test by registering a new user
```

Done! 🎉

