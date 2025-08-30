# Google OAuth Setup for Bossio.io

## Quick Fix (Recommended)
If you have access to the Google Cloud Console for project `bookedbarber-staging`:

1. Go to: https://console.cloud.google.com/apis/credentials?project=bookedbarber-staging
2. Find OAuth 2.0 client ID: `123456789012-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com`
3. Edit the client and add to "Authorized redirect URIs":
   ```
   https://bossioio.vercel.app/api/auth/callback/google
   ```
4. Save changes

## Create New OAuth Credentials (Alternative)
If you want separate credentials for Bossio.io:

1. **Create New Project** (Optional):
   - Go to https://console.cloud.google.com/
   - Create project "bossio-io" or similar

2. **Enable APIs**:
   - Go to "APIs & Services" > "Library"
   - Enable "Google+ API" or "Google Identity API"

3. **Configure OAuth Consent Screen**:
   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in:
     - App name: "Bossio.io"
     - User support email: hello@bossio.io
     - Developer contact: hello@bossio.io
   - Add domains: bossioio.vercel.app

4. **Create OAuth 2.0 Client ID**:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "Bossio.io Web Client"
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     https://bossioio.vercel.app/api/auth/callback/google
     ```

5. **Update Environment Variables**:
   ```bash
   # Replace the placeholder values in .env.local with real credentials:
   GOOGLE_CLIENT_ID=your_new_client_id_here
   GOOGLE_CLIENT_SECRET=your_new_client_secret_here
   
   # Then update production:
   vercel env rm GOOGLE_CLIENT_ID production
   vercel env rm GOOGLE_CLIENT_SECRET production
   vercel env add GOOGLE_CLIENT_ID production
   vercel env add GOOGLE_CLIENT_SECRET production
   ```

## Current Issue
The authentication system is fully functional - we just need the OAuth redirect URI configured. Once this is done, users will be able to sign in with Google successfully.

## Test After Configuration
Visit https://bossioio.vercel.app and try "Sign in with Google" - it should work without the "Authorization Error".