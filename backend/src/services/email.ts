/**
 * Email service for sending transactional emails
 * Supports multiple providers (SendGrid, AWS SES, etc.)
 * 
 * For development, emails are logged to console
 * For production, configure EMAIL_PROVIDER and credentials
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const provider = process.env.EMAIL_PROVIDER || 'console';
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  // Development: Log to console
  if (provider === 'console' || process.env.NODE_ENV !== 'production') {
    console.log('\n📧 EMAIL SENT (Console Mode)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(options.html);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    return;
  }

  // Production: Use configured provider
  switch (provider) {
    case 'sendgrid':
      await sendViaSendGrid(options);
      break;
    case 'ses':
      await sendViaSES(options);
      break;
    default:
      console.warn(`Unknown email provider: ${provider}. Falling back to console.`);
      console.log('📧 EMAIL:', options);
  }
}

async function sendViaSendGrid(options: EmailOptions): Promise<void> {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    throw new Error('SENDGRID_API_KEY not configured');
  }

  // Dynamic import to avoid requiring sendgrid in development
  const sgMail = await import('@sendgrid/mail');
  sgMail.default.setApiKey(apiKey);

  await sgMail.default.send({
    to: options.to,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@petflix.com',
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''),
  });
}

async function sendViaSES(options: EmailOptions): Promise<void> {
  // AWS SES implementation would go here
  // For now, log that it would be sent
  console.log('📧 [AWS SES] Would send email:', options);
  throw new Error('AWS SES integration not yet implemented');
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(email: string, username: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ADD8E6 0%, #F0F0DC 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #ADD8E6; color: #36454F; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #36454F;">🐾 Welcome to Petflix!</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>Welcome to Petflix! We're excited to have you join our community of pet video enthusiasts.</p>
          <p>Get started by:</p>
          <ul>
            <li>🔍 Searching for your favorite pet videos</li>
            <li>📤 Sharing videos you love</li>
            <li>👥 Following other pet lovers</li>
            <li>💬 Commenting and engaging with the community</li>
          </ul>
          <p style="text-align: center;">
            <a href="${frontendUrl}/feed" class="button">Start Exploring</a>
          </p>
          <p>Happy watching! 🎬</p>
          <p>— The Petflix Team</p>
        </div>
        <div class="footer">
          <p>This email was sent to ${email}. If you didn't create an account, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to Petflix! 🐾',
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(email: string, username: string, resetToken: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  const expiresIn = process.env.PASSWORD_RESET_EXPIRY || '1 hour';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ADD8E6 0%, #F0F0DC 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #ADD8E6; color: #36454F; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .code { background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #36454F;">🔑 Reset Your Password</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>We received a request to reset your password for your Petflix account.</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Reset Password</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <div class="code">${resetLink}</div>
          <div class="warning">
            <strong>⚠️ Important:</strong> This link will expire in ${expiresIn}. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </div>
          <p>— The Petflix Team</p>
        </div>
        <div class="footer">
          <p>This email was sent to ${email}. If you didn't request a password reset, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Reset Your Petflix Password',
    html,
  });
}

/**
 * Send email verification for email address change
 */
export async function sendEmailVerificationEmail(email: string, username: string, verificationToken: string): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationLink = `${frontendUrl}/verify-email?token=${verificationToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ADD8E6 0%, #F0F0DC 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #fff; padding: 30px; border: 1px solid #ddd; border-top: none; }
        .button { display: inline-block; padding: 12px 30px; background: #ADD8E6; color: #36454F; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .code { background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace; word-break: break-all; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin: 0; color: #36454F;">✉️ Verify Your Email Address</h1>
        </div>
        <div class="content">
          <p>Hi ${username},</p>
          <p>You've requested to change your email address on Petflix. Please verify your new email address by clicking the button below:</p>
          <p style="text-align: center;">
            <a href="${verificationLink}" class="button">Verify Email Address</a>
          </p>
          <p>Or copy and paste this link into your browser:</p>
          <div class="code">${verificationLink}</div>
          <div class="warning">
            <strong>⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't request this email change, please ignore this email or contact support.
          </div>
          <p>— The Petflix Team</p>
        </div>
        <div class="footer">
          <p>This email was sent to ${email}. If you didn't request an email change, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Verify Your New Email Address - Petflix',
    html,
  });
}

