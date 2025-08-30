import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  // FIRST: Check if request is from Vercel subdomain and redirect to custom domain
  const hostname = request.headers.get('host') || '';
  
  // Check if the request is coming from a Vercel subdomain
  if (hostname.includes('vercel.app') && !hostname.includes('localhost')) {
    // Get the request URL path
    const url = request.nextUrl.clone();
    
    // Redirect to the custom domain
    url.hostname = 'bossio.io';
    url.protocol = 'https:';
    
    return NextResponse.redirect(url, { status: 301 });
  }

  // THEN: Handle auth logic
  const sessionCookie = getSessionCookie(request);
  const { pathname } = request.nextUrl;

  // /api/payments/webhooks is a webhook endpoint that should be accessible without authentication
  if (pathname.startsWith("/api/payments/webhooks")) {
    return NextResponse.next();
  }

  if (sessionCookie && ["/sign-in", "/sign-up"].includes(pathname)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!sessionCookie && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
