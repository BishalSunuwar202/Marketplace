import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { Role } from "@/generated/prisma/enums";

// ─── Route Protection Configuration ─────────────────────────────────────────

type RouteRule = {
  pattern: RegExp;
  allowedRoles: Role[];
  redirectTo: string;
};

const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 1,
  SELLER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

/**
 * Protected route rules — checked in order, first match wins.
 */
const PROTECTED_ROUTES: RouteRule[] = [
  // Admin dashboard and API — Admin or Super Admin only
  {
    pattern: /^\/dashboard\/admin(\/|$)/,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
    redirectTo: "/forbidden",
  },
  {
    pattern: /^\/api\/admin(\/|$)/,
    allowedRoles: [Role.ADMIN, Role.SUPER_ADMIN],
    redirectTo: "/forbidden",
  },

  // Seller dashboard and API — Seller, Admin, or Super Admin
  {
    pattern: /^\/dashboard\/seller(\/|$)/,
    allowedRoles: [Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN],
    redirectTo: "/forbidden",
  },
  {
    pattern: /^\/api\/seller(\/|$)/,
    allowedRoles: [Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN],
    redirectTo: "/forbidden",
  },

  // User dashboard — any authenticated user
  {
    pattern: /^\/dashboard\/user(\/|$)/,
    allowedRoles: [Role.USER, Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN],
    redirectTo: "/auth/login",
  },

  // User API routes — any authenticated user
  {
    pattern: /^\/api\/user(\/|$)/,
    allowedRoles: [Role.USER, Role.SELLER, Role.ADMIN, Role.SUPER_ADMIN],
    redirectTo: "/auth/login",
  },
];

/**
 * Auth pages — redirect authenticated users away from login/register
 */
const AUTH_ROUTES = /^\/auth\/(login|register|reset-password)(\/|$)/;

// ─── Middleware ──────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isAuthenticated = !!token;
  const userRole = token?.role as Role | undefined;
  const accountStatus = token?.accountStatus as string | undefined;

  // ── Handle suspended/banned users ──
  if (isAuthenticated && accountStatus === "SUSPENDED") {
    if (!pathname.startsWith("/suspended") && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/suspended", request.url));
    }
  }

  if (isAuthenticated && accountStatus === "BANNED") {
    if (!pathname.startsWith("/banned") && !pathname.startsWith("/api/auth")) {
      return NextResponse.redirect(new URL("/banned", request.url));
    }
  }

  // ── Redirect authenticated users away from auth pages ──
  if (isAuthenticated && AUTH_ROUTES.test(pathname)) {
    const dashboardPath = getDashboardForRole(userRole);
    return NextResponse.redirect(new URL(dashboardPath, request.url));
  }

  // ── Check protected routes ──
  for (const rule of PROTECTED_ROUTES) {
    if (rule.pattern.test(pathname)) {
      // Not authenticated → redirect to login
      if (!isAuthenticated) {
        const loginUrl = new URL("/auth/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Authenticated but wrong role → redirect to forbidden or appropriate dashboard
      if (userRole && !rule.allowedRoles.includes(userRole)) {
        const isApiRoute = pathname.startsWith("/api/");
        if (isApiRoute) {
          return NextResponse.json(
            { error: "FORBIDDEN", message: "Insufficient permissions" },
            { status: 403 }
          );
        }
        return NextResponse.redirect(
          new URL("/forbidden?error=insufficient_permissions", request.url)
        );
      }

      break; // First match wins
    }
  }

  return NextResponse.next();
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDashboardForRole(role?: Role): string {
  switch (role) {
    case Role.SUPER_ADMIN:
    case Role.ADMIN:
      return "/dashboard/admin";
    case Role.SELLER:
      return "/dashboard/seller";
    default:
      return "/dashboard/user";
  }
}

// ─── Matcher — only run middleware on relevant paths ─────────────────────────

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/api/admin/:path*",
    "/api/seller/:path*",
    "/api/user/:path*",
    "/auth/:path*",
  ],
};
