import { Role, AccountStatus } from "@/generated/prisma/enums";
import type { Permission } from "./types";
import { ROLE_PERMISSIONS } from "./permissions";

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.includes(permission) ?? false;
}

/**
 * Check if a role has ALL of the specified permissions.
 */
export function hasAllPermissions(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

/**
 * Check if a role has ANY of the specified permissions.
 */
export function hasAnyPermission(
  role: Role,
  permissions: Permission[]
): boolean {
  return permissions.some((p) => hasPermission(role, p));
}

/**
 * Check if an account is in an active state (not suspended or banned).
 */
export function isAccountActive(status: AccountStatus): boolean {
  return status === AccountStatus.ACTIVE;
}

/**
 * Comprehensive authorization check: verifies role permission AND account status.
 * Returns an object with the result and an error message if denied.
 */
export function authorize(
  role: Role,
  accountStatus: AccountStatus,
  permission: Permission
): { authorized: boolean; error?: string } {
  if (!isAccountActive(accountStatus)) {
    if (accountStatus === AccountStatus.SUSPENDED) {
      return { authorized: false, error: "ACCOUNT_SUSPENDED" };
    }
    return { authorized: false, error: "ACCOUNT_BANNED" };
  }

  if (!hasPermission(role, permission)) {
    return { authorized: false, error: "INSUFFICIENT_PERMISSIONS" };
  }

  return { authorized: true };
}
