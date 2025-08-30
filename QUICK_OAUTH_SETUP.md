# Quick OAuth Setup for Bossio.io

## 🚀 Created New Google Cloud Project
- **Project ID**: `bossio-io-auth`
- **Project Name**: "Bossio IO Authentication"
- **Direct Link**: https://console.cloud.google.com/apis/credentials?project=bossio-io-auth

## 📋 Step-by-Step Setup (5 minutes)

### 1. Open the OAuth Console
Click this link: https://console.cloud.google.com/apis/credentials?project=bossio-io-auth

### 2. Enable Required APIs
If prompted, enable these APIs:
- Google+ API (or Google Identity API)
- OAuth2 API

### 3. Configure OAuth Consent Screen
- Go to "OAuth consent screen" (left sidebar)
- Choose "External" user type
- Fill in required fields:
  - **App name**: `Bossio.io`
  - **User support email**: `hello@bossio.io`
  - **Developer contact**: `hello@bossio.io`
- Add authorized domain: `bossioio.vercel.app`
- Save and continue through all steps

### 4. Create OAuth 2.0 Client ID
- Go to "Credentials" (left sidebar)
- Click "CREATE CREDENTIALS" > "OAuth 2.0 Client ID"
- Application type: **Web application**
- Name: `Bossio.io Web Client`
- **Authorized redirect URIs**:
  ```
  http://localhost:3000/api/auth/callback/google
  https://bossioio.vercel.app/api/auth/callback/google
  ```
- Click "CREATE"

### 5. Copy the Credentials
After creation, you'll get:
- **Client ID**: `something.apps.googleusercontent.com`
- **Client Secret**: `GOCSPX-something`

### 6. Update Environment Variables
```bash
# Update .env.local
GOOGLE_CLIENT_ID=your_new_client_id_here
GOOGLE_CLIENT_SECRET=your_new_client_secret_here

# Update Vercel production
vercel env rm GOOGLE_CLIENT_ID production
vercel env rm GOOGLE_CLIENT_SECRET production
vercel env add GOOGLE_CLIENT_ID production
# Paste your new client ID

vercel env add GOOGLE_CLIENT_SECRET production  
# Paste your new client secret

# Redeploy
vercel --prod
```

## 🎯 Alternative: Quick Test Setup
If you want to test immediately, I can also set up email/password authentication first while you configure Google OAuth later.

## ✅ After Setup
Once configured, test at: https://bossioio.vercel.app

The "Sign in with Google" button should work without the "Authorization Error".

---
**Need help?** Just let me know which step you're on!