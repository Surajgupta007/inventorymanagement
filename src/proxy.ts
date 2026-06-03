import { NextRequest, NextResponse } from 'next/server';
import { decrypt } from '@/lib/session';

const PUBLIC_PATHS = ['/login', '/api/auth'];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Read and verify session cookie
  const token = request.cookies.get('inventory_session')?.value;
  const session = await decrypt(token);

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Role-based access: /admin/** requires admin role
  if (pathname.startsWith('/admin') && session.role !== 'admin') {
    return NextResponse.redirect(new URL('/seller/dashboard', request.url));
  }

  // Sellers accessing /seller/** are fine; redirect root to role dashboard
  if (pathname === '/') {
    const dest = session.role === 'admin' ? '/admin/dashboard' : '/seller/dashboard';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths EXCEPT:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
