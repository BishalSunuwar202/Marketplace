import { Role, AccountStatus } from "@/generated/prisma/enums";

export { Role, AccountStatus };

export const ROLE_HIERARCHY: Record<Role, number> = {
  USER: 1,
  SELLER: 2,
  ADMIN: 3,
  SUPER_ADMIN: 4,
};

export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  USER: "User",
  SELLER: "Seller",
  ADMIN: "Admin",
  SUPER_ADMIN: "Super Admin",
};

export type Permission =
  // Authentication & Account
  | "auth.register"
  | "auth.login"
  | "auth.logout"
  | "auth.resetPassword"
  // Profile
  | "profile.viewOwn"
  | "profile.editOwn"
  | "profile.deleteOwn"
  | "profile.viewAny"
  | "profile.editAny"
  // Listings
  | "listing.browse"
  | "listing.viewDetail"
  | "listing.create"
  | "listing.editOwn"
  | "listing.editAny"
  | "listing.deleteOwn"
  | "listing.deleteAny"
  | "listing.viewAnalyticsOwn"
  | "listing.viewAnalyticsAll"
  | "listing.manageCategories"
  // Orders
  | "order.create"
  | "order.viewOwn"
  | "order.viewAll"
  | "order.cancelOwn"
  | "order.cancelAny"
  | "order.updateStatusOwn"
  | "order.updateStatusAny"
  | "order.refundRequest"
  | "order.refundProcess"
  // Reviews
  | "review.create"
  | "review.editOwn"
  | "review.deleteOwn"
  | "review.moderateAny"
  // Moderation
  | "moderation.reportContent"
  | "moderation.reviewReports"
  | "moderation.approveSellers"
  | "moderation.suspendUsers"
  | "moderation.viewAuditLogs"
  // Admin
  | "admin.accessDashboard"
  | "admin.viewAnalytics"
  | "admin.manageUsers"
  | "admin.createAdmins"
  | "admin.systemConfig"
  | "admin.exportData"
  | "admin.manageRbac"
  // Messaging
  | "messaging.sendToSeller"
  | "messaging.sendToBuyer"
  | "messaging.viewConversations"
  // Notifications
  | "notification.receive"
  | "notification.sendPlatformWide";

export type RolePermissionMap = Record<Role, Permission[]>;
