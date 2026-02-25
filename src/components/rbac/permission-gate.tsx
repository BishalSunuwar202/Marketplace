"use client";

import { usePermission } from "@/hooks/use-permission";
import type { Permission } from "@/lib/rbac";
import type { Role } from "@/generated/prisma/enums";

type PermissionGateProps = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
} & (
  | { permission: Permission; role?: never }
  | { role: Role; permission?: never }
);

/**
 * Conditionally renders children based on the current user's role or permission.
 * This is a UI-level gate only — the server always re-validates.
 *
 * Usage:
 *   <PermissionGate permission="admin.accessDashboard">
 *     <AdminPanel />
 *   </PermissionGate>
 *
 *   <PermissionGate role="SELLER">
 *     <SellerTools />
 *   </PermissionGate>
 */
export function PermissionGate({
  children,
  fallback = null,
  permission,
  role,
}: PermissionGateProps) {
  const { can, hasRole: checkRole } = usePermission();

  if (permission && !can(permission)) {
    return <>{fallback}</>;
  }

  if (role && !checkRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
