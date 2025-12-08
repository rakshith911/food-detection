# OTP Authentication Setup Guide

This guide will help you set up OTP (One-Time Password) authentication using AWS Cognito.

## 🎯 Quick Start Options

### Option 1: Use Mock OTP (For Testing - No AWS Setup Required)
✅ **Already configured!** The app is currently using mock OTP authentication.

**How it works:**
- Enter your email on the login screen
- Click "Send OTP"
- An OTP will appear in a popup alert and console
- Enter the OTP to log in

**To test:**
1. Run the app: `cd food-detection && npx expo start`
2. Go to login screen
3. Enter any email (e.g., `test@example.com`)
4. Click "Send OTP"
5. Copy the OTP from the alert popup
6. Enter it in the OTP screen

---

### Option 2: Use Real AWS Cognito (For Production)

Follow these steps to set up real email OTP authentication:

## Step 1: Create AWS Account (If You Don't Have One)

1. Go to [AWS Console](https://aws.amazon.com/)
2. Sign up for a free account (12 months free tier)
3. Complete the registration process

## Step 2: Create Cognito User Pool

1. **Go to AWS Cognito**
   - Open AWS Console
   - Search for "Cognito" in the services search
   - Click "Amazon Cognito"

2. **Create User Pool**
   - Click "Create user pool" button
   - Choose **"Email"** as sign-in option ✅
   - Click "Next"

3. **Configure Security**
   - Password policy: Use Cognito defaults
   - MFA: **OFF** (we're using OTP instead)
   - User account recovery: **Email only**
   - Click "Next"

4. **Configure Sign-up**
   - Self-service sign-up: **Enable** ✅
   - Cognito-assisted verification: **Send email message** ✅
   - Required attributes: **Email** ✅
   - Click "Next"

5. **Configure Message Delivery**
   - Email provider: **Send email with Cognito** (for testing)
   - FROM email: Use default
   - Click "Next"

6. **Integrate Your App**
   - User pool name: `ukcal-food-app` (or your choice)
   - App type: **Public client** ✅
   - App client name: `ukcal-mobile-app`
   - **IMPORTANT:** Under "Authentication flows", enable:
     - ✅ **ALLOW_USER_PASSWORD_AUTH**
     - ✅ **ALLOW_REFRESH_TOKEN_AUTH**
   - Click "Next"

7. **Review and Create**
   - Review settings
   - Click "Create user pool"

## Step 3: Get Your Credentials

After creating the user pool, you need 3 values:

### 1. User Pool ID
- In your User Pool dashboard
- Look at the top for "User pool ID"
- Example: `us-east-1_AbCdEfGhI`

### 2. App Client ID
- Go to "App integration" tab
- Scroll to "App clients" section
- Copy the "Client ID"
- Example: `1a2b3c4d5e6f7g8h9i0j1k2l3m`

### 3. AWS Region
- Look at the top-right of AWS Console
- Your region (e.g., `us-east-1`, `eu-west-1`)

## Step 4: Update Your App Configuration

1. **Open `food-detection/aws-config.ts`**

2. **Replace the placeholder values:**

```typescript
export const awsConfig = {
  Auth: {
    region: 'us-east-1', // 👈 Your AWS region
    userPoolId: 'us-east-1_AbCdEfGhI', // 👈 Your User Pool ID
    userPoolWebClientId: '1a2b3c4d5e6f7g8h9i0j1k2l3m', // 👈 Your App Client ID
    mandatorySignIn: false,
    cookieStorage: {
      domain: 'localhost',
      path: '/',
      expires: 365,
      secure: false,
    },
    // Remove authenticationFlowType - not needed for standard flow
  },
  // ... rest of config
};
```

## Step 5: Enable Real Cognito in Your App

1. **Open `food-detection/contexts/AuthContext.tsx`**

2. **Change line 9 from:**
```typescript
const USE_REAL_AWS_COGNITO = false; // 👈 Currently using mock
```

3. **To:**
```typescript
const USE_REAL_AWS_COGNITO = true; // 👈 Now using real AWS Cognito
```

## Step 6: Test Real OTP

1. **Run the app:**
```bash
cd food-detection
npx expo start
```

2. **Test the flow:**
   - Enter your real email address
   - Click "Send OTP"
   - Check your email inbox (and spam folder)
   - Enter the 6-digit code from email
   - You should be logged in! ✅

## 🔧 Troubleshooting

### Email Not Receiving OTP
- ✅ Check spam/junk folder
- ✅ Verify email address is correct
- ✅ For production, configure Amazon SES (better deliverability)

### "Invalid Client ID" Error
- ✅ Double-check App Client ID in `aws-config.ts`
- ✅ Make sure you copied the entire ID (no spaces)

### "User Pool Not Found" Error
- ✅ Verify User Pool ID is correct
- ✅ Check that region matches

### "CodeMismatchException"
- ✅ OTP expires after 5 minutes - request a new one
- ✅ Make sure you're entering the correct 6-digit code

### "UsernameExistsException"
- ✅ This is normal if you've already signed up
- ✅ The app will automatically resend the OTP

## 💰 Cost Information

**AWS Cognito Free Tier:**
- ✅ **50,000 Monthly Active Users (MAUs)** - FREE
- After that: $0.0055 per MAU

**Email OTPs:**
- ✅ First 50 emails/day: FREE (Cognito default)
- After that: Very low cost

**For most apps, you'll stay within the free tier!**

## 🚀 Production Recommendations

1. **Use Amazon SES for Email**
   - Better deliverability
   - Custom FROM address
   - Professional appearance

2. **Enable CloudWatch Monitoring**
   - Track authentication attempts
   - Monitor failed logins

3. **Set Up Custom Domain**
   - Professional look
   - Better user trust

## 📝 Current Status

- ✅ Mock OTP: **Working** (for testing)
- ⚠️ Real Cognito: **Needs AWS setup** (follow steps above)

## 🎯 Next Steps

1. **For Testing:** Keep using mock OTP (already working)
2. **For Production:** Follow Steps 1-6 above to set up real AWS Cognito

---

**Need Help?**
- AWS Cognito Docs: https://docs.aws.amazon.com/cognito/
- AWS Support: https://aws.amazon.com/support/

