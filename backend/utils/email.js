const nodemailer = require('nodemailer');
const logger = require('../config/logger');

// Create transporter - make it optional for development
let transporter = null;

try {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: process.env.EMAIL_PORT || 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Verify transporter configuration
    transporter.verify((error, success) => {
      if (error) {
        logger.error(`Email transporter error: ${error.message}`);
      } else {
        logger.info('Email server is ready to send messages');
      }
    });
  } else {
    logger.warn('Email credentials not configured. Email functionality will be disabled.');
  }
} catch (error) {
  logger.error(`Failed to create email transporter: ${error.message}`);
}

// Send verification email
exports.sendVerificationEmail = async (email, token, name) => {
  if (!transporter) {
    logger.warn('Email transporter not configured. Skipping verification email.');
    return false;
  }

  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

  const mailOptions = {
    from: `"LIT GENIUS" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Verify Your Email - LIT GENIUS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #2563EB; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to LIT GENIUS!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Thank you for registering with LIT GENIUS - your AI-powered literature survey assistant.</p>
            <p>Please verify your email address by clicking the button below:</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563EB;">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <p>If you didn't create an account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LIT GENIUS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Verification email sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending verification email: ${error.message}`);
    throw error;
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (email, token, name) => {
  if (!transporter) {
    logger.warn('Email transporter not configured. Skipping password reset email.');
    return false;
  }

  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  const mailOptions = {
    from: `"LIT GENIUS" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Password Reset Request - LIT GENIUS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #EF4444; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>We received a request to reset your password for your LIT GENIUS account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563EB;">${resetUrl}</p>
            <p><strong>This link will expire in 1 hour.</strong></p>
            <p>If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LIT GENIUS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Password reset email sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending password reset email: ${error.message}`);
    throw error;
  }
};

// Send survey completion email
exports.sendSurveyCompletionEmail = async (email, name, surveyTopic, surveyId) => {
  if (!transporter) {
    logger.warn('Email transporter not configured. Skipping survey completion email.');
    return false;
  }

  const surveyUrl = `${process.env.FRONTEND_URL}/surveys/${surveyId}`;

  const mailOptions = {
    from: `"LIT GENIUS" <${process.env.EMAIL_FROM}>`,
    to: email,
    subject: 'Your Literature Survey is Ready! - LIT GENIUS',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #10B981 0%, #2563EB 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #10B981; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Your Survey is Complete!</h1>
          </div>
          <div class="content">
            <p>Hi ${name},</p>
            <p>Great news! Your literature survey on <strong>"${surveyTopic}"</strong> has been successfully generated.</p>
            <p>Our AI agents have:</p>
            <ul>
              <li>✅ Retrieved and analyzed relevant research papers</li>
              <li>✅ Generated a comprehensive literature review</li>
              <li>✅ Added proper citations</li>
              <li>✅ Verified all facts and claims</li>
              <li>✅ Checked for plagiarism</li>
            </ul>
            <div style="text-align: center;">
              <a href="${surveyUrl}" class="button">View Your Survey</a>
            </div>
            <p>You can now view, download, and export your survey in multiple formats (PDF, DOCX, Markdown).</p>
          </div>
          <div class="footer">
            <p>&copy; 2026 LIT GENIUS. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    logger.info(`Survey completion email sent to: ${email}`);
    return true;
  } catch (error) {
    logger.error(`Error sending survey completion email: ${error.message}`);
    throw error;
  }
};
