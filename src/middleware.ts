import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets and API routes handled separately or allowed through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/documents') ||
    pathname.startsWith('/data') ||
    pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // Define role route requirements
  const isAdminRoute = pathname.startsWith('/admin') || pathname.startsWith('/dashboard');
  const isOfficerRoute = pathname.startsWith('/officer');
  const isCitizenRoute = pathname.startsWith('/citizen');

  if (!isAdminRoute && !isOfficerRoute && !isCitizenRoute) {
    return NextResponse.next();
  }

  // Extract token from cookie or Authorization header
  let token: string | undefined = req.cookies.get('landstack_token')?.value;
  if (!token) {
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyToken(token);
  if (!payload) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role validation
  if (isAdminRoute && payload.role !== 'ADMIN') {
    // If Officer tries to access Admin route, redirect to Officer portal
    if (payload.role === 'OFFICER') {
      return NextResponse.redirect(new URL('/officer', req.url));
    }
    // If Citizen tries to access Admin route, redirect to Citizen portal
    return NextResponse.redirect(new URL('/citizen', req.url));
  }

  if (isOfficerRoute && payload.role !== 'OFFICER' && payload.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/citizen', req.url));
  }

  if (isCitizenRoute && payload.role !== 'CITIZEN' && payload.role !== 'ADMIN' && payload.role !== 'OFFICER') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/officer/:path*', '/dashboard/:path*', '/citizen/:path*'],
};
