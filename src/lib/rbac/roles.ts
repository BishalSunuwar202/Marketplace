import { Role, ROLE_HIERARCHY, ROLE_DISPLAY_NAMES } from "./types";

export { Role, ROLE_HIERARCHY, ROLE_DISPLAY_NAMES };

/**
 * Check if a role meets the minimum required role level.
 * Uses the role hierarchy: USER < SELLER < ADMIN < SUPER_ADMIN
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if a role is exactly one of the allowed roles.
 */
export function isOneOfRoles(userRole: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(userRole);
}

/**
 * Get display-friendly name for a role.
 */
export function getRoleDisplayName(role: Role): string {
  return ROLE_DISPLAY_NAMES[role];
}

/**
 * All roles ordered by hierarchy (lowest to highest).
 */
export const ALL_ROLES: Role[] = [
  Role.USER,
  Role.SELLER,
  Role.ADMIN,
  Role.SUPER_ADMIN,
];
