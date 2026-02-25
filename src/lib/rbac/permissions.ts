import { Role } from "@/generated/prisma/enums";
import type { Permission, RolePermissionMap } from "./types";

// ─── Guest Permissions (unauthenticated — used for reference only) ──────────

const GUEST_PERMISSIONS: Permission[] = [
  "auth.register",
  "auth.login",
  "auth.resetPassword",
  "listing.browse",
  "listing.viewDetail",
];

// ─── User Permissions ───────────────────────────────────────────────────────

const USER_PERMISSIONS: Permission[] = [
  ...GUEST_PERMISSIONS,
  "auth.logout",
  "profile.viewOwn",
  "profile.editOwn",
  "profile.deleteOwn",
  "order.create",
  "order.viewOwn",
  "order.cancelOwn",
  "order.refundRequest",
  "review.create",
  "review.editOwn",
  "review.deleteOwn",
  "moderation.reportContent",
  "messaging.sendToSeller",
  "messaging.viewConversations",
  "notification.receive",
];

// ─── Seller Permissions (inherits all User permissions) ─────────────────────

const SELLER_PERMISSIONS: Permission[] = [
  ...USER_PERMISSIONS,
  "listing.create",
  "listing.editOwn",
  "listing.deleteOwn",
  "listing.viewAnalyticsOwn",
  "order.updateStatusOwn",
  "messaging.sendToBuyer",
];

// ─── Admin Permissions (inherits all Seller permissions conceptually) ───────

const ADMIN_PERMISSIONS: Permission[] = [
  ...SELLER_PERMISSIONS,
  "profile.viewAny",
  "profile.editAny",
  "listing.editAny",
  "listing.deleteAny",
  "listing.viewAnalyticsAll",
  "listing.manageCategories",
  "order.viewAll",
  "order.cancelAny",
  "order.updateStatusAny",
  "order.refundProcess",
  "review.moderateAny",
  "moderation.reviewReports",
  "moderation.approveSellers",
  "moderation.suspendUsers",
  "moderation.viewAuditLogs",
  "admin.accessDashboard",
  "admin.viewAnalytics",
  "admin.manageUsers",
  "notification.sendPlatformWide",
];

// ─── Super Admin Permissions (unrestricted — all permissions) ───────────────

const SUPER_ADMIN_PERMISSIONS: Permission[] = [
  ...ADMIN_PERMISSIONS,
  "admin.createAdmins",
  "admin.systemConfig",
  "admin.exportData",
  "admin.manageRbac",
];

// ─── Role → Permission Map ─────────────────────────────────────────────────

export const ROLE_PERMISSIONS: RolePermissionMap = {
  USER: USER_PERMISSIONS,
  SELLER: SELLER_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  SUPER_ADMIN: SUPER_ADMIN_PERMISSIONS,
};

/**
 * Get all permissions for a given role.
 */
export function getPermissionsForRole(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

/**
 * Get the guest permissions (for unauthenticated visitors).
 */
export function getGuestPermissions(): Permission[] {
  return GUEST_PERMISSIONS;
}
