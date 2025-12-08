# Fix: "SignUp is not permitted for this user pool"

## Problem
You're seeing this error: `NotAuthorizedException: SignUp is not permitted for this user pool`

This means self-registration is disabled in your AWS Cognito User Pool.

## Solution: Enable Self-Registration

### Step 1: Go to AWS Cognito Console
1. Open [AWS Console](https://console.aws.amazon.com)
2. Navigate to **Amazon Cognito**
3. Click on your User Pool: **User pool - qmnat** (or `us-east-1_gMgIH1mpO`)

### Step 2: Enable Self-Registration
1. In the left sidebar, click **Sign-up experience**
2. Under **Allow users to sign themselves up**, make sure it's set to **Enabled**
3. If it's disabled, click **Edit** and enable it
4. Click **Save changes**

### Step 3: Configure Sign-In Options (if needed)
1. Still in **Sign-up experience**, check **Sign-in options**
2. Make sure **Email** is enabled (it should be, since you're using email OTP)
3. Save changes

### Step 4: Verify App Client Settings
1. Go to **App integration** tab
2. Click on your app client: **My mobile app - qmnat**
3. Under **Authentication flows**, make sure these are enabled:
   - ✅ **Secure remote password (SRP)**
   - ✅ **Choice-based sign-in** (if available)
4. Save changes

### Step 5: Test Again
After enabling self-registration:
1. Restart your app
2. Try sending OTP again
3. You should receive the verification code in your email

## Alternative: Use Admin-Created Users
If you don't want to enable self-registration, you can:
1. Create users manually in the Cognito Console
2. Users will receive a temporary password via email
3. They'll need to change password on first login

But for OTP authentication, **enabling self-registration is recommended**.

## Quick Checklist
- [ ] Self-registration is enabled in User Pool
- [ ] Email sign-in is enabled
- [ ] App client has SRP authentication flow enabled
- [ ] Test OTP sending again

