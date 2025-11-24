# Profile Picture Content Moderation Setup

## Overview

Petflix includes ML-based content moderation for profile pictures to automatically detect and block inappropriate images. This is optional but highly recommended for production.

**Basic validation (always active)**:
- ✅ Image dimensions (50px - 5000px)
- ✅ File size (max 5MB)
- ✅ Format validation (JPEG, PNG, GIF, WebP)
- ✅ Aspect ratio warnings

**ML-based moderation (optional)**:
- 🤖 Detect adult/explicit content
- 🤖 Detect violence/gore
- 🤖 Detect offensive content
- 🤖 Detect hate symbols
- 🤖 Spoofed/manipulated images

---

## Supported Providers

### 1. AWS Rekognition (Recommended)

**Best for**: AWS users, high accuracy, comprehensive categories

**Pricing**:
- First 5,000 images/month: $1.00 per 1,000
- Next 45,000 images/month: $0.80 per 1,000
- Over 50,000 images/month: $0.60 per 1,000

**Pros**:
- ✅ Highly accurate
- ✅ Comprehensive moderation labels
- ✅ Confidence scores for fine-tuning
- ✅ Part of AWS ecosystem

**Cons**:
- ❌ Requires AWS account
- ❌ More complex setup

---

### 2. Google Cloud Vision API

**Best for**: Google Cloud users, good balance of features and simplicity

**Pricing**:
- First 1,000 images/month: Free
- Next 4,999,000 images/month: $1.50 per 1,000
- Over 5M images/month: Contact sales

**Pros**:
- ✅ Free tier (1,000 images/month)
- ✅ Simple REST API
- ✅ SafeSearch detection
- ✅ Good accuracy

**Cons**:
- ❌ Fewer categories than AWS
- ❌ Requires Google Cloud account

---

### 3. Sightengine

**Best for**: Simplicity, no cloud account needed, dedicated moderation service

**Pricing**:
- Free tier: 2,000 images/month
- Starter: $49/month (10,000 images)
- Business: $199/month (100,000 images)

**Pros**:
- ✅ Dedicated moderation service
- ✅ Very simple setup (API key only)
- ✅ No cloud account needed
- ✅ Free tier available

**Cons**:
- ❌ More expensive at scale
- ❌ Less flexible than AWS/Google

---

## Setup Instructions

### Option 1: AWS Rekognition (Recommended)

#### Step 1: Create AWS Account
1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create an account
3. Enable billing (free tier available)

#### Step 2: Enable Rekognition
1. Go to AWS Console
2. Search for "Rekognition"
3. Enable the service in your region

#### Step 3: Create IAM User
1. Go to IAM → Users → Create User
2. Give name: `petflix-rekognition`
3. Attach policy: `AmazonRekognitionReadOnlyAccess` (or create custom)
4. Create Access Key
5. Save Access Key ID and Secret Access Key

#### Step 4: Configure Environment

Add to `backend/.env`:
```env
IMAGE_MODERATION_PROVIDER=aws-rekognition
AWS_ACCESS_KEY_ID=AKIAXXXXXXXXXXXXXXXX
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AWS_REGION=us-east-1
AWS_REKOGNITION_MIN_CONFIDENCE=75
```

#### Step 5: Install AWS SDK
```bash
cd backend
npm install @aws-sdk/client-rekognition
```

#### Step 6: Test
Upload a profile picture and check logs for moderation results.

---

### Option 2: Google Cloud Vision API

#### Step 1: Create Google Cloud Project
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project: "Petflix"
3. Enable billing (free tier available)

#### Step 2: Enable Vision API
1. Go to APIs & Services → Library
2. Search for "Cloud Vision API"
3. Click "Enable"

#### Step 3: Create API Key
1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → API Key
3. Copy API key
4. (Optional) Restrict API key to Vision API only

#### Step 4: Configure Environment

Add to `backend/.env`:
```env
IMAGE_MODERATION_PROVIDER=google-vision
GOOGLE_CLOUD_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

#### Step 5: Test
Upload a profile picture and check logs for moderation results.

**Note**: No additional packages needed! Uses REST API.

---

### Option 3: Sightengine

#### Step 1: Sign up
1. Go to [sightengine.com](https://sightengine.com)
2. Create account
3. Get API credentials from dashboard

#### Step 2: Configure Environment

Add to `backend/.env`:
```env
IMAGE_MODERATION_PROVIDER=sightengine
SIGHTENGINE_API_USER=your-api-user
SIGHTENGINE_API_SECRET=your-api-secret
```

#### Step 3: Test
Upload a profile picture and check logs for moderation results.

**Note**: No additional packages needed! Uses REST API.

---

## Configuration Options

### Confidence Thresholds

**AWS Rekognition**:
```env
# Minimum confidence to block (0-100)
# Higher = fewer false positives, but may miss some inappropriate content
# Lower = catches more, but more false positives
AWS_REKOGNITION_MIN_CONFIDENCE=75  # Default: 75
```

**Blocked categories** (hardcoded):
- Explicit Nudity (≥75% confidence)
- Violence (≥75% confidence)
- Visually Disturbing (≥75% confidence)

**Warning categories** (allow but log):
- Suggestive (≥60% confidence)
- Hate Symbols (≥60% confidence)
- Drugs (≥60% confidence)

### Custom Thresholds

To customize thresholds, edit `backend/src/services/imageModeration.ts`:

```typescript
// In moderateWithAWSRekognition function
const blockedCategories = ['Explicit Nudity', 'Violence', 'Visually Disturbing'];
const blockThreshold = 75; // Change this

// In moderateWithGoogleVision function
if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.adult)) {
  // Adjust to block at lower confidence: ['POSSIBLE', 'LIKELY', 'VERY_LIKELY']
}
```

---

## Testing Content Moderation

### Test Images
Use these test resources:
- [NSFW JS Test Images](https://github.com/infinitered/nsfwjs/tree/master/example/assets)
- [Google's SafeSearch Test](https://cloud.google.com/vision/docs/drag-and-drop)

### Manual Testing
1. Enable moderation in `.env`
2. Restart backend: `npm run dev`
3. Go to Profile → Settings
4. Upload a test image
5. Check backend console logs

Expected output:
```
Content moderation check...
AWS Rekognition result: { approved: false, reason: 'Explicit Nudity (92% confidence)' }
```

### Automated Testing
Create test script `backend/src/test-moderation.ts`:

```typescript
import { moderateProfilePicture } from './services/imageModeration';
import fs from 'fs';

async function test() {
  const imageBuffer = fs.readFileSync('test-image.jpg');
  const result = await moderateProfilePicture(imageBuffer, 'image/jpeg');
  console.log('Moderation result:', result);
}

test();
```

Run: `npx tsx src/test-moderation.ts`

---

## Fallback Behavior

If ML moderation fails (service down, API error, etc.):
- ✅ Upload is **allowed** (fail open, not fail closed)
- ⚠️ Warning added: "Content moderation service unavailable"
- 📝 Error logged to console

This ensures uploads aren't blocked due to temporary service issues.

**To change to fail-closed** (block on error):
```typescript
// In imageModeration.ts
} catch (error) {
  console.error(`ML moderation error (${mlProvider}):`, error);
  return {
    approved: false,
    reason: 'Content moderation service unavailable - please try again later'
  };
}
```

---

## Cost Estimation

### Small app (< 1,000 users, ~100 uploads/month):
- **AWS Rekognition**: ~$0.10/month (first 5K free with free tier)
- **Google Vision**: Free (under 1,000/month)
- **Sightengine**: Free (under 2,000/month)

### Medium app (< 10,000 users, ~1,000 uploads/month):
- **AWS Rekognition**: ~$1.00/month
- **Google Vision**: ~$1.50/month
- **Sightengine**: Free (under 2,000/month) or $49/month

### Large app (> 100,000 users, ~10,000 uploads/month):
- **AWS Rekognition**: ~$10/month
- **Google Vision**: ~$15/month
- **Sightengine**: $199/month

**Recommendation**: Start with Google Vision (free tier), switch to AWS at scale.

---

## Best Practices

### 1. Start Without ML (Development)
```env
IMAGE_MODERATION_PROVIDER=none
```
This allows faster development without API setup.

### 2. Add ML Before Launch (Staging/Production)
```env
IMAGE_MODERATION_PROVIDER=google-vision  # or aws-rekognition
```

### 3. Monitor False Positives
- Log all blocked images for review
- Adjust confidence thresholds if needed
- Have manual review process for appeals

### 4. Rate Limiting
Already implemented! Profile picture uploads are rate-limited to prevent abuse.

### 5. Manual Review Queue
Consider adding a manual review system for:
- Borderline content (warnings)
- User appeals
- Edge cases

---

## Troubleshooting

### Problem: "AWS credentials not configured"

**Solution**:
1. Verify `.env` has `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
2. Check credentials are valid (test in AWS Console)
3. Ensure IAM user has Rekognition permissions

### Problem: "Google Vision API error: 403"

**Solutions**:
1. Verify Vision API is enabled in Google Cloud Console
2. Check API key is valid
3. Ensure billing is enabled (required even for free tier)
4. Check API key restrictions (should allow Vision API)

### Problem: Images always approved (no blocking)

**Solutions**:
1. Verify `IMAGE_MODERATION_PROVIDER` is set correctly (not 'none')
2. Check logs for ML moderation errors
3. Test with known inappropriate image
4. Lower confidence threshold if needed

### Problem: Too many false positives

**Solutions**:
1. Increase confidence threshold (e.g., 75 → 85)
2. Review blocked categories (comment out overly strict ones)
3. Switch providers (different providers have different sensitivities)

---

## Security Considerations

### API Key Security
- ✅ Never commit API keys to git
- ✅ Use environment variables
- ✅ Rotate keys periodically
- ✅ Restrict API keys to specific services (when possible)

### Privacy
- Profile picture moderation happens server-side
- Original images are not stored by moderation APIs
- Only moderation labels are logged
- Consider GDPR compliance if serving EU users

### Rate Limiting
Already implemented:
- Upload limiter on profile picture endpoint
- Prevents abuse and cost overruns

---

## Comparison Table

| Feature | AWS Rekognition | Google Vision | Sightengine |
|---------|----------------|---------------|-------------|
| **Free Tier** | 5,000 images/month (1st year) | 1,000 images/month | 2,000 images/month |
| **Pricing** | $1.00 per 1,000 | $1.50 per 1,000 | $49/month (10K) |
| **Setup Complexity** | Medium (IAM, SDK) | Easy (API key only) | Very Easy (API key) |
| **Accuracy** | Excellent | Very Good | Very Good |
| **Categories** | Comprehensive | Basic (SafeSearch) | Comprehensive |
| **Response Time** | Fast (~500ms) | Fast (~300ms) | Medium (~800ms) |
| **Cloud Required** | Yes (AWS) | Yes (Google) | No |
| **Best For** | AWS users, scale | Simplicity, free tier | No cloud account |

---

## Migration Guide

### Switching Providers

1. Update `.env`:
```env
# From:
IMAGE_MODERATION_PROVIDER=google-vision
# To:
IMAGE_MODERATION_PROVIDER=aws-rekognition
```

2. Add new provider credentials
3. Install SDK if needed (AWS only)
4. Restart backend
5. Test with sample image

No code changes needed!

---

## Disabling Moderation

To disable ML moderation (keep basic validation only):

```env
IMAGE_MODERATION_PROVIDER=none
```

Or remove the environment variable entirely.

Basic validation (size, format, dimensions) still applies.

---

## Support

- **AWS Rekognition**: [AWS Support](https://aws.amazon.com/premiumsupport/), [Docs](https://docs.aws.amazon.com/rekognition/)
- **Google Vision**: [Google Cloud Support](https://cloud.google.com/support), [Docs](https://cloud.google.com/vision/docs)
- **Sightengine**: support@sightengine.com, [Docs](https://sightengine.com/docs)

---

## Summary

✅ **Image moderation is now ready!**

**Quick Start**:
1. Choose provider (recommend Google Vision for free tier)
2. Get API credentials
3. Add to `.env`
4. Restart backend
5. Test with sample image

**Production Checklist**:
- [ ] ML moderation provider configured
- [ ] API credentials tested
- [ ] Confidence thresholds tuned
- [ ] False positive monitoring in place
- [ ] Manual review process defined
- [ ] Cost monitoring set up
- [ ] Privacy policy updated (if needed)

