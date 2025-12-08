# AWS Cognito Setup Guide

This guide will walk you through setting up AWS Cognito for OTP-based authentication.

## Step 1: Create AWS Account
1. Go to [AWS Console](https://aws.amazon.com/)
2. Sign up or log in to your account

## Step 2: Create a Cognito User Pool

1. **Go to AWS Cognito**
   - Open the AWS Console
   - Search for "Cognito" in the services search bar
   - Click on "Amazon Cognito"

2. **Create User Pool**
   - Click "Create user pool"
   - Choose "Email" or "Phone" as sign-in option
   - For this app, select **"Email"** ✅

3. **Configure Sign-in Experience**
   - Cognito user pool sign-in options: **Email**
   - User name requirements: **Email address**
   - Click "Next"

4. **Configure Security Requirements**
   - Password policy: Choose "Cognito defaults" or custom
   - Multi-factor authentication (MFA): **Optional** or **OFF** (for email OTP)
   - User account recovery: **Email only**
   - Click "Next"

5. **Configure Sign-up Experience**
   - Self-service sign-up: **Enable** ✅
   - Cognito-assisted verification: **Send email message, verify email address** ✅
   - Required attributes: **Email**
   - Click "Next"

6. **Configure Message Delivery**
   - Email provider: **Send email with Cognito** (default)
     - For production, use Amazon SES for better deliverability
   - FROM email address: Use default or configure custom
   - Click "Next"

7. **Integrate Your App**
   - User pool name: `ukcal-food-app` (or your preferred name)
   - App type: **Public client**
   - App client name: `ukcal-mobile-app`
   - Authentication flows: 
     - ✅ **ALLOW_USER_PASSWORD_AUTH**
     - ✅ **ALLOW_REFRESH_TOKEN_AUTH**
     - ✅ **ALLOW_CUSTOM_AUTH** (for OTP)
   - Click "Next"

8. **Review and Create**
   - Review all settings
   - Click "Create user pool"

## Step 3: Get Your Credentials

After creating the user pool, you'll need three values:

### 1. User Pool ID
- Go to your User Pool
- Look for "User pool ID" at the top
- Example: `us-east-1_XXXXXXXXX`

### 2. App Client ID
- In your User Pool, go to "App integration" tab
- Scroll down to "App clients"
- Copy the "Client ID"
- Example: `1a2b3c4d5e6f7g8h9i0j1k2l3m`

### 3. AWS Region
- Look at your AWS Console URL or the region selector
- Example: `us-east-1`, `eu-west-1`, `ap-southeast-1`

## Step 4: Configure Your App

1. **Open `aws-config.ts`** in the `food-detection` folder

2. **Replace the placeholder values:**
```typescript
export const awsConfig = {
  Auth: {
    region: 'us-east-1', // Your AWS region
    userPoolId: 'us-east-1_XXXXXXXXX', // Your User Pool ID
    userPoolWebClientId: '1a2b3c4d5e6f7g8h9i0j1k2l3m', // Your App Client ID
    mandatorySignIn: false,
    cookieStorage: {
      domain: 'localhost',
      path: '/',
      expires: 365,
      secure: false,
    },
    authenticationFlowType: 'CUSTOM_AUTH',
  },
};
```

## Step 5: Update AuthContext to Use Real Cognito

Open `food-detection/contexts/AuthContext.tsx` and update the import:

```typescript
// Change from mock to real service
import { realCognitoOTPService as cognitoOTPService } from '../services/RealCognitoAuthService';
```

Or keep the current service switcher and set the flag:
```typescript
const [useCognitoAuth, setUseCognitoAuth] = useState(true); // Already set to true
```

## Step 6: Test Your Setup

1. **Remove the temporary storage clear**
   - In `AuthContext.tsx`, remove these lines:
   ```typescript
   await AsyncStorage.removeItem('user');
   await AsyncStorage.removeItem('user_consent');
   await AsyncStorage.removeItem('business_profile_completed');
   ```

2. **Run the app**
   ```bash
   cd food-detection
   npx expo start
   ```

3. **Test OTP Flow**
   - Enter your email on the login screen
   - Click "Send OTP"
   - Check your email inbox for the verification code
   - Enter the 6-digit code in the app
   - You should be authenticated! ✅

## Troubleshooting

### Email Not Receiving OTP
- Check your spam/junk folder
- Verify your email in Cognito is correct
- For production, configure Amazon SES

### "Invalid Client ID" Error
- Double-check your App Client ID in `aws-config.ts`
- Make sure you copied the entire ID

### "User Pool Not Found" Error
- Verify your User Pool ID is correct
- Check that the region matches

### "CodeMismatchException"
- OTP code expired (valid for 5 minutes)
- Wrong code entered - request a new one

## Cost Information

AWS Cognito Free Tier:
- ✅ **50,000 Monthly Active Users (MAUs)** - FREE
- After that: $0.0055 per MAU

Email OTPs:
- First 50 emails/day: FREE
- After that: Very low cost ($0.10 per 1,000 emails with SES)

## Production Recommendations

1. **Use Amazon SES for email delivery**
   - Better deliverability
   - Custom FROM address
   - Email templates

2. **Enable MFA (Multi-Factor Authentication)**
   - Extra security layer
   - SMS or TOTP options

3. **Set up CloudWatch monitoring**
   - Track authentication attempts
   - Monitor failed logins

4. **Configure custom domain**
   - Professional look
   - Better user trust

5. **Add password recovery flow**
   - Users can reset via email

## Support

For issues:
- AWS Documentation: https://docs.aws.amazon.com/cognito/
- AWS Forums: https://forums.aws.amazon.com/forum.jspa?forumID=173

---

**Important:** Never commit your `aws-config.ts` file with real credentials to GitHub!
Add it to `.gitignore`:
```
# AWS Config (contains sensitive data)
aws-config.ts
```

