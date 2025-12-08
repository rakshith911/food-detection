# Complete AWS Setup Guide - Cognito + DynamoDB + S3

This is your **complete guide** to setting up AWS services for authentication, data storage, and file storage.

---

## 🎯 What We're Building

**Full Cloud Architecture:**
```
User App
   │
   ├─▶ AWS Cognito (Authentication)
   │   └─ Email OTP, User Management
   │
   ├─▶ DynamoDB (Data Storage)
   │   └─ Business Profiles, User Data
   │
   └─▶ S3 (File Storage)
       └─ Images, Videos, Menu PDFs
```

---

## 📋 Setup Checklist

### ✅ Phase 1: Authentication (Cognito)
- [ ] Create AWS Account
- [ ] Create Cognito User Pool
- [ ] Get User Pool ID, App Client ID, Region
- [ ] Update `aws-config.ts`
- [ ] Set `USE_REAL_AWS_COGNITO = true` in `AuthContext.tsx`
- [ ] Test email OTP

### ✅ Phase 2: Data Storage (DynamoDB)
- [ ] Create DynamoDB Table
- [ ] Configure IAM Permissions
- [ ] Update `aws-config.ts` with table name
- [ ] Set `STORAGE_MODE = 'dynamodb'` in `UserService.ts`
- [ ] Test profile saving

### ✅ Phase 3: File Storage (S3) - Future
- [ ] Create S3 Bucket
- [ ] Configure CORS
- [ ] Update `aws-config.ts` with bucket name
- [ ] Implement S3 upload service
- [ ] Test image/video uploads

---

## 🚀 Quick Start (Step by Step)

### **Step 1: AWS Cognito Setup**
Follow: `AWS_COGNITO_SETUP.md`

**Time:** ~10 minutes  
**Result:** Real email OTPs working

### **Step 2: DynamoDB Setup**
Follow: `DYNAMODB_SETUP.md`

**Time:** ~5 minutes  
**Result:** Profiles stored in cloud

### **Step 3: Test Everything**
1. Login with email → Get real OTP
2. Complete business profile → Saved to DynamoDB
3. Check DynamoDB console → See your data!

---

## 🔧 Configuration Files

### **1. `aws-config.ts`** - AWS Credentials
```typescript
export const awsConfig = {
  Auth: {
    region: 'us-east-1',              // Your AWS region
    userPoolId: 'us-east-1_XXXXX',    // From Cognito
    userPoolWebClientId: 'XXXXX',     // From Cognito
  },
  DynamoDB: {
    tableName: 'ukcal-business-profiles',
    region: 'us-east-1',
  },
  S3: {
    bucketName: 'ukcal-user-uploads',
    region: 'us-east-1',
  },
};
```

### **2. `contexts/AuthContext.tsx`** - Auth Mode
```typescript
const USE_REAL_AWS_COGNITO = true; // false = mock, true = real
```

### **3. `services/UserService.ts`** - Storage Mode
```typescript
const STORAGE_MODE: 'local' | 'dynamodb' = 'dynamodb'; // 'local' or 'dynamodb'
```

---

## 💰 Total Cost Estimate

### **Free Tier (First Year):**
- ✅ Cognito: 50,000 MAUs - **FREE**
- ✅ DynamoDB: 25 GB - **FREE**
- ✅ S3: 5 GB - **FREE**
- ✅ **Total: $0/month** for small apps!

### **After Free Tier:**
- Cognito: $0.0055 per MAU
- DynamoDB: ~$0.25 per million reads
- S3: ~$0.023 per GB
- **Estimated: $5-20/month** for medium apps

---

## 📁 File Structure

```
food-detection/
├── aws-config.ts                    # 👈 Configure AWS credentials here
├── AWS_COGNITO_SETUP.md            # Cognito setup guide
├── DYNAMODB_SETUP.md                # DynamoDB setup guide
├── COMPLETE_AWS_SETUP.md            # This file
├── contexts/
│   └── AuthContext.tsx             # 👈 Toggle auth mode here
└── services/
    ├── CognitoAuthService.ts       # Mock auth (testing)
    ├── RealCognitoAuthService.ts   # Real AWS auth (production)
    ├── DynamoDBService.ts          # DynamoDB operations
    └── UserService.ts              # 👈 Toggle storage mode here
```

---

## 🎛️ Current Configuration

**Authentication:**
- Mode: **Mock** (for testing)
- Toggle: `USE_REAL_AWS_COGNITO = false` in `AuthContext.tsx`

**Storage:**
- Mode: **Local** (AsyncStorage)
- Toggle: `STORAGE_MODE = 'local'` in `UserService.ts`

**To Enable Production:**
1. Set `USE_REAL_AWS_COGNITO = true`
2. Set `STORAGE_MODE = 'dynamodb'`
3. Configure `aws-config.ts` with real credentials

---

## 🔄 Migration Path

### **Development → Production:**

1. **Keep Mock Auth + Local Storage** (Current)
   - Fast development
   - No AWS costs
   - Easy testing

2. **Switch to Real Auth + Local Storage**
   - Real email OTPs
   - Still using local storage
   - Good for testing real auth

3. **Switch to Real Auth + DynamoDB** (Production)
   - Everything in cloud
   - Scalable
   - Production-ready

4. **Add S3 for Files** (Future)
   - Images/videos in cloud
   - CDN delivery
   - Complete solution

---

## ✅ What's Implemented

### **Authentication:**
- ✅ Mock OTP service (testing)
- ✅ Real AWS Cognito service (production)
- ✅ Email OTP support
- ✅ SMS OTP support
- ✅ User account creation
- ✅ Easy toggle between modes

### **Data Storage:**
- ✅ Local storage (AsyncStorage)
- ✅ DynamoDB service
- ✅ Profile CRUD operations
- ✅ Easy toggle between modes
- ✅ Automatic user ID handling

### **Ready for:**
- ✅ S3 integration (structure ready)
- ✅ Image/video uploads
- ✅ File management

---

## 🎯 Recommended Workflow

### **For Development (Now):**
```typescript
// AuthContext.tsx
const USE_REAL_AWS_COGNITO = false; // Mock

// UserService.ts
const STORAGE_MODE = 'local'; // AsyncStorage
```
✅ Fast iteration, no AWS setup needed

### **For Production (Later):**
```typescript
// AuthContext.tsx
const USE_REAL_AWS_COGNITO = true; // Real Cognito

// UserService.ts
const STORAGE_MODE = 'dynamodb'; // Cloud storage
```
✅ Scalable, production-ready

---

## 📚 Documentation

- **`AWS_COGNITO_SETUP.md`** - Complete Cognito guide
- **`DYNAMODB_SETUP.md`** - Complete DynamoDB guide
- **`AUTHENTICATION_SUMMARY.md`** - Auth overview
- **`COMPLETE_AWS_SETUP.md`** - This file (overview)

---

## 🆘 Support

**AWS Issues:**
- Cognito Docs: https://docs.aws.amazon.com/cognito/
- DynamoDB Docs: https://docs.aws.amazon.com/dynamodb/
- S3 Docs: https://docs.aws.amazon.com/s3/

**App Issues:**
- Check terminal logs
- Verify AWS credentials
- Check IAM permissions

---

## 🎉 You're Ready!

Your app now has:
- ✅ **Dual authentication** (mock + real)
- ✅ **Dual storage** (local + cloud)
- ✅ **Scalable architecture**
- ✅ **Production-ready code**
- ✅ **Easy configuration**

**Just configure AWS and flip the switches!** 🚀

