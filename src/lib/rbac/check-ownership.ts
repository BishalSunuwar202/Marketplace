import { Role } from "@/generated/prisma/enums";
import { hasPermission } from "./check-permission";
import type { Permission } from "./types";

/**
 * Check if a user can access a resource based on ownership or elevated permissions.
 *
 * For example, a Seller can edit their OWN listings (listing.editOwn),
 * while an Admin can edit ANY listing (listing.editAny).
 *
 * @param userId - The ID of the user making the request
 * @param resourceOwnerId - The ID of the resource owner
 * @param userRole - The role of the user making the request
 * @param ownPermission - Permission for own resources (e.g., "listing.editOwn")
 * @param anyPermission - Permission for any resources (e.g., "listing.editAny")
 */
export function canAccessResource(
  userId: string,
  resourceOwnerId: string,
  userRole: Role,
  ownPermission: Permission,
  anyPermission: Permission
): boolean {
  // If user has the "any" permission, they can access regardless of ownership
  if (hasPermission(userRole, anyPermission)) {
    return true;
  }

  // Otherwise, check if they own the resource AND have the "own" permission
  return userId === resourceOwnerId && hasPermission(userRole, ownPermission);
}

/**
 * Simple ownership check without permission system.
 * Use for basic "is this mine?" checks.
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}
