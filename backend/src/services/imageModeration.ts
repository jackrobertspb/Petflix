// Profile Picture Content Moderation
// Basic image validation and moderation checks

import sharp from 'sharp';

export interface ImageModerationResult {
  approved: boolean;
  reason?: string;
  warnings?: string[];
}

/**
 * Basic image moderation checks
 * Note: For production, integrate with a service like AWS Rekognition, Google Cloud Vision API, or similar
 */
export async function moderateProfilePicture(
  imageBuffer: Buffer,
  _imageType: string
): Promise<ImageModerationResult> {
  const warnings: string[] = [];

  try {
    // 1. Validate image dimensions
    // Wrap in try-catch in case sharp fails to load at runtime (native module issues)
    let metadata;
    try {
      metadata = await sharp(imageBuffer).metadata();
    } catch (sharpError: any) {
      console.warn('⚠️ Sharp processing failed, skipping image moderation:', sharpError);
      // Return approved if sharp fails (don't block uploads)
      return {
        approved: true,
        warnings: ['Image moderation unavailable - upload allowed']
      };
    }
    
    if (!metadata.width || !metadata.height) {
      return {
        approved: false,
        reason: 'Invalid image: Could not read dimensions'
      };
    }

    // Check minimum dimensions (prevent tiny images)
    if (metadata.width < 50 || metadata.height < 50) {
      return {
        approved: false,
        reason: 'Image too small: Minimum dimensions are 50x50 pixels'
      };
    }

    // Check maximum dimensions (prevent extremely large images)
    if (metadata.width > 5000 || metadata.height > 5000) {
      return {
        approved: false,
        reason: 'Image too large: Maximum dimensions are 5000x5000 pixels'
      };
    }

    // Warn if image is not square (profile pictures work best as squares)
    const aspectRatio = metadata.width / metadata.height;
    if (aspectRatio < 0.8 || aspectRatio > 1.2) {
      warnings.push('Profile pictures work best as square images (1:1 aspect ratio)');
    }

    // 2. Check file size (already done in route, but double-check)
    if (imageBuffer.length > 5 * 1024 * 1024) {
      return {
        approved: false,
        reason: 'Image too large: Maximum file size is 5MB'
      };
    }

    // 3. Validate image format
    const allowedFormats = ['jpeg', 'png', 'gif', 'webp'];
    if (!metadata.format || !allowedFormats.includes(metadata.format)) {
      return {
        approved: false,
        reason: `Unsupported image format: ${metadata.format}. Allowed formats: ${allowedFormats.join(', ')}`
      };
    }

    // 4. Basic content checks (can be enhanced with ML services)
    // For now, we'll do basic checks:
    // - Check if image is mostly transparent (GIF/PNG with alpha)
    if (metadata.hasAlpha && (metadata.format === 'png' || metadata.format === 'gif')) {
      // This is just a warning, not a rejection
      warnings.push('Transparent images may not display well as profile pictures');
    }

    // ML-based content moderation (if configured)
    const mlProvider = process.env.IMAGE_MODERATION_PROVIDER || 'none';
    
    if (mlProvider !== 'none' && mlProvider !== 'console') {
      try {
        const mlResult = await moderateWithML(imageBuffer, mlProvider);
        if (!mlResult.approved) {
          return {
            approved: false,
            reason: mlResult.reason || 'Content moderation flagged inappropriate content',
            warnings
          };
        }
        if (mlResult.warnings) {
          warnings.push(...mlResult.warnings);
        }
      } catch (error) {
        console.error(`ML moderation error (${mlProvider}):`, error);
        // Fall through - don't block upload on ML service errors
        warnings.push('Content moderation service unavailable - manual review may be required');
      }
    }

    return {
      approved: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    console.error('Image moderation error:', error);
    return {
      approved: false,
      reason: 'Failed to process image: Invalid or corrupted image file'
    };
  }
}

/**
 * ML-based content moderation
 * Supports multiple providers: AWS Rekognition, Google Cloud Vision, etc.
 */
async function moderateWithML(
  imageBuffer: Buffer,
  provider: string
): Promise<ImageModerationResult> {
  switch (provider) {
    case 'aws-rekognition':
      return await moderateWithAWSRekognition(imageBuffer);
    case 'google-vision':
      return await moderateWithGoogleVision(imageBuffer);
    case 'sightengine':
      return await moderateWithSightengine(imageBuffer);
    default:
      console.warn(`Unknown ML provider: ${provider}`);
      return { approved: true };
  }
}

/**
 * AWS Rekognition - DetectModerationLabels
 * Docs: https://docs.aws.amazon.com/rekognition/latest/dg/moderation.html
 */
async function moderateWithAWSRekognition(
  imageBuffer: Buffer
): Promise<ImageModerationResult> {
  const AWS_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
  const AWS_SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY;
  const AWS_REGION = process.env.AWS_REGION || 'us-east-1';

  if (!AWS_ACCESS_KEY || !AWS_SECRET_KEY) {
    throw new Error('AWS credentials not configured');
  }

  // Dynamic import to avoid requiring AWS SDK if not used
  // @ts-expect-error - Optional dependency, types may not be available
  const { RekognitionClient, DetectModerationLabelsCommand } = await import('@aws-sdk/client-rekognition');

  const client = new RekognitionClient({
    region: AWS_REGION,
    credentials: {
      accessKeyId: AWS_ACCESS_KEY,
      secretAccessKey: AWS_SECRET_KEY,
    },
  });

  const command = new DetectModerationLabelsCommand({
    Image: {
      Bytes: imageBuffer,
    },
    MinConfidence: parseFloat(process.env.AWS_REKOGNITION_MIN_CONFIDENCE || '75'),
  });

  const response = await client.send(command);
  const labels = response.ModerationLabels || [];
  const warnings: string[] = [];

  // Check for inappropriate content
  const blockedCategories = ['Explicit Nudity', 'Violence', 'Visually Disturbing'];
  const flaggedLabels = labels.filter(
    (label: any) => label.Confidence && label.Confidence >= 75 && label.ParentName && blockedCategories.includes(label.ParentName)
  );

  if (flaggedLabels.length > 0) {
    const reasons = flaggedLabels.map(
      (label: any) => `${label.Name} (${Math.round(label.Confidence || 0)}% confidence)`
    );
    return {
      approved: false,
      reason: `Inappropriate content detected: ${reasons.join(', ')}`,
    };
  }

  // Check for warning categories (allow but warn)
  const warningCategories = ['Suggestive', 'Hate Symbols', 'Drugs'];
  const warnLabels = labels.filter(
    (label: any) => label.Confidence && label.Confidence >= 60 && label.ParentName && warningCategories.includes(label.ParentName)
  );

  if (warnLabels.length > 0) {
    warnLabels.forEach((label: any) => {
      warnings.push(`Detected: ${label.Name} (${Math.round(label.Confidence || 0)}% confidence)`);
    });
  }

  return {
    approved: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Google Cloud Vision API - SafeSearch Detection
 * Docs: https://cloud.google.com/vision/docs/detecting-safe-search
 */
async function moderateWithGoogleVision(
  imageBuffer: Buffer
): Promise<ImageModerationResult> {
  const GOOGLE_API_KEY = process.env.GOOGLE_CLOUD_API_KEY;

  if (!GOOGLE_API_KEY) {
    throw new Error('Google Cloud API key not configured');
  }

  // Use REST API (simpler than SDK for single operation)
  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: [
          {
            image: {
              content: imageBuffer.toString('base64'),
            },
            features: [{ type: 'SAFE_SEARCH_DETECTION' }],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`Google Vision API error: ${response.statusText}`);
  }

  const data = await response.json() as any;
  const safeSearch = data.responses[0]?.safeSearchAnnotation;

  if (!safeSearch) {
    throw new Error('No SafeSearch data returned');
  }

  // Likelihood levels: UNKNOWN, VERY_UNLIKELY, UNLIKELY, POSSIBLE, LIKELY, VERY_LIKELY
  const warnings: string[] = [];

  // Block if LIKELY or VERY_LIKELY for these categories
  if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.adult)) {
    return {
      approved: false,
      reason: 'Adult content detected',
    };
  }

  if (['LIKELY', 'VERY_LIKELY'].includes(safeSearch.violence)) {
    return {
      approved: false,
      reason: 'Violent content detected',
    };
  }

  // Warn if POSSIBLE
  if (safeSearch.adult === 'POSSIBLE') {
    warnings.push('Possible adult content - manual review recommended');
  }

  if (safeSearch.spoof === 'LIKELY' || safeSearch.spoof === 'VERY_LIKELY') {
    warnings.push('Image may be spoofed or manipulated');
  }

  return {
    approved: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Sightengine - Third-party moderation API
 * Docs: https://sightengine.com/docs/
 */
async function moderateWithSightengine(
  imageBuffer: Buffer
): Promise<ImageModerationResult> {
  const SIGHTENGINE_API_USER = process.env.SIGHTENGINE_API_USER;
  const SIGHTENGINE_API_SECRET = process.env.SIGHTENGINE_API_SECRET;

  if (!SIGHTENGINE_API_USER || !SIGHTENGINE_API_SECRET) {
    throw new Error('Sightengine credentials not configured');
  }

  // Create form data for image upload
  const formData = new FormData();
  formData.append('media', new Blob([imageBuffer]), 'image.jpg');
  formData.append('models', 'nudity-2.0,offensive,gore-2.0');
  formData.append('api_user', SIGHTENGINE_API_USER);
  formData.append('api_secret', SIGHTENGINE_API_SECRET);

  const response = await fetch('https://api.sightengine.com/1.0/check.json', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Sightengine API error: ${response.statusText}`);
  }

  const data = await response.json() as any;
  const warnings: string[] = [];

  // Check nudity score (0-1)
  if (data.nudity?.raw >= 0.8) {
    return {
      approved: false,
      reason: 'Explicit content detected',
    };
  }

  // Check offensive content
  if (data.offensive?.prob >= 0.8) {
    return {
      approved: false,
      reason: 'Offensive content detected',
    };
  }

  // Check gore
  if (data.gore?.prob >= 0.8) {
    return {
      approved: false,
      reason: 'Graphic/disturbing content detected',
    };
  }

  // Add warnings for medium-confidence detections
  if (data.nudity?.raw >= 0.5) {
    warnings.push('Potentially suggestive content detected');
  }

  if (data.offensive?.prob >= 0.5) {
    warnings.push('Potentially offensive content detected');
  }

  return {
    approved: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}


