import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Auth Debug Information',
    environment: {
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
      GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? 'Set' : 'Not set',
      GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'Set' : 'Not set',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'Set' : 'Not set',
    },
    expectedRedirectURI: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/callback/google`,
    authEndpoints: {
      base: '/api/auth/',
      googleSignIn: '/api/auth/signin/google',
      callback: '/api/auth/callback/google',
    },
    troubleshooting: {
      step1: 'Verify Google OAuth app has the correct redirect URI configured',
      step2: 'Check that GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are valid',
      step3: 'Ensure NEXT_PUBLIC_APP_URL matches the current environment',
      step4: 'Try visiting /api/auth/signin/google directly in browser'
    }
  });
}