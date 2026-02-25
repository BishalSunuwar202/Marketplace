"use client";

import Link from "next/link";
import { useCurrentUser } from "@/hooks/use-current-user";
import { usePermission } from "@/hooks/use-permission";
import { RoleBadge } from "@/components/rbac/role-badge";

export function Navbar() {
  const { user, isAuthenticated, isGuest } = useCurrentUser();
  const { canAccessAdminDashboard, canAccessSellerDashboard } = usePermission();

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-xl font-bold text-gray-900">
            LaptopMarket
          </Link>

          <div className="hidden items-center gap-6 md:flex">
            <Link href="/listings" className="text-sm text-gray-600 hover:text-gray-900">
              Browse Laptops
            </Link>

            {isAuthenticated && (
              <Link href="/dashboard/user" className="text-sm text-gray-600 hover:text-gray-900">
                My Dashboard
              </Link>
            )}

            {canAccessSellerDashboard && (
              <Link href="/dashboard/seller" className="text-sm text-gray-600 hover:text-gray-900">
                Seller Dashboard
              </Link>
            )}

            {canAccessAdminDashboard && (
              <Link href="/dashboard/admin" className="text-sm text-gray-600 hover:text-gray-900">
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3">
              <RoleBadge role={user.role} />
              <span className="text-sm text-gray-700">{user.name}</span>
              <Link
                href="/api/auth/signout"
                className="rounded-md bg-gray-100 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-200"
              >
                Sign Out
              </Link>
            </div>
          ) : isGuest ? (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Log In
              </Link>
              <Link
                href="/auth/register"
                className="rounded-md bg-gray-900 px-3 py-1.5 text-sm text-white hover:bg-gray-800"
              >
                Sign Up
              </Link>
            </div>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
