"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { authorize, hasPermission } from "@/lib/rbac";
import { Role, AccountStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import {
  suspendUserSchema,
  banUserSchema,
  reviewSellerApplicationSchema,
} from "@/lib/validations/admin-schemas";

// ─── Audit Log Helper ───────────────────────────────────────────────────────

async function createAuditLog(
  actorId: string,
  actorRole: Role,
  action: string,
  targetType: string,
  targetId: string,
  metadata?: Record<string, string | number | boolean | null | undefined>
) {
  await db.auditLog.create({
    data: {
      actorId,
      actorRole,
      action,
      targetType,
      targetId,
      metadata: metadata as Prisma.InputJsonValue | undefined,
    },
  });
}

// ─── User Management ────────────────────────────────────────────────────────

export async function suspendUser(data: {
  userId: string;
  reason: string;
  expiresAt?: string;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "moderation.suspendUsers"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = suspendUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch target user ──
  const targetUser = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true },
  });

  if (!targetUser) {
    return { error: "USER_NOT_FOUND" };
  }

  // ── Admins cannot suspend other Admins or Super Admins ──
  if (
    session.user.role === Role.ADMIN &&
    (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN)
  ) {
    return { error: "CANNOT_SUSPEND_ADMIN" };
  }

  // ── Super Admins cannot suspend other Super Admins ──
  if (session.user.role === Role.SUPER_ADMIN && targetUser.role === Role.SUPER_ADMIN) {
    return { error: "CANNOT_SUSPEND_SUPER_ADMIN" };
  }

  // ── Execute ──
  await db.user.update({
    where: { id: parsed.data.userId },
    data: {
      accountStatus: AccountStatus.SUSPENDED,
      suspensionReason: parsed.data.reason,
      suspensionExpiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
    },
  });

  // Invalidate tokens for the suspended user
  await db.tokenInvalidation.create({
    data: { userId: parsed.data.userId, reason: "account_suspended" },
  });

  // Audit log
  await createAuditLog(
    session.user.id,
    session.user.role,
    "user.suspended",
    "User",
    parsed.data.userId,
    { reason: parsed.data.reason, expiresAt: parsed.data.expiresAt }
  );

  return { success: true };
}

export async function banUser(data: { userId: string; reason: string }) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "moderation.suspendUsers"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = banUserSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch target user ──
  const targetUser = await db.user.findUnique({
    where: { id: parsed.data.userId },
    select: { role: true },
  });

  if (!targetUser) {
    return { error: "USER_NOT_FOUND" };
  }

  // ── Role-based ban restrictions ──
  if (
    session.user.role === Role.ADMIN &&
    (targetUser.role === Role.ADMIN || targetUser.role === Role.SUPER_ADMIN)
  ) {
    return { error: "CANNOT_BAN_ADMIN" };
  }

  if (session.user.role === Role.SUPER_ADMIN && targetUser.role === Role.SUPER_ADMIN) {
    return { error: "CANNOT_BAN_SUPER_ADMIN" };
  }

  // ── Execute ──
  await db.user.update({
    where: { id: parsed.data.userId },
    data: {
      accountStatus: AccountStatus.BANNED,
      suspensionReason: parsed.data.reason,
    },
  });

  // Hide the banned user's listings
  await db.listing.updateMany({
    where: { sellerId: parsed.data.userId, status: "ACTIVE" },
    data: { status: "DELETED" },
  });

  // Invalidate tokens
  await db.tokenInvalidation.create({
    data: { userId: parsed.data.userId, reason: "account_banned" },
  });

  // Audit log
  await createAuditLog(
    session.user.id,
    session.user.role,
    "user.banned",
    "User",
    parsed.data.userId,
    { reason: parsed.data.reason }
  );

  return { success: true };
}

export async function reactivateUser(userId: string) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "moderation.suspendUsers"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Execute ──
  await db.user.update({
    where: { id: userId },
    data: {
      accountStatus: AccountStatus.ACTIVE,
      suspensionReason: null,
      suspensionExpiresAt: null,
    },
  });

  // Invalidate tokens to refresh status
  await db.tokenInvalidation.create({
    data: { userId, reason: "account_reactivated" },
  });

  // Audit log
  await createAuditLog(
    session.user.id,
    session.user.role,
    "user.reactivated",
    "User",
    userId
  );

  return { success: true };
}

// ─── Seller Application Review ──────────────────────────────────────────────

export async function reviewSellerApplication(data: {
  applicationId: string;
  action: "APPROVE" | "REJECT";
  rejectionReason?: string;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "moderation.approveSellers"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = reviewSellerApplicationSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Fetch application ──
  const application = await db.sellerApplication.findUnique({
    where: { id: parsed.data.applicationId },
    select: { userId: true, status: true, businessName: true },
  });

  if (!application) {
    return { error: "APPLICATION_NOT_FOUND" };
  }

  if (application.status !== "PENDING") {
    return { error: "APPLICATION_ALREADY_REVIEWED" };
  }

  if (parsed.data.action === "APPROVE") {
    // Update application
    await db.sellerApplication.update({
      where: { id: parsed.data.applicationId },
      data: {
        status: "APPROVED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
      },
    });

    // Upgrade user role to SELLER
    await db.user.update({
      where: { id: application.userId },
      data: { role: Role.SELLER },
    });

    // Create seller profile
    await db.sellerProfile.create({
      data: {
        userId: application.userId,
        businessName: application.businessName,
        verificationStatus: "APPROVED",
        verifiedAt: new Date(),
        verifiedBy: session.user.id,
      },
    });

    // Invalidate tokens so the user gets their new role
    await db.tokenInvalidation.create({
      data: { userId: application.userId, reason: "role_upgraded_to_seller" },
    });

    // Audit log
    await createAuditLog(
      session.user.id,
      session.user.role,
      "seller.approved",
      "SellerApplication",
      parsed.data.applicationId,
      { userId: application.userId }
    );
  } else {
    // Reject
    await db.sellerApplication.update({
      where: { id: parsed.data.applicationId },
      data: {
        status: "REJECTED",
        reviewedBy: session.user.id,
        reviewedAt: new Date(),
        rejectionReason: parsed.data.rejectionReason,
      },
    });

    // Audit log
    await createAuditLog(
      session.user.id,
      session.user.role,
      "seller.rejected",
      "SellerApplication",
      parsed.data.applicationId,
      { userId: application.userId, reason: parsed.data.rejectionReason }
    );
  }

  return { success: true };
}

// ─── List Users (Admin) ─────────────────────────────────────────────────────

export async function listUsers(filters: {
  search?: string;
  role?: Role;
  accountStatus?: AccountStatus;
  page?: number;
  limit?: number;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "admin.manageUsers"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  // ── Build where clause ──
  const where: Record<string, unknown> = {};
  if (filters.role) where.role = filters.role;
  if (filters.accountStatus) where.accountStatus = filters.accountStatus;
  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: "insensitive" } },
      { email: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  // ── Execute ──
  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        accountStatus: true,
        createdAt: true,
      },
    }),
    db.user.count({ where }),
  ]);

  return {
    data: users,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── List Pending Seller Applications ───────────────────────────────────────

export async function listSellerApplications(filters: {
  status?: string;
  page?: number;
  limit?: number;
}) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "moderation.approveSellers"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.status) where.status = filters.status;

  const [applications, total] = await Promise.all([
    db.sellerApplication.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { name: true, email: true } },
      },
    }),
    db.sellerApplication.count({ where }),
  ]);

  return {
    data: applications,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}
