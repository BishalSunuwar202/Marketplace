"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCurrentUser } from "./use-current-user";
import { hasMinimumRole } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/enums";

/**
 * Client-side hook that redirects if the user doesn't have the required role.
 * This is a UX convenience — the middleware is the real security layer.
 */
export function useRequireRole(requiredRole: Role, redirectTo = "/forbidden") {
  const { user, isLoading, isAuthenticated } = useCurrentUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      router.replace("/auth/login");
      return;
    }

    if (user && !hasMinimumRole(user.role, requiredRole)) {
      router.replace(redirectTo);
    }
  }, [user, isLoading, isAuthenticated, requiredRole, redirectTo, router]);

  return { user, isLoading, isAuthorized: user ? hasMinimumRole(user.role, requiredRole) : false };
}
