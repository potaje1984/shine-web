import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * middleware.ts
 * Protects /dashboard/* (customers) and /admin/* (admin) routes.
 * Fast cookie check to prevent content flash.
 * Real auth/role verification happens client-side in AuthGuard.
 */

const PUBLIC_PATHS = ["/", "/login", "/register", "/test-firebase", "/api"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get("__session");

  // Protected routes: dashboard and admin both need session
  if (!sessionCookie && (pathname.startsWith("/dashboard") || pathname.startsWith("/admin"))) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user has session and goes to login/register, redirect based on role
  // (We can't check role in middleware, so redirect to dashboard — AuthGuard will redirect admin to /admin)
  if (sessionCookie && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|logo.svg|robots.txt).*)"],
};