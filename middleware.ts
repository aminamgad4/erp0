import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { SessionData } from '@/lib/auth';

// Define route access requirements
const routeAccess = {
  '/dashboard': { requireAuth: true },
  '/crm': { requireAuth: true, module: 'crm' },
  '/hr': { requireAuth: true, module: 'hr' },
  '/inventory': { requireAuth: true, module: 'inventory' },
  '/sales': { requireAuth: true, module: 'sales' },
  '/admin': { requireAuth: true, requireAdmin: true },
} as const;

// API route access requirements
const apiRouteAccess = {
  '/api/crm': { requireAuth: true, module: 'crm' },
  '/api/hr': { requireAuth: true, module: 'hr' },
  '/api/inventory': { requireAuth: true, module: 'inventory' },
  '/api/sales': { requireAuth: true, module: 'sales' },
  '/api/admin': { requireAuth: true, requireAdmin: true },
  '/api/dashboard': { requireAuth: true },
} as const;

async function getSessionFromRequest(request: NextRequest): Promise<SessionData | null> {
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(
      request,
      response,
      {
        cookieName: 'erp_session',
        password: process.env.SESSION_SECRET || 'your-secret-key-min-32-chars-long',
        cookieOptions: {
          secure: process.env.NODE_ENV === 'production',
          maxAge: 60 * 60 * 24 * 7, // 1 week
        },
      }
    );

    return session.isLoggedIn ? session : null;
  } catch (error) {
    console.error('Session error in middleware:', error);
    return null;
  }
}

function findMatchingRoute(pathname: string, routes: Record<string, any>) {
  // Find exact match first
  if (routes[pathname]) {
    return routes[pathname];
  }
  
  // Find prefix match
  for (const route in routes) {
    if (pathname.startsWith(route + '/')) {
      return routes[route];
    }
  }
  
  return null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API auth routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout' ||
    pathname === '/api/auth/me' ||
    pathname === '/login' ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Determine if this is an API route or page route
  const isApiRoute = pathname.startsWith('/api');
  const accessRules = isApiRoute ? apiRouteAccess : routeAccess;
  
  // Find matching route access rules
  const routeRule = findMatchingRoute(pathname, accessRules);
  
  if (!routeRule) {
    return NextResponse.next();
  }

  // Get session
  const session = await getSessionFromRequest(request);

  // Check authentication requirement
  if (routeRule.requireAuth && !session) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (!session) {
    return NextResponse.next();
  }

  // Check admin access requirement
  if (routeRule.requireAdmin && session.role !== 'super-admin') {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول للوحة الإدارة' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check module access requirement
  if (routeRule.module && !session.modules[routeRule.module as keyof typeof session.modules]) {
    if (isApiRoute) {
      return NextResponse.json(
        { success: false, message: 'غير مصرح بالوصول لهذه الوحدة' },
        { status: 403 }
      );
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/crm/:path*',
    '/hr/:path*',
    '/inventory/:path*',
    '/sales/:path*',
    '/api/admin/:path*',
    '/api/crm/:path*',
    '/api/hr/:path*',
    '/api/inventory/:path*',
    '/api/sales/:path*',
    '/api/dashboard/:path*',
  ],
};