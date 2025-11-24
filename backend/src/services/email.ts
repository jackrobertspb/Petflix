/**
 * Email service for sending transactional emails
 * Supports multiple providers (Resend, SendGrid, etc.)
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

  // Development/Console mode: Log to console
  if (provider === 'console') {
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
    case 'resend':
      await sendViaResend(options);
      break;
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

async function sendViaResend(options: EmailOptions): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('RESEND_API_KEY not configured');
  }

  // Dynamic import to avoid requiring resend in development
  const { Resend } = await import('resend');
  const resend = new Resend(apiKey);

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
  
  const { data, error } = await resend.emails.send({
    from: fromEmail,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || options.html.replace(/<[^>]*>/g, ''),
  });

  if (error) {
    console.error('Resend email error:', error);
    
    // If it's a domain/recipient restriction error, provide helpful message
    if (error.statusCode === 403 && error.message?.includes('only send testing emails')) {
      console.warn('⚠️  Resend Testing Mode Restriction:');
      console.warn('   You can only send to your verified email address in testing mode.');
      console.warn('   For production, verify a domain at resend.com/domains');
      console.warn(`   Attempted to send to: ${options.to}`);
    }
    
    throw new Error(`Failed to send email via Resend: ${error.message}`);
  }

  console.log(`✅ Email sent via Resend. ID: ${data?.id}`);
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
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #36454F; 
          background: #f8f9fa;
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(173, 216, 230, 0.15);
          border: 1px solid #e8f4f8;
        }
        .header { 
          background: linear-gradient(135deg, #ADD8E6 0%, #87CEEB 50%, #F0F0DC 100%); 
          padding: 45px 30px; 
          text-align: center;
        }
        .logo {
          font-size: 56px;
          margin-bottom: 12px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        .content { 
          background: #ffffff; 
          padding: 40px 35px; 
          color: #36454F;
        }
        .content p {
          color: #36454F;
          margin: 16px 0;
          font-size: 16px;
        }
        .content ul {
          margin: 24px 0;
          padding-left: 24px;
        }
        .content li {
          color: #36454F;
          margin: 12px 0;
          font-size: 15px;
        }
        .button { 
          display: inline-block; 
          padding: 15px 40px; 
          background: linear-gradient(135deg, #ADD8E6 0%, #87CEEB 100%); 
          color: #36454F; 
          text-decoration: none; 
          border-radius: 10px; 
          font-weight: 700; 
          margin: 28px 0;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(173, 216, 230, 0.3);
        }
        .button:hover {
          background: linear-gradient(135deg, #87CEEB 0%, #ADD8E6 100%);
          box-shadow: 0 6px 16px rgba(173, 216, 230, 0.4);
          transform: translateY(-2px);
        }
        .footer { 
          text-align: center; 
          padding: 28px 35px; 
          color: #8899a6; 
          font-size: 13px;
          background: #f8f9fa;
          border-top: 1px solid #e8f4f8;
        }
        .highlight {
          color: #5FA8D3;
          font-weight: 700;
        }
        .welcome-text {
          font-size: 17px;
          color: #5a6c7d;
          line-height: 1.7;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🐾</div>
          <h1 style="margin: 0; color: #36454F; font-size: 36px; font-weight: 800; text-shadow: 0 2px 4px rgba(255,255,255,0.8);">Welcome to Petflix!</h1>
        </div>
        <div class="content">
          <p style="font-size: 19px; margin-bottom: 8px;">Hi <span class="highlight">${username}</span>,</p>
          <p class="welcome-text">Welcome to Petflix! We're thrilled to have you join our community of pet video enthusiasts. 🎉</p>
          <p style="margin-top: 28px; font-weight: 700; color: #36454F; font-size: 16px;">Get started by:</p>
          <ul>
            <li>🔍 Searching for your favorite pet videos</li>
            <li>📤 Sharing videos you love with the community</li>
            <li>👥 Following other pet lovers</li>
            <li>💬 Commenting and engaging with fellow enthusiasts</li>
          </ul>
          <p style="text-align: center; margin-top: 38px;">
            <a href="${frontendUrl}/feed" class="button">Start Exploring →</a>
          </p>
          <p style="margin-top: 32px; font-size: 16px;">Happy watching! 🎬</p>
          <p style="color: #8899a6; margin-top: 20px;">— The Petflix Team</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">This email was sent to ${email}. If you didn't create an account, please ignore this email.</p>
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
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #36454F; 
          background: #f8f9fa;
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(173, 216, 230, 0.15);
          border: 1px solid #e8f4f8;
        }
        .header { 
          background: linear-gradient(135deg, #ADD8E6 0%, #87CEEB 50%, #F0F0DC 100%); 
          padding: 45px 30px; 
          text-align: center;
        }
        .logo {
          font-size: 56px;
          margin-bottom: 12px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        .content { 
          background: #ffffff; 
          padding: 40px 35px; 
          color: #36454F;
        }
        .content p {
          color: #36454F;
          margin: 16px 0;
          font-size: 16px;
        }
        .button { 
          display: inline-block; 
          padding: 15px 40px; 
          background: linear-gradient(135deg, #ADD8E6 0%, #87CEEB 100%); 
          color: #36454F; 
          text-decoration: none; 
          border-radius: 10px; 
          font-weight: 700; 
          margin: 28px 0;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(173, 216, 230, 0.3);
        }
        .button:hover {
          background: linear-gradient(135deg, #87CEEB 0%, #ADD8E6 100%);
          box-shadow: 0 6px 16px rgba(173, 216, 230, 0.4);
          transform: translateY(-2px);
        }
        .warning { 
          background: #fff8e1; 
          border-left: 4px solid #ffc107; 
          padding: 20px; 
          margin: 28px 0;
          border-radius: 8px;
        }
        .footer { 
          text-align: center; 
          padding: 28px 35px; 
          color: #8899a6; 
          font-size: 13px;
          background: #f8f9fa;
          border-top: 1px solid #e8f4f8;
        }
        .code { 
          background: #f1f8fc; 
          padding: 18px; 
          border-radius: 8px; 
          font-family: 'Courier New', monospace; 
          word-break: break-all;
          border: 1px solid #d4e9f7;
          color: #5FA8D3;
          font-size: 13px;
          line-height: 1.5;
        }
        .highlight {
          color: #5FA8D3;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🔑</div>
          <h1 style="margin: 0; color: #36454F; font-size: 36px; font-weight: 800; text-shadow: 0 2px 4px rgba(255,255,255,0.8);">Reset Your Password</h1>
        </div>
        <div class="content">
          <p style="font-size: 19px; margin-bottom: 8px;">Hi <span class="highlight">${username}</span>,</p>
          <p style="font-size: 16px; color: #5a6c7d; line-height: 1.7;">We received a request to reset your password for your Petflix account. Click the button below to create a new password:</p>
          <p style="text-align: center; margin-top: 32px;">
            <a href="${resetLink}" class="button">Reset Password →</a>
          </p>
          <p style="margin-top: 28px; color: #8899a6; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <div class="code">${resetLink}</div>
          <div class="warning">
            <strong style="color: #f57c00;">⚠️ Important:</strong> This link will expire in ${expiresIn}. If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </div>
          <p style="color: #8899a6; margin-top: 32px;">— The Petflix Team</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">This email was sent to ${email}. If you didn't request a password reset, please ignore this email.</p>
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
        body { 
          font-family: 'Segoe UI', Arial, sans-serif; 
          line-height: 1.6; 
          color: #36454F; 
          background: #f8f9fa;
          margin: 0;
          padding: 20px;
        }
        .container { 
          max-width: 600px; 
          margin: 0 auto; 
          background: #ffffff;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 24px rgba(173, 216, 230, 0.15);
          border: 1px solid #e8f4f8;
        }
        .header { 
          background: linear-gradient(135deg, #ADD8E6 0%, #87CEEB 50%, #F0F0DC 100%); 
          padding: 45px 30px; 
          text-align: center;
        }
        .logo {
          font-size: 56px;
          margin-bottom: 12px;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        .content { 
          background: #ffffff; 
          padding: 40px 35px; 
          color: #36454F;
        }
        .content p {
          color: #36454F;
          margin: 16px 0;
          font-size: 16px;
        }
        .button { 
          display: inline-block; 
          padding: 15px 40px; 
          background: linear-gradient(135deg, #ADD8E6 0%, #87CEEB 100%); 
          color: #36454F; 
          text-decoration: none; 
          border-radius: 10px; 
          font-weight: 700; 
          margin: 28px 0;
          transition: all 0.3s;
          box-shadow: 0 4px 12px rgba(173, 216, 230, 0.3);
        }
        .button:hover {
          background: linear-gradient(135deg, #87CEEB 0%, #ADD8E6 100%);
          box-shadow: 0 6px 16px rgba(173, 216, 230, 0.4);
          transform: translateY(-2px);
        }
        .warning { 
          background: #fff8e1; 
          border-left: 4px solid #ffc107; 
          padding: 20px; 
          margin: 28px 0;
          border-radius: 8px;
        }
        .footer { 
          text-align: center; 
          padding: 28px 35px; 
          color: #8899a6; 
          font-size: 13px;
          background: #f8f9fa;
          border-top: 1px solid #e8f4f8;
        }
        .code { 
          background: #f1f8fc; 
          padding: 18px; 
          border-radius: 8px; 
          font-family: 'Courier New', monospace; 
          word-break: break-all;
          border: 1px solid #d4e9f7;
          color: #5FA8D3;
          font-size: 13px;
          line-height: 1.5;
        }
        .highlight {
          color: #5FA8D3;
          font-weight: 700;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">✉️</div>
          <h1 style="margin: 0; color: #36454F; font-size: 36px; font-weight: 800; text-shadow: 0 2px 4px rgba(255,255,255,0.8);">Verify Your Email Address</h1>
        </div>
        <div class="content">
          <p style="font-size: 19px; margin-bottom: 8px;">Hi <span class="highlight">${username}</span>,</p>
          <p style="font-size: 16px; color: #5a6c7d; line-height: 1.7;">You've requested to change your email address on Petflix. Please verify your new email address by clicking the button below:</p>
          <p style="text-align: center; margin-top: 32px;">
            <a href="${verificationLink}" class="button">Verify Email Address →</a>
          </p>
          <p style="margin-top: 28px; color: #8899a6; font-size: 14px;">Or copy and paste this link into your browser:</p>
          <div class="code">${verificationLink}</div>
          <div class="warning">
            <strong style="color: #f57c00;">⚠️ Important:</strong> This verification link will expire in 24 hours. If you didn't request this email change, please ignore this email or contact support.
          </div>
          <p style="color: #8899a6; margin-top: 32px;">— The Petflix Team</p>
        </div>
        <div class="footer">
          <p style="margin: 0;">This email was sent to ${email}. If you didn't request an email change, please ignore this email.</p>
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

