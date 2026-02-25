"use client";

import { useCurrentUser } from "./use-current-user";
import {
  hasPermission,
  hasMinimumRole,
  canAccessResource,
} from "@/lib/rbac";
import type { Permission } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/enums";

export function usePermission() {
  const { user, isAuthenticated } = useCurrentUser();

  /**
   * Check if the current user has a specific permission.
   */
  function can(permission: Permission): boolean {
    if (!user) return false;
    return hasPermission(user.role, permission);
  }

  /**
   * Check if the current user meets a minimum role level.
   */
  function hasRole(requiredRole: Role): boolean {
    if (!user) return false;
    return hasMinimumRole(user.role, requiredRole);
  }

  /**
   * Check if the current user can access a specific resource.
   * Combines ownership check with role-based permission.
   */
  function canAccess(
    resourceOwnerId: string,
    ownPermission: Permission,
    anyPermission: Permission
  ): boolean {
    if (!user) return false;
    return canAccessResource(
      user.id,
      resourceOwnerId,
      user.role,
      ownPermission,
      anyPermission
    );
  }

  // ─── Pre-built convenience checks ──────────────────────────────────

  const canAccessAdminDashboard = can("admin.accessDashboard");
  const canAccessSellerDashboard = can("listing.create");
  const canManageUsers = can("admin.manageUsers");
  const canApproveSellers = can("moderation.approveSellers");
  const canViewAnalytics = can("admin.viewAnalytics");
  const canExportData = can("admin.exportData");
  const canManageRbac = can("admin.manageRbac");

  return {
    user,
    isAuthenticated,
    can,
    hasRole,
    canAccess,
    canAccessAdminDashboard,
    canAccessSellerDashboard,
    canManageUsers,
    canApproveSellers,
    canViewAnalytics,
    canExportData,
    canManageRbac,
  };
}
