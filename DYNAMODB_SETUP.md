# DynamoDB Setup Guide for User Profiles

This guide will help you set up AWS DynamoDB to store user business profiles, images, and videos.

## 📊 Architecture Overview

```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│   Cognito   │─────▶│   DynamoDB   │      │     S3      │
│  (Auth)     │      │  (Profiles)  │      │ (Files)     │
└─────────────┘      └──────────────┘      └─────────────┘
     │                      │                      │
     │                      │                      │
     └──────────────────────┴──────────────────────┘
                    Your App
```

**What goes where:**
- **Cognito**: User authentication, email, user ID
- **DynamoDB**: Business profile data, metadata
- **S3**: Profile images, menu files, videos (future)

---

## Step 1: Create DynamoDB Table

1. **Go to AWS Console**
   - Navigate to [DynamoDB](https://console.aws.amazon.com/dynamodb/)
   - Click "Create table"

2. **Table Settings**
   - **Table name**: `ukcal-business-profiles`
   - **Partition key**: `userId` (String)
   - **Table settings**: Use default settings
   - Click "Create table"

3. **Wait for Creation**
   - Table status should show "Active" (takes ~30 seconds)

---

## Step 2: Configure IAM Permissions

Your Cognito users need permission to read/write to DynamoDB.

1. **Go to IAM Console**
   - Navigate to [IAM](https://console.aws.amazon.com/iam/)
   - Click "Roles"
   - Find your Cognito Identity Pool role (or create one)

2. **Add DynamoDB Policy**
   - Click on the role
   - Click "Add permissions" → "Attach policies"
   - Search for "AmazonDynamoDBFullAccess" (or create custom policy)
   - Attach the policy

3. **Custom Policy (Recommended for Production)**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "dynamodb:PutItem",
           "dynamodb:GetItem",
           "dynamodb:UpdateItem",
           "dynamodb:DeleteItem"
         ],
         "Resource": "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/ukcal-business-profiles"
       }
     ]
   }
   ```

---

## Step 3: Update Your App Configuration

1. **Open `aws-config.ts`**
   - Update `DynamoDB.tableName` to your table name
   - Update `DynamoDB.region` to match your Cognito region

2. **Enable DynamoDB Storage**
   - Open `services/UserService.ts`
   - Change: `const STORAGE_MODE: 'local' | 'dynamodb' = 'dynamodb';`

---

## Step 4: Test Your Setup

1. **Run the app**
   ```bash
   cd food-detection
   npx expo start
   ```

2. **Complete onboarding**
   - Login with email
   - Enter OTP
   - Fill business profile
   - Submit

3. **Verify in DynamoDB**
   - Go to DynamoDB Console
   - Click on your table
   - Click "Explore table items"
   - You should see your profile data! ✅

---

## Step 5: S3 Setup (For Images/Videos)

### Create S3 Bucket

1. **Go to S3 Console**
   - Navigate to [S3](https://console.aws.amazon.com/s3/)
   - Click "Create bucket"

2. **Bucket Settings**
   - **Bucket name**: `ukcal-user-uploads` (must be globally unique)
   - **Region**: Same as Cognito/DynamoDB
   - **Block Public Access**: Uncheck (or configure CORS properly)
   - Click "Create bucket"

3. **Configure CORS** (for web access)
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

4. **Update `aws-config.ts`**
   - Set `S3.bucketName` to your bucket name
   - Set `S3.region` to your region

---

## 📋 Table Schema

Your DynamoDB table structure:

```typescript
{
  userId: string,                    // Primary key (from Cognito)
  businessName: string,
  address: string,
  town: string,
  district: string,
  postalCode: string,
  country: string,
  businessCategory: string,
  cuisineType: string,
  primaryServingStyle: string,
  averageDishPrice: string,
  standardMealSize: string,
  businessSize: string,
  profileImage?: string,            // S3 URL
  menuFileUrl?: string,              // S3 URL
  hasCompletedProfile: boolean,
  createdAt: string,                 // ISO timestamp
  updatedAt: string,                 // ISO timestamp
}
```

---

## 💰 Cost Information

### DynamoDB Free Tier:
- ✅ **25 GB storage** - FREE
- ✅ **25 read units** - FREE
- ✅ **25 write units** - FREE
- After limits: Very low cost ($0.25 per million reads, $1.25 per million writes)

### S3 Free Tier:
- ✅ **5 GB storage** - FREE
- ✅ **20,000 GET requests** - FREE
- ✅ **2,000 PUT requests** - FREE
- After limits: $0.023 per GB storage

**Perfect for:**
- ✅ Startups
- ✅ MVP development
- ✅ Small to medium apps

---

## 🔄 Switching Between Storage Modes

### Use Local Storage (Development):
```typescript
// In services/UserService.ts
const STORAGE_MODE: 'local' | 'dynamodb' = 'local';
```

### Use DynamoDB (Production):
```typescript
// In services/UserService.ts
const STORAGE_MODE: 'local' | 'dynamodb' = 'dynamodb';
```

That's it! Just change one line.

---

## 🚀 Future: S3 Integration for Images/Videos

When you're ready to store images/videos:

1. **Install S3 SDK**
   ```bash
   npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
   ```

2. **Create S3Service.ts**
   - Upload profile images
   - Upload menu PDFs
   - Upload food photos/videos
   - Generate presigned URLs for access

3. **Update UserService**
   - Upload files to S3 before saving to DynamoDB
   - Store S3 URLs in DynamoDB

---

## 🔒 Security Best Practices

1. **Never commit credentials**
   - Add `aws-config.ts` to `.gitignore`
   - Use environment variables in production

2. **Use IAM roles properly**
   - Don't use full access policies
   - Grant minimum required permissions

3. **Enable encryption**
   - Enable encryption at rest in DynamoDB
   - Enable encryption in transit (HTTPS)

4. **Monitor access**
   - Enable CloudTrail
   - Set up CloudWatch alarms

---

## 📞 Troubleshooting

### "Access Denied" Error
- Check IAM role permissions
- Verify Cognito Identity Pool is configured
- Check DynamoDB table name matches config

### "Table Not Found" Error
- Verify table name in `aws-config.ts`
- Check table exists in correct region
- Ensure table status is "Active"

### "Credentials Not Found" Error
- Verify user is logged in via Cognito
- Check `fetchAuthSession()` returns credentials
- Verify Cognito Identity Pool is set up

---

## ✅ What's Ready Now

**Current Setup:**
- ✅ DynamoDB service created
- ✅ UserService supports both local & DynamoDB
- ✅ Easy toggle between storage modes
- ✅ Profile data structure defined
- ✅ Ready for S3 integration

**Next Steps:**
1. Create DynamoDB table (follow Step 1)
2. Configure IAM permissions (follow Step 2)
3. Update config and enable DynamoDB mode
4. Test and verify!

---

**You're all set!** Your app can now store user profiles in the cloud! ☁️

