/**
 * AWS Cognito Custom Message Lambda
 *
 * Attach this to your User Pool:
 * Cognito → Your user pool → Extensions → Lambda triggers → Custom message → select this function.
 *
 * Trigger sources handled:
 *   CustomMessage_SignUp / CustomMessage_ResendCode  → sign-in OTP email (new users)
 *   CustomMessage_ForgotPassword                     → generic verification code email
 *                                                       (covers both existing-user sign-in
 *                                                        AND delete-account, since both call
 *                                                        resetPassword in the app)
 *
 * Logo: upload assets/icon.png to an S3 bucket with public read and update LOGO_URL below.
 * Example: https://ukcal-assets.s3.amazonaws.com/logo.png
 */

const LOGO_URL = 'https://ukcal-assets.s3.amazonaws.com/icon.png';

// ── Shared layout helpers ────────────────────────────────────────────────────

function header() {
  return `
<td style="padding: 40px 40px 20px 40px; text-align: center; background: linear-gradient(135deg, #7BA21B 0%, #5d7d14 100%); border-radius: 16px 16px 0 0;">
  <div style="width: 80px; height: 80px; margin: 0 auto 16px auto; background-color: #ffffff; border-radius: 50%; padding: 12px; box-sizing: border-box;">
    <img src="${LOGO_URL}" alt="UKcal" width="56" height="56" style="display: block; width: 56px; height: 56px; object-fit: contain;" />
  </div>
  <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">UKcal</h1>
  <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Smart Nutrition Tracking</p>
</td>`;
}

function otpBox() {
  return `
<div style="background: linear-gradient(135deg, #f0f7e6 0%, #e8f5d6 100%); border: 2px solid #7BA21B; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 30px;">
  <p style="margin: 0 0 8px 0; color: #5d7d14; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Your Verification Code</p>
  <p style="margin: 0; color: #7BA21B; font-size: 36px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">{####}</p>
</div>`;
}

function footer() {
  return `
<td style="padding: 24px 40px; background-color: #f9fafb; border-radius: 0 0 16px 16px; border-top: 1px solid #e5e7eb;">
  <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">© 2025 UKcal. All rights reserved.</p>
  <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">This is an automated message. Please do not reply.</p>
</td>`;
}

function wrap(bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f7f5;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f7f5;">
<tr><td style="padding: 40px 20px;">
<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
<tr>${header()}</tr>
<tr><td style="padding: 40px;">${bodyContent}</td></tr>
<tr>${footer()}</tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

// ── Email templates ──────────────────────────────────────────────────────────

function signInEmail() {
  return wrap(`
<h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 22px; font-weight: 600; text-align: center;">Your Login Code</h2>
<p style="margin: 0 0 30px 0; color: #6b7280; font-size: 15px; line-height: 1.6; text-align: center;">
  Use the code below to sign in to UKcal. It expires in 24 hours.
</p>
${otpBox()}
<p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
  If you didn't request this code, you can safely ignore this email.
</p>`);
}

function verificationEmail() {
  return wrap(`
<h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 22px; font-weight: 600; text-align: center;">Your Verification Code</h2>
<p style="margin: 0 0 30px 0; color: #6b7280; font-size: 15px; line-height: 1.6; text-align: center;">
  Use the code below to complete your request in UKcal. It expires in 24 hours.
</p>
${otpBox()}
<p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center; line-height: 1.5;">
  If you didn't request this code, you can safely ignore this email.
</p>`);
}

// ── Handler ──────────────────────────────────────────────────────────────────

exports.handler = async (event) => {
  const trigger = event.triggerSource;

  if (trigger === 'CustomMessage_SignUp' || trigger === 'CustomMessage_ResendCode') {
    // New user — email OTP for sign-up verification
    event.response.emailSubject = 'Your UKcal login code';
    event.response.emailMessage = signInEmail();
    return event;
  }

  if (trigger === 'CustomMessage_ForgotPassword') {
    // Covers two cases in the app:
    //   1. Existing user signing in (app calls resetPassword)
    //   2. Delete-account OTP (app also calls resetPassword)
    // Both need a verification code — use a generic branded template.
    event.response.emailSubject = 'Your UKcal verification code';
    event.response.emailMessage = verificationEmail();
    return event;
  }

  // All other triggers (AdminCreateUser, VerifyUserAttribute, etc.) — use Cognito defaults
  return event;
};
