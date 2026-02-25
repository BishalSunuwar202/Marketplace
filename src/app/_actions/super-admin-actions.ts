"use server";

import { auth } from "@/lib/auth/auth";
import { db } from "@/lib/db";
import { authorize } from "@/lib/rbac";
import { Role } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { updateUserRoleSchema } from "@/lib/validations/admin-schemas";

// ─── Role Management (Super Admin Only) ─────────────────────────────────────

export async function updateUserRole(data: { userId: string; role: Role }) {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize — only Super Admin can manage roles ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "admin.createAdmins"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Validate ──
  const parsed = updateUserRoleSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  // ── Cannot change own role ──
  if (parsed.data.userId === session.user.id) {
    return { error: "CANNOT_CHANGE_OWN_ROLE" };
  }

  // ── Execute ──
  await db.user.update({
    where: { id: parsed.data.userId },
    data: { role: parsed.data.role },
  });

  // Invalidate tokens for the affected user
  await db.tokenInvalidation.create({
    data: {
      userId: parsed.data.userId,
      reason: `role_changed_to_${parsed.data.role}`,
    },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "user.role_changed",
      targetType: "User",
      targetId: parsed.data.userId,
      metadata: { newRole: parsed.data.role } as Prisma.InputJsonValue,
    },
  });

  return { success: true };
}

// ─── View Audit Logs ────────────────────────────────────────────────────────

export async function getAuditLogs(filters: {
  action?: string;
  targetType?: string;
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
    "moderation.viewAuditLogs"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  const page = filters.page ?? 1;
  const limit = filters.limit ?? 50;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filters.action) where.action = filters.action;
  if (filters.targetType) where.targetType = filters.targetType;

  // Admins can only see their own audit logs; Super Admins see all
  if (session.user.role === Role.ADMIN) {
    where.actorId = session.user.id;
  }

  const [logs, total] = await Promise.all([
    db.auditLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        actor: { select: { name: true, email: true, role: true } },
      },
    }),
    db.auditLog.count({ where }),
  ]);

  return {
    data: logs,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

// ─── Export Users Data (Super Admin Only) ────────────────────────────────────

export async function exportUsersData() {
  // ── Authenticate ──
  const session = await auth();
  if (!session?.user) {
    return { error: "UNAUTHENTICATED" };
  }

  // ── Authorize ──
  const authResult = authorize(
    session.user.role,
    session.user.accountStatus,
    "admin.exportData"
  );
  if (!authResult.authorized) {
    return { error: authResult.error };
  }

  // ── Execute ──
  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      accountStatus: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Audit log
  await db.auditLog.create({
    data: {
      actorId: session.user.id,
      actorRole: session.user.role,
      action: "data.exported",
      targetType: "User",
      targetId: "all",
      metadata: { exportedCount: users.length } as Prisma.InputJsonValue,
    },
  });

  return { data: users };
}
